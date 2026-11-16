import { randomBytes, randomUUID } from "node:crypto";
import type { FulfillmentMode, OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

let defaultPizzaId: string | null = null;
let defaultCategoryId: string | null = null;

export function resetFixtureCache() {
  defaultPizzaId = null;
  defaultCategoryId = null;
}

const uid = () => randomUUID().slice(0, 8);

export async function makeCategory(o: { name?: string; isPizza?: boolean; displayOrder?: number } = {}) {
  return prisma.category.create({
    data: { name: o.name ?? `Catégorie ${uid()}`, isPizza: o.isPizza ?? false, displayOrder: o.displayOrder ?? 0 },
  });
}

async function pizzaCategoryId() {
  if (!defaultCategoryId) defaultCategoryId = (await makeCategory({ name: `Pizzas ${uid()}`, isPizza: true })).id;
  return defaultCategoryId;
}

export async function makeProduct(
  o: {
    name?: string;
    priceCents?: number;
    discountPercent?: number;
    categoryId?: string | null;
    isAvailable?: boolean;
    stockQuantity?: number | null;
    isEditionOnly?: boolean;
    supplementIds?: string[];
  } = {},
) {
  const categoryId = o.categoryId === undefined ? await pizzaCategoryId() : o.categoryId;
  return prisma.product.create({
    data: {
      name: o.name ?? `Pizza ${uid()}`,
      priceCents: o.priceCents ?? 1050,
      discountPercent: o.discountPercent ?? 0,
      categoryId,
      isAvailable: o.isAvailable ?? true,
      stockQuantity: o.stockQuantity ?? null,
      isEditionOnly: o.isEditionOnly ?? false,
      supplements: o.supplementIds
        ? { create: o.supplementIds.map((supplementId) => ({ supplementId })) }
        : undefined,
    },
  });
}

export async function makeSupplement(o: { name?: string; priceCents?: number; isActive?: boolean } = {}) {
  return prisma.supplement.create({
    data: { name: o.name ?? `Supplément ${uid()}`, priceCents: o.priceCents ?? 100, isActive: o.isActive ?? true },
  });
}

export async function makeZone(
  o: { name?: string; postalCodes?: string[]; feeCents?: number; minOrderCents?: number; isActive?: boolean } = {},
) {
  return prisma.deliveryZone.create({
    data: {
      name: o.name ?? "Toulouse",
      postalCodes: o.postalCodes ?? ["31000", "31100"],
      feeCents: o.feeCents ?? 250,
      minOrderCents: o.minOrderCents ?? 2000,
      isActive: o.isActive ?? true,
    },
  });
}

/** Opening hours used across tests: the real O'Frero hours. */
export const SEED_HOURS = [
  ...[1, 2, 3, 4].flatMap((weekday) => [
    { weekday, opensAt: "11:30", closesAt: "13:30" },
    { weekday, opensAt: "18:00", closesAt: "22:00" },
  ]),
  { weekday: 5, opensAt: "18:00", closesAt: "22:00" },
  ...[6, 7].flatMap((weekday) => [
    { weekday, opensAt: "12:00", closesAt: "13:30" },
    { weekday, opensAt: "18:00", closesAt: "22:00" },
  ]),
];

export async function makeHours(windows = SEED_HOURS) {
  await prisma.serviceWindow.createMany({ data: windows });
}

export async function makeEdition(o: {
  number: number;
  productId?: string;
  startsAt: Date;
  endsAt: Date;
  brothersNote?: string;
}) {
  const productId = o.productId ?? (await makeProduct({ isEditionOnly: true, priceCents: 1490 })).id;
  return prisma.edition.create({
    data: {
      number: o.number,
      productId,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      brothersNote: o.brothersNote ?? "Le mot des frères.",
    },
  });
}

export async function makeUser(
  o: { email?: string; name?: string; role?: "USER" | "ADMIN"; emailVerified?: boolean; stamps?: number } = {},
) {
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: (o.email ?? `client-${uid()}@exemple.fr`).toLowerCase(),
      name: o.name ?? "Karim",
      role: o.role ?? "USER",
      emailVerified: o.emailVerified ?? true,
    },
  });
  if (o.stamps && o.stamps > 0) {
    const order = await makeOrder({ userId: user.id, customerEmail: user.email, status: "COMPLETED", pizzas: 1 });
    await prisma.loyaltyEntry.create({
      data: { userId: user.id, orderId: order.id, kind: "EARN", stamps: o.stamps },
    });
  }
  return user;
}

async function defaultPizza() {
  if (!defaultPizzaId) defaultPizzaId = (await makeProduct({ name: "Pizza test", priceCents: 1050 })).id;
  return defaultPizzaId;
}

export async function makeOrder(
  o: {
    customerEmail?: string;
    userId?: string | null;
    status?: OrderStatus;
    mode?: FulfillmentMode;
    paymentMethod?: PaymentMethod;
    pizzas?: number;
    productId?: string;
    editionId?: string;
    stripePaymentIntentId?: string;
    totalCents?: number;
    createdAt?: Date;
    slotAt?: Date;
  } = {},
) {
  const quantity = o.pizzas ?? 1;
  const productId = o.productId ?? (await defaultPizza());
  const subtotal = quantity * 1050;
  return prisma.order.create({
    data: {
      trackingToken: randomBytes(24).toString("base64url"),
      userId: o.userId ?? null,
      customerFirstName: "Karim",
      customerPhone: "0600000000",
      customerEmail: (o.customerEmail ?? "karim@exemple.fr").toLowerCase(),
      mode: o.mode ?? "PICKUP",
      slotAt: o.slotAt ?? new Date("2026-11-19T19:00:00Z"),
      paymentMethod: o.paymentMethod ?? "AT_PICKUP",
      status: o.status ?? "RECEIVED",
      subtotalCents: subtotal,
      totalCents: o.totalCents ?? subtotal,
      editionId: o.editionId ?? null,
      stripePaymentIntentId: o.stripePaymentIntentId ?? null,
      createdAt: o.createdAt,
      items: {
        create: [
          { productId, name: "Pizza test", unitPriceCents: 1050, quantity, isPizza: true },
        ],
      },
    },
  });
}
