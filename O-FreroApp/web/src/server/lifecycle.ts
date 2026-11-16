import type Stripe from "stripe";
import { stampsEarned } from "@/domain/loyalty";
import { nextStatuses, trackingSteps } from "@/domain/order-status";
import type { Cooking, FulfillmentMode, OrderStatus, PaymentMethod } from "@/domain/types";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { notifyOrderReceived } from "./notifications";
import { releaseOrderResources } from "./order-resources";

const REFUND_NOTE = "Paiement reçu après annulation : à rembourser depuis Stripe";

async function creditStamps(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { userId: true, rewardCents: true, items: { select: { isPizza: true, quantity: true } } },
  });
  if (!order.userId) return;
  const pizzaCount = order.items.filter((i) => i.isPizza).reduce((sum, i) => sum + i.quantity, 0);
  const stamps = stampsEarned({ pizzaCount, rewardCents: order.rewardCents });
  if (stamps === 0) return;
  await tx.loyaltyEntry.createMany({
    data: [{ userId: order.userId, orderId, kind: "EARN", stamps }],
    skipDuplicates: true,
  });
}

export async function advanceOrderStatus(
  orderId: string,
  to: OrderStatus,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: "NOT_FOUND" | "INVALID_TRANSITION" }> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, mode: true } });
  if (!order) return { ok: false, error: "NOT_FOUND" };
  if (!nextStatuses(order.status, order.mode).includes(to)) return { ok: false, error: "INVALID_TRANSITION" };

  const applied = await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: to } });
    if (count === 0) return false;
    if (to === "COMPLETED") await creditStamps(tx, orderId);
    if (to === "CANCELLED") await releaseOrderResources(tx, orderId);
    if (to === "NOT_COLLECTED") await tx.loyaltyEntry.deleteMany({ where: { orderId, kind: "REDEEM" } });
    await tx.orderLog.create({ data: { orderId, status: to, createdBy: actor } });
    return true;
  });
  return applied ? { ok: true } : { ok: false, error: "INVALID_TRANSITION" };
}

export async function markOrderPaid(intentId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: intentId }, select: { id: true, status: true } });
  if (!order) return;

  const paid = await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT" },
      data: { status: "RECEIVED" },
    });
    if (count === 0) return false;
    await tx.orderLog.create({ data: { orderId: order.id, status: "RECEIVED", message: "Paiement en ligne confirmé" } });
    return true;
  });

  if (paid) {
    await notifyOrderReceived(order.id);
    return;
  }
  if (order.status === "CANCELLED" || order.status === "FAILED") {
    const flagged = await prisma.orderLog.count({ where: { orderId: order.id, message: REFUND_NOTE } });
    if (flagged === 0) {
      await prisma.orderLog.create({ data: { orderId: order.id, status: order.status, message: REFUND_NOTE } });
    }
  }
}

export async function markOrderFailed(intentId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { stripePaymentIntentId: intentId }, select: { id: true } });
    if (!order) return;
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT" },
      data: { status: "FAILED" },
    });
    if (count === 0) return;
    await releaseOrderResources(tx, order.id);
    await tx.orderLog.create({ data: { orderId: order.id, status: "FAILED", message: "Paiement en ligne annulé" } });
  });
}

/**
 * `payment_intent.payment_failed` is one failed attempt: the customer can retry with the
 * same intent, so the order stays payable. Only `payment_intent.canceled` ends it.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "payment_intent.succeeded":
      await markOrderPaid(event.data.object.id);
      break;
    case "payment_intent.canceled":
      await markOrderFailed(event.data.object.id);
      break;
    default:
      break;
  }
}

export interface TrackingView {
  number: number;
  status: OrderStatus;
  mode: FulfillmentMode;
  paymentMethod: PaymentMethod;
  slotAt: string;
  firstName: string;
  items: { name: string; quantity: number; cooking: Cooking; supplements: string[]; isReward: boolean }[];
  totalCents: number;
  addressShort: string | null;
  steps: { status: OrderStatus; label: string; done: boolean }[];
  /** Stamps this order is worth once completed. */
  stamps: number;
  isGuest: boolean;
}

/** Public view of an order for its private tracking link: no e-mail, no phone. */
export async function getTracking(token: string): Promise<TrackingView | null> {
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: { items: { include: { supplements: true } } },
  });
  if (!order) return null;

  const steps = trackingSteps(order.mode);
  const reached =
    order.status === "NOT_COLLECTED"
      ? steps.findIndex((s) => s.status === "READY")
      : steps.findIndex((s) => s.status === order.status);

  return {
    number: order.number,
    status: order.status,
    mode: order.mode,
    paymentMethod: order.paymentMethod,
    slotAt: order.slotAt.toISOString(),
    firstName: order.customerFirstName,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      cooking: i.cooking,
      supplements: i.supplements.map((s) => s.name),
      isReward: i.isReward,
    })),
    totalCents: order.totalCents,
    addressShort: order.mode === "DELIVERY" ? `${order.addressLine1}, ${order.postalCode} ${order.city}` : null,
    steps: steps.map((s, index) => ({ ...s, done: reached >= 0 && index <= reached })),
    stamps: stampsEarned({
      pizzaCount: order.items.filter((i) => i.isPizza).reduce((sum, i) => sum + i.quantity, 0),
      rewardCents: order.rewardCents,
    }),
    isGuest: order.userId === null,
  };
}
