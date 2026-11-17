import type { ServiceWindowLike } from "./types";

const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Opening hours for display: consecutive days with the same services are merged. */
export function groupServiceWindows(windows: ServiceWindowLike[]): { days: string; services: string }[] {
  const perDay = Array.from({ length: 7 }, (_, i) => {
    const services = windows
      .filter((w) => w.weekday === i + 1)
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
      .map((w) => `${w.opensAt}–${w.closesAt}`)
      .join(" · ");
    return services || "Fermé";
  });

  const groups: { from: number; to: number; services: string }[] = [];
  perDay.forEach((services, day) => {
    const last = groups.at(-1);
    if (last && last.services === services && last.to === day - 1) last.to = day;
    else groups.push({ from: day, to: day, services });
  });

  return groups.map((g) => ({
    days: g.from === g.to ? DAY_NAMES[g.from] : `${DAY_SHORT[g.from]} – ${DAY_SHORT[g.to]}`,
    services: g.services,
  }));
}
