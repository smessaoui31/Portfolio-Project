import { prisma } from "../lib/prisma";

export async function createOrderFromCartPrisma(params: {
  userId: string;
  cartItems: Array<{ productId: string; quantity: number }>;
  addressLine: string;
  city: string;
  postalCode: string;
  phone: string;
}) {
  const { userId, cartItems, addressLine, city, postalCode, phone } = params;

  if (!cartItems.length) {
    throw new Error("Cart is empty");
  }

  // Normaliser par productId pour eviter les doublons d'affichage
  const byProduct: Record<string, number> = {};
  for (const it of cartItems) {
    byProduct[it.productId] = (byProduct[it.productId] ?? 0) + it.quantity;
  }
  const productIds = Object.keys(byProduct);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, priceCents: true },
  });

  if (products.length !== productIds.length) {
    // un productId du panier n’existe pas/plus
    throw new Error("Some products not found");
  }

  // Somme et mise en page des ligne pr la db
  let totalCents = 0;
  const orderItemsData = products.map((p) => {
    const qty = byProduct[p.id];
    const lineTotal = p.priceCents * qty;
    totalCents += lineTotal;
    return {
      productId: p.id,
      name: p.name,
      unitPriceCents: p.priceCents,
      quantity: qty,
    };
  });

  // Créer Order + OrderItems en transaction
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        status: "PENDING",
        totalCents,

        items: {
          create: orderItemsData.map((it) => ({
            productId: it.productId,
            name: it.name,
            unitPriceCents: it.unitPriceCents,
            quantity: it.quantity,
          })),
        },
      },
      include: { items: true },
    });
    return created;
  });

  return { order, totalCents };
}

/** Retrouver une commande via un PaymentIntent Stripe */
export async function findOrderByPaymentIntentPrisma(paymentIntentId: string) {
  return prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });
}

/** Mettre à jour le statut d’une commande */
export async function setOrderStatusPrisma(orderId: string, status: "PENDING" | "PAID" | "FAILED" | "CANCELLED") {
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

/** Load et m.a.j d'un Payment associé à l’Order */
export async function upsertPaymentPrisma(params: {
  orderId: string;
  provider: "stripe";
  status: "succeeded" | "failed";
  intentId: string;
}) {
  const { orderId, provider, status, intentId } = params;

  // comme Payment.orderId et Payment.intentId sont uniques, on fait un upsert par intentId
  await prisma.payment.upsert({
    where: { intentId },
    update: { status },
    create: { orderId, provider, status, intentId },
  });
}