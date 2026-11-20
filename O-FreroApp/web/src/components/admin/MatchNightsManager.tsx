"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { addMatchNightAction, deleteMatchNightAction } from "@/app/actions/match-nights";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

/** Match nights: a banner 3 days before, and the evening bookable from the day before. */
export function MatchNightsManager({ nights }: { nights: { id: string; date: string; title: string; message: string | null }[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const result = await addMatchNightAction({ date, title, message: message || undefined });
    if (!result.ok) return setError(result.message);
    setError(null);
    setDate("");
    setTitle("");
    setMessage("");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted">
        Un bandeau s&apos;affiche sur le site 3 jours avant, et les clients peuvent réserver leur créneau du soir dès la veille.
      </p>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {nights.length === 0 ? <li className="px-4 py-3 text-sm text-muted">Aucune soirée prévue.</li> : null}
        {nights.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="tabular-nums text-sm text-muted-2">{n.date.split("-").reverse().join("/")}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{n.title}</span>
              {n.message ? <span className="text-xs text-muted">{n.message}</span> : null}
            </span>
            <button
              type="button"
              className="text-sm text-muted-2 hover:text-danger"
              onClick={async () => {
                if (!window.confirm(`Supprimer la soirée « ${n.title} » ?`)) return;
                await deleteMatchNightAction(n.id);
                router.refresh();
              }}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[auto_1fr]">
        <Input aria-label="Date du match" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input aria-label="Match" placeholder="France – Angleterre" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input aria-label="Message" placeholder="Coup d'envoi 21 h (facultatif)" value={message} onChange={(e) => setMessage(e.target.value)} className="sm:col-span-2" />
        <Button type="submit" className="sm:col-span-2">
          Ajouter la soirée
        </Button>
      </form>
    </div>
  );
}
