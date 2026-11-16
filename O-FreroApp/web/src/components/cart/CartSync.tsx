"use client";

import { useEffect, useRef } from "react";
import { mergeCartAction, quoteCartAction, syncCartAction } from "@/app/actions/cart";
import { useCart, useCartReady } from "./cart-store";

/**
 * Keeps the cart honest: asks the server for prices on every change, merges the
 * device cart into the account once at sign-in, then saves it to the account.
 */
export function CartSync({ signedIn }: { signedIn: boolean }) {
  const ready = useCartReady();
  const lines = useCart((s) => s.lines);
  const replace = useCart((s) => s.replace);
  const setQuote = useCart((s) => s.setQuote);
  const merged = useRef(false);

  useEffect(() => {
    if (!ready || !signedIn || merged.current) return;
    merged.current = true;
    mergeCartAction(useCart.getState().lines).then((result) => {
      if (result) replace(result);
    });
  }, [ready, signedIn, replace]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await quoteCartAction(lines);
      if (cancelled) return;
      if (result.ok) setQuote(result.quote);
      else setQuote(null, result.message);
      if (signedIn && merged.current) await syncCartAction(lines);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, lines, signedIn, setQuote]);

  return null;
}
