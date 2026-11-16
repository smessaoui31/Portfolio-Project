"use client";

import { cartCount, useCart, useCartReady } from "@/components/cart/cart-store";
import { ActionBar } from "@/components/site/ActionBar";
import { formatEuros } from "@/lib/money";
import type { MenuProduct } from "@/server/catalog";
import { useOpenProduct } from "./ProductSheetProvider";

/** On the home page: order the poster pizza, or go to checkout once the cart has something. */
export function HomeActionBar({ product }: { product: MenuProduct }) {
  const openProduct = useOpenProduct();
  const ready = useCartReady();
  const count = useCart((s) => cartCount(s.lines));
  const quote = useCart((s) => s.quote);

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
  return (
    <ActionBar
      primary={{ onClick: () => openProduct(product), label: "Commander", detail: formatEuros(product.unitPriceCents) }}
    />
  );
}
