"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteOptionGroupAction, saveOptionGroupAction } from "@/app/actions/admin-options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { parseEuros } from "@/lib/money";

export interface AdminOptionGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  products: number;
  options: { id: string; name: string; priceCents: number; isActive: boolean }[];
}

interface DraftOption {
  id?: string;
  name: string;
  price: string;
  isActive: boolean;
}

const euros = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

function GroupEditor({ group, onDone }: { group: AdminOptionGroup | null; onDone: (message: string | null, reset?: boolean) => void }) {
  const [name, setName] = useState(group?.name ?? "");
  const [min, setMin] = useState(String(group?.minSelect ?? 1));
  const [max, setMax] = useState(String(group?.maxSelect ?? 1));
  const [options, setOptions] = useState<DraftOption[]>(
    group?.options.map((o) => ({ id: o.id, name: o.name, price: euros(o.priceCents), isActive: o.isActive })) ?? [
      { name: "", price: "0,00", isActive: true },
    ],
  );

  const update = (index: number, changes: Partial<DraftOption>) =>
    setOptions((list) => list.map((o, i) => (i === index ? { ...o, ...changes } : o)));
  const move = (index: number, by: number) =>
    setOptions((list) => {
      const target = index + by;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  async function save(e: FormEvent) {
    e.preventDefault();
    const priced = options.map((o) => ({ ...o, cents: parseEuros(o.price) }));
    if (priced.some((o) => o.cents === null)) return onDone("Prix invalide (exemple : 1,50).");
    const result = await saveOptionGroupAction({
      id: group?.id,
      name,
      minSelect: Number(min),
      maxSelect: Number(max),
      options: priced.map((o) => ({ id: o.id, name: o.name, priceCents: o.cents!, isActive: o.isActive })),
    });
    onDone(result.ok ? null : result.message, result.ok && !group);
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input aria-label="Nom du groupe" placeholder="Nom du groupe" value={name} onChange={(e) => setName(e.target.value)} className="!w-auto flex-1" required />
        <label className="flex items-center gap-2 text-sm text-muted-2">
          Min
          <Input aria-label="Minimum" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} className="!w-14 text-right" />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-2">
          Max
          <Input aria-label="Maximum" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} className="!w-14 text-right" />
        </label>
      </div>
      {group ? (
        <p className="text-xs text-muted">
          Utilisé par {group.products} produit{group.products > 1 ? "s" : ""}. Min 1 et max 1 : un choix obligatoire.
        </p>
      ) : null}
      <ul className="divide-y divide-line rounded-xl border border-line">
        {options.map((option, index) => (
          <li key={option.id ?? `new-${index}`} className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Input aria-label={`Option ${index + 1}`} value={option.name} onChange={(e) => update(index, { name: e.target.value })} className="!w-auto flex-1" required />
            <Input aria-label={`Prix de l'option ${index + 1}`} inputMode="decimal" value={option.price} onChange={(e) => update(index, { price: e.target.value })} className="!w-20 text-right" />
            <label className="flex items-center gap-1 text-xs text-muted-2">
              <input type="checkbox" className="accent-[var(--ember)]" checked={option.isActive} onChange={(e) => update(index, { isActive: e.target.checked })} />
              Actif
            </label>
            <button type="button" aria-label="Monter" className="px-1 text-muted-2 hover:text-fg" onClick={() => move(index, -1)}>
              ↑
            </button>
            <button type="button" aria-label="Descendre" className="px-1 text-muted-2 hover:text-fg" onClick={() => move(index, 1)}>
              ↓
            </button>
            <button type="button" className="text-xs text-muted-2 hover:text-danger" onClick={() => setOptions((list) => list.filter((_, i) => i !== index))}>
              Retirer
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="text-sm text-muted-2 underline-offset-4 hover:text-fg hover:underline" onClick={() => setOptions((list) => [...list, { name: "", price: "0,00", isActive: true }])}>
          + Ajouter une option
        </button>
        <span className="flex-1" />
        {group ? (
          <button
            type="button"
            className="text-sm text-muted-2 hover:text-danger"
            onClick={async () => {
              if (!window.confirm(`Supprimer le groupe ${group.name} ?`)) return;
              const result = await deleteOptionGroupAction(group.id);
              onDone(result.ok ? null : result.message);
            }}
          >
            Supprimer
          </button>
        ) : null}
        <Button type="submit">{group ? "Enregistrer" : "Créer le groupe"}</Button>
      </div>
    </form>
  );
}

export function OptionGroupsManager({ groups }: { groups: AdminOptionGroup[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState(0);

  const done = (message: string | null, reset = false) => {
    setError(message);
    if (reset) setNewKey((k) => k + 1);
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted">
        Un groupe de choix (taille, sauce, parfum, pizza d&apos;un menu) se règle ici une fois, puis se rattache aux produits dans leur fiche.
      </p>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      {groups.map((g) => (
        <GroupEditor key={`${g.id}-${JSON.stringify(g.options)}-${g.name}`} group={g} onDone={done} />
      ))}
      <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Nouveau groupe</h2>
      <GroupEditor key={`new-${newKey}`} group={null} onDone={done} />
    </div>
  );
}
