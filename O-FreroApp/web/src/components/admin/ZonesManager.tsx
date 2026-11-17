"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteZoneAction, saveZoneAction } from "@/app/actions/admin-settings";
import { Button } from "@/components/ui/Button";
import { Field, Input, inputClasses } from "@/components/ui/Field";
import { formatEuros, parseEuros } from "@/lib/money";

interface Zone {
  id: string;
  name: string;
  postalCodes: string[];
  feeCents: number;
  minOrderCents: number;
  isActive: boolean;
}

const euros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const blank = { name: "", postalCodes: "", fee: "2,50", min: "20,00", isActive: true };

export function ZonesManager({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const feeCents = parseEuros(form.fee);
    const minOrderCents = parseEuros(form.min);
    if (feeCents === null || minOrderCents === null) return setError("Montant invalide (exemple : 2,50).");
    const result = await saveZoneAction({ id: editing ?? undefined, name: form.name, postalCodes: form.postalCodes, feeCents, minOrderCents, isActive: form.isActive });
    if (!result.ok) return setError(result.message);
    setEditing(null);
    setForm(blank);
    setError(null);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {zones.length === 0 ? <li className="px-4 py-6 text-sm text-muted-2">Aucune zone : la livraison est indisponible.</li> : null}
        {zones.map((z) => (
          <li key={z.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {z.name} {!z.isActive ? <span className="text-xs text-muted">(inactive)</span> : null}
              </p>
              <p className="text-xs text-muted">{z.postalCodes.join(", ")}</p>
              <p className="text-xs text-muted-2">
                Frais {formatEuros(z.feeCents)} · minimum {formatEuros(z.minOrderCents)}
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-muted-2 hover:text-fg"
              onClick={() => {
                setEditing(z.id);
                setForm({ name: z.name, postalCodes: z.postalCodes.join(", "), fee: euros(z.feeCents), min: euros(z.minOrderCents), isActive: z.isActive });
              }}
            >
              Modifier
            </button>
            <button
              type="button"
              className="text-sm text-muted-2 hover:text-danger"
              onClick={async () => {
                if (!window.confirm(`Supprimer la zone ${z.name} ?`)) return;
                await deleteZoneAction(z.id);
                router.refresh();
              }}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">{editing ? "Modifier la zone" : "Nouvelle zone"}</h2>
        <Field label="Nom">{(p) => <Input {...p} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}</Field>
        <Field label="Codes postaux" hint="Séparés par des virgules ou des espaces.">
          {(p) => <textarea {...p} rows={3} className={inputClasses} value={form.postalCodes} onChange={(e) => setForm({ ...form, postalCodes: e.target.value })} required />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frais (€)">{(p) => <Input {...p} inputMode="decimal" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} required />}</Field>
          <Field label="Minimum (€)">{(p) => <Input {...p} inputMode="decimal" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} required />}</Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[var(--ember)]" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Zone active
        </label>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit">Enregistrer</Button>
      </form>
    </div>
  );
}
