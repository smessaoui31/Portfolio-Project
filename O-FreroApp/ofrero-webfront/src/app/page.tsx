// src/app/page.tsx (SSR + passe les données au composant client animé)
import { api } from "@/lib/api";
import ProductsGrid from "@/components/menu/ProductsGrid";

type Category = { id: string; name: string } | null;
type Product = {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: Category;
};
type Paginated<T> = { page: number; pageSize: number; total: number; items: T[] };

export const revalidate = 0; // no-store en dev

export default async function HomePage() {
  const data = await api<Paginated<Product>>("/products");
  const products = data.items ?? [];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-10 pb-8 border-b border-neutral-800">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">🍕 O’Frero Pizza</h1>
        <p className="mt-2 text-neutral-400">
          Pizzas artisanales, ingrédients frais — noir & blanc, comme on aime.
        </p>
      </header>

      {/* Grille produits (animée côté client) */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <ProductsGrid products={products} />
      </section>

      <footer className="py-8 text-center text-neutral-500 text-sm border-t border-neutral-800">
        © {new Date().getFullYear()} O’Frero Pizza
      </footer>
    </main>
  );
}