"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteEditionAction, saveEditionAction } from "@/app/actions/admin-settings";
import { ProductImage } from "@/components/menu/ProductImage";
import { Button } from "@/components/ui/Button";
import { Field, Input, inputClasses } from "@/components/ui/Field";

export interface EditionRow {
  id: string;
  number: number;
  productId: string;
  productName: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  brothersNote: string;
  state: "past" | "current" | "upcoming";
  orders: number;
}

const STATE_LABEL = { past: "Passée", current: "En cours", upcoming: "À venir" } as const;

const empty = (next: number) => ({ number: String(next), productId: "", startDate: "", endDate: "", brothersNote: "" });

export function EditionsManager({ editions, products }: { editions: EditionRow[]; products: { id: string; name: string }[] }) {
  const router = useRouter();
  const nextNumber = Math.max(0, ...editions.map((e) => e.number)) + 1;
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty(nextNumber));
  const [error, setError] = useState<string | null>(null);

  function edit(e: EditionRow) {
    setEditing(e.id);
    setForm({ number: String(e.number), productId: e.productId, startDate: e.startDate, endDate: e.endDate, brothersNote: e.brothersNote });
    setError(null);
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const result = await saveEditionAction({ id: editing ?? undefined, ...form, number: Number(form.number) });
    if (!result.ok) return setError(result.message);
    setEditing(null);
    setForm(empty(nextNumber + 1));
    setError(null);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {editions.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
            <ProductImage src={e.imageUrl} alt="" size={52} className={e.state === "past" ? "opacity-50 grayscale" : ""} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                <span className="font-display mr-2 text-lg">N°{String(e.number).padStart(2, "0")}</span>
                {e.productName}
              </p>
              <p className="text-xs text-muted">
                {e.startDate} → {e.endDate} · {e.orders} commande{e.orders > 1 ? "s" : ""}
              </p>
            </div>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${e.state === "current" ? "border-ember text-ember" : "border-line-2 text-muted-2"}`}>
              {STATE_LABEL[e.state]}
            </span>
            <button type="button" className="text-sm text-muted-2 hover:text-fg" onClick={() => edit(e)}>
              Modifier
            </button>
            {e.orders === 0 ? (
              <button
                type="button"
                className="text-sm text-muted-2 hover:text-danger"
                onClick={async () => {
                  if (!window.confirm(`Supprimer l'édition n°${e.number} ?`)) return;
                  const r = await deleteEditionAction(e.id);
                  setError(r.ok ? null : r.message);
                  router.refresh();
                }}
              >
                Supprimer
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">{editing ? "Modifier l'édition" : "Programmer une édition"}</h2>
        <div className="grid grid-cols-[90px_1fr] gap-3">
          <Field label="N°">{(p) => <Input {...p} type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />}</Field>
          <Field label="Pizza" hint={products.length === 0 ? "Crée d'abord une pizza « réservée à une édition »." : undefined}>
            {(p) => (
              <select {...p} className={inputClasses} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">Choisir…</option>
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Premier jour">{(p) => <Input {...p} type="date" className="[color-scheme:dark]" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />}</Field>
          <Field label="Dernier jour">{(p) => <Input {...p} type="date" className="[color-scheme:dark]" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />}</Field>
        </div>
        <Field label="Le mot des frères">
          {(p) => <textarea {...p} rows={3} className={inputClasses} value={form.brothersNote} onChange={(e) => setForm({ ...form, brothersNote: e.target.value })} required />}
        </Field>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit">Enregistrer</Button>
          {editing ? (
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setForm(empty(nextNumber));
              }}
            >
              Annuler
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
