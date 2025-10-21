"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiAuthed } from "@/lib/api";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};
export type Cart = {
  id: string;
  items: CartItem[];
  totalCents: number;
};

type CartContextType = {
  cart: Cart | null;
  count: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cart: null,
  count: 0,
  loading: false,
  error: null,
  refresh: async () => {},
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  clear: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = useMemo(() => cart?.items?.reduce((n, it) => n + it.quantity, 0) ?? 0, [cart]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiAuthed<Cart>("/cart", { method: "GET" });
      setCart(data);
    } catch (e: any) {
      setError(e?.message || "Erreur panier");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (productId: string, quantity = 1) => {
    await apiAuthed<Cart>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
    await refresh();
  }, [refresh]);

  const update = useCallback(async (itemId: string, quantity: number) => {
    await apiAuthed<Cart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (itemId: string) => {
    await apiAuthed(`/cart/items/${itemId}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    // simple clear: passer tous les items à 0
    const items = cart?.items ?? [];
    for (const it of items) {
      await apiAuthed(`/cart/items/${it.id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: 0 }),
      });
    }
    await refresh();
  }, [cart, refresh]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <CartContext.Provider value={{ cart, count, loading, error, refresh, add, update, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}