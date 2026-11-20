import { randomBytes } from "node:crypto";
import { z } from "zod";
import { quoteDelivery } from "@/domain/delivery";
import { canRedeem, stampBalance } from "@/domain/loyalty";
import { CartError, orderTotalCents, priceCart, type CartErrorCode, type PricedCart } from "@/domain/pricing";
import { computeSlots, isValidSlot } from "@/domain/slots";
import { prisma } from "@/lib/db";
import { formatEuros } from "@/lib/money";
import { getCurrentEditionRef, getPricedProducts } from "./catalog";
import { expireStalePendingOrders, releasePendingOrdersOfUser } from "./lifecycle";
import { notifyOrderReceived } from "./notifications";
import { releaseOrderResources } from "./order-resources";
import { createPaymentIntent, isOnlinePaymentEnabled } from "./payments";
import { getActiveZones, getSettings, getSlotOptions } from "./settings";

const STRIPE_MINIMUM_CENTS = 50;

const phone = z
  .string()
  .transform((s) => s.replace(/[\s.-]/g, ""))
  .refine((s) => /^(0\d{9}|\+33\d{9})$/.test(s));

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number(),
  cooking: z.enum(["NORMAL", "WELL_DONE", "LIGHTLY_COOKED"]),
  supplementIds: z.array(z.string()).max(10),
  choices: z.array(z.object({ slotId: z.string(), optionId: z.string() })).max(12).default([]),
});

export const placeOrderSchema = z.object({
  mode: z.enum(["PICKUP", "DELIVERY"]),
  /** "asap" lets the server pick the first slot at submit time. */
  slotAt: z.union([z.literal("asap"), z.iso.datetime({ offset: true })]),
  paymentMethod: z.enum(["ONLINE", "AT_PICKUP"]),
  customer: z.object({
    firstName: z.string().trim().min(1).max(40),
    phone,
    email: z.email().transform((s) => s.toLowerCase()),
  }),
  address: z
    .object({
      line1: z.string().trim().min(1).max(120),
      line2: z.string().trim().max(120).optional(),
      postalCode: z.string().max(10),
      city: z.string().trim().min(1).max(60),
    })
    .optional(),
  lines: z.array(lineSchema).max(30),
  rewardLineIndex: z.number().int().min(0).optional(),
  /** REORDER when the order comes from "Recommander"; only used for the retention metrics. */
  source: z.enum(["WEB", "REORDER"]).default("WEB"),
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export type PlaceOrderError =
  | "VALIDATION"
  | "INVALID_SLOT"
  | "DELIVERY_REQUIRES_ONLINE"
  | "ADDRESS_REQUIRED"
  | "INVALID_POSTAL_CODE"
  | "OUT_OF_ZONE"
  | "BELOW_MINIMUM"
  | "REWARD_UNAVAILABLE"
  | "REWARD_PICKUP_ONLY"
  | "PAYMENT_UNAVAILABLE"
  | "ONLINE_MINIMUM"
  | CartErrorCode;

export const ORDER_ERROR_MESSAGES: Record<PlaceOrderError, string> = {
  VALIDATION: "Certaines informations sont incomplètes ou invalides.",
  INVALID_SLOT: "Ce créneau n'est plus disponible. Choisis-en un autre.",
  DELIVERY_REQUIRES_ONLINE: "La livraison se paie en ligne.",
  ADDRESS_REQUIRED: "Indique ton adresse de livraison.",
  INVALID_POSTAL_CODE: "Ce code postal n'est pas valide.",
  OUT_OF_ZONE: "Nous ne livrons pas encore à cette adresse. Tu peux commander à emporter ou nous appeler.",
  BELOW_MINIMUM: "Le minimum de commande pour la livraison n'est pas atteint.",
  REWARD_UNAVAILABLE: "Ta pizza offerte n'est pas disponible.",
  REWARD_PICKUP_ONLY: "La pizza offerte est réservée aux commandes à emporter.",
  PAYMENT_UNAVAILABLE: "Le paiement en ligne est indisponible pour le moment. Tu peux payer au retrait ou nous appeler.",
  ONLINE_MINIMUM: "Le paiement en ligne n'est possible qu'à partir de 0,50 €. Choisis le paiement au retrait.",
  EMPTY: "Ton panier est vide.",
  INVALID_QUANTITY: "Une quantité de ton panier n'est pas valide.",
  UNKNOWN_PRODUCT: "Un produit de ton panier n'existe plus.",
  UNAVAILABLE: "Un produit de ton panier n'est plus disponible.",
  OUT_OF_STOCK: "Il n'y en a plus assez en stock.",
  SUPPLEMENT_NOT_ALLOWED: "Un supplément n'est pas proposé pour ce produit.",
  OPTION_NOT_ALLOWED: "Un choix n'est pas proposé pour ce produit.",
  OPTIONS_INCOMPLETE: "Il manque un choix pour un produit de ton panier.",
  EDITION_OVER: "Cette pizza n'est plus à la carte : son édition est terminée.",
  REWARD_NOT_PIZZA: "La pizza offerte doit être une pizza.",
};

export function orderErrorMessage(error: PlaceOrderError, detail: { productName?: string; minOrderCents?: number } = {}): string {
  const name = detail.productName;
  if (error === "BELOW_MINIMUM" && detail.minOrderCents !== undefined) {
    return `Le minimum de commande pour la livraison est de ${formatEuros(detail.minOrderCents)}.`;
  }
  if (name && error === "UNAVAILABLE") return `${name} n'est plus disponible.`;
  if (name && error === "OUT_OF_STOCK") return `Il ne reste plus assez de ${name} en stock.`;
  if (name && error === "EDITION_OVER") return `${name} n'est plus à la carte : son édition est terminée.`;
  if (name && error === "SUPPLEMENT_NOT_ALLOWED") return `Un supplément n'est pas proposé pour ${name}.`;
  if (name && error === "OPTION_NOT_ALLOWED") return `Un choix n'est pas proposé pour ${name}.`;
  if (name && error === "OPTIONS_INCOMPLETE") return `Il manque un choix pour ${name}.`;
  return ORDER_ERROR_MESSAGES[error];
}

export type PlaceOrderResult =
  | { ok: true; orderId: string; number: number; trackingToken: string; totalCents: number; clientSecret: string | null }
  | { ok: false; error: PlaceOrderError; message: string };

class OrderRejected extends Error {
  constructor(
    readonly error: PlaceOrderError,
    readonly detail: { productName?: string; minOrderCents?: number } = {},
  ) {
    super(error);
  }
}

const fail = (error: PlaceOrderError, detail?: { productName?: string; minOrderCents?: number }): PlaceOrderResult => ({
  ok: false,
  error,
  message: orderErrorMessage(error, detail),
});

export async function placeOrder(input: unknown, ctx: { userId: string | null; now: Date }): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION");
  const data = parsed.data;

  if (data.mode === "DELIVERY" && data.paymentMethod === "AT_PICKUP") return fail("DELIVERY_REQUIRES_ONLINE");
  if (data.mode === "DELIVERY" && !data.address) return fail("ADDRESS_REQUIRED");
  if (data.rewardLineIndex !== undefined && data.mode === "DELIVERY") return fail("REWARD_PICKUP_ONLY");
  if (data.rewardLineIndex !== undefined && !ctx.userId) return fail("REWARD_UNAVAILABLE");
  if (data.paymentMethod === "ONLINE" && !isOnlinePaymentEnabled()) return fail("PAYMENT_UNAVAILABLE");

  await expireStalePendingOrders(ctx.now);
  if (data.rewardLineIndex !== undefined && ctx.userId) await releasePendingOrdersOfUser(ctx.userId);

  const slotOptions = await getSlotOptions(data.mode, ctx.now);
  let slotAt: Date;
  if (data.slotAt === "asap") {
    const first = computeSlots(slotOptions);
    if (!first) return fail("INVALID_SLOT");
    slotAt = first.asap;
  } else {
    slotAt = new Date(data.slotAt);
    if (!isValidSlot(slotAt, slotOptions)) return fail("INVALID_SLOT");
  }

  const [products, edition] = await Promise.all([
    getPricedProducts(data.lines.map((l) => l.productId)),
    getCurrentEditionRef(ctx.now),
  ]);

  let cart: PricedCart;
  try {
    cart = priceCart(data.lines, products, {
      rewardLineIndex: data.rewardLineIndex,
      currentEditionProductId: edition?.productId ?? null,
    });
  } catch (error) {
    if (error instanceof CartError) return fail(error.code, { productName: error.productName });
    throw error;
  }

  let deliveryFeeCents = 0;
  let postalCode: string | null = null;
  if (data.mode === "DELIVERY" && data.address) {
    const quote = quoteDelivery(data.address.postalCode, cart.subtotalCents - cart.rewardCents, await getActiveZones());
    if (!quote.ok) return fail(quote.reason, { minOrderCents: quote.minOrderCents });
    deliveryFeeCents = quote.feeCents;
    postalCode = data.address.postalCode.replace(/\s+/g, "");
  }

  const totalCents = orderTotalCents(cart, deliveryFeeCents);
  // Stripe refuses amounts under 0,50 €; a free order needs no payment at all.
  if (data.paymentMethod === "ONLINE" && totalCents > 0 && totalCents < STRIPE_MINIMUM_CENTS) return fail("ONLINE_MINIMUM");
  const needsPayment = data.paymentMethod === "ONLINE" && totalCents > 0;

  const settings = await getSettings();
  const status = needsPayment ? "PENDING_PAYMENT" : "RECEIVED";

  let order: { id: string; number: number; trackingToken: string; totalCents: number; customerEmail: string };
  try {
    order = await prisma.$transaction(async (tx) => {
      if (cart.rewardCents > 0 && ctx.userId) {
        await tx.$executeRaw`SELECT id FROM "user" WHERE id = ${ctx.userId} FOR UPDATE`;
        const entries = await tx.loyaltyEntry.findMany({ where: { userId: ctx.userId }, select: { kind: true, stamps: true } });
        if (!canRedeem(stampBalance(entries), settings.stampsForReward)) throw new OrderRejected("REWARD_UNAVAILABLE");
      }

      const quantities = new Map<string, number>();
      for (const line of cart.lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
      for (const [productId, quantity] of quantities) {
        const product = products.get(productId)!;
        if (product.stockQuantity === null) continue;
        const { count } = await tx.product.updateMany({
          where: { id: productId, stockQuantity: { gte: quantity } },
          data: { stockQuantity: { decrement: quantity } },
        });
        if (count === 0) throw new OrderRejected("OUT_OF_STOCK", { productName: product.name });
      }

      const created = await tx.order.create({
        data: {
          trackingToken: randomBytes(24).toString("base64url"),
          createdAt: ctx.now,
          userId: ctx.userId,
          customerFirstName: data.customer.firstName,
          customerPhone: data.customer.phone,
          customerEmail: data.customer.email,
          mode: data.mode,
          slotAt,
          paymentMethod: data.paymentMethod,
          status,
          subtotalCents: cart.subtotalCents,
          rewardCents: cart.rewardCents,
          deliveryFeeCents,
          totalCents,
          addressLine1: data.mode === "DELIVERY" ? data.address?.line1 : null,
          addressLine2: data.mode === "DELIVERY" ? data.address?.line2 || null : null,
          postalCode,
          city: data.mode === "DELIVERY" ? data.address?.city : null,
          editionId: edition && quantities.has(edition.productId) ? edition.id : null,
          source: data.source,
          items: {
            create: cart.lines.map((line) => ({
              productId: line.productId,
              name: line.name,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
              cooking: line.cooking,
              supplementsTotalCents: line.supplementsTotalCents,
              choicesTotalCents: line.choicesTotalCents,
              isPizza: line.isPizza,
              isMenu: line.isMenu,
              isReward: line.isReward,
              supplements: {
                create: line.supplements.map((s) => ({ supplementId: s.id, name: s.name, unitPriceCents: s.unitPriceCents })),
              },
              choices: {
                create: line.choices.map((c) => ({
                  slotId: c.slotId,
                  optionId: c.optionId,
                  label: c.label,
                  name: c.name,
                  unitPriceCents: c.unitPriceCents,
                })),
              },
            })),
          },
          logs: { create: [{ status, message: "Commande passée en ligne" }] },
        },
        select: { id: true, number: true, trackingToken: true, totalCents: true, customerEmail: true },
      });

      if (cart.rewardCents > 0 && ctx.userId) {
        await tx.loyaltyEntry.create({
          data: { userId: ctx.userId, orderId: created.id, kind: "REDEEM", stamps: settings.stampsForReward },
        });
      }
      return created;
    });
  } catch (error) {
    if (error instanceof OrderRejected) return fail(error.error, error.detail);
    throw error;
  }

  if (!needsPayment) {
    await notifyOrderReceived(order.id);
    return { ok: true, orderId: order.id, number: order.number, trackingToken: order.trackingToken, totalCents: order.totalCents, clientSecret: null };
  }

  try {
    const intent = await createPaymentIntent(order);
    await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: intent.intentId } });
    return {
      ok: true,
      orderId: order.id,
      number: order.number,
      trackingToken: order.trackingToken,
      totalCents: order.totalCents,
      clientSecret: intent.clientSecret,
    };
  } catch (error) {
    console.error("[commande] création du paiement impossible", order.id, error);
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
      if (count === 0) return;
      await releaseOrderResources(tx, order.id);
      await tx.orderLog.create({ data: { orderId: order.id, status: "CANCELLED", message: "Paiement en ligne indisponible" } });
    });
    return fail("PAYMENT_UNAVAILABLE");
  }
}
