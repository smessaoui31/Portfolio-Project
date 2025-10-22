// src/context/CartContext.tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiAuthed } from "@/lib/api";

type CartItem = {
  id: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

type Cart = {
  id: string;
  items: CartItem[];
  totalCents: number;
};

type CartContextType = {
  cart: Cart | null;
  items: CartItem[];
  count: number; // ← important
  totalCents: number;
  loading: boolean;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cart: null,
  items: [],
  count: 0,            // ← default
  totalCents: 0,
  loading: false,
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  refresh: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const items = cart?.items ?? [];
  const count = useMemo(
    () => items.reduce((n, it) => n + it.quantity, 0),
    [items]
  );
  const totalCents = cart?.totalCents ?? 0;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiAuthed<Cart>("/cart");
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (productId: string, quantity = 1) => {
    setLoading(true);
    try {
      const data = await apiAuthed<Cart>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const data = await apiAuthed<Cart>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const data = await apiAuthed<{ cart: Cart }>(`/cart/items/${itemId}`, { method: "DELETE" });
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // charge le panier au mount
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <CartContext.Provider
      value={{ cart, items, count, totalCents, loading, add, update, remove, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}