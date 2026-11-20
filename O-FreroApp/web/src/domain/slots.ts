import { addDaysToKey, atParisTime, formatParisTime, parisDateKey, parisWeekday } from "@/lib/time";
import type { ServiceWindowLike } from "./types";

export interface SlotOptions {
  now: Date;
  hours: ServiceWindowLike[];
  /** Closed Paris days, "YYYY-MM-DD". */
  closures: string[];
  leadMinutes: number;
  /** When set, the last slot of a service is this many minutes before its closing (delivery). */
  lastSlotBeforeCloseMinutes?: number;
  slotMinutes?: number;
  searchDays?: number;
}

const ceilTo = (t: number, step: number) => Math.ceil(t / step) * step;

/** Slots of one service window on a given day, from the earliest allowed time. */
function windowSlots(o: SlotOptions, day: string, w: ServiceWindowLike, earliest: number, step: number): Date[] {
  const close = atParisTime(day, w.closesAt).getTime();
  // Pickup: every slot before closing. Delivery: up to closing minus the cutoff, inclusive.
  const end = o.lastSlotBeforeCloseMinutes === undefined ? close : close - o.lastSlotBeforeCloseMinutes * 60_000 + 1;
  const slots: Date[] = [];
  for (let t = ceilTo(Math.max(earliest, atParisTime(day, w.opensAt).getTime()), step); t < end; t += step) {
    slots.push(new Date(t));
  }
  return slots;
}

const windowsOf = (o: SlotOptions, day: string) => {
  const weekday = parisWeekday(atParisTime(day, "12:00"));
  return o.hours.filter((w) => w.weekday === weekday).sort((a, b) => a.opensAt.localeCompare(b.opensAt));
};

/**
 * Slots of the first service (from now on) that still has a slot at least
 * `leadMinutes` away, rounded up to the slot size. Only that service is returned.
 */
export function computeSlots(o: SlotOptions): { slots: Date[]; asap: Date } | null {
  const step = (o.slotMinutes ?? 15) * 60_000;
  const earliest = ceilTo(o.now.getTime() + o.leadMinutes * 60_000, step);
  const today = parisDateKey(o.now);

  for (let offset = 0; offset < (o.searchDays ?? 7); offset++) {
    const day = addDaysToKey(today, offset);
    if (o.closures.includes(day)) continue;
    for (const w of windowsOf(o, day)) {
      const slots = windowSlots(o, day, w, earliest, step);
      if (slots.length > 0) return { slots, asap: slots[0] };
    }
  }
  return null;
}

/**
 * Slots of the evening service (the last window) of a given Paris day, with the same rules
 * as `computeSlots`: lead time from now, slot size, delivery cutoff, closures. Used on match nights.
 */
export function eveningSlots(o: SlotOptions, day: string): Date[] {
  if (o.closures.includes(day)) return [];
  const evening = windowsOf(o, day).at(-1);
  if (!evening) return [];
  const step = (o.slotMinutes ?? 15) * 60_000;
  return windowSlots(o, day, evening, ceilTo(o.now.getTime() + o.leadMinutes * 60_000, step), step);
}

export function isValidSlot(slot: Date, o: SlotOptions): boolean {
  return computeSlots(o)?.slots.some((s) => s.getTime() === slot.getTime()) ?? false;
}

const WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

/** "ce soir", "demain midi", "samedi soir"... for the service a slot belongs to. */
export function serviceLabel(slot: Date, now: Date): string {
  const part = Number(formatParisTime(slot).slice(0, 2)) < 16 ? "midi" : "soir";
  const day = parisDateKey(slot);
  if (day === parisDateKey(now)) return `ce ${part}`;
  if (day === addDaysToKey(parisDateKey(now), 1)) return `demain ${part}`;
  return `${WEEKDAYS[parisWeekday(slot) - 1]} ${part}`;
}
