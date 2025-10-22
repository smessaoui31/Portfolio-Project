// src/components/menu/ProductsGrid.tsx
"use client";

import AddToCartButton from "@/components/ui/AddToCartButton";

type Category = { id: string; name: string } | null;
type Product = {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: Category;
};

export default function ProductsGrid({ products }: { products: Product[] }) {
  if (!Array.isArray(products)) {
    return (
      <div className="text-red-300 bg-red-900/20 border border-red-700 rounded-md p-4">
        Format inattendu des données produits.
      </div>
    );
  }

  if (products.length === 0) {
    return <div className="text-neutral-400">Aucun produit pour le moment.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <article
          key={p.id}
          className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition"
        >
          <div className="aspect-square bg-neutral-800/60 grid place-items-center text-6xl">
            🍕
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{p.name}</h2>
              <div className="text-white font-bold">{(p.priceCents / 100).toFixed(2)} €</div>
            </div>

            {p.description && (
              <p className="text-sm text-neutral-400 line-clamp-2">{p.description}</p>
            )}

            {p.category && (
              <span className="inline-block mt-1 text-[11px] uppercase tracking-wide text-neutral-500">
                {p.category.name}
              </span>
            )}

            <AddToCartButton productId={p.id} />
          </div>
        </article>
      ))}
    </div>
  );
}