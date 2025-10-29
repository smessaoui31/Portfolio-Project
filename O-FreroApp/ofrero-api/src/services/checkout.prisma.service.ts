// src/services/checkout.prisma.service.ts
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

// --- helper: génération numéro de commande ---
function generateOrderNumber() {
  // base36 + random pour un code court mais varié
  const part1 = Date.now().toString(36).toUpperCase().slice(-4); // ex: 5K2J
  const part2 = Math.random().toString(36).toUpperCase().slice(2, 6); // ex: 8A9F
  return `OFR-${part1}${part2}`; // OFR-5K2J8A9F → on tronque un peu en dessous
}

async function getUniqueOrderNumber(): Promise<string> {
  // on limite à ~8 caractères après le préfixe pour rester court
  for (let i = 0; i < 5; i++) {
    const candidate = `OFR-${Date.now().toString(36).toUpperCase().slice(-3)}${Math.random()
      .toString(36)
      .toUpperCase()
      .slice(2, 7)}`.slice(0, 4 + 1 + 7); // "OFR-" + 7 chars max
    const exists = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!exists) return candidate;
  }
  // fallback si vraiment pas de chance
  return generateOrderNumber();
}

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

  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((c) => c.productId) } },
    select: { id: true, name: true, priceCents: true },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  let totalCents = 0;
  const itemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

  for (const line of cartItems) {
    const p = byId.get(line.productId);
    if (!p) continue;
    totalCents += p.priceCents * line.quantity;
    itemsData.push({
      productId: p.id,
      name: p.name,
      unitPriceCents: p.priceCents,
      quantity: line.quantity,
    });
  }

  // 👇 Nouveau : numéro de commande lisible
  const orderNumber = await getUniqueOrderNumber();

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      totalCents,
      orderNumber, // 👈
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

export async function setOrderStatusPrisma(
  orderId: string,
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED"
) {
  return prisma.order.update({ where: { id: orderId }, data: { status } });
}

export async function upsertPaymentPrisma(input: {
  orderId: string;
  provider: string;
  status: string;
  intentId: string;
}) {
  const { orderId, provider, status, intentId } = input;
  return prisma.payment.upsert({
    where: { orderId },
    create: { orderId, provider, status, intentId },
    update: { status, intentId, provider },
  });
}