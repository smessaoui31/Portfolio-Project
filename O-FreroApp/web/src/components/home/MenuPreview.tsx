"use client";

import Link from "next/link";
import { ProductRow } from "@/components/menu/ProductRow";
import type { MenuProduct } from "@/server/catalog";
import { useOpenProduct } from "./ProductSheetProvider";

export function MenuPreview({ products, categories }: { products: MenuProduct[]; categories: { name: string; href: string }[] }) {
  const openProduct = useOpenProduct();
  return (
    <section aria-labelledby="carte-titre" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="carte-titre" className="font-display text-5xl md:text-6xl">La carte</h2>
          <p className="mt-2 text-muted-2">Toute l&apos;année, au feu de bois.</p>
        </div>
        <ul className="flex gap-2">
          {categories.map((c) => (
            <li key={c.name}>
              <Link href={c.href} className="block rounded-full border border-line-2 px-4 py-1.5 text-sm text-muted-2 hover:border-fg hover:text-fg">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 grid gap-x-10 md:grid-cols-3">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} onSelect={openProduct} />
        ))}
      </div>
      <Link
        href="/carte"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-fg underline-offset-4 hover:underline"
      >
        Voir toute la carte
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
