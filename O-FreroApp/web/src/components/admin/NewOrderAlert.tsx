"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function beep(context: AudioContext) {
  [0, 0.3].forEach((offset) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.2);
    osc.connect(gain).connect(context.destination);
    osc.start(context.currentTime + offset);
    osc.stop(context.currentTime + offset + 0.2);
  });
}

/** Polls for new orders every 15 s, beeps and refreshes the page when one arrives. */
export function NewOrderAlert() {
  const router = useRouter();
  const audio = useRef<AudioContext | null>(null);
  const since = useRef(new Date().toISOString());
  const [soundOn, setSoundOn] = useState(false);
  const [fresh, setFresh] = useState(0);

  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/admin/orders/latest?since=${encodeURIComponent(since.current)}`, { cache: "no-store" });
      if (!res.ok) return;
      const { count, newest } = (await res.json()) as { count: number; newest: string | null };
      if (count > 0 && newest) {
        since.current = newest;
        setFresh((n) => n + count);
        if (audio.current) beep(audio.current);
        router.refresh();
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex items-center gap-3 print:hidden">
      {fresh > 0 ? (
        <button
          type="button"
          onClick={() => setFresh(0)}
          className="rounded-full bg-ember px-3 py-1 text-xs font-bold text-ember-ink"
        >
          {fresh} nouvelle{fresh > 1 ? "s" : ""} commande{fresh > 1 ? "s" : ""}
        </button>
      ) : null}
      <button
        type="button"
        aria-pressed={soundOn}
        onClick={() => {
          if (!audio.current) audio.current = new AudioContext();
          if (!soundOn) beep(audio.current);
          setSoundOn((on) => {
            if (on) audio.current = null;
            return !on;
          });
        }}
        className="rounded-full border border-line-2 px-3 py-1 text-xs text-muted-2 transition hover:text-fg aria-pressed:border-ok aria-pressed:text-ok"
      >
        {soundOn ? "Son activé" : "Activer le son"}
      </button>
    </div>
  );
}
