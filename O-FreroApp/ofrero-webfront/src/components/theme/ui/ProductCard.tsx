// src/components/ProductCard.tsx
"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import Price from "./Price";

type Category = { id: string; name: string } | null;

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  category?: Category;
};

const ProductCard = memo(function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (p: Product) => void;
}) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group flex h-full min-h-[200px] flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-lg shadow-black/20 ring-1 ring-inset ring-white/5 transition"
    >
      {/* header */}
      <div className="mb-3 flex h-10 items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-zinc-100">
          {product.name}
        </h3>
        {product.category?.name && (
          <span className="shrink-0 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
            {product.category.name}
          </span>
        )}
      </div>

      {/* description */}
      <div className="mb-4 h-10">
        <p className="line-clamp-2 text-sm leading-5 text-zinc-400">
          {product.description || '\u00A0'}
        </p>
      </div>

      {/* footer */}
      <div className="mt-auto flex items-center justify-between">
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
});

export default ProductCard;