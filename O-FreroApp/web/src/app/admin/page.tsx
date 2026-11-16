import Link from "next/link";
import { connection } from "next/server";
import { BarChart } from "@/components/admin/BarChart";
import { Card, Kpi, PageTitle } from "@/components/admin/ui";
import { STATUS_LABELS } from "@/domain/order-status";
import type { OrderStatus } from "@/domain/types";
import { now } from "@/lib/clock";
import { formatEuros } from "@/lib/money";
import { getDashboardStats } from "@/server/admin/stats";

const SHOWN: OrderStatus[] = ["RECEIVED", "IN_OVEN", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "NOT_COLLECTED", "CANCELLED"];

export default async function AdminDashboard() {
  await connection();
  const stats = await getDashboardStats(now());
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
    </>
  );
}
