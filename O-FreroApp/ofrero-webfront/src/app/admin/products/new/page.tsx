"use client";

import { useEffect, useState } from "react";
import { apiAuthed, api } from "@/lib/api";
import type { AdminCategory } from "@/types/admin";
import { useRouter } from "next/navigation";

export default function AdminProductCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [priceCents, setPriceCents] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | "">("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const c = await api<AdminCategory[]>("/categories");
        setCats(c);
      } catch {}
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const body = {
        name,
        priceCents: Number(priceCents || 0),
        description: description || undefined,
        categoryId: categoryId || undefined,
        isFeatured,
      };
      await apiAuthed("/admin/products", { method: "POST", body: JSON.stringify(body) });
      router.push("/admin/products");
    } catch (err: any) {
      setError(err?.message || "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Nouveau produit</h1>

      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div>
          <label className="text-sm text-neutral-300">Nom</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-300">Prix (centimes)</label>
          <input
            type="number" value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
          />
          <div className="text-xs text-neutral-500 mt-1">Soit {(Number(priceCents)/100).toFixed(2)} €</div>
        </div>

        <div>
          <label className="text-sm text-neutral-300">Catégorie</label>
          <select
            value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
          >
            <option value="">— Aucune —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-300">Description</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
            rows={3}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Mettre à la une
        </label>

        <div className="pt-2">
          <button type="submit" className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-90">
            Créer
          </button>
        </div>
      </form>
    </div>
  );
}