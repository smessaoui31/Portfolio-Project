// src/context/CartContext.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiAuthed, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
  getGuestCartTotal,
  type GuestCartItem,
} from "@/lib/guestCart";

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
  productName?: string; // Pour le panier invité
};

type CartContextType = {
  id: string | null;
  items: CartItemView[];
  totalCents: number;
  loading: boolean;
  error: string | null;
  isGuest: boolean;

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
  isGuest: true,
  reload: async () => {},
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  clear: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  const isGuest = !token;

  // Charger le panier invité au démarrage
  useEffect(() => {
    if (!token) {
      const guestCart = getGuestCart();
      setGuestCartItems(guestCart.items);
    }
  }, [token]);

  const reload = useCallback(async () => {
    if (!token) {
      // Mode invité: charger depuis localStorage
      const guestCart = getGuestCart();
      setGuestCartItems(guestCart.items);
      return;
    }

    // Mode authentifié: charger depuis l'API
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
    reload();
  }, [reload]);

  const add = useCallback(
    async (productId: string, quantity = 1, opts?: AddOptions) => {
      if (!token) {
        // Mode invité: ajouter au localStorage
        if (!opts?.productName) {
          throw new Error("Product name required for guest cart");
        }

        try {
          // Récupérer le prix du produit depuis l'API publique
          const product = await api<any>(`/products/${productId}`);
          const unitPriceCents = product.priceCents || 0;

          const updatedCart = addToGuestCart(
            productId,
            opts.productName,
            unitPriceCents,
            quantity,
            opts.cooking,
            opts.supplementIds?.map((id) => ({
              id,
              name: "Supplément", // Pourrait être amélioré
              priceCents: 100, // Prix par défaut, à améliorer
            }))
          );
          setGuestCartItems(updatedCart.items);
        } catch (e: any) {
          setErr(e?.message || "Erreur lors de l'ajout au panier");
          throw e;
        }
        return;
      }

      // Mode authentifié: utiliser l'API
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
        setErr(e?.message || "Erreur lors de l'ajout au panier");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const update = useCallback(
    async (itemId: string, quantity: number) => {
      if (!token) {
        // Mode invité: itemId est l'index dans le tableau
        const index = parseInt(itemId, 10);
        const updatedCart = updateGuestCartItem(index, quantity);
        setGuestCartItems(updatedCart.items);
        return;
      }

      // Mode authentifié
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
      if (!token) {
        // Mode invité: itemId est l'index dans le tableau
        const index = parseInt(itemId, 10);
        const updatedCart = removeFromGuestCart(index);
        setGuestCartItems(updatedCart.items);
        return;
      }

      // Mode authentifié
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
    if (!token) {
      // Mode invité
      clearGuestCart();
      setGuestCartItems([]);
      return;
    }

    // Mode authentifié
    if (!cart) return;
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

  // Convertir les items invités au format CartItemView
  const normalizedItems: CartItemView[] = useMemo(() => {
    if (!token) {
      return guestCartItems.map((item, index) => ({
        id: index.toString(),
        productId: item.productId,
        name: item.name,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        cooking: item.cooking as CookingLevel | undefined,
        supplements: item.supplements?.map((sup) => ({
          id: sup.id,
          supplementId: sup.id,
          name: sup.name,
          unitPriceCents: sup.priceCents,
        })),
      }));
    }
    return cart?.items ?? [];
  }, [token, guestCartItems, cart?.items]);

  const totalCents = useMemo(() => {
    if (!token) {
      return getGuestCartTotal();
    }
    return cart?.totalCents ?? 0;
  }, [token, cart?.totalCents, guestCartItems]);

  const value = useMemo<CartContextType>(
    () => ({
      id: cart?.id ?? null,
      items: normalizedItems,
      totalCents,
      loading,
      error: error,
      isGuest,
      reload,
      add,
      update,
      remove,
      clear,
    }),
    [cart?.id, normalizedItems, totalCents, loading, error, isGuest, reload, add, update, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
