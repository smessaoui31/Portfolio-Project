// src/components/admin/ProductForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { api, apiAuthed } from "@/lib/api";
import type { AdminProduct } from "@/types/admin";

type Category = { id: string; name: string };

type Props = {
  mode: "create" | "edit";
  initial?: AdminProduct | null;
  onSaved?: (p: AdminProduct) => void;
};

export default function ProductForm({ mode, initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceEuros, setPriceEuros] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : ""
  );
  const [categoryId, setCategoryId] = useState<string | "">(
    initial?.category?.id ?? ""
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(!!initial?.isFeatured);

  const [cats, setCats] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Category[]>("/categories");
        setCats(data);
      } catch (e: any) {
        console.error("[categories] load error:", e);
      }
    })();
  }, []);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!priceEuros || isNaN(Number(priceEuros))) return false;
    const cents = Math.round(Number(priceEuros) * 100);
    if (cents < 0) return false;
    return true;
  }, [name, priceEuros]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        priceCents: Math.round(Number(priceEuros) * 100),
        categoryId: categoryId || undefined,
        isFeatured,
      };

      const endpoint =
        mode === "create"
          ? "/admin/products"
          : `/admin/products/${initial!.id}`;

      const method = mode === "create" ? "POST" : "PUT";
      const saved = await apiAuthed<AdminProduct>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSaved?.(saved);
    } catch (e: any) {
      console.error("[product save] error:", e);
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Nom</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Pizza Margherita"
          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tomate, mozzarella, basilic…"
          rows={3}
          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm text-neutral-300">Prix (€)</label>
          <input
            inputMode="decimal"
            value={priceEuros}
            onChange={(e) => setPriceEuros(e.target.value)}
            placeholder="9.50"
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm text-neutral-300">Catégorie</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-700"
          >
            <option value="">— Aucune —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-neutral-200">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
        />
        Mettre “À la une”
      </label>

      <div className="pt-2 flex items-center justify-end gap-3">
        <a
          href="/admin/products"
          className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-800/70"
        >
          Annuler
        </a>
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            !canSubmit || saving
              ? "bg-white/60 text-black/70 cursor-not-allowed"
              : "bg-white text-black hover:opacity-90"
          }`}
        >
          {saving ? "Enregistrement…" : mode === "create" ? "Créer" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}