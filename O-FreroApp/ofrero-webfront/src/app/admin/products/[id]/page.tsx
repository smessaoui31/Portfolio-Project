// src/app/admin/products/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { apiAuthed } from "@/lib/api";
import type { AdminProduct } from "@/types/admin";

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await apiAuthed<AdminProduct>(`/admin/products/${id}`);
        setProduct(data);
      } catch (e: any) {
        setErr(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleDelete() {
    const ok = window.confirm("Supprimer ce produit ? Cette action est irréversible.");
    if (!ok) return;
    try {
      setDeleting(true);
      await apiAuthed(`/admin/products/${id}`, { method: "DELETE" });
      router.push("/admin/products");
    } catch (e) {
      console.error("[delete product] error:", e);
      setDeleting(false);
    }
  }

  function handleSaved(_p: AdminProduct) {
    router.push("/admin/products");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Éditer le produit</h1>
        <div className="flex items-center gap-2">
          <a
            href="/admin/products"
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-800/70"
          >
            ← Retour
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-600/60 text-red-200 px-3 py-2 text-sm hover:bg-red-600/10 disabled:opacity-60"
          >
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        {loading ? (
          <div className="text-neutral-400">Chargement…</div>
        ) : err ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {err}
          </div>
        ) : product ? (
          <ProductForm mode="edit" initial={product} onSaved={handleSaved} />
        ) : (
          <div className="text-neutral-400">Produit introuvable.</div>
        )}
      </div>
    </div>
  );
}