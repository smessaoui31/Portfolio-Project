"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteSupplementAction, saveSupplementAction } from "@/app/actions/admin-catalog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { parseEuros } from "@/lib/money";

interface Supplement {
  id: string;
  name: string;
  priceCents: number;
  isActive: boolean;
  products: number;
}

const euros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

function Row({ supplement, onDone }: { supplement: Supplement; onDone: (message: string | null) => void }) {
  const [price, setPrice] = useState(euros(supplement.priceCents));

  async function save(changes: Partial<{ priceCents: number; isActive: boolean }>) {
    const result = await saveSupplementAction({ id: supplement.id, name: supplement.name, priceCents: supplement.priceCents, isActive: supplement.isActive, ...changes });
    onDone(result.ok ? null : result.message);
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{supplement.name}</span>
        <span className="text-xs text-muted">
          Proposé sur {supplement.products} produit{supplement.products > 1 ? "s" : ""}
        </span>
      </span>
      <Input
        aria-label={`Prix de ${supplement.name}`}
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={() => {
          const cents = parseEuros(price);
          if (cents === null) return onDone("Prix invalide (exemple : 1,50).");
          if (cents !== supplement.priceCents) save({ priceCents: cents });
        }}
        className="!w-24 text-right"
      />
      <label className="flex items-center gap-2 text-sm text-muted-2">
        <input type="checkbox" className="accent-[var(--ember)]" checked={supplement.isActive} onChange={(e) => save({ isActive: e.target.checked })} />
        Actif
      </label>
      <button
        type="button"
        className="text-sm text-muted-2 hover:text-danger"
        onClick={async () => {
          if (!window.confirm(`Supprimer ${supplement.name} ?`)) return;
          const result = await deleteSupplementAction(supplement.id);
          onDone(result.ok ? null : result.message);
        }}
      >
        Supprimer
      </button>
    </li>
  );
}

export function SupplementsManager({ supplements }: { supplements: Supplement[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const done = (message: string | null) => {
    setError(message);
    router.refresh();
  };

  async function add(e: FormEvent) {
    e.preventDefault();
    const cents = parseEuros(price);
    if (cents === null) return setError("Prix invalide (exemple : 1,50).");
    const result = await saveSupplementAction({ name, priceCents: cents, isActive: true });
    if (result.ok) {
      setName("");
      setPrice("");
    }
    done(result.ok ? null : result.message);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {supplements.map((s) => (
          <Row key={`${s.id}-${s.priceCents}`} supplement={s} onDone={done} />
        ))}
      </ul>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <form onSubmit={add} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4">
        <Input aria-label="Nouveau supplément" placeholder="Nouveau supplément" value={name} onChange={(e) => setName(e.target.value)} className="!w-auto flex-1" required />
        <Input aria-label="Prix" placeholder="Prix" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="!w-24" required />
        <Button type="submit">Ajouter</Button>
      </form>
      <p className="text-sm text-muted">Pour proposer un supplément sur une pizza, coche-le dans la fiche du produit.</p>
    </div>
  );
}
