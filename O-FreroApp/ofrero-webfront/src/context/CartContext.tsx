// src/context/CartContext.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiAuthed } from "@/lib/api";

/* --- Types alignés avec l’API --- */
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
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cart: null,
  count: 0,
  loading: false,
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  refresh: async () => {},
  clear: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const count = useMemo(
    () => (cart?.items?.reduce((s, it) => s + it.quantity, 0) ?? 0),
    [cart]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiAuthed<Cart>("/cart");
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(
    async (productId: string, quantity = 1) => {
      setLoading(true);
      try {
        // POST /cart/items -> renvoie le panier
        const data = await apiAuthed<Cart>("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        });
        setCart(data);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const update = useCallback(
    async (itemId: string, quantity: number) => {
      setLoading(true);
      try {
        const data = await apiAuthed<Cart>("/cart/items/" + itemId, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        });
        setCart(data);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const remove = useCallback(
    async (itemId: string) => {
      setLoading(true);
      try {
        // Selon ton API, DELETE renvoie { deleted, cart } ou juste Cart
        const res = await apiAuthed<any>("/cart/items/" + itemId, { method: "DELETE" });
        setCart(res?.cart ?? res ?? null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(async () => {
    setLoading(true);
    try {
      // Adapte si ton backend expose /cart/clear ou DELETE /cart
      // Ici on tente DELETE /cart qui renverrait le cart vide
      const data = await apiAuthed<Cart>("/cart", { method: "DELETE" });
      setCart(data);
    } catch {
      // si pas de route clear, on retombe sur refresh
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Charger à l’arrivée (utile quand on arrive direct sur /cart)
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <CartContext.Provider value={{ cart, count, loading, add, update, remove, refresh, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}