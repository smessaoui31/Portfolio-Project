// src/app/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

type AdminOrderRow = {
  id: string;
  createdAt: string;
  status: OrderStatus | string;
  totalCents: number;
  user: { id: string; email: string; fullName: string } | null;
  items: { id: string; name: string; quantity: number; unitPriceCents: number }[];
  payment: { status: string; provider: string; intentId: string } | null;
};

type AdminOrdersResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: AdminOrderRow[];
};

const PAGE_SIZE = 10;

export default function AdminOrdersPage() {
  const { token, role } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();

  const page = Math.max(parseInt(sp.get("page") || "1", 10) || 1, 1);
  const status = (sp.get("status") || "") as "" | OrderStatus;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [error, setError] = useState<string>("");

  // Fetch
  useEffect(() => {
    if (!token || role !== "ADMIN") return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        qs.set("page", String(page));
        qs.set("pageSize", String(PAGE_SIZE));
        if (status) qs.set("status", status);

        const res = await apiAuthed<AdminOrdersResponse>(`/admin/orders?${qs.toString()}`);
        setData(res);
      } catch (e: any) {
        setError(e?.message || "Erreur de chargement des commandes");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, role, page, status]);

  const totalPages = useMemo(
    () => (data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1),
    [data]
  );

  function setParam(next: Partial<{ page: number; status: string }>) {
    const qs = new URLSearchParams(sp.toString());
    if (next.page !== undefined) qs.set("page", String(next.page));
    if (next.status !== undefined) {
      if (next.status) qs.set("status", next.status);
      else qs.delete("status");
      // revenir page 1 si on change le filtre
      qs.set("page", "1");
    }
    router.push(`?${qs.toString()}`);
  }

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-white">Toutes les commandes</h1>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setParam({ status: e.target.value })}
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-700"
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payée</option>
            <option value="FAILED">Échouée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 text-neutral-300 text-sm">
          {loading
            ? "Chargement…"
            : data
            ? `${data.total} commande${data.total > 1 ? "s" : ""} — page ${data.page}/${totalPages}`
            : "—"}
        </div>

        {error && (
          <div className="p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && data && data.items.length === 0 && !error && (
          <div className="p-6 text-neutral-400">Aucune commande à afficher.</div>
        )}

        {!loading && data && data.items.length > 0 && (
          <ul className="divide-y divide-neutral-800">
            {data.items.map((o) => (
              <li key={o.id} className="px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  {/* Nom du client (ou fallback) */}
                  <div className="text-white text-sm truncate">
                    {o.user?.fullName?.trim() ||
                      // si jamais tu veux déduire prénom/nom plus tard :
                      // [o.user?.firstName, o.user?.lastName].filter(Boolean).join(" ").trim() ||
                      "Client inconnu"}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">
                    {o.user?.email ?? "—"}
                  </div>

                  <div className="mt-1 text-xs text-neutral-500">
                    <span className="inline-block mr-2"># {o.id}</span>
                    <span className="inline-block">
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-white font-medium">
                    {(o.totalCents / 100).toFixed(2)} €
                  </span>
                  <StatusBadge status={o.status} />
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-sm text-neutral-300 hover:text-white underline underline-offset-4"
                  >
                    Détails
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {!loading && data && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-neutral-800">
            <button
              className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800/60 disabled:opacity-50"
              onClick={() => setParam({ page: Math.max(page - 1, 1) })}
              disabled={page <= 1}
            >
              ← Précédent
            </button>
            <div className="text-xs text-neutral-400">
              Page {page} / {totalPages}
            </div>
            <button
              className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800/60 disabled:opacity-50"
              onClick={() => setParam({ page: Math.min(page + 1, totalPages) })}
              disabled={page >= totalPages}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border transition";
  switch (status) {
    case "PENDING":
      return (
        <span className={`${base} border-amber-500/40 bg-amber-500/10 text-amber-300`}>
          En attente
        </span>
      );
    case "PAID":
      return (
        <span className={`${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-300`}>
          Payée
        </span>
      );
    case "FAILED":
      return (
        <span className={`${base} border-red-500/40 bg-red-500/10 text-red-300`}>
          Échouée
        </span>
      );
    case "CANCELLED":
      return (
        <span className={`${base} border-neutral-700 bg-neutral-800 text-neutral-300`}>
          Annulée
        </span>
      );
    default:
      return (
        <span className={`${base} border-neutral-700 bg-neutral-800 text-neutral-300`}>
          {status}
        </span>
      );
  }
}