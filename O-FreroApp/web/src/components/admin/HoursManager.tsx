"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { addClosureAction, removeClosureAction, saveHoursAction } from "@/app/actions/admin-settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { ServiceWindowLike } from "@/domain/types";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function HoursManager({ windows, closures }: { windows: ServiceWindowLike[]; closures: { date: string; reason: string | null }[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(windows);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [closureDate, setClosureDate] = useState("");
  const [closureReason, setClosureReason] = useState("");

  const update = (index: number, patch: Partial<ServiceWindowLike>) => setRows((r) => r.map((w, i) => (i === index ? { ...w, ...patch } : w)));

  async function save() {
    const result = await saveHoursAction(rows);
    setMessage(result.ok ? { ok: true, text: "Horaires enregistrés." } : { ok: false, text: result.message });
    router.refresh();
  }

  async function addClosure(e: FormEvent) {
    e.preventDefault();
    const result = await addClosureAction(closureDate, closureReason);
    if (!result.ok) return setMessage({ ok: false, text: result.message });
    setClosureDate("");
    setClosureReason("");
    router.refresh();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <section>
        <h2 className="font-display mb-4 text-3xl">Services</h2>
        <div className="divide-y divide-line rounded-2xl border border-line">
          {DAYS.map((label, d) => {
            const weekday = d + 1;
            return (
              <div key={weekday} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="w-24 font-semibold">{label}</span>
                <div className="flex flex-1 flex-wrap gap-2">
                  {rows.map((w, i) =>
                    w.weekday === weekday ? (
                      <span key={i} className="flex items-center gap-1 rounded-xl border border-line-2 px-2 py-1">
                        <input aria-label={`${label}, ouverture`} type="time" value={w.opensAt} onChange={(e) => update(i, { opensAt: e.target.value })} className="bg-transparent text-sm [color-scheme:dark]" />
                        <span className="text-muted">–</span>
                        <input aria-label={`${label}, fermeture`} type="time" value={w.closesAt} onChange={(e) => update(i, { closesAt: e.target.value })} className="bg-transparent text-sm [color-scheme:dark]" />
                        <button type="button" aria-label="Retirer ce service" className="ml-1 text-muted hover:text-danger" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>
                          ×
                        </button>
                      </span>
                    ) : null,
                  )}
                  {!rows.some((w) => w.weekday === weekday) ? <span className="py-1 text-sm text-muted">Fermé</span> : null}
                </div>
                <button type="button" className="text-sm text-muted-2 hover:text-fg" onClick={() => setRows((r) => [...r, { weekday, opensAt: "18:00", closesAt: "22:00" }])}>
                  + service
                </button>
              </div>
            );
          })}
        </div>
        {message ? <p className={`mt-3 text-sm ${message.ok ? "text-ok" : "text-danger"}`}>{message.text}</p> : null}
        <Button size="lg" className="mt-4" onClick={save}>
          Enregistrer les horaires
        </Button>
      </section>

      <section>
        <h2 className="font-display mb-4 text-3xl">Fermetures</h2>
        <form onSubmit={addClosure} className="space-y-2 rounded-2xl border border-line p-4">
          <Input aria-label="Jour de fermeture" type="date" className="[color-scheme:dark]" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} required />
          <Input aria-label="Motif" placeholder="Motif (facultatif)" value={closureReason} onChange={(e) => setClosureReason(e.target.value)} />
          <Button type="submit" variant="secondary">
            Ajouter
          </Button>
        </form>
        <ul className="mt-4 divide-y divide-line">
          {closures.map((c) => (
            <li key={c.date} className="flex items-center justify-between py-2 text-sm">
              <span>
                {c.date.split("-").reverse().join("/")} {c.reason ? <span className="text-muted">· {c.reason}</span> : null}
              </span>
              <button
                type="button"
                className="text-muted-2 hover:text-danger"
                onClick={async () => {
                  await removeClosureAction(c.date);
                  router.refresh();
                }}
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
