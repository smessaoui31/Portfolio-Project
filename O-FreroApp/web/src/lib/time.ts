import { TZDate } from "@date-fns/tz";

export const PARIS = "Europe/Paris";

const pad = (n: number) => String(n).padStart(2, "0");

/** Paris calendar day of an instant, "YYYY-MM-DD". */
export function parisDateKey(d: Date): string {
  const t = new TZDate(d.getTime(), PARIS);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

/** ISO weekday in Paris: 1 = Monday ... 7 = Sunday. */
export function parisWeekday(d: Date): number {
  const day = new TZDate(d.getTime(), PARIS).getDay();
  return day === 0 ? 7 : day;
}

/** The instant of a Paris wall-clock time on a Paris calendar day. */
export function atParisTime(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, h, min, 0, PARIS).getTime());
}

/** "20:00" in Paris. */
export function formatParisTime(d: Date): string {
  const t = new TZDate(d.getTime(), PARIS);
  return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

/** Adds calendar days to a "YYYY-MM-DD" key. */
export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

const dayFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, weekday: "long", day: "numeric", month: "long" });

/** "jeudi 19 novembre" in Paris. */
export function formatParisDay(d: Date): string {
  return dayFormat.format(d);
}
