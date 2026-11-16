"use client";

import { usePathname } from "next/navigation";
import { cartCount, useCart, useCartReady } from "@/components/cart/cart-store";
import { formatEuros } from "@/lib/money";
import { ActionBar } from "./ActionBar";

/** Default phone action bar. The home page renders its own (edition price). */
export function SiteActionBar() {
  const pathname = usePathname();
  const ready = useCartReady();
  const count = useCart((s) => cartCount(s.lines));
  const quote = useCart((s) => s.quote);

  if (pathname === "/" || pathname.startsWith("/commande")) return null;

  if (ready && count > 0) {
    return (
      <ActionBar
        primary={{
          href: "/commande",
          label: `Commander · ${count} article${count > 1 ? "s" : ""}`,
          detail: quote ? formatEuros(quote.subtotalCents) : undefined,
        }}
      />
    );
  }
  if (pathname.startsWith("/carte")) {
    return <ActionBar primary={{ href: "/carte", label: "Choisis tes pizzas", disabled: true }} />;
  }
  return <ActionBar primary={{ href: "/carte", label: "Voir la carte" }} />;
}
