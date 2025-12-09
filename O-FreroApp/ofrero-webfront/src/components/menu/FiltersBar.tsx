"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types";

type Props = {
  categories: Category[];
};

const sortOptions = [
  { value: "", label: "Nom (A→Z)" },
  { value: "nameDesc", label: "Nom (Z→A)" },
  { value: "price", label: "Prix ↑" },
  { value: "priceDesc", label: "Prix ↓" },
  { value: "createdAtDesc", label: "Nouveautés" },
];

export default function FiltersBar({ categories }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");

  // Trouver l'ID de la catégorie "Pizza" pour la sélectionner par défaut
  const pizzaCategory = categories.find(c => c.name.toLowerCase() === "pizza");
  const defaultCategoryId = pizzaCategory?.id ?? "";

  const categoryId = params.get("categoryId") ?? defaultCategoryId;
  const sort = params.get("sort") ?? "";
  const featured = params.get("featured") === "true";

  // Rediriger vers la catégorie Pizza par défaut si aucune catégorie n'est sélectionnée
  useEffect(() => {
    if (!params.get("categoryId") && defaultCategoryId) {
      router.push(buildUrl({ categoryId: defaultCategoryId }));
    }
  }, []);

  // construit l’URL /menu?... proprement
  const buildUrl = useMemo(() => {
    return (patch: Partial<Record<string, string | null>>) => {
      const p = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "" || v === undefined) p.delete(k);
        else p.set(k, String(v));
      });
      // remise à 1 si on change les filtres
      p.delete("page");
      return `/menu?${p.toString()}`;
    };
  }, [params]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q }));
  }

  return (
    <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
      {/* Recherche */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Rechercher une pizza…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
        <button
          type="submit"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          Rechercher
        </button>
      </form>

      {/* Catégories */}
      <select
        value={categoryId}
        onChange={(e) => router.push(buildUrl({ categoryId: e.target.value || null }))}
        className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
        aria-label="Filtrer par catégorie"
      >
        <option value="">Toutes les catégories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Tri */}
      <select
        value={sort}
        onChange={(e) => router.push(buildUrl({ sort: e.target.value || null }))}
        className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
        aria-label="Trier"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Featured */}
      <button
        onClick={() => router.push(buildUrl({ featured: featured ? null : "true" }))}
        className={`rounded-md border px-4 py-2 text-sm transition
          ${featured
            ? "border-emerald-500/40 bg-emerald-600/15 text-emerald-300"
            : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800/60"}`}
        aria-pressed={featured}
      >
        La Sélection du Chef
      </button>
    </div>
  );
}