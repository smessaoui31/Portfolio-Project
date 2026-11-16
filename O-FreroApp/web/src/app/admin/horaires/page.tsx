import type { Metadata } from "next";
import { connection } from "next/server";
import { HoursManager } from "@/components/admin/HoursManager";
import { PageTitle } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { getServiceWindows } from "@/server/settings";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Horaires" };

export default async function AdminHoursPage() {
  await requireAdmin();
  await connection();
  const [windows, closures] = await Promise.all([
    getServiceWindows(),
    prisma.closure.findMany({ orderBy: { date: "asc" }, select: { date: true, reason: true } }),
  ]);
  return (
    <>
      <PageTitle title="Horaires" />
      <p className="mb-6 max-w-2xl text-sm text-muted-2">
        Les créneaux de retrait et de livraison sont proposés pendant ces services. Les jours de fermeture n&apos;en proposent aucun.
      </p>
      <HoursManager windows={windows} closures={closures} />
    </>
  );
}
