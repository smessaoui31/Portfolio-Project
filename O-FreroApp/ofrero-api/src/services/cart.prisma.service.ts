// src/services/cart.prisma.service.ts
import { prisma } from "../lib/prisma";

/** Vue normalisée du panier renvoyée à l’API */
export type CartItemView = {
  id: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type CartView = {
  id: string;
  items: CartItemView[];
  totalCents: number;
};

/** Récupère ou crée le panier de l’utilisateur (en base) */
export async function getOrCreateCartPrisma(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

/** Renvoie le panier formaté + total calculé (type explicite) */
export async function getCartWithTotalPrisma(userId: string): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: { select: { id: true, name: true, priceCents: true } } },
    orderBy: { id: "asc" },
  });

  // ⬇️ Typage explicite du reduce (sum est number, it est l’élément du tableau items)
  const totalCents = items.reduce<number>((sum, it) => {
    return sum + it.product.priceCents * it.quantity;
  }, 0);

  // ⬇️ Typage explicite du map pour produire un CartItemView
  const normalizedItems: CartItemView[] = items.map((it): CartItemView => ({
    id: it.id,
    productId: it.productId,
    name: it.product.name,
    unitPriceCents: it.product.priceCents,
    quantity: it.quantity,
  }));

  return {
    id: cart.id,
    items: normalizedItems,
    totalCents,
  };
}

/** Ajoute un produit au panier (ou incrémente la quantité) et renvoie le panier à jour */
export async function addItemToCartPrisma(
  userId: string,
  productId: string,
  quantity: number
): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  // Vérifier l’existence du produit
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  // Upsert (cartId, productId) : 1 ligne max par produit
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });

  return getCartWithTotalPrisma(userId);
}

/** Met à jour la quantité d’un item (0 = suppression) et renvoie le panier à jour */
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

/** Supprime un item du panier et renvoie le panier à jour */
export async function removeCartItemPrisma(userId: string, itemId: string): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new Error("Item not found");

  await prisma.cartItem.delete({ where: { id: itemId } });

  return getCartWithTotalPrisma(userId);
}

/** Vide le panier (après commande, par ex.) et renvoie le panier désormais vide */
export async function clearCartPrisma(userId: string): Promise<CartView> {
  const cart = await getOrCreateCartPrisma(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCartWithTotalPrisma(userId);
}