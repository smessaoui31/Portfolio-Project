// src/app/page.tsx
import { api } from "@/lib/api";

type Category = { id: string; name: string } | null;
type Product = {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: Category;
};
type Paginated<T> = { page: number; pageSize: number; total: number; items: T[] };

export default async function HomePage() {
  const data: Paginated<Product> = await api("/products");
  const products = data.items ?? [];

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <header className="py-10 text-center border-b border-neutral-800">
        <h1 className="text-4xl font-semibold tracking-tight">
          🍕 O’Frero Pizza
        </h1>
        <p className="mt-2 text-neutral-400">
          Pizzas artisanales, ingrédients frais, saveur garantie.
        </p>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-neutral-800 rounded-2xl shadow-lg hover:shadow-xl transition-transform hover:-translate-y-1 overflow-hidden"
          >
            <div className="aspect-square bg-neutral-700 flex items-center justify-center text-6xl">
              🍕
            </div>
            <div className="p-5 space-y-2">
              <h2 className="text-xl font-semibold text-white">{p.name}</h2>
              <p className="text-neutral-400 text-sm">{p.description}</p>
              {p.category && (
                <span className="text-xs uppercase text-neutral-500">
                  {p.category.name}
                </span>
              )}
              <div className="pt-3 text-lg font-bold text-white">
                {(p.priceCents / 100).toFixed(2)} €
              </div>
            </div>
          </div>
        ))}
      </section>

      <footer className="py-8 text-center text-neutral-500 text-sm border-t border-neutral-800">
        © 2025 O’Frero Pizza — Fait avec ❤️ et Next.js
      </footer>
    </main>
  );
}