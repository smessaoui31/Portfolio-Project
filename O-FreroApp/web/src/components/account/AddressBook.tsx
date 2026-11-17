"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/app/actions/account";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

interface Address {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  isDefault: boolean;
}

const empty = { label: "", line1: "", line2: "", postalCode: "", city: "Toulouse" };

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(addresses.length === 0);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = await saveAddressAction(draft);
    if (!result.ok) return setError(result.message);
    setDraft(empty);
    setAdding(false);
    setError(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {addresses.length > 0 ? (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="text-sm">
                <p className="font-semibold">
                  {a.label || "Adresse"}
                  {a.isDefault ? <span className="ml-2 rounded-full bg-ember/15 px-2 py-0.5 text-xs text-ember">Par défaut</span> : null}
                </p>
                <p className="text-muted-2">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""} · {a.postalCode} {a.city}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                {!a.isDefault ? (
                  <button
                    type="button"
                    className="text-muted-2 underline-offset-4 hover:text-fg hover:underline"
                    onClick={async () => {
                      await setDefaultAddressAction(a.id);
                      router.refresh();
                    }}
                  >
                    Par défaut
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-muted-2 underline-offset-4 hover:text-danger hover:underline"
                  onClick={async () => {
                    await deleteAddressAction(a.id);
                    router.refresh();
                  }}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line p-4">
          <Field label="Nom (facultatif)">{(p) => <Input {...p} placeholder="Maison, Bureau…" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />}</Field>
          <Field label="Adresse">{(p) => <Input {...p} autoComplete="address-line1" value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} required />}</Field>
          <Field label="Complément">{(p) => <Input {...p} autoComplete="address-line2" value={draft.line2} onChange={(e) => setDraft({ ...draft, line2: e.target.value })} />}</Field>
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <Field label="Code postal">{(p) => <Input {...p} inputMode="numeric" autoComplete="postal-code" value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} required />}</Field>
            <Field label="Ville">{(p) => <Input {...p} autoComplete="address-level2" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} required />}</Field>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit">Enregistrer</Button>
            {addresses.length > 0 ? (
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Annuler
              </Button>
            ) : null}
          </div>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          Ajouter une adresse
        </Button>
      )}
    </div>
  );
}
