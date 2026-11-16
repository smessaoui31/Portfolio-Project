import { addDaysToKey, atParisTime, parisDateKey, parisWeekday } from "@/lib/time";
import type { ServiceWindowLike } from "./types";

export interface SlotOptions {
  now: Date;
  hours: ServiceWindowLike[];
  /** Closed Paris days, "YYYY-MM-DD". */
  closures: string[];
  leadMinutes: number;
  slotMinutes?: number;
  searchDays?: number;
}

const ceilTo = (t: number, step: number) => Math.ceil(t / step) * step;

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
    const weekday = parisWeekday(atParisTime(day, "12:00"));
    const windows = o.hours
      .filter((w) => w.weekday === weekday)
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt));

    for (const w of windows) {
      const close = atParisTime(day, w.closesAt).getTime();
      const slots: Date[] = [];
      for (let t = ceilTo(Math.max(earliest, atParisTime(day, w.opensAt).getTime()), step); t < close; t += step) {
        slots.push(new Date(t));
      }
      if (slots.length > 0) return { slots, asap: slots[0] };
    }
  }
  return null;
}

export function isValidSlot(slot: Date, o: SlotOptions): boolean {
  return computeSlots(o)?.slots.some((s) => s.getTime() === slot.getTime()) ?? false;
}
