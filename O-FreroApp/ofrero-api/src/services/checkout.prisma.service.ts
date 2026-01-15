// src/services/checkout.prisma.service.ts
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { getCartWithTotalPrisma } from "./cart.prisma.service";

/* --------------------- Numéro de commande lisible --------------------- */

function generateOrderNumber() {
  const part1 = Date.now().toString(36).toUpperCase().slice(-4);
  const part2 = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `OFR-${part1}${part2}`;
}

async function getUniqueOrderNumber(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = `OFR-${Date.now().toString(36).toUpperCase().slice(-3)}${Math.random()
      .toString(36)
      .toUpperCase()
      .slice(2, 7)}`.slice(0, 4 + 1 + 7); // "OFR-" + 7 chars max
    const exists = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!exists) return candidate;
  }
  return generateOrderNumber();
}

/* ---------------------------- Types d'entrée --------------------------- */

type CreateOrderFromCartInput = {
  userId: string;
  // On lit le panier DB (incluant cuisson + suppléments) pour construire la commande
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    phone: string;
  };
};

type GuestOrderItem = {
  productId: string;
  quantity: number;
  cooking?: string;
  supplements?: string[];
};

type CreateGuestOrderInput = {
  items: GuestOrderItem[];
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
};

export async function createOrderFromCartPrisma(input: CreateOrderFromCartInput) {
  const { userId, address } = input;

  // 1) Panier enrichi (produits + suppléments) + total calculé
  const cart = await getCartWithTotalPrisma(userId);
  if (!cart.items || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // 2) Préparer les lignes de commande
  const itemsData: Prisma.OrderItemCreateManyOrderInput[] = cart.items.map((it) => {
    // Somme des suppléments par unité
    const suppsUnitTotal =
      Array.isArray((it as any).supplements)
        ? (it as any).supplements.reduce(
            (sum: number, s: { unitPriceCents?: number }) => sum + (s.unitPriceCents ?? 0),
            0
          )
        : 0;

    // Prix unitaire final (produit + suppléments)
    const perUnitWithSupp = (it as any).unitPriceCents + suppsUnitTotal;

    // Total suppléments pour la ligne (par unité * quantité)
    const supplementsTotalCents = suppsUnitTotal * (it.quantity ?? 1);

    return {
      productId: it.productId,
      name: it.name,                           // snapshot nom produit
      unitPriceCents: perUnitWithSupp,         // prix unitaire incluant les suppléments
      quantity: it.quantity,
      // Champs optionnels selon ton modèle Prisma
      cooking: ((it as any).cooking ?? "NORMAL") as any,
      supplementsTotalCents,
    };
  });

  // 3) Total depuis la vue panier (inclut suppléments)
  const totalCents = cart.totalCents;

  // 4) Numéro de commande lisible
  const orderNumber = await getUniqueOrderNumber();

  // 5) Création de la commande + items
  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      totalCents,
      orderNumber, // affichage court type "OFR-AB12CD3"
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

/* ------------------------------ Utilitaires ----------------------------- */

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

/* ------------------------ Commande invité ------------------------ */

export async function createGuestOrderPrisma(input: CreateGuestOrderInput) {
  const { items, guestInfo } = input;

  if (!items || items.length === 0) {
    throw new Error("Items array is empty");
  }

  // 1) Récupérer les produits depuis la base de données
  const productIds = items.map((it) => it.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { supplements: { include: { supplement: true } } },
  });

  if (products.length !== items.length) {
    throw new Error("Some products not found");
  }

  // 2) Construire les lignes de commande avec les prix réels
  let totalCents = 0;
  const itemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    // Prix unitaire du produit
    let unitPriceCents = product.priceCents;

    // Calculer le total des suppléments
    let supplementsTotalCents = 0;
    if (item.supplements && item.supplements.length > 0) {
      for (const suppId of item.supplements) {
        const productSupplement = product.supplements.find((ps) => ps.supplementId === suppId);
        if (productSupplement) {
          const suppPrice = productSupplement.overridePriceCents ?? productSupplement.supplement.priceCents;
          supplementsTotalCents += suppPrice;
        }
      }
    }

    // Prix unitaire total (produit + suppléments par unité)
    const pricePerUnit = unitPriceCents + supplementsTotalCents;

    // Total pour cette ligne
    const lineTotal = pricePerUnit * item.quantity;
    totalCents += lineTotal;

    // Total suppléments pour toute la ligne
    const lineSuppTotal = supplementsTotalCents * item.quantity;

    itemsData.push({
      productId: item.productId,
      name: product.name,
      unitPriceCents: pricePerUnit,
      quantity: item.quantity,
      cooking: (item.cooking ?? "NORMAL") as any,
      supplementsTotalCents: lineSuppTotal,
    });
  }

  // 3) Générer un numéro de commande unique
  const orderNumber = await getUniqueOrderNumber();

  // 4) Créer la commande invité
  const order = await prisma.order.create({
    data: {
      userId: null, // Commande invité
      guestEmail: guestInfo.email,
      guestFirstName: guestInfo.firstName,
      guestLastName: guestInfo.lastName,
      status: "PENDING",
      totalCents,
      orderNumber,
      shippingLine1: guestInfo.address,
      shippingLine2: null,
      shippingCity: "", // Pourrait être extrait de l'adresse si nécessaire
      shippingPostalCode: "",
      shippingPhone: guestInfo.phone,
      items: { createMany: { data: itemsData } },
    },
    include: { items: true },
  });

  return { order, totalCents };
}