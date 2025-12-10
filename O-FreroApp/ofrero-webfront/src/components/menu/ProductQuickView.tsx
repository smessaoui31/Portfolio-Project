"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import AddToCartButton from "@/components/theme/ui/AddToCartButton";
import ProductCustomizeButton from "@/components/menu/ProductCustomizeButton";
import type { Product } from "@/types";

type ProductQuickViewProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  getProductImage: (p: Product) => string;
};

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  getProductImage,
}: ProductQuickViewProps) {
  if (!product) return null;

  const isPizza = (product.category?.name ?? "").toLowerCase() === "pizza";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-800 bg-neutral-900 p-0 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative aspect-square md:aspect-auto md:min-h-[400px] overflow-hidden rounded-l-2xl bg-neutral-800/60">
                <Image
                  src={getProductImage(product)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
                <div className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-lg font-semibold text-white backdrop-blur-sm">
                  {(product.priceCents / 100).toFixed(2)} €
                </div>
              </div>

              {/* Contenu */}
              <div className="flex flex-col p-6 md:p-8">
                <div className="flex-1">
                  <div className="mb-4">
                    {product.category && (
                      <span className="inline-block text-xs uppercase tracking-wide text-neutral-500 mb-2">
                        {product.category.name}
                      </span>
                    )}
                    <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                  </div>

                  {product.description && (
                    <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                      {product.description}
                    </p>
                  )}

                  {product.isFeatured && (
                    <div className="mb-6">
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-sm">
                        ⭐ Sélection du Chef
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <AddToCartButton productId={product.id} />
                  {isPizza && (
                    <ProductCustomizeButton
                      productId={product.id}
                      priceCents={product.priceCents}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
