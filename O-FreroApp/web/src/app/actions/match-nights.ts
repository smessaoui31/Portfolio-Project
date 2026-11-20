"use server";

import { now } from "@/lib/clock";
import { requireAdmin } from "@/lib/session";
import { addMatchNight, deleteMatchNight } from "@/server/match-nights";

export async function addMatchNightAction(input: { date: string; title: string; message?: string }) {
  await requireAdmin();
  return addMatchNight(input, now());
}

export async function deleteMatchNightAction(id: string) {
  await requireAdmin();
  await deleteMatchNight(id);
}
