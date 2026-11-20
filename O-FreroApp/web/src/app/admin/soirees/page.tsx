import type { Metadata } from "next";
import { connection } from "next/server";
import { MatchNightsManager } from "@/components/admin/MatchNightsManager";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/session";
import { listMatchNightsAdmin } from "@/server/match-nights";

export const metadata: Metadata = { title: "Soirées" };

export default async function AdminMatchNightsPage() {
  await requireAdmin();
  await connection();
  const nights = await listMatchNightsAdmin();
  return (
    <>
      <PageTitle title="Soirées de match" />
      <MatchNightsManager nights={nights.map((n) => ({ id: n.id, date: n.date, title: n.title, message: n.message }))} />
    </>
  );
}
