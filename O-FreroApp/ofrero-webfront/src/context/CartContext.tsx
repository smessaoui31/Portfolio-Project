// src/context/CartContext.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export type CookingLevel = "NORMAL" | "WELL_DONE" | "EXTRA_CRISPY";

export type CartSupplementView = {
  id: string;
  supplementId: string;
  name: string;
  unitPriceCents: number;
};

export type CartItemView = {
  id: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  cooking?: CookingLevel;
  supplements?: CartSupplementView[];
};

export type CartView = {
  id: string;
  items: CartItemView[];
  totalCents: number;
};

type AddOptions = {
  cooking?: CookingLevel;
  supplementIds?: string[];
};

type CartContextType = {
  id: string | null;
  items: CartItemView[];
  totalCents: number;
  loading: boolean;
  error: string | null;

  reload: () => Promise<void>;
  add: (productId: string, quantity?: number, opts?: AddOptions) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  id: null,
  items: [],
  totalCents: 0,
  loading: false,
  error: null,
  reload: async () => {},
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  clear: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setCart({ id: null as any, items: [], totalCents: 0 });
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const data = await apiAuthed<CartView>("/cart");
      setCart(data);
    } catch (e: any) {
      setErr(e?.message || "Erreur de chargement du panier");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) reload();
    else setCart({ id: null as any, items: [], totalCents: 0 });
  }, [token, reload]);

  const add = useCallback(
    async (productId: string, quantity = 1, opts?: AddOptions) => {
      if (!token) throw new Error("Non authentifié");
      setLoading(true);
      setErr(null);
      try {
        const body = {
          productId,
          quantity,
          cooking: opts?.cooking ?? "NORMAL",
          supplementIds: opts?.supplementIds ?? [],
        };
        const data = await apiAuthed<CartView>("/cart/items", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setCart(data);
      } catch (e: any) {
        setErr(e?.message || "Erreur lors de l’ajout au panier");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const update = useCallback(
    async (itemId: string, quantity: number) => {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const data = await apiAuthed<CartView>(`/cart/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        });
        setCart(data);
      } catch (e: any) {
        setErr(e?.message || "Erreur de mise à jour");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const remove = useCallback(
    async (itemId: string) => {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const data = await apiAuthed<{ cart: CartView }>(`/cart/items/${itemId}`, {
          method: "DELETE",
        });
        setCart(data.cart);
      } catch (e: any) {
        setErr(e?.message || "Erreur de suppression");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const clear = useCallback(async () => {
    // Option simple: supprimer chaque item (sinon faire un endpoint /cart/clear)
    if (!token || !cart) return;
    setLoading(true);
    setErr(null);
    try {
      for (const it of cart.items) {
        await apiAuthed<{ cart: CartView }>(`/cart/items/${it.id}`, { method: "DELETE" });
      }
      await reload();
    } catch (e: any) {
      setErr(e?.message || "Erreur lors du vidage du panier");
    } finally {
      setLoading(false);
    }
  }, [token, cart, reload]);

  const value = useMemo<CartContextType>(
    () => ({
      id: cart?.id ?? null,
      items: cart?.items ?? [],
      totalCents: cart?.totalCents ?? 0,
      loading,
      error: error,
      reload,
      add,
      update,
      remove,
      clear,
    }),
    [cart?.id, cart?.items, cart?.totalCents, loading, error, reload, add, update, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}