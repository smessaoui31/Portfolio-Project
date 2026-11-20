import { connection } from "next/server";
import { now } from "@/lib/clock";
import { atParisTime, formatParisDay, parisDateKey } from "@/lib/time";
import { getBannerMatch } from "@/server/match-nights";

/** Match night banner, from 3 days before until the evening itself. */
export async function MatchBanner() {
  // Read at request time: the banner depends on today's date.
  await connection();
  const at = now();
  const match = await getBannerMatch(at);
  if (!match) return null;
  const day = match.day === parisDateKey(at) ? "ce soir" : formatParisDay(atParisTime(match.day, "12:00"));
  return (
    <div className="bg-ember text-ember-ink">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-sm font-semibold md:px-6">
        Soir de match · {match.title} · {day}
        {match.message ? <span className="font-normal"> · {match.message}</span> : null}
        <span className="font-normal"> · Réserve ton créneau dès la veille.</span>
      </p>
    </div>
  );
}
