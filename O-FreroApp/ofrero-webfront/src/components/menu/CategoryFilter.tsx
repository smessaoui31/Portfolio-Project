"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Category = { id: string; name: string };

export default function CategoryFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPending, startTransition] = useTransition();

  const active = params.get("category") || "all";

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:5050"}/categories`)
      .then(r => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  function setCategory(next: string) {
    startTransition(() => {
      const p = new URLSearchParams(params.toString());
      if (next === "all") p.delete("category"); else p.set("category", next);
      router.push(`/menu?${p.toString()}`);
    });
  }

  function setSort(next: string) {
    startTransition(() => {
      const p = new URLSearchParams(params.toString());
      if (next === "name-asc") p.delete("sort"); else p.set("sort", next);
      router.push(`/menu?${p.toString()}`);
    });
  }

  const sort = params.get("sort") || "name-asc";

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Catégories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("all")}
          className={`rounded-lg px-3 py-1.5 text-sm transition
            ${active === "all" ? "bg-white text-black" : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"}`}
          disabled={isPending}
        >
          Toutes
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition
              ${active === c.id ? "bg-white text-black" : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"}`}
            disabled={isPending}
            title={c.name}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Tri */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-400">Trier par</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md bg-neutral-900 text-neutral-200 text-sm border border-neutral-800 px-2 py-1.5"
          disabled={isPending}
        >
          <option value="name-asc">Nom (A→Z)</option>
          <option value="price-asc">Prix ↑</option>
          <option value="price-desc">Prix ↓</option>
        </select>
      </div>
    </div>
  );
}