import { z } from "zod";
import { eveningSlots } from "@/domain/slots";
import type { FulfillmentMode } from "@/domain/types";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { addDaysToKey, parisDateKey } from "@/lib/time";
import { getSlotOptions } from "./settings";

async function firstMatchBetween(from: string, to: string) {
  return prisma.matchNight.findFirst({ where: { date: { gte: from, lte: to } }, orderBy: { date: "asc" } });
}

/** A match today or tomorrow (Paris): its evening can be ordered now. */
export async function getMatchForOrdering(now: Date): Promise<{ title: string; day: string } | null> {
  const today = parisDateKey(now);
  const match = await firstMatchBetween(today, addDaysToKey(today, 1));
  return match ? { title: match.title, day: match.date } : null;
}

/** A match within the next 3 days, today included: the banner shows it. */
export async function getBannerMatch(now: Date): Promise<{ title: string; message: string | null; day: string } | null> {
  const today = parisDateKey(now);
  const match = await firstMatchBetween(today, addDaysToKey(today, 3));
  return match ? { title: match.title, message: match.message, day: match.date } : null;
}

/** The match evening slots that can be chosen now, or null when no match opens ordering. */
export async function matchSlotsFor(mode: FulfillmentMode, now: Date): Promise<{ title: string; day: string; slots: Date[] } | null> {
  const match = await getMatchForOrdering(now);
  if (!match) return null;
  const slots = eveningSlots(await getSlotOptions(mode, now), match.day);
  return slots.length > 0 ? { ...match, slots } : null;
}

/* ---------- Admin ---------- */

const nightSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(60),
  message: z.string().trim().max(120).optional(),
});

export async function listMatchNightsAdmin() {
  return prisma.matchNight.findMany({ orderBy: { date: "asc" } });
}

export async function addMatchNight(
  input: z.input<typeof nightSchema>,
  now: Date,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const parsed = nightSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Informations invalides." };
  if (parsed.data.date < parisDateKey(now)) return { ok: false, message: "Cette date est passée." };
  try {
    const night = await prisma.matchNight.create({ data: { ...parsed.data, message: parsed.data.message || null } });
    return { ok: true, id: night.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Une soirée existe déjà ce jour-là." };
    }
    throw error;
  }
}

export async function deleteMatchNight(id: string): Promise<void> {
  await prisma.matchNight.deleteMany({ where: { id } });
}
