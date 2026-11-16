import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { OrdersFilters } from "@/components/admin/OrdersFilters";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import type { FulfillmentMode } from "@/domain/types";
import { now } from "@/lib/clock";
import { formatEuros } from "@/lib/money";
import { formatParisDay, formatParisTime, parisDateKey } from "@/lib/time";
import { listOrders } from "@/server/admin/orders";

export const metadata: Metadata = { title: "Commandes" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/commandes">) {
  await connection();
  const query = await searchParams;
  const date = typeof query.jour === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.jour) ? query.jour : parisDateKey(now());
  const mode = query.mode === "PICKUP" || query.mode === "DELIVERY" ? (query.mode as FulfillmentMode) : undefined;
  const orders = await listOrders({ date, mode, activeOnly: query.toutes !== "1" });

  return (
    <>
      <PageTitle title="Commandes">
        <OrdersFilters date={date} />
      </PageTitle>
      <p className="mb-4 text-sm text-muted">
        {formatParisDay(new Date(`${date}T12:00:00Z`))} · {orders.length} commande{orders.length > 1 ? "s" : ""}
      </p>
      {orders.length === 0 ? (
        <p className="rounded-2xl border border-line p-8 text-center text-muted-2">Aucune commande pour ce filtre.</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/commandes/${o.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 transition hover:bg-surface md:grid-cols-[90px_1fr_auto_auto_auto]">
                <span className="font-display text-3xl tabular-nums">{formatParisTime(o.slotAt)}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    n°{String(o.number).padStart(4, "0")} · {o.firstName}
                  </span>
                  <span className="block text-sm text-muted">
                    {o.mode === "PICKUP" ? "À emporter" : "Livraison"} · {o.itemsCount} article{o.itemsCount > 1 ? "s" : ""} · {o.phone}
                  </span>
                </span>
                <span className="hidden md:block">
                  {o.paymentMethod === "AT_PICKUP" && !["COMPLETED", "CANCELLED", "NOT_COLLECTED"].includes(o.status) ? (
                    <span className="rounded-full bg-ember px-2.5 py-0.5 text-xs font-bold text-ember-ink">À ENCAISSER</span>
                  ) : (
                    <span className="text-xs text-muted">{o.paymentMethod === "ONLINE" ? "Payée en ligne" : "Encaissée"}</span>
                  )}
                </span>
                <span className="hidden font-semibold tabular-nums md:block">{formatEuros(o.totalCents)}</span>
                <StatusBadge status={o.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
