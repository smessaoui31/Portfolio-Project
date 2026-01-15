// src/lib/guestCart.ts
"use client";

export type GuestCartItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  cooking?: string;
  supplements?: Array<{
    id: string;
    name: string;
    priceCents: number;
  }>;
};

export type GuestCart = {
  items: GuestCartItem[];
};

const GUEST_CART_KEY = "ofrero_guest_cart";

export function getGuestCart(): GuestCart {
  if (typeof window === "undefined") return { items: [] };

  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (!stored) return { items: [] };
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading guest cart:", error);
    return { items: [] };
  }
}

export function saveGuestCart(cart: GuestCart): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving guest cart:", error);
  }
}

export function addToGuestCart(
  productId: string,
  name: string,
  unitPriceCents: number,
  quantity: number = 1,
  cooking?: string,
  supplements?: Array<{ id: string; name: string; priceCents: number }>
): GuestCart {
  const cart = getGuestCart();

  // Chercher si le produit existe déjà avec les mêmes options
  const existingIndex = cart.items.findIndex(
    (item) =>
      item.productId === productId &&
      item.cooking === cooking &&
      JSON.stringify(item.supplements) === JSON.stringify(supplements)
  );

  if (existingIndex !== -1) {
    // Incrémenter la quantité
    cart.items[existingIndex].quantity += quantity;
  } else {
    // Ajouter nouvel item
    cart.items.push({
      productId,
      name,
      unitPriceCents,
      quantity,
      cooking,
      supplements,
    });
  }

  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartItem(index: number, quantity: number): GuestCart {
  const cart = getGuestCart();

  if (index >= 0 && index < cart.items.length) {
    if (quantity <= 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = quantity;
    }
  }

  saveGuestCart(cart);
  return cart;
}

export function removeFromGuestCart(index: number): GuestCart {
  const cart = getGuestCart();

  if (index >= 0 && index < cart.items.length) {
    cart.items.splice(index, 1);
  }

  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
}

export function getGuestCartTotal(): number {
  const cart = getGuestCart();
  return cart.items.reduce((total, item) => {
    const itemPrice = item.unitPriceCents * item.quantity;
    const supplementsPrice = (item.supplements || []).reduce(
      (sum, sup) => sum + sup.priceCents * item.quantity,
      0
    );
    return total + itemPrice + supplementsPrice;
  }, 0);
}
