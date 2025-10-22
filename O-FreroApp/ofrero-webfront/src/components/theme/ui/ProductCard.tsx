// src/components/ProductCard.tsx
"use client";

import { motion } from "framer-motion";
import Price from "./Price";

type Category = { id: string; name: string } | null;

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  category?: Category;
};

export default function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (p: Product) => void;
}) {
  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-lg shadow-black/20 ring-1 ring-inset ring-white/5 transition"
    >
      {/* header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight text-zinc-100">
          {product.name}
        </h3>
        {product.category?.name && (
          <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
            {product.category.name}
          </span>
        )}
      </div>

      {/* description */}
      {product.description && (
        <p className="mb-4 line-clamp-2 text-sm text-zinc-400">
          {product.description}
        </p>
      )}

      {/* footer */}
      <div className="flex items-center justify-between">
        <Price cents={product.priceCents} />
        <button
          type="button"
          onClick={() => onAdd?.(product)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300/20"
        >
          Ajouter
        </button>
      </div>
    </motion.article>
  );
}