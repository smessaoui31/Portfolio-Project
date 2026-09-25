"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiAuthed } from "@/lib/api";
import OrderStatusBadge from "@/components/theme/ui/OrderStatusBadge";

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
        <h1 className="text-2xl font-semibold text-foreground">Mes commandes</h1>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card/50 p-4">
              <div className="h-4 w-1/3 bg-secondary rounded" />
              <div className="mt-3 h-3 w-2/3 bg-secondary rounded" />
              <div className="mt-3 h-3 w-1/4 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Mes commandes</h1>
        <Link href="/menu" className="text-sm text-foreground hover:text-foreground underline-offset-4 hover:underline">
          ← Retour au menu
        </Link>
      </div>

      {err && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-rose-200 text-sm">
          {err}
        </div>
      )}

      {isEmpty ? (
        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-6 text-center">
          <p className="text-foreground">Vous n’avez pas encore de commande.</p>
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
              className="rounded-2xl border border-border bg-card/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground truncate">#{o.id}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Passée le <span className="text-foreground">{formatDate(o.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-foreground font-semibold">{euro(o.totalCents)}</div>
                  <button
                    onClick={() => setOpenId(openId === o.id ? null : o.id)}
                    className="mt-2 text-xs text-foreground hover:text-foreground underline-offset-4 hover:underline"
                  >
                    {openId === o.id ? "Masquer le détail" : "Voir le détail"}
                  </button>
                </div>
              </div>

              {openId === o.id && (
                <div className="mt-4 border-t border-border pt-3">
                  {o.items && o.items.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {o.items.map((it) => (
                        <li key={it.id} className="py-3 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm text-foreground">{it.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {euro(it.unitPriceCents)} × {it.quantity}
                            </div>
                          </div>
                          <div className="text-sm text-foreground font-medium">
                            {euro(it.unitPriceCents * it.quantity)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun article (commande vide).</p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-foreground font-semibold">{euro(o.totalCents)}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/checkout/success?orderId=${o.id}`}
                      className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent/60"
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