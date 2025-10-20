"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard, { type Product } from "../components/ui/ProductCard";
import SkeletonGrid from "../components/ui/SkeletonGrid";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5050";

type ProductsResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Product[];
};

export default function MenuContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // client-side fetch pour interactivité immédiate
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`, { cache: "no-store" });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data: ProductsResponse = await res.json();
        if (!active) return;
        setProducts(Array.isArray(data.items) ? data.items : []);
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const byText = q.trim().toLowerCase();
    return products.filter((p) => {
      const okText =
        !byText ||
        p.name.toLowerCase().includes(byText) ||
        (p.description ?? "").toLowerCase().includes(byText);
      const okCat = category === "all" || p.category?.name === category;
      return okText && okCat;
    });
  }, [products, q, category]);

  function handleAdd(p: Product) {
    // TODO: brancher sur un vrai CartContext côté front
    // pour l’instant, feedback simple :
    // eslint-disable-next-line no-alert
    alert(`Ajouté au panier : ${p.name}`);
  }

  return (
    <section className="space-y-6">
      {/* filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-inset ring-white/5 focus:ring-zinc-300/20"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Toutes les catégories" : c}
              </option>
            ))}
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-64 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-inset ring-white/5 focus:ring-zinc-300/20"
          />
        </div>

        <div className="text-xs text-zinc-500">
          {filtered.length} produit{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* grille */}
      {loading ? (
        <SkeletonGrid count={8} />
      ) : error ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-6 text-sm text-zinc-400">
          Aucun produit ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={handleAdd} />
          ))}
        </div>
      )}
    </section>
  );
}