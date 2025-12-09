// Page Menu — charge les catégories côté serveur, le reste côté client
import { Suspense } from "react";
import FiltersBar from "@/components/menu/FiltersBar";
import ProductsGrid from "@/components/menu/ProductsGrid";
import type { Category } from "@/types";

export const revalidate = 0;

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5050"}/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-neutral-900/60 rounded-2xl border border-neutral-800 h-96 animate-pulse"
        />
      ))}
    </div>
  );
}

export default async function MenuPage() {
  const categories = await fetchCategories();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">La Carte</h1>
        <p className="text-sm text-zinc-400">
          Filtre par catégorie, recherche, tri
        </p>
      </header>

      <FiltersBar categories={categories} />
      <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsGrid />
      </Suspense>
    </main>
  );
}