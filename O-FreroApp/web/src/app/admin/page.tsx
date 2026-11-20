import Link from "next/link";
import { connection } from "next/server";
import { BarChart } from "@/components/admin/BarChart";
import { Card, Kpi, PageTitle } from "@/components/admin/ui";
import { STATUS_LABELS } from "@/domain/order-status";
import { RATING_LABELS, type RatingScore } from "@/domain/ratings";
import type { OrderStatus } from "@/domain/types";
import { now } from "@/lib/clock";
import { formatEuros } from "@/lib/money";
import { countRefundsToDo } from "@/server/admin/orders";
import { getDashboardStats, getRecentRatings, getRetentionStats } from "@/server/admin/stats";
import { expireStalePendingOrders } from "@/server/lifecycle";
import { requireAdmin } from "@/lib/session";

const SHOWN: OrderStatus[] = ["PENDING_PAYMENT", "RECEIVED", "IN_OVEN", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "NOT_COLLECTED", "CANCELLED"];

export default async function AdminDashboard() {
  await requireAdmin();
  await connection();
  await expireStalePendingOrders(now());
  const at = now();
  const [stats, refunds, retention, ratings] = await Promise.all([
    getDashboardStats(at),
    countRefundsToDo(),
    getRetentionStats(at),
    getRecentRatings(at),
  ]);
  return (
    <>
      <PageTitle title="Tableau de bord">
        <Link href="/admin/commandes" className="rounded-xl bg-ember px-4 py-2 text-sm font-bold text-ember-ink">
          Commandes du jour
        </Link>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Commandes du jour" value={String(stats.todayCount)} />
        <Kpi label="Chiffre du jour" value={formatEuros(stats.todayRevenueCents)} hint="Commandes terminées" />
        <Kpi label="7 derniers jours" value={formatEuros(stats.weekRevenueCents)} hint="Commandes terminées" />
        <Kpi label="À encaisser" value={formatEuros(stats.toCollectCents)} hint="Paiement au retrait, en cours" />
      </div>
      {refunds > 0 ? (
        <Link href="/admin/commandes?toutes=1" className="mt-4 block rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
          {refunds} commande{refunds > 1 ? "s" : ""} payée{refunds > 1 ? "s" : ""} en ligne puis annulée{refunds > 1 ? "s" : ""} : à rembourser depuis Stripe.
        </Link>
      ) : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Chiffre d'affaires, 14 jours">
          <BarChart data={stats.last14Days} />
        </Card>
        <Card title="Aujourd'hui par statut">
          <dl className="space-y-2 text-sm">
            {SHOWN.map((s) => (
              <div key={s} className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted-2">{STATUS_LABELS[s]}</dt>
                <dd className="font-semibold tabular-nums">{stats.byStatus[s]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <h2 className="font-display mt-10 mb-4 text-3xl">Clients qui reviennent</h2>
      <p className="mb-4 text-sm text-muted">Sur 90 jours. Un client = une adresse e-mail, avec ou sans compte.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Reviennent" value={`${retention.returningPercent} %`} hint={`${retention.customers} client${retention.customers > 1 ? "s" : ""} au total`} />
        <Kpi
          label="Entre deux commandes"
          value={retention.medianDaysBetweenOrders === null ? "–" : `${String(retention.medianDaysBetweenOrders).replace(".", ",")} j`}
          hint="Délai médian"
        />
        <Kpi label="Via « Recommander »" value={`${retention.reorderPercent} %`} hint="Part des commandes" />
        <Kpi label="Parrainages" value={String(retention.referrals)} hint="Récompensés" />
      </div>

      <div className="mt-6">
        <Card title="Notes, 30 jours">
          <p className="text-sm">
            {ratings.average === null ? (
              <span className="text-muted-2">Pas encore de note.</span>
            ) : (
              <>
                <span className="font-display text-3xl">{String(ratings.average).replace(".", ",")}</span>
                <span className="text-muted-2"> / 3 · {ratings.count} note{ratings.count > 1 ? "s" : ""} (1 = Bof, 3 = Excellent)</span>
              </>
            )}
          </p>
          {ratings.comments.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {ratings.comments.map((c) => (
                <li key={c.orderId} className="border-b border-line pb-2">
                  <Link href={`/admin/commandes/${c.orderId}`} className="hover:underline">
                    <span className="font-semibold">{RATING_LABELS[c.score as RatingScore]}</span> · « {c.comment} »
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
    </>
  );
}
