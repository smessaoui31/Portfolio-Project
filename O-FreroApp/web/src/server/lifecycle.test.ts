import type Stripe from "stripe";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { prisma } from "@/lib/db";
import { runSeed } from "../../prisma/seed";
import { advanceOrderStatus, getTracking, handleStripeEvent } from "./lifecycle";
import { placeOrder } from "./orders";
import { resetDb } from "./test/db";
import { makeUser } from "./test/fixtures";

const sent: { to: string }[] = [];
vi.mock("@/lib/email", () => ({
  sendEmail: async (msg: { to: string }) => {
    sent.push(msg);
    return { delivered: false };
  },
}));
let intentCounter = 0;
vi.mock("@/server/payments", () => ({
  isOnlinePaymentEnabled: () => true,
  createPaymentIntent: async () => ({ intentId: `pi_lifecycle_${++intentCounter}`, clientSecret: "cs_test" }),
}));

const NOW = new Date("2026-11-19T18:02:00Z");
let MARG = "";

const event = (type: string, id: string) => ({ type, data: { object: { id } } }) as unknown as Stripe.Event;

const line = (quantity = 1) => [{ productId: MARG, quantity, cooking: "NORMAL", supplementIds: [] }];
const pickup = (over: Record<string, unknown> = {}) => ({
  mode: "PICKUP",
  slotAt: "2026-11-19T18:30:00Z",
  paymentMethod: "AT_PICKUP",
  customer: { firstName: "Karim", phone: "0612345678", email: "karim@exemple.fr" },
  lines: line(2),
  ...over,
});
const delivery = (over: Record<string, unknown> = {}) => ({
  ...pickup(),
  mode: "DELIVERY",
  slotAt: "2026-11-19T18:45:00Z",
  paymentMethod: "ONLINE",
  address: { line1: "12 rue des Lois", postalCode: "31000", city: "Toulouse" },
  ...over,
});

async function place(input: Record<string, unknown>, userId: string | null = null) {
  const r = await placeOrder(input, { userId, now: NOW });
  if (!r.ok) throw new Error(r.message);
  return prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
}

beforeAll(async () => {
  await resetDb();
  await runSeed(prisma);
  MARG = (await prisma.product.findFirstOrThrow({ where: { name: "Margherita" } })).id;
});

beforeEach(async () => {
  sent.length = 0;
  await prisma.product.update({ where: { id: MARG }, data: { stockQuantity: 5 } });
});

describe("Stripe events", () => {
  test("webhook is idempotent", async () => {
    const order = await place(delivery());
    await handleStripeEvent(event("payment_intent.succeeded", order.stripePaymentIntentId!));
    await handleStripeEvent(event("payment_intent.succeeded", order.stripePaymentIntentId!));
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "RECEIVED" });
    expect(sent.filter((m) => m.to === "karim@exemple.fr")).toHaveLength(1);
    expect(await prisma.orderLog.count({ where: { orderId: order.id, status: "RECEIVED" } })).toBe(1);
  });

  test("a failed attempt keeps the order payable", async () => {
    const order = await place(delivery());
    await handleStripeEvent(event("payment_intent.payment_failed", order.stripePaymentIntentId!));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
  });

  test("a canceled payment restocks and refunds the reward once", async () => {
    const user = await makeUser({ email: "fidele@exemple.fr", stamps: 10 });
    const order = await place(delivery({ lines: line(3), rewardLineIndex: 0 }), user.id);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(2);
    await handleStripeEvent(event("payment_intent.canceled", order.stripePaymentIntentId!));
    await handleStripeEvent(event("payment_intent.canceled", order.stripePaymentIntentId!));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("FAILED");
    expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(5);
    expect(await prisma.loyaltyEntry.count({ where: { orderId: order.id, kind: "REDEEM" } })).toBe(0);
  });

  test("late success after cancel keeps the order cancelled and flags a refund", async () => {
    const order = await place(delivery());
    expect(await advanceOrderStatus(order.id, "CANCELLED", "admin@ofrero.test")).toEqual({ ok: true });
    await handleStripeEvent(event("payment_intent.succeeded", order.stripePaymentIntentId!));
    await handleStripeEvent(event("payment_intent.succeeded", order.stripePaymentIntentId!));
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect(sent).toHaveLength(0);
    const refundLogs = await prisma.orderLog.findMany({ where: { orderId: order.id, message: { contains: "rembourser" } } });
    expect(refundLogs).toHaveLength(1);
  });

  test("unknown events are ignored", async () => {
    await expect(handleStripeEvent(event("charge.refunded", "ch_1"))).resolves.toBeUndefined();
  });
});

