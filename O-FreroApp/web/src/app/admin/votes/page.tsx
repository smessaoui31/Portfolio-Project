import type { Metadata } from "next";
import { connection } from "next/server";
import { PollsManager } from "@/components/admin/PollsManager";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/session";
import { listPollsAdmin } from "@/server/polls";

export const metadata: Metadata = { title: "Votes" };

export default async function AdminPollsPage() {
  await requireAdmin();
  await connection();
  const polls = await listPollsAdmin();
  return (
    <>
      <PageTitle title="Votes" />
      <PollsManager polls={polls.map((p) => ({ ...p, closesAt: p.closesAt.toISOString() }))} />
    </>
  );
}
