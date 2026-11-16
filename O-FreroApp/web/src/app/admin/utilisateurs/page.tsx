import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageTitle } from "@/components/admin/ui";
import { formatParisDay } from "@/lib/time";
import { listUsersAdmin } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage() {
  await connection();
  const users = await listUsersAdmin();
  return (
    <>
      <PageTitle title="Utilisateurs" />
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {users.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/utilisateurs/${u.id}`} className="flex flex-wrap items-center gap-4 px-4 py-3 transition hover:bg-surface">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {u.name} {u.role === "ADMIN" ? <span className="ml-1 rounded-full border border-ember px-2 py-0.5 text-xs text-ember">Admin</span> : null}
                </span>
                <span className="block text-sm text-muted">
                  {u.email}
                  {!u.emailVerified ? " · e-mail non vérifié" : ""} · inscrit le {formatParisDay(u.createdAt)}
                </span>
              </span>
              <span className="text-sm tabular-nums text-muted-2">
                {u.ordersCount} commande{u.ordersCount > 1 ? "s" : ""} · {u.balance} tampon{u.balance > 1 ? "s" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
