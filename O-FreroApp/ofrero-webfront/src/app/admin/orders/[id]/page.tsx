"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type OrderItem = {
  id: string;
  productId: string | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

type Payment = {
  id: string;
  provider: string;
  status: string;
  intentId: string;
};

type Order = {
  id: string;
  userId?: string;
  userEmail?: string;
  status: string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
  payment?: Payment | null;

  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingPhone?: string | null;
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!token || !params?.id) return;
    (async () => {
      try {
        // ⚠️ Backend : assure-toi que l’endpoint permet à un ADMIN de lire la commande
        // (sinon tu auras un 403/404 via la route user-only).
        const data = await apiAuthed<Order>(`/orders/${params.id}`);
        setOrder(data);
      } catch (e: any) {
        setErr(e?.message || "Impossible de charger la commande.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, params?.id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 text-neutral-400">
        Chargement de la commande…
      </main>
    );
  }
  if (err) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {err}
        </div>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 text-neutral-400">
        Commande introuvable.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Commande {order.id}</h1>
        <StatusBadge status={order.status} />
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 lg:col-span-2">
          <h2 className="text-white font-medium mb-3">Articles</h2>
          <ul className="divide-y divide-neutral-800">
            {order.items.map((it) => (
              <li key={it.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm text-white">{it.name}</div>
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

          <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
            <span className="text-neutral-400 text-sm">Total</span>
            <span className="text-white font-semibold">
              {(order.totalCents / 100).toFixed(2)} €
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-4">
          <div>
            <h3 className="text-white font-medium">Client</h3>
            <p className="text-sm text-neutral-400">
              {order.userEmail ?? "—"}
            </p>
          </div>

          <div>
            <h3 className="text-white font-medium">Adresse</h3>
            <p className="text-sm text-neutral-300">
              {order.shippingLine1}
              {order.shippingLine2 ? <><br />{order.shippingLine2}</> : null}
              <br />
              {order.shippingPostalCode} {order.shippingCity}
              <br />
              {order.shippingPhone}
            </p>
          </div>

          <div>
            <h3 className="text-white font-medium">Paiement</h3>
            {order.payment ? (
              <div className="text-sm text-neutral-300">
                <div>Provider : {order.payment.provider}</div>
                <div>Statut : {order.payment.status}</div>
                <div className="truncate">Intent : {order.payment.intentId}</div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Aucun paiement enregistré.</p>
            )}
          </div>

          <div>
            <h3 className="text-white font-medium">Créée le</h3>
            <p className="text-sm text-neutral-400">
              {new Date(order.createdAt).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
      </section>
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