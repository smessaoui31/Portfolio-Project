"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ProductSheet } from "@/components/menu/ProductSheet";
import type { MenuProduct } from "@/server/catalog";

const OpenProduct = createContext<(product: MenuProduct) => void>(() => {});

/** Lets any part of a page open the customize-and-add sheet for a product. */
export function ProductSheetProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<MenuProduct | null>(null);
  const [open, setOpen] = useState(false);
  const openProduct = useCallback((p: MenuProduct) => {
    setProduct(p);
    setOpen(true);
  }, []);
  return (
    <OpenProduct.Provider value={openProduct}>
      {children}
      <ProductSheet key={product?.id ?? "none"} product={product} open={open} onOpenChange={setOpen} />
    </OpenProduct.Provider>
  );
}

export const useOpenProduct = () => useContext(OpenProduct);
