"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Recherche instantanée avec debounce
  useEffect(() => {
    // Nettoyer le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Ne pas déclencher la recherche si la valeur est la même que dans l'URL
    if (q === (params.get("q") ?? "")) {
      return;
    }

    // Debounce de 400ms
    debounceTimerRef.current = setTimeout(() => {
      router.push(buildUrl({ q: q || null }));
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [q]);

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

  // Raccourci clavier pour focus sur la recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compter les filtres actifs
  const activeFiltersCount = [
    q,
    categoryId && categoryId !== defaultCategoryId,
    sort,
    featured,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setQ("");
    router.push("/menu");
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || "";
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Barre de filtres principale */}
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
      {/* Recherche instantanée */}
      <div className="relative">
        <input
          id="search-input"
          type="text"
          placeholder="Rechercher une pizza… (appuyez sur /)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 pr-10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>

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

      {/* Chips des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500">Filtres actifs:</span>

          {q && (
            <button
              onClick={() => setQ("")}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800/60 px-3 py-1 text-xs text-white hover:bg-neutral-800 transition"
            >
              Recherche: "{q}"
              <span className="text-neutral-400">✕</span>
            </button>
          )}

          {categoryId && categoryId !== defaultCategoryId && (
            <button
              onClick={() => router.push(buildUrl({ categoryId: null }))}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800/60 px-3 py-1 text-xs text-white hover:bg-neutral-800 transition"
            >
              {getCategoryName(categoryId)}
              <span className="text-neutral-400">✕</span>
            </button>
          )}

          {sort && (
            <button
              onClick={() => router.push(buildUrl({ sort: null }))}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800/60 px-3 py-1 text-xs text-white hover:bg-neutral-800 transition"
            >
              {sortOptions.find(o => o.value === sort)?.label}
              <span className="text-neutral-400">✕</span>
            </button>
          )}

          {featured && (
            <button
              onClick={() => router.push(buildUrl({ featured: null }))}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/20 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-600/30 transition"
            >
              Sélection du Chef
              <span className="text-emerald-400">✕</span>
            </button>
          )}

          {activeFiltersCount > 1 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-neutral-400 hover:text-white underline transition"
            >
              Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}