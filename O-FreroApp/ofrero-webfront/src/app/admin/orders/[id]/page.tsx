"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiAuthed } from "@/lib/api";

type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

type AdminOrderDetail = {
  id: string;
  createdAt: string;
  status: OrderStatus | string;
  totalCents: number;
  user: { id: string; email: string; fullName: string } | null;
  items: { id: string; productId: string; name: string; quantity: number; unitPriceCents: number }[];
  payment: { status: string; provider: string; intentId: string; createdAt?: string } | null;
  shipping: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    phone: string;
  };
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiAuthed<AdminOrderDetail>(`/admin/orders/${id}`);
        setOrder(data);
      } catch (e: any) {
        setError(e?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalFormatted = useMemo(
    () => (order ? (order.totalCents / 100).toFixed(2) + " €" : "—"),
    [order]
  );

  return (
    <main className="space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-neutral-400">
          <Link href="/admin/orders" className="hover:underline hover:text-white">
            Commandes
          </Link>{" "}
          / <span className="text-neutral-300">Détail</span>
        </div>
        <button
          onClick={() => router.refresh()}
          className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800/60"
        >
          Actualiser
        </button>
      </div>

      {/* Header */}
      <header className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        {loading ? (
          <div className="text-neutral-400">Chargement…</div>
        ) : error ? (
          <div className="text-red-300">{error}</div>
        ) : !order ? (
          <div className="text-neutral-400">Commande introuvable.</div>
        ) : (
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {order.user?.fullName || "Client inconnu"}
              </h1>
              <div className="text-sm text-neutral-400">
                #{order.id} • {new Date(order.createdAt).toLocaleString()} •{" "}
                <span className="text-white font-medium">{totalFormatted}</span>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>
        )}
      </header>

      {/* Grid détail */}
      {!loading && order && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Items */}
          <section className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            <h2 className="text-white font-medium mb-3">Articles</h2>
            {order.items.length === 0 ? (
              <p className="text-neutral-400 text-sm">Aucun article.</p>
            ) : (
              <ul className="divide-y divide-neutral-800">
                {order.items.map((it) => (
                  <li key={it.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{it.name}</div>
                      <div className="text-xs text-neutral-400">
                        {(it.unitPriceCents / 100).toFixed(2)} € × {it.quantity}
                      </div>
                    </div>
                    <div className="text-sm text-white font-medium">
                      {((it.unitPriceCents * it.quantity) / 100).toFixed(2)} €
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
              <span className="text-neutral-400 text-sm">Total</span>
              <span className="text-white font-semibold">{totalFormatted}</span>
            </div>
          </section>

          {/* Client & livraison & paiement */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="text-white font-medium mb-2">Client</h3>
              <div className="text-sm text-neutral-200">
                {order.user?.fullName || "—"}
              </div>
              <div className="text-xs text-neutral-400">{order.user?.email || "—"}</div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="text-white font-medium mb-2">Livraison</h3>
              <div className="text-sm text-neutral-200">{order.shipping.line1}</div>
              {order.shipping.line2 ? (
                <div className="text-sm text-neutral-200">{order.shipping.line2}</div>
              ) : null}
              <div className="text-sm text-neutral-200">
                {order.shipping.postalCode} {order.shipping.city}
              </div>
              <div className="text-sm text-neutral-200">{order.shipping.phone}</div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="text-white font-medium mb-2">Paiement</h3>
              {order.payment ? (
                <div className="space-y-1 text-sm">
                  <div className="text-neutral-200">
                    {order.payment.provider} • {order.payment.status}
                  </div>
                  <div className="text-neutral-400 text-xs break-all">
                    {order.payment.intentId}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-400 text-sm">Aucun paiement enregistré.</div>
              )}
            </div>
          </aside>
        </div>
      )}
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