"use client";

import { useEffect, useMemo, useState } from "react";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { OrdersChart } from "@/components/admin/OrdersChart";

type Period = "today" | "week" | "month" | "year" | "all";

type AnalyticsData = {
  period: string;
  stats: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    revenue: number;
    avgBasket: number;
  };
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueTimeline: Array<{ date: string; revenue: number }>;
  ordersTimeline: Array<{ date: string; count: number }>;
};

type Order = {
  id: string;
  totalCents: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "FAILED" | "CANCELLED" | string;
  createdAt: string;
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
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const [ordersData, analyticsData] = await Promise.all([
          apiAuthed<Order[]>("/orders"),
          apiAuthed<AnalyticsData>(`/admin/analytics/dashboard?period=${period}`),
        ]);
        ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(ordersData);
        setAnalytics(analyticsData);
      } catch (e: unknown) {
        console.error(e);
        setErr(e instanceof Error ? e.message : "Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, period]);

  const stats = useMemo(() => {
    if (analytics) {
      return {
        count: analytics.stats.totalOrders,
        paidCount: analytics.stats.paidOrders,
        pendingCount: analytics.stats.pendingOrders,
        shippedCount: analytics.stats.shippedOrders,
        deliveredCount: analytics.stats.deliveredOrders,
        revenueCents: analytics.stats.revenue,
        avgBasket: analytics.stats.avgBasket,
      };
    }
    const count = orders.length;
    const paid = orders.filter((o) => o.status === "PAID");
    const pending = orders.filter((o) => o.status === "PENDING");
    const shipped = orders.filter((o) => o.status === "SHIPPED");
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const revenueCents = paid.reduce((sum, o) => sum + o.totalCents, 0);
    const avgBasket = paid.length ? revenueCents / paid.length : 0;
    return {
      count,
      paidCount: paid.length,
      pendingCount: pending.length,
      shippedCount: shipped.length,
      deliveredCount: delivered.length,
      revenueCents,
      avgBasket,
    };
  }, [orders, analytics]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Tableau de bord</h1>

        {/* Period Selector */}
        <div className="flex gap-2">
          {[
            { label: "Aujourd'hui", value: "today" as Period },
            { label: "7 jours", value: "week" as Period },
            { label: "30 jours", value: "month" as Period },
            { label: "1 an", value: "year" as Period },
            { label: "Tout", value: "all" as Period },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                period === p.value
                  ? "bg-white text-black font-medium"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Commandes (total)" value={String(stats.count)} />
        <StatCard label="CA (payé)" value={`${(stats.revenueCents / 100).toFixed(2)} €`} />
        <StatCard label="Commandes payées" value={String(stats.paidCount)} />
        <StatCard label="Panier moyen" value={`${(stats.avgBasket / 100).toFixed(2)} €`} />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="text-white text-lg font-medium mb-4">Évolution du chiffre d'affaires</h2>
          {analytics && analytics.revenueTimeline.length > 0 ? (
            <RevenueChart data={analytics.revenueTimeline} />
          ) : (
            <div className="h-80 flex items-center justify-center text-neutral-400">
              Aucune donnée disponible
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="text-white text-lg font-medium mb-4">Évolution des commandes</h2>
          {analytics && analytics.ordersTimeline.length > 0 ? (
            <OrdersChart data={analytics.ordersTimeline} />
          ) : (
            <div className="h-80 flex items-center justify-center text-neutral-400">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </section>

      {/* Top Products */}
      {analytics && analytics.topProducts.length > 0 && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800">
            <h2 className="text-white text-base font-medium">Top 10 produits</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400">Produit</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-neutral-400">Quantité</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-neutral-400">Revenus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {analytics.topProducts.map((product) => (
                  <tr key={product.productId} className="hover:bg-neutral-800/30">
                    <td className="px-4 py-3 text-sm text-white">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-neutral-300">{product.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-white font-medium">
                      {(product.revenue / 100).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Latest Orders */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-white text-base font-medium">Dernières commandes</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-neutral-300 hover:text-white underline underline-offset-4"
          >
            Voir tout
          </Link>
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
                full && full.length > 0 ? full : (o.user?.email ?? o.userEmail) || "Client inconnu";
              const email = o.user?.email ?? o.userEmail ?? "—";

              return (
                <li key={o.id} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-800/30">
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
  const base = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border transition";
  switch (status) {
    case "PENDING":
      return (
        <span className={`${base} border-amber-500/40 bg-amber-500/10 text-amber-300`}>En attente</span>
      );
    case "PAID":
      return (
        <span className={`${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-300`}>Payée</span>
      );
    case "SHIPPED":
      return (
        <span className={`${base} border-sky-500/40 bg-sky-500/10 text-sky-300`}>Expédiée</span>
      );
    case "DELIVERED":
      return (
        <span className={`${base} border-green-500/40 bg-green-500/10 text-green-300`}>Livrée</span>
      );
    case "FAILED":
      return (
        <span className={`${base} border-rose-500/40 bg-rose-500/10 text-rose-300`}>Échouée</span>
      );
    case "CANCELLED":
      return (
        <span className={`${base} border-red-500/40 bg-red-500/10 text-red-300`}>Annulée</span>
      );
    default:
      return (
        <span className={`${base} border-neutral-700 bg-neutral-800 text-neutral-300`}>{status}</span>
      );
  }
}
