// src/services/checkout.prisma.service.ts
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

type CreateOrderFromCartInput = {
  userId: string;
  cartItems: Array<{ productId: string; quantity: number }>;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    phone: string;
  };
};

export async function createOrderFromCartPrisma(input: CreateOrderFromCartInput) {
  const { userId, cartItems, address } = input;

  // Recalcule total côté serveur depuis les produits
  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((c) => c.productId) } },
    select: { id: true, name: true, priceCents: true },
  });

  // map pour accès rapide
  const byId = new Map(products.map((p) => [p.id, p]));

  let totalCents = 0;
  const itemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

  for (const line of cartItems) {
    const p = byId.get(line.productId);
    if (!p) continue; // si un produit a été supprimé entre temps
    totalCents += p.priceCents * line.quantity;
    itemsData.push({
      productId: p.id,
      name: p.name,
      unitPriceCents: p.priceCents,
      quantity: line.quantity,
    });
  }

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      totalCents,
      shippingLine1: address.line1,
      shippingLine2: address.line2 ?? null,
      shippingCity: address.city,
      shippingPostalCode: address.postalCode,
      shippingPhone: address.phone,
      items: { createMany: { data: itemsData } },
    },
    include: { items: true },
  });

  return { order, totalCents };
}

export async function findOrderByPaymentIntentPrisma(piId: string) {
  return prisma.order.findFirst({ where: { stripePaymentIntentId: piId } });
}

export async function setOrderStatusPrisma(orderId: string, status: "PENDING" | "PAID" | "FAILED" | "CANCELLED") {
  return prisma.order.update({ where: { id: orderId }, data: { status } });
}

export async function upsertPaymentPrisma(input: { orderId: string; provider: string; status: string; intentId: string }) {
  const { orderId, provider, status, intentId } = input;
  return prisma.payment.upsert({
    where: { orderId },
    create: { orderId, provider, status, intentId },
    update: { status, intentId, provider },
  });
}