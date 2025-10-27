"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiAuthed, api } from "@/lib/api";
import type { AdminCategory, AdminProduct } from "@/types/admin";

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [data, setData] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState({
    name: "",
    priceCents: 0,
    description: "",
    categoryId: "" as string | "",
    isFeatured: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([
          apiAuthed<AdminProduct>(`/admin/products/${id}`),
          api<AdminCategory[]>("/categories"),
        ]);
        setData(p);
        setCats(c);
        setForm({
          name: p.name,
          priceCents: p.priceCents,
          description: p.description || "",
          categoryId: p.categoryId || "",
          isFeatured: p.isFeatured,
        });
      } catch (err: any) {
        setError(err?.message || "Erreur de chargement");
      }
    })();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiAuthed(`/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          priceCents: Number(form.priceCents || 0),
          description: form.description || undefined,
          categoryId: form.categoryId || undefined,
          isFeatured: form.isFeatured,
        }),
      });
      router.push("/admin/products");
    } catch (err: any) {
      setError(err?.message || "Erreur");
    }
  }

  async function toggleFeatured() {
    await apiAuthed(`/admin/products/${id}/featured`, { method: "PATCH" });
    setForm((f) => ({ ...f, isFeatured: !f.isFeatured }));
  }

  async function remove() {
    if (!confirm("Supprimer ce produit ?")) return;
    await apiAuthed(`/admin/products/${id}`, { method: "DELETE" });
    router.push("/admin/products");
  }

  if (!data) {
    return <div className="text-neutral-400">Chargement…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Éditer : {data.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFeatured}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-800/70"
          >
            {form.isFeatured ? "Retirer de la une" : "Mettre à la une"}
          </button>
          <button
            onClick={remove}
            className="rounded-md border border-red-600 text-red-200 px-3 py-2 text-sm hover:bg-red-600/10"
          >
            Supprimer
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div>
          <label className="text-sm text-neutral-300">Nom</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-300">Prix (centimes)</label>
          <input
            type="number"
            value={form.priceCents}
            onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
          />
          <div className="text-xs text-neutral-500 mt-1">Soit {(Number(form.priceCents)/100).toFixed(2)} €</div>
        </div>

        <div>
          <label className="text-sm text-neutral-300">Catégorie</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
          >
            <option value="">— Aucune —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-300">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white focus:border-neutral-700"
            rows={3}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
          />
          Mettre à la une
        </label>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}