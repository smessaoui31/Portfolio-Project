"use client";

import { useState } from "react";
import type { MenuCategory, MenuProduct } from "@/server/catalog";
import { ProductRow } from "./ProductRow";
import { ProductSheet } from "./ProductSheet";

const anchor = (name: string) => `categorie-${name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}`;

export function MenuList({ categories }: { categories: MenuCategory[] }) {
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [open, setOpen] = useState(false);

  function select(product: MenuProduct) {
    setSelected(product);
    setOpen(true);
  }

  return (
    <>
      <nav aria-label="Catégories" className="sticky top-16 z-20 -mx-4 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
        <ul className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <li key={c.id}>
              <a
                href={`#${anchor(c.name)}`}
                className="block whitespace-nowrap rounded-full border border-line-2 px-4 py-1.5 text-sm text-muted-2 transition hover:border-fg hover:text-fg"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {categories.map((c) => (
        <section key={c.id} id={anchor(c.name)} className="scroll-mt-32 pt-10">
          <h2 className="font-display text-4xl md:text-5xl">{c.name}</h2>
          <div className="mt-4 grid gap-x-10 md:grid-cols-2">
            {c.products.map((p) => (
              <ProductRow key={p.id} product={p} onSelect={select} />
            ))}
          </div>
        </section>
      ))}

      <ProductSheet key={selected?.id ?? "none"} product={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
