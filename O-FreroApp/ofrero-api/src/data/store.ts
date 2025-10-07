export type Role = "user" | "admin";
export type User = {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: Role;
};

export const USERS: User[] = [];

export const newId = () => "u_" + Math.random().toString(36).slice(2, 10);

// (optionnel) petite liste de produits pour test
export const PRODUCTS = [
  { id: "p1", name: "Margherita", priceCents: 900 },
  { id: "p2", name: "Pepperoni",  priceCents: 1100 },
  { id: "p3", name: "4 Cheeses",  priceCents: 1200 }
];

export type CartItem = {
  id: string;
  productId: string;
  name: string; // snapshot du nom au moment de l'ajout
  unitPriceCents: number; // meme snapshot pour le prix
  quantity: number;
};

export type Cart = {
  userId: string;
  items: CartItem[];
};

export const CARTS: Cart[] = [];

export function getOrCreateCart(userId: string): Cart {
  let c = CARTS.find(c => c.userId === userId);
  if (!c) {
    c = { userId, items: [] };
    CARTS.push(c);
  }
  return c;
}

export function cartTotalCents(cart: Cart): number {
  return cart.items.reduce((sum, it) => sum + it.unitPriceCents * it.quantity, 0);
}