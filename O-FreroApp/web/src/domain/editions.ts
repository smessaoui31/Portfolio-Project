import { addDaysToKey, atParisTime, parisDateKey } from "@/lib/time";

export interface EditionLike {
  id: string;
  number: number;
  startsAt: Date;
  /** Exclusive. */
  endsAt: Date;
}

const DAY_MS = 86_400_000;

/** Start at Paris midnight of `startDate`, end at Paris midnight after `endDate` (both "YYYY-MM-DD"). */
export function editionBounds(startDate: string, endDate: string): { startsAt: Date; endsAt: Date } {
  return { startsAt: atParisTime(startDate, "00:00"), endsAt: atParisTime(addDaysToKey(endDate, 1), "00:00") };
}

export function currentEdition<T extends EditionLike>(list: T[], now: Date): T | null {
  const t = now.getTime();
  return (
    list
      .filter((e) => e.startsAt.getTime() <= t && t < e.endsAt.getTime())
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0] ?? null
  );
}

export function pastEditions<T extends EditionLike>(list: T[], now: Date): T[] {
  return list.filter((e) => e.endsAt.getTime() <= now.getTime()).sort((a, b) => b.number - a.number);
}

/** Whole calendar days between two "YYYY-MM-DD" keys. */
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);

export function editionProgress(
  e: EditionLike,
  now: Date,
): { dayIndex: number; totalDays: number; ratio: number; remainingMs: number } {
  const startKey = parisDateKey(e.startsAt);
  const totalDays = daysBetween(startKey, parisDateKey(e.endsAt));
  const dayIndex = Math.min(totalDays, Math.max(1, daysBetween(startKey, parisDateKey(now)) + 1));
  const span = e.endsAt.getTime() - e.startsAt.getTime();
  const ratio = Math.min(1, Math.max(0, (now.getTime() - e.startsAt.getTime()) / span));
  return { dayIndex, totalDays, ratio, remainingMs: Math.max(0, e.endsAt.getTime() - now.getTime()) };
}

export function splitRemaining(ms: number): { days: number; hours: number; minutes: number } {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}
