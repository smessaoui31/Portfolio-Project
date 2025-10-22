"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiAuthed } from "@/lib/api";

type OrderItem = {
  id: string;
  productId?: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

type Payment = {
  id: string;
  provider: string;       // "stripe"…
  status: string;         // "succeeded" | "failed" | …
  intentId?: string | null;
};

type Order = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  totalCents: number;
  createdAt: string;

  // Snapshot d’adresse stocké sur l’order
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;

  items: OrderItem[];
  payment?: Payment | null;
};

function euro(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusChip({ status }: { status: Order["status"] }) {
  const map: Record<Order["status"], { text: string; cls: string }> = {
    PENDING:   { text: "En attente", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
    PAID:      { text: "Payée",      cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
    FAILED:    { text: "Échouée",    cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
    CANCELLED: { text: "Annulée",    cls: "bg-neutral-700/30 text-neutral-300 border-neutral-600/50" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${m.cls}`}>
      {m.text}
    </span>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiAuthed<Order>(`/checkout/orders/${id}`);
      setOrder(data);
    } catch (e: any) {
      try {
        const alt = await apiAuthed<Order>(`/orders/${id}`);
        setOrder(alt);
      } catch (e2: any) {
        setErr(e?.message || e2?.message || "Impossible de charger la commande.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const itemsTotal = useMemo(
    () =>
      (order?.items ?? []).reduce(
        (acc, it) => acc + it.unitPriceCents * it.quantity,
        0
      ),
    [order]
  );

  function handlePrint() {
    if ("vibrate" in navigator) {
      try { (navigator as any).vibrate?.(10); } catch {}
    }
    window.print();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-6 w-40 bg-neutral-800 rounded animate-pulse" />
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div className="h-4 w-1/3 bg-neutral-800 rounded animate-pulse" />
          <div className="mt-3 h-3 w-1/2 bg-neutral-800 rounded animate-pulse" />
          <div className="mt-6 h-24 bg-neutral-900 rounded border border-neutral-800 animate-pulse" />
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-neutral-300 hover:text-white underline-offset-4 hover:underline"
          >
            ← Retour
          </button>
        </div>
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
          {err}
        </div>
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 print:max-w-none print:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Commande <span className="font-mono text-base text-neutral-300">#{order.id}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Passée le <span className="text-neutral-200">{formatDate(order.createdAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip status={order.status} />
          <button
            onClick={handlePrint}
            className="print:hidden rounded-md border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
          >
            Imprimer
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_0.8fr] print:grid-cols-2">
        {/* Colonne gauche: items */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="text-white font-medium">Articles</h2>
          {order.items.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">Aucun article.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-800">
              {order.items.map((it) => (
                <li key={it.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-white">{it.name}</div>
                    <div className="text-xs text-neutral-400">
                      {euro(it.unitPriceCents)} × {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm text-white font-medium">
                    {euro(it.unitPriceCents * it.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-neutral-800 pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Sous-total</span>
              <span className="text-white">{euro(itemsTotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-neutral-400">Frais</span>
              <span className="text-white">0,00 €</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base">
              <span className="text-neutral-300">Total</span>
              <span className="text-white font-semibold">{euro(order.totalCents)}</span>
            </div>
          </div>
        </section>

        {/* Colonne droite: adresse + paiement */}
        <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="text-white font-medium">Livraison / Contact</h2>
          <div className="mt-3 text-sm text-neutral-300">
            <div className="text-neutral-200">{order.shippingLine1}</div>
            {order.shippingLine2 && (
              <div className="text-neutral-300">{order.shippingLine2}</div>
            )}
            <div className="text-neutral-300">
              {order.shippingPostalCode} {order.shippingCity}
            </div>
            <div className="text-neutral-400 mt-1">Tél. {order.shippingPhone}</div>
          </div>

          <div className="mt-5 border-t border-neutral-800 pt-4">
            <h3 className="text-white font-medium">Paiement</h3>
            {order.payment ? (
              <div className="mt-2 text-sm text-neutral-300">
                <div>Provider : <span className="text-neutral-200">{order.payment.provider}</span></div>
                <div>
                  Statut :{" "}
                  <span className="text-neutral-200">
                    {order.payment.status}
                  </span>
                </div>
                {order.payment.intentId && (
                  <div className="truncate">
                    Intent :{" "}
                    <span className="font-mono text-neutral-400">
                      {order.payment.intentId}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">
                Paiement non renseigné.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            <Link
              href="/orders"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-white hover:bg-neutral-800/60"
            >
              ← Mes commandes
            </Link>
            <Link
              href="/menu"
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:opacity-90"
            >
              Re-commander
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}