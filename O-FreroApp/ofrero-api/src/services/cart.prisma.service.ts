// src/services/cart.prisma.service.ts
import { prisma } from "../lib/prisma";
import type { Prisma, CookingLevel } from "@prisma/client";

/** ---- Types renvoyés à l’API ---- */
export type CartSupplementView = {
  id: string;             // id de la ligne CartItemSupplement
  supplementId: string;   // id du supplément source
  name: string;           // snapshot
  unitPriceCents: number; // snapshot
};

export type CartItemView = {
  id: string;
  productId: string;
  name: string;
  unitPriceCents: number; // prix unitaire du produit (snapshot produit courant)
  quantity: number;       // quantité de l’item
  cooking: "NORMAL" | "WELL_DONE" | "EXTRA_CRISPY";
  supplements: CartSupplementView[];
};

export type CartView = {
  id: string;
  items: CartItemView[];
  totalCents: number;
};

/** ---- Helpers ---- */
export async function getOrCreateCartPrisma(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

export async function getCartWithTotalPrisma(userId: string): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  type ItemPayload = Prisma.CartItemGetPayload<{
    include: {
      product: { select: { id: true, name: true, priceCents: true } };
      supplements: {
        select: {
          id: true;
          supplementId: true;
          name: true;
          unitPriceCents: true;
        };
        orderBy: { id: "asc" | "desc" };
      };
    };
  }>;

  const items: ItemPayload[] = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      product: { select: { id: true, name: true, priceCents: true } },
      supplements: {
        select: {
          id: true,
          supplementId: true,
          name: true,
          unitPriceCents: true,
        },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  // Total = (prix produit * qty) + (somme suppléments * qty item)
  const totalCents = items.reduce<number>((sum, it) => {
    const base = it.product.priceCents * it.quantity;
    const suppsOneUnit = it.supplements.reduce<number>(
      (s, sv) => s + sv.unitPriceCents,
      0
    );
    const supps = suppsOneUnit * it.quantity; // chaque pizza prend ses suppléments
    return sum + base + supps;
  }, 0);

  const normalizedItems: CartItemView[] = items.map((it) => ({
    id: it.id,
    productId: it.productId,
    name: it.product.name,
    unitPriceCents: it.product.priceCents,
    quantity: it.quantity,
    cooking: it.cooking ?? "NORMAL",
    supplements: it.supplements.map((s) => ({
      id: s.id,
      supplementId: s.supplementId,
      name: s.name,
      unitPriceCents: s.unitPriceCents,
    })),
  }));

  return {
    id: cart.id,
    items: normalizedItems,
    totalCents,
  };
}

/** Ajoute un produit (avec options cuisson/suppléments) au panier et renvoie le panier */
export async function addItemToCartPrisma(
  userId: string,
  productId: string,
  quantity: number,
  options?: { cooking?: CookingLevel | "NORMAL" | "WELL_DONE" | "EXTRA_CRISPY"; supplementIds?: string[] }
): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const cooking: CookingLevel = (options?.cooking as CookingLevel) ?? "NORMAL";
  const supplementIds = options?.supplementIds ?? [];

  // upsert 1 ligne max par (cartId, productId)
  const upserted = await prisma.cartItem.upsert({
    where: { cartId_productId_cooking: { cartId: cart.id, productId, cooking } },
    update: {
      quantity: { increment: quantity },
      cooking, // on garde la dernière cuisson choisie
    },
    create: {
      cartId: cart.id,
      productId,
      quantity,
      cooking,
    },
  });

  // Attacher les suppléments demandés (s’ils n’y sont pas déjà)
  if (supplementIds.length > 0) {
    const supps = await prisma.supplement.findMany({
      where: { id: { in: supplementIds } },
      select: { id: true, name: true, priceCents: true, isActive: true },
    });
    const found = new Map(supps.map((s) => [s.id, s]));
    for (const sId of supplementIds) {
      const s = found.get(sId);
      if (!s) throw new Error("Supplement not found");
      if (!s.isActive) continue;

      const already = await prisma.cartItemSupplement.findFirst({
        where: { cartItemId: upserted.id, supplementId: s.id },
        select: { id: true },
      });
      if (already) continue;

      await prisma.cartItemSupplement.create({
        data: {
          cartItemId: upserted.id,
          supplementId: s.id,
          name: s.name,
          unitPriceCents: s.priceCents,
        },
      });
    }
  }

  return getCartWithTotalPrisma(userId);
}

/** Met à jour la quantité d’un item (0 = suppression) et renvoie le panier */
export async function updateCartItemPrisma(
  userId: string,
  itemId: string,
  quantity: number
): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new Error("Item not found");

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  return getCartWithTotalPrisma(userId);
}

/** Change la cuisson d’un item et renvoie le panier */
export async function updateCartItemCookingPrisma(
  userId: string,
  itemId: string,
  cooking: CookingLevel | "NORMAL" | "WELL_DONE" | "EXTRA_CRISPY"
): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new Error("Item not found");

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { cooking: cooking as CookingLevel },
  });

  return getCartWithTotalPrisma(userId);
}

/** Ajoute un supplément à un item (si absent) et renvoie le panier */
export async function addSupplementToCartItemPrisma(
  userId: string,
  itemId: string,
  supplementId: string
): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true },
  });
  if (!item) throw new Error("Item not found");

  const supp = await prisma.supplement.findUnique({
    where: { id: supplementId },
    select: { id: true, name: true, priceCents: true, isActive: true },
  });
  if (!supp) throw new Error("Supplement not found");
  if (!supp.isActive) throw new Error("Supplement not found");

  const existing = await prisma.cartItemSupplement.findFirst({
    where: { cartItemId: item.id, supplementId: supp.id },
    select: { id: true },
  });
  if (existing) throw new Error("Already attached");

  await prisma.cartItemSupplement.create({
    data: {
      cartItemId: item.id,
      supplementId: supp.id,
      name: supp.name,
      unitPriceCents: supp.priceCents,
    },
  });

  return getCartWithTotalPrisma(userId);
}

/** Retire un supplément d’un item et renvoie le panier */
export async function removeSupplementFromCartItemPrisma(
  userId: string,
  itemId: string,
  supplementId: string
): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true },
  });
  if (!item) throw new Error("Item not found");

  const existing = await prisma.cartItemSupplement.findFirst({
    where: { cartItemId: item.id, supplementId },
    select: { id: true },
  });
  if (!existing) throw new Error("Supplement not attached");

  await prisma.cartItemSupplement.delete({ where: { id: existing.id } });

  return getCartWithTotalPrisma(userId);
}

/** Remplace la liste des suppléments d’un item par une nouvelle liste et renvoie le panier */
export async function setCartItemSupplementsPrisma(
  userId: string,
  itemId: string,
  supplementIds: string[]
): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true },
  });
  if (!item) throw new Error("Item not found");

  // liste actuelle
  const current = await prisma.cartItemSupplement.findMany({
    where: { cartItemId: item.id },
    select: { id: true, supplementId: true },
  });
  const currentSet = new Set(current.map((c) => c.supplementId));
  const nextSet = new Set(supplementIds);

  // à retirer
  const toRemove = current.filter((c) => !nextSet.has(c.supplementId));
  if (toRemove.length > 0) {
    await prisma.cartItemSupplement.deleteMany({
      where: { id: { in: toRemove.map((r) => r.id) } },
    });
  }

  // à ajouter
  const neededIds = [...nextSet].filter((id) => !currentSet.has(id));
  if (neededIds.length > 0) {
    const supps = await prisma.supplement.findMany({
      where: { id: { in: neededIds } },
      select: { id: true, name: true, priceCents: true, isActive: true },
    });
    const found = new Map(supps.map((s) => [s.id, s]));

    const toCreate = neededIds
      .map((sId) => {
        const s = found.get(sId);
        if (!s || !s.isActive) return null;
        return {
          cartItemId: item.id,
          supplementId: s.id,
          name: s.name,
          unitPriceCents: s.priceCents,
        };
      })
      .filter(Boolean) as Prisma.CartItemSupplementCreateManyInput[];

    if (toCreate.length > 0) {
      await prisma.cartItemSupplement.createMany({ data: toCreate });
    }

    // si un id ne correspond à aucun supplément, on considère “Supplement not found”
    if (neededIds.some((id) => !found.get(id))) {
      throw new Error("Supplement not found");
    }
  }

  return getCartWithTotalPrisma(userId);
}

/** Supprime un item du panier et renvoie le panier */
export async function removeCartItemPrisma(userId: string, itemId: string): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new Error("Item not found");

  await prisma.cartItem.delete({ where: { id: itemId } });

  return getCartWithTotalPrisma(userId);
}

/** Vide le panier (après commande) et renvoie le panier vide */
export async function clearCartPrisma(userId: string): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCartWithTotalPrisma(userId);
}