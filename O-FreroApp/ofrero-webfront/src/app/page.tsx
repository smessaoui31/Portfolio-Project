// src/app/page.tsx
import { api } from "@/lib/api";
import AddToCartButton from "@/components/ui/AddToCartButton";

type Category = { id: string; name: string } | null;
type Product = {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: Category;
};
type Paginated<T> = { page: number; pageSize: number; total: number; items: T[] };

export const revalidate = 0; // pas de cache côté serveur (dev)

export default async function HomePage() {
  // Récupère les produits depuis l'API (SSR)
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

      {/* Grille produits */}
      <section className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p) => (
          <article
            key={p.id}
            className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition"
          >
            <div className="aspect-square bg-neutral-800/60 grid place-items-center text-6xl">🍕</div>
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

              {/* Bouton client */}
              <AddToCartButton productId={p.id} />
            </div>
          </article>
        ))}

        {products.length === 0 && (
          <div className="col-span-full text-neutral-400">Aucun produit pour le moment.</div>
        )}
      </section>

      <footer className="py-8 text-center text-neutral-500 text-sm border-t border-neutral-800">
        © {new Date().getFullYear()} O’Frero Pizza — Fait avec ❤️ et Next.js
      </footer>
    </main>
  );
}