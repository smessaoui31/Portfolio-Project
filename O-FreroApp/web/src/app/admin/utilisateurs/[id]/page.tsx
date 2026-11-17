import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { RoleToggle } from "@/components/admin/RoleToggle";
import { Card, StatusBadge } from "@/components/admin/ui";
import { stampBalance } from "@/domain/loyalty";
import { formatEuros } from "@/lib/money";
import { formatParisDay } from "@/lib/time";
import { getUserAdmin } from "@/server/admin/settings";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Utilisateur" };

export default async function AdminUserPage({ params }: PageProps<"/admin/utilisateurs/[id]">) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const user = await getUserAdmin(id);
  if (!user) notFound();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/utilisateurs" className="text-sm text-muted-2 hover:text-fg">
        ← Utilisateurs
      </Link>
      <h1 className="font-display mt-4 text-5xl">{user.name}</h1>
      <p className="mt-1 text-muted-2">
        {user.email} · {stampBalance(user.loyaltyEntries)} tampon(s)
      </p>
      <div className="mt-6">
        <RoleToggle userId={user.id} role={user.role} />
      </div>
      <div className="mt-8">
        <Card title="Commandes">
          {user.orders.length === 0 ? (
            <p className="text-sm text-muted">Aucune commande.</p>
          ) : (
            <ul className="divide-y divide-line">
              {user.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/commandes/${o.id}`} className="flex flex-wrap items-center gap-3 py-3 text-sm hover:text-fg">
                    <span className="text-muted">n°{String(o.number).padStart(4, "0")} · {formatParisDay(o.createdAt)}</span>
                    <span className="flex-1">{o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</span>
                    <span className="tabular-nums">{formatEuros(o.totalCents)}</span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
