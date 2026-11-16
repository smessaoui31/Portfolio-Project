import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StatusActions } from "@/components/admin/StatusActions";
import { Card, StatusBadge } from "@/components/admin/ui";
import { STATUS_LABELS } from "@/domain/order-status";
import { COOKING_LABELS } from "@/domain/types";
import { formatEuros } from "@/lib/money";
import { formatParisDay, formatParisTime } from "@/lib/time";
import { getAdminOrder } from "@/server/admin/orders";
import { refundPending } from "@/server/lifecycle";
import { RefundDoneButton } from "@/components/admin/RefundDoneButton";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Commande" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/commandes/[id]">) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const toCollect = order.paymentMethod === "AT_PICKUP" && !["COMPLETED", "CANCELLED", "NOT_COLLECTED"].includes(order.status);
  const toRefund = refundPending(order.logs);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/commandes" className="text-sm text-muted-2 hover:text-fg">
        ← Commandes
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            n°{String(order.number).padStart(4, "0")} · {order.mode === "PICKUP" ? "À emporter" : "Livraison"} ·{" "}
            {formatParisDay(order.slotAt)}
          </p>
          <h1 className="font-display mt-1 text-7xl tabular-nums">{formatParisTime(order.slotAt)}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {toCollect ? <span className="rounded-full bg-ember px-3 py-1 text-sm font-bold text-ember-ink">À ENCAISSER</span> : null}
          {toRefund ? <span className="rounded-full bg-danger px-3 py-1 text-sm font-bold text-ember-ink">À REMBOURSER</span> : null}
          <StatusBadge status={order.status} />
          <Link href={`/admin/commandes/${order.id}/ticket`} target="_blank" className="rounded-xl border border-line-2 px-3 py-2 text-sm">
            Imprimer le ticket
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <StatusActions orderId={order.id} status={order.status} mode={order.mode} paidOnline={order.paymentMethod === "ONLINE" && order.status !== "PENDING_PAYMENT"} />
        {toRefund ? <RefundDoneButton orderId={order.id} /> : null}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card title="Préparation">
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="py-3">
                <p className="text-lg font-semibold">
                  {item.quantity} × {item.name}
                  {item.isReward ? <span className="ml-2 text-sm text-ember">(1 offerte)</span> : null}
                </p>
                <p className="text-sm text-muted-2">
                  {COOKING_LABELS[item.cooking]}
                  {item.supplements.length > 0 ? ` · ${item.supplements.map((s) => `+ ${s.name}`).join(" · ")}` : ""}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted-2">
              <dt>Sous-total</dt>
              <dd className="tabular-nums">{formatEuros(order.subtotalCents)}</dd>
            </div>
            {order.rewardCents > 0 ? (
              <div className="flex justify-between text-muted-2">
                <dt>Pizza offerte</dt>
                <dd className="tabular-nums">− {formatEuros(order.rewardCents)}</dd>
              </div>
            ) : null}
            {order.deliveryFeeCents > 0 ? (
              <div className="flex justify-between text-muted-2">
                <dt>Livraison</dt>
                <dd className="tabular-nums">{formatEuros(order.deliveryFeeCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatEuros(order.totalCents)}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-4">
          <Card title="Client">
            <p className="font-semibold">{order.customerFirstName}</p>
            <a href={`tel:${order.customerPhone}`} className="block text-sm text-ember">
              {order.customerPhone}
            </a>
            <p className="text-sm text-muted-2">{order.customerEmail}</p>
            <p className="mt-2 text-xs text-muted">{order.user ? "Client avec compte" : "Commande sans compte"}</p>
            {order.mode === "DELIVERY" ? (
              <p className="mt-3 text-sm">
                {order.addressLine1}
                {order.addressLine2 ? <><br />{order.addressLine2}</> : null}
                <br />
                {order.postalCode} {order.city}
              </p>
            ) : null}
          </Card>
          <Card title="Paiement">
            <p className="text-sm">{order.paymentMethod === "ONLINE" ? "En ligne (Stripe)" : "Au retrait"}</p>
            {order.stripePaymentIntentId ? <p className="mt-1 break-all text-xs text-muted">{order.stripePaymentIntentId}</p> : null}
          </Card>
          <Card title="Historique">
            <ol className="space-y-2 text-sm">
              {order.logs.map((log) => (
                <li key={log.id}>
                  <span className="tabular-nums text-muted">{formatParisTime(log.createdAt)}</span> · {STATUS_LABELS[log.status]}
                  {log.message ? <span className="block text-xs text-muted-2">{log.message}</span> : null}
                  {log.createdBy ? <span className="block text-xs text-muted">{log.createdBy}</span> : null}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
