"use server";

import { now } from "@/lib/clock";
import { getSession, requireAdmin } from "@/lib/session";
import { castVote, createPoll, deletePoll, getPollView, type PollView } from "@/server/polls";

export async function voteAction(
  candidateId: string,
): Promise<{ ok: true; view: PollView | null } | { ok: false; error: "SIGN_IN" | "NOT_FOUND" | "CLOSED" | "ALREADY_VOTED" }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "SIGN_IN" };
  const at = now();
  const result = await castVote(session.user.id, candidateId, at);
  if (!result.ok) return result;
  return { ok: true, view: await getPollView(at, session.user.id) };
}

export async function createPollAction(input: { title: string; closesOn: string; candidates: { name: string; description?: string }[] }) {
  await requireAdmin();
  return createPoll(input, now());
}

export async function deletePollAction(id: string) {
  await requireAdmin();
  await deletePoll(id);
}
