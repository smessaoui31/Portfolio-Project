"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

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
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cart: null,
  count: 0,
  loading: false,
  refresh: async () => {},
  addItem: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Cart>("/cart");
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    setLoading(true);
    try {
      const data = await api<Cart>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const data = await api<Cart>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const data = await api<{ deleted: CartItem; cart: Cart }>(`/cart/items/${itemId}`, {
        method: "DELETE",
      });
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    if (!cart) return;
    setLoading(true);
    try {
      // met tout à 0 via PATCH 
      await Promise.all(cart.items.map((it) => api(`/cart/items/${it.id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: 0 }),
      })));
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [cart, refresh]);

  // auto-load au mount
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const count = cart?.items.reduce((n, it) => n + it.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, count, loading, refresh, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}