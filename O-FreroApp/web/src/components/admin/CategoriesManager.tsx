"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteCategoryAction, reorderCategoriesAction, saveCategoryAction } from "@/app/actions/admin-catalog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface Category {
  id: string;
  name: string;
  isPizza: boolean;
  products: number;
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isPizza, setIsPizza] = useState(false);

  async function run(action: () => Promise<{ ok: boolean; message?: string } | void>) {
    const result = await action();
    setError(result && !result.ok ? (result.message ?? "Action impossible.") : null);
    router.refresh();
  }

  function move(index: number, delta: number) {
    const ids = categories.map((c) => c.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderCategoriesAction(ids));
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    await run(() => saveCategoryAction({ name, isPizza }));
    setName("");
    setIsPizza(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {categories.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex flex-col">
              <button type="button" aria-label={`Monter ${c.name}`} className="text-muted hover:text-fg disabled:opacity-20" disabled={i === 0} onClick={() => move(i, -1)}>
                ▲
              </button>
              <button
                type="button"
                aria-label={`Descendre ${c.name}`}
                className="text-muted hover:text-fg disabled:opacity-20"
                disabled={i === categories.length - 1}
                onClick={() => move(i, 1)}
              >
                ▼
              </button>
            </div>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{c.name}</span>
              <span className="text-xs text-muted">
                {c.products} produit{c.products > 1 ? "s" : ""}
              </span>
            </span>
            <label className="flex items-center gap-2 text-sm text-muted-2">
              <input
                type="checkbox"
                className="accent-[var(--ember)]"
                checked={c.isPizza}
                onChange={(e) => run(() => saveCategoryAction({ id: c.id, name: c.name, isPizza: e.target.checked }))}
              />
              Pizzas (tampons, offerte, éditions)
            </label>
            <button
              type="button"
              className="text-sm text-muted-2 hover:text-danger"
              onClick={() => window.confirm(`Supprimer ${c.name} ?`) && run(() => deleteCategoryAction(c.id))}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <form onSubmit={add} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4">
        <Input aria-label="Nouvelle catégorie" placeholder="Nouvelle catégorie" value={name} onChange={(e) => setName(e.target.value)} className="!w-auto flex-1" required />
        <label className="flex items-center gap-2 text-sm text-muted-2">
          <input type="checkbox" className="accent-[var(--ember)]" checked={isPizza} onChange={(e) => setIsPizza(e.target.checked)} />
          Pizzas
        </label>
        <Button type="submit">Ajouter</Button>
      </form>
    </div>
  );
}
