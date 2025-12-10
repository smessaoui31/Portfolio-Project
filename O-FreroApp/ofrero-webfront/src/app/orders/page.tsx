"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiAuthed } from "@/lib/api";

// Types (adaptés à ton API Prisma)
type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

type Order = {
  id: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "FAILED" | "CANCELLED";
  totalCents: number;
  createdAt: string;
  items?: OrderItem[];
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
    PENDING:  { text: "En attente", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
    PAID:     { text: "Payée",      cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
    SHIPPED:  { text: "Expédiée",   cls: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
    DELIVERED:{ text: "Livrée",     cls: "bg-green-500/10 text-green-300 border-green-500/30" },
    FAILED:   { text: "Échouée",    cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
    CANCELLED:{ text: "Annulée",    cls: "bg-neutral-700/30 text-neutral-300 border-neutral-600/50" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${m.cls}`}>
      {m.text}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      // Assure-toi que ton ordersRouter expose GET /orders (liste des commandes de l’utilisateur)
      const data = await apiAuthed<Order[]>("/orders?includeItems=true");
      setOrders(data);
    } catch (e: any) {
      setErr(e?.message || "Impossible de récupérer vos commandes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const isEmpty = useMemo(() => !loading && (orders?.length ?? 0) === 0, [loading, orders]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-white">Mes commandes</h1>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="h-4 w-1/3 bg-neutral-800 rounded" />
              <div className="mt-3 h-3 w-2/3 bg-neutral-800 rounded" />
              <div className="mt-3 h-3 w-1/4 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Mes commandes</h1>
        <Link href="/menu" className="text-sm text-neutral-300 hover:text-white underline-offset-4 hover:underline">
          ← Retour au menu
        </Link>
      </div>

      {err && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-rose-200 text-sm">
          {err}
        </div>
      )}

      {isEmpty ? (
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-center">
          <p className="text-neutral-300">Vous n’avez pas encore de commande.</p>
          <Link
            href="/menu"
            className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Voir le menu
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders!.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-neutral-300 truncate">#{o.id}</span>
                    <StatusChip status={o.status} />
                  </div>
                  <div className="mt-1 text-sm text-neutral-400">
                    Passée le <span className="text-neutral-300">{formatDate(o.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-semibold">{euro(o.totalCents)}</div>
                  <button
                    onClick={() => setOpenId(openId === o.id ? null : o.id)}
                    className="mt-2 text-xs text-neutral-300 hover:text-white underline-offset-4 hover:underline"
                  >
                    {openId === o.id ? "Masquer le détail" : "Voir le détail"}
                  </button>
                </div>
              </div>

              {openId === o.id && (
                <div className="mt-4 border-t border-neutral-800 pt-3">
                  {o.items && o.items.length > 0 ? (
                    <ul className="divide-y divide-neutral-800">
                      {o.items.map((it) => (
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
                  ) : (
                    <p className="text-sm text-neutral-400">Aucun article (commande vide).</p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Total</span>
                    <span className="text-white font-semibold">{euro(o.totalCents)}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/checkout/success?orderId=${o.id}`}
                      className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-white hover:bg-neutral-800/60"
                    >
                      Détails paiement
                    </Link>
                    <Link
                      href="/menu"
                      className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:opacity-90"
                    >
                      Re-commander
                    </Link>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}