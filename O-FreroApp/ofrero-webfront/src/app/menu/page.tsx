// Page Menu — charge les catégories côté serveur, le reste côté client
import FiltersBar from "@/components/-/FiltersBar";
import ProductsGrid from "@/components/-/ProductsGrid";
import type { Category } from "@/types";

export const revalidate = 0;

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5050"}/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function MenuPage() {
  const categories = await fetchCategories();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">Notre carte</h1>
        <p className="text-sm text-zinc-400">
          Filtre par catégorie, recherche, tri
        </p>
      </header>

      <FiltersBar categories={categories} />
      <ProductsGrid />
    </main>
  );
}