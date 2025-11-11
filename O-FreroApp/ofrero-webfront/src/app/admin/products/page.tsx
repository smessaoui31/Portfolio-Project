// src/app/admin/products/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiAuthed } from "@/lib/api";
import type { AdminProduct, AdminProductListResponse } from "@/types/admin";

type SortKey = "name" | "createdAt" | "priceCents";
type SortDir = "asc" | "desc";

export default function AdminProductsListPage() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // states d'actions par ligne
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // petit debounce sur la recherche
  const debounceRef = useRef<number | null>(null);

  async function fetchList(search?: string) {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (search?.trim()) qs.set("q", search.trim());
      // NOTE: si tu veux paginer, ajoute page/pageSize ici
      const data = await apiAuthed<AdminProductListResponse>(
        `/admin/products?${qs.toString()}`
      );
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? 0));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur de chargement");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  // Debounce input
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchList(q);
    }, 400) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  const filtered = useMemo(() => {
    const base = Array.isArray(items) ? items : [];

    const sorted = [...base].sort((a, b) => {
      const va =
        sortKey === "priceCents"
          ? a.priceCents
          : sortKey === "name"
          ? (a.name || "").toLowerCase()
          : new Date(a.createdAt ?? 0).getTime();
      const vb =
        sortKey === "priceCents"
          ? b.priceCents
          : sortKey === "name"
          ? (b.name || "").toLowerCase()
          : new Date(b.createdAt ?? 0).getTime();

      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, sortKey, sortDir]);

  async function toggleFeatured(id: string) {
    try {
      setTogglingId(id);
      await apiAuthed(`/admin/products/${id}/featured`, { method: "PATCH" });
      // rafraîchit la ligne localement pour éviter un refetch global
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p))
      );
    } catch (e) {
      console.error("[toggle featured] error:", e);
      // fallback: refetch liste
      fetchList(q);
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteProduct(id: string) {
    const ok = window.confirm("Supprimer ce produit ? Cette action est irréversible.");
    if (!ok) return;
    try {
      setDeletingId(id);
      await apiAuthed(`/admin/products/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      console.error("[delete product] error:", e);
      fetchList(q);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-white">Produits</h1>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="rounded-md bg-white text-black px-3 py-2 text-sm font-medium hover:opacity-90"
          >
            + Nouveau produit
          </Link>
        </div>
      </div>

      {/* Barre d'actions : recherche + tri */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400">Trier par</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-700"
          >
            <option value="createdAt">Créé le</option>
            <option value="name">Nom</option>
            <option value="priceCents">Prix</option>
          </select>

          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-800/70"
            aria-label={`Ordre ${sortDir}`}
            title={`Ordre ${sortDir}`}
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <div className="border-b border-neutral-800 px-4 py-3 text-sm text-neutral-300">
          {loading ? "Chargement…" : `${filtered.length} / ${total} produit(s)`}
          {err && <span className="ml-2 text-red-400">— {err}</span>}
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-neutral-800 text-neutral-400">
            <tr>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Catégorie</th>
              <th className="px-4 py-2 text-left">Prix</th>
              <th className="px-4 py-2 text-left">À la une</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-neutral-400" colSpan={5}>
                  Chargement…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-neutral-400" colSpan={5}>
                  Aucun produit
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-white">
                    <div className="font-medium">{p.name}</div>
                    {p.description ? (
                      <div className="text-xs text-neutral-400 line-clamp-2">
                        {p.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {p.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {(p.priceCents / 100).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${
                        p.isFeatured
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-neutral-700 bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {p.isFeatured ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleFeatured(p.id)}
                        disabled={togglingId === p.id}
                        className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800/70 disabled:opacity-60"
                        title={p.isFeatured ? "Retirer de la une" : "Mettre à la une"}
                      >
                        {togglingId === p.id
                          ? "..."
                          : p.isFeatured
                          ? "Retirer une"
                          : "Mettre une"}
                      </button>

                      <Link
                        href={`/admin/products/${p.id}`}
                        className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800/70"
                      >
                        Éditer
                      </Link>

                      <button
                        onClick={() => deleteProduct(p.id)}
                        disabled={deletingId === p.id}
                        className="rounded-md border border-red-600/60 text-red-200 px-3 py-1.5 text-xs hover:bg-red-600/10 disabled:opacity-60"
                      >
                        {deletingId === p.id ? "Suppression…" : "Supprimer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">Total : {total}</p>
    </div>
  );
}