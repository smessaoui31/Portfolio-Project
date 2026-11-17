"use client";

import { useEffect, useRef } from "react";
import { mergeCartAction, quoteCartAction, syncCartAction } from "@/app/actions/cart";
import { useCart, useCartReady } from "./cart-store";

/** localStorage key: the account this device's cart was last merged into. */
export const CART_OWNER_KEY = "ofrero-cart-compte";

function readOwner(): string | null {
  try {
    return localStorage.getItem(CART_OWNER_KEY);
  } catch {
    return null;
  }
}

/**
 * Keeps the cart honest: asks the server for prices on every change, merges this
 * device's cart into the account once per account, then saves it to the account.
 */
export function CartSync({ userId }: { userId: string | null }) {
  const ready = useCartReady();
  const lines = useCart((s) => s.lines);
  const replace = useCart((s) => s.replace);
  const setQuote = useCart((s) => s.setQuote);
  const linked = useRef(false);

  useEffect(() => {
    if (!ready || !userId || linked.current) return;
    if (readOwner() === userId) {
      linked.current = true;
      return;
    }
    mergeCartAction(useCart.getState().lines).then((result) => {
      if (!result) return;
      replace(result);
      try {
        localStorage.setItem(CART_OWNER_KEY, userId);
      } catch {
        // Without storage the merge may run again on the next visit; quantities are capped.
      }
      linked.current = true;
    });
  }, [ready, userId, replace]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await quoteCartAction(lines);
      if (cancelled) return;
      if (result.ok) setQuote(result.quote);
      else setQuote(null, result.message);
      if (userId && linked.current) await syncCartAction(lines);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, lines, userId, setQuote]);

  return null;
}
