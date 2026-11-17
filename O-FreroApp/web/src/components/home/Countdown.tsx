"use client";

import { useEffect, useState } from "react";
import { splitRemaining } from "@/domain/editions";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Time left before the edition disappears. Starts from the server's values and
 * ticks every minute, keeping the server/client clock offset.
 */
export function Countdown({
  endsAt,
  serverNow,
  dayIndex,
  totalDays,
  ratio,
}: {
  endsAt: Date;
  serverNow: Date;
  dayIndex: number;
  totalDays: number;
  ratio: number;
}) {
  const [remaining, setRemaining] = useState(endsAt.getTime() - serverNow.getTime());

  useEffect(() => {
    const offset = serverNow.getTime() - Date.now();
    const tick = () => setRemaining(endsAt.getTime() - (Date.now() + offset));
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [endsAt, serverNow]);

  const { days, hours, minutes } = splitRemaining(remaining);

  return (
    <div>
      <div className="flex justify-between text-[11px] uppercase tracking-[0.16em] text-muted">
        <span>Disparaît dans</span>
        <span className="tabular-nums">
          J+{dayIndex} / {totalDays}
        </span>
      </div>
      <p className="font-display mt-1 text-[2.4rem] leading-none tabular-nums md:text-5xl" aria-live="off">
        {days} J {pad(hours)} H {pad(minutes)} MIN
      </p>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Avancement de l'édition"
        aria-valuemin={1}
        aria-valuemax={totalDays}
        aria-valuenow={dayIndex}
      >
        <div className="h-full rounded-full bg-ember" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}
