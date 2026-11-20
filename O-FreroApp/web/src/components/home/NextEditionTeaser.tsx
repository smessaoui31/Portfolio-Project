"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

function parts(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60 };
}

/** The next edition, hidden: a blurred pizza, its number and a countdown to the reveal. */
export function NextEditionTeaser({ number, startsAt, serverNow }: { number: number; startsAt: string; serverNow: string }) {
  const target = new Date(startsAt).getTime();
  const [remaining, setRemaining] = useState(target - new Date(serverNow).getTime());
  useEffect(() => {
    const offset = new Date(serverNow).getTime() - Date.now();
    const tick = () => setRemaining(target - (Date.now() + offset));
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [target, serverNow]);
  const { days, hours, minutes } = parts(remaining);

  return (
    <section aria-labelledby="prochaine" className="grid items-center gap-6 rounded-3xl border border-dashed border-line-2 p-6 md:grid-cols-[auto_1fr] md:p-8">
      <div className="relative mx-auto size-36" aria-hidden>
        <motion.div
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_40%_35%,#d8401c,#7a2a12_60%,#2a1a12)] blur-[6px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <span className="font-display absolute inset-0 grid place-items-center text-6xl text-fg">?</span>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ember">Bientôt</p>
        <h2 id="prochaine" className="font-display mt-2 text-4xl md:text-5xl">
          Édition N°{String(number).padStart(2, "0")}
        </h2>
        <p className="mt-3 text-muted-2">Son nom reste secret jusqu&apos;au jour J. Révélation dans :</p>
        <p className="font-display mt-2 text-3xl tabular-nums">
          {days} j {String(hours).padStart(2, "0")} h {String(minutes).padStart(2, "0")} min
        </p>
      </div>
    </section>
  );
}