describe("admin transitions", () => {
  test("pickup lifecycle credits stamps on completion only", async () => {
    const user = await makeUser({ email: "suivi@exemple.fr" });
    const order = await place(pickup(), user.id);
    for (const to of ["IN_OVEN", "READY"] as const) {
      expect(await advanceOrderStatus(order.id, to, "admin@ofrero.test")).toEqual({ ok: true });
    }
    expect(await prisma.loyaltyEntry.count({ where: { userId: user.id } })).toBe(0);
    expect(await advanceOrderStatus(order.id, "COMPLETED", "admin@ofrero.test")).toEqual({ ok: true });
    expect(await prisma.loyaltyEntry.findFirst({ where: { orderId: order.id, kind: "EARN" } })).toMatchObject({ stamps: 2 });
    const logs = await prisma.orderLog.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "asc" } });
    expect(logs.map((l) => l.status)).toEqual(["RECEIVED", "IN_OVEN", "READY", "COMPLETED"]);
    expect(logs.at(-1)?.createdBy).toBe("admin@ofrero.test");
  });

  test("invalid transitions are refused", async () => {
    const order = await place(pickup());
    expect(await advanceOrderStatus(order.id, "COMPLETED", "admin@ofrero.test")).toEqual({ ok: false, error: "INVALID_TRANSITION" });
    expect(await advanceOrderStatus(order.id, "OUT_FOR_DELIVERY", "admin@ofrero.test")).toEqual({ ok: false, error: "INVALID_TRANSITION" });
    expect(await advanceOrderStatus("nope", "IN_OVEN", "admin@ofrero.test")).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  test("a cancelled pickup order gives its stock back", async () => {
    const order = await place(pickup());
    expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(3);
    await advanceOrderStatus(order.id, "CANCELLED", "admin@ofrero.test");
    expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(5);
  });

  test("not collected keeps stock used, earns no stamps and gives the reward back", async () => {
    const user = await makeUser({ email: "absent@exemple.fr", stamps: 10 });
    const order = await place(pickup({ rewardLineIndex: 0 }), user.id);
    for (const to of ["IN_OVEN", "READY", "NOT_COLLECTED"] as const) await advanceOrderStatus(order.id, to, "admin@ofrero.test");
    expect((await prisma.product.findUniqueOrThrow({ where: { id: MARG } })).stockQuantity).toBe(3);
    expect(await prisma.loyaltyEntry.count({ where: { orderId: order.id } })).toBe(0);
  });
});

test("getTracking hides contact details and marks done steps", async () => {
  const order = await place(pickup());
  await advanceOrderStatus(order.id, "IN_OVEN", "admin@ofrero.test");
  const view = await getTracking(order.trackingToken);
  expect(view).not.toBeNull();
  expect(Object.keys(view!)).not.toContain("customerEmail");
  expect(Object.keys(view!)).not.toContain("customerPhone");
  expect(JSON.stringify(view)).not.toContain("karim@exemple.fr");
  expect(JSON.stringify(view)).not.toContain("0612345678");
  expect(view).toMatchObject({ number: order.number, status: "IN_OVEN", firstName: "Karim", addressShort: null, stamps: 2, isGuest: true });
  expect(view!.steps.map((s) => s.done)).toEqual([true, true, false, false]);
  expect(view!.items[0]).toMatchObject({ name: "Margherita", quantity: 2, cooking: "NORMAL", supplements: [] });
  expect(await getTracking("unknown-token")).toBeNull();
});
