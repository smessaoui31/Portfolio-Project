"use client";

import { buttonClasses } from "@/components/ui/Button";
import { formatEuros } from "@/lib/money";
import type { MenuProduct } from "@/server/catalog";
import { useOpenProduct } from "./ProductSheetProvider";

export function OrderProductButton({ product }: { product: MenuProduct }) {
  const openProduct = useOpenProduct();
  return (
    <button type="button" onClick={() => openProduct(product)} className={buttonClasses("primary", "lg", "min-w-56 justify-between")}>
      <span>Commander</span>
      <span className="tabular-nums">{formatEuros(product.unitPriceCents)}</span>
    </button>
  );
}
