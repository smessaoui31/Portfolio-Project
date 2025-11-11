"use client";

import { useEffect, useMemo, useState } from "react";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

/** Type tolérant : fonctionne même si ton API ne renvoie pas toujours user{} */
type Order = {
  id: string;
  totalCents: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | string;
  createdAt: string;
  // Certains back renvoient user à part, d'autres un alias userEmail
  user?: {
    email?: string | null;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  userEmail?: string | null;
};

export default function AdminDashboardHome() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await apiAuthed<Order[]>("/orders");
        // Optionnel : trier côté front si le back ne le fait pas
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(data);
      } catch (e: unknown) {
        console.error(e);
        setErr(e instanceof Error ? e.message : "Impossible de charger les commandes");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const stats = useMemo(() => {
    const count = orders.length;
    const paid = orders.filter((o) => o.status === "PAID");
    const pending = orders.filter((o) => o.status === "PENDING");
    const revenueCents = paid.reduce((sum, o) => sum + o.totalCents, 0);
    const avgBasket = paid.length ? revenueCents / paid.length : 0;
    return { count, paidCount: paid.length, pendingCount: pending.length, revenueCents, avgBasket };
  }, [orders]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-white">Tableau de bord</h1>

      {/* Résumé */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Commandes (total)" value={String(stats.count)} />
        <StatCard
          label="CA (payé)"
          value={`${(stats.revenueCents / 100).toFixed(2)} €`}
        />
        <StatCard label="Commandes payées" value={String(stats.paidCount)} />
        <StatCard
          label="Panier moyen (payé)"
          value={`${(stats.avgBasket / 100).toFixed(2)} €`}
        />
      </section>

      {/* Dernières commandes */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-white text-base font-medium">Dernières commandes</h2>
          {/* Ex: futur filtre/pagination */}
        </div>

        {loading ? (
          <ul className="divide-y divide-neutral-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="h-4 w-40 rounded skeleton" />
                  <div className="mt-2 h-3 w-24 rounded skeleton" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-16 rounded skeleton" />
                  <div className="h-6 w-20 rounded skeleton" />
                  <div className="h-4 w-12 rounded skeleton" />
                </div>
              </li>
            ))}
          </ul>
        ) : err ? (
          <div className="p-6 text-red-300">{err}</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-neutral-400">Aucune commande.</div>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {orders.slice(0, 12).map((o) => {
              const full =
                o.user?.fullName ??
                [o.user?.firstName, o.user?.lastName].filter(Boolean).join(" ").trim();
              const displayName =
                full && full.length > 0
                  ? full
                  : (o.user?.email ?? o.userEmail) || "Client inconnu";
              const email = o.user?.email ?? o.userEmail ?? "—";

              return (
                <li key={o.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-white text-sm truncate">{displayName}</div>
                    <div className="text-xs text-neutral-400">{email}</div>
                  </div>
                  <div className="flex items-center gap-4">
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
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="text-sm text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
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
        <span className={`${base} border-rose-500/40 bg-rose-500/10 text-rose-300`}>
          Échouée
        </span>
      );
    case "CANCELLED":
      return (
        <span className={`${base} border-red-500/40 bg-red-500/10 text-red-300`}>
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