// src/app/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import OrderStatusBadge from "@/components/theme/ui/OrderStatusBadge";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "FAILED" | "CANCELLED";

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
  const initialQuery = sp.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (sp.get("q")) qs.set("q", sp.get("q")!);

        const res = await apiAuthed<AdminOrdersResponse>(`/admin/orders?${qs.toString()}`);
        setData(res);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur de chargement des commandes");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, role, page, status, sp]);

  const totalPages = useMemo(
    () => (data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1),
    [data]
  );

  function setParam(next: Partial<{ page: number; status: string; q: string }>) {
    const qs = new URLSearchParams(sp.toString());
    if (next.page !== undefined) qs.set("page", String(next.page));
    if (next.status !== undefined) {
      if (next.status) qs.set("status", next.status);
      else qs.delete("status");
      qs.set("page", "1");
    }
    if (next.q !== undefined) {
      if (next.q) qs.set("q", next.q);
      else qs.delete("q");
      qs.set("page", "1");
    }
    router.push(`?${qs.toString()}`);
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setParam({ q: value });
    }, 400);
  };

  const handlePageInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pageNum = parseInt(formData.get("pageNum") as string, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setParam({ page: pageNum });
    }
  };

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground">Toutes les commandes</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par client, email, numéro..."
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-border w-full sm:w-64"
          />
          <select
            value={status}
            onChange={(e) => setParam({ status: e.target.value })}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-border"
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payée</option>
            <option value="SHIPPED">Expédiée</option>
            <option value="DELIVERED">Livrée</option>
            <option value="FAILED">Échouée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-foreground text-sm">
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
          <div className="p-6 text-muted-foreground">Aucune commande à afficher.</div>
        )}

        {!loading && data && data.items.length > 0 && (
          <ul className="divide-y divide-border">
            {data.items.map((o) => (
              <li key={o.id} className="px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between hover:bg-accent/30">
                <div className="min-w-0">
                  <div className="text-foreground text-sm truncate">
                    {o.user?.fullName?.trim() || "Client inconnu"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {o.user?.email ?? "—"}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="inline-block mr-2"># {o.id}</span>
                    <span className="inline-block">
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-foreground font-medium">
                    {(o.totalCents / 100).toFixed(2)} €
                  </span>
                  <OrderStatusBadge status={o.status} />
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-sm text-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Détails
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Enhanced Pagination */}
        {!loading && data && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border flex-wrap">
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent/60 disabled:opacity-50"
              onClick={() => setParam({ page: Math.max(page - 1, 1) })}
              disabled={page <= 1}
            >
              ← Précédent
            </button>

            <form onSubmit={handlePageInput} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Page</span>
              <input
                type="number"
                name="pageNum"
                min="1"
                max={totalPages}
                defaultValue={page}
                className="w-16 px-2 py-1 text-sm bg-secondary border border-border rounded text-foreground text-center"
              />
              <span className="text-xs text-muted-foreground">/ {totalPages}</span>
              <button
                type="submit"
                className="px-2 py-1 text-xs bg-secondary text-foreground rounded hover:bg-secondary"
              >
                OK
              </button>
            </form>

            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent/60 disabled:opacity-50"
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
