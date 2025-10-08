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

export const newItemId = () => "ci_" + Math.random().toString(36).slice(2, 10); // on fix le helper ici pour l'import sur la route

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

// ---- ORDERS (in-memory) ----
export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  totalCents: number;
  status: OrderStatus;
  stripePaymentIntentId?: string;
};

export const ORDERS: Order[] = [];

export const newOrderId = () => "o_" + Math.random().toString(36).slice(2, 10);

export function createOrderFromCart(userId: string, items: { name: string; unitPriceCents: number; productId: string; quantity: number }[], totalCents: number): Order {
  const order: Order = {
    id: newOrderId(),
    userId,
    items: items.map(i => ({
      productId: i.productId,
      name: i.name,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity
    })),
    totalCents,
    status: "pending"
  };
  ORDERS.push(order);
  return order;
}

export function setOrderStatus(orderId: string, status: OrderStatus) {
  const o = ORDERS.find(o => o.id === orderId);
  if (o) o.status = status;
  return o;
}

export function findOrderByPaymentIntent(piId: string) {
  return ORDERS.find(o => o.stripePaymentIntentId === piId);
}