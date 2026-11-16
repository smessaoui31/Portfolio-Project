"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { lineKey, MAX_LINE_QUANTITY } from "@/domain/cart";
import type { CartLineInput } from "@/domain/types";

/** A cart line plus what the UI needs to display it. Prices always come from the server. */
export interface CartItem extends CartLineInput {
  name: string;
  imageUrl: string | null;
  supplementNames: string[];
}

export interface CartQuote {
  subtotalCents: number;
  lines: { lineTotalCents: number }[];
}

interface CartState {
  lines: CartItem[];
  open: boolean;
  quote: CartQuote | null;
  quoteError: string | null;
  add: (item: CartItem) => void;
  setQuantity: (index: number, quantity: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
  setOpen: (open: boolean) => void;
  setQuote: (quote: CartQuote | null, error?: string | null) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      quote: null,
      quoteError: null,
      add: (item) =>
        set((state) => {
          const index = state.lines.findIndex((l) => lineKey(l) === lineKey(item));
          if (index === -1) return { lines: [...state.lines, item] };
          const lines = [...state.lines];
          lines[index] = { ...lines[index], quantity: Math.min(MAX_LINE_QUANTITY, lines[index].quantity + item.quantity) };
          return { lines };
        }),
      setQuantity: (index, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l, i) => (i === index ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (index) => set((state) => ({ lines: state.lines.filter((_, i) => i !== index) })),
      clear: () => set({ lines: [], quote: null, quoteError: null }),
      replace: (items) => set({ lines: items }),
      setOpen: (open) => set({ open }),
      setQuote: (quote, error = null) => set({ quote, quoteError: error }),
    }),
    {
      name: "ofrero-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const cartCount = (lines: CartItem[]) => lines.reduce((sum, l) => sum + l.quantity, 0);

/** True once the persisted cart has been read on the client (avoids hydration mismatches). */
export function useCartReady(): boolean {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
