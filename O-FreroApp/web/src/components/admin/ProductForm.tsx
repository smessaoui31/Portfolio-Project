"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteProductAction, saveProductAction } from "@/app/actions/admin-catalog";
import { ProductImage } from "@/components/menu/ProductImage";
import { Button } from "@/components/ui/Button";
import { Field, Input, inputClasses } from "@/components/ui/Field";
import { formatEuros, parseEuros } from "@/lib/money";

export interface ProductFormValue {
  id?: string;
  name: string;
  description: string;
  price: string;
  discountPercent: string;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  stock: string;
  isEditionOnly: boolean;
  supplementIds: string[];
}

export function ProductForm({
  initial,
  categories,
  supplements,
  images,
}: {
  initial: ProductFormValue;
  categories: { id: string; name: string }[];
  supplements: { id: string; name: string; priceCents: number }[];
  images: string[];
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ProductFormValue>(key: K, value: ProductFormValue[K]) => setV((prev) => ({ ...prev, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const priceCents = parseEuros(v.price);
    if (priceCents === null) return setError("Prix invalide (exemple : 12,50).");
    const stock = v.stock.trim() === "" ? null : Number(v.stock);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return setError("Stock invalide : laisse vide pour illimité.");
    setBusy(true);
    const result = await saveProductAction({
      id: v.id,
      name: v.name,
      description: v.description,
      priceCents,
      discountPercent: Number(v.discountPercent || 0),
      categoryId: v.categoryId || null,
      imageUrl: v.imageUrl,
      isAvailable: v.isAvailable,
      stockQuantity: stock,
      isEditionOnly: v.isEditionOnly,
      supplementIds: v.supplementIds,
    });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    router.push("/admin/produits");
    router.refresh();
  }

  async function remove() {
    if (!v.id || !window.confirm(`Supprimer ${v.name} ?`)) return;
    const result = await deleteProductAction(v.id);
    if (!result.ok) return setError(result.message);
    router.push("/admin/produits");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid max-w-4xl gap-8 md:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <Field label="Nom">{(p) => <Input {...p} value={v.name} onChange={(e) => set("name", e.target.value)} required />}</Field>
        <Field label="Description">
          {(p) => <textarea {...p} rows={3} className={inputClasses} value={v.description} onChange={(e) => set("description", e.target.value)} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix (€)">{(p) => <Input {...p} inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} required />}</Field>
          <Field label="Remise (%)">
            {(p) => <Input {...p} type="number" min={0} max={90} value={v.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} />}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            {(p) => (
              <select {...p} className={inputClasses} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Sans catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Stock" hint="Vide = illimité">
            {(p) => <Input {...p} type="number" min={0} value={v.stock} onChange={(e) => set("stock", e.target.value)} />}
          </Field>
        </div>
        <Field label="Image" hint="Un fichier de public/images, par exemple /images/pizzas/reine.jpg.">
          {(p) => (
            <>
              <Input {...p} list="images-disponibles" value={v.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
              <datalist id="images-disponibles">
                {images.map((src) => (
                  <option key={src} value={src} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <fieldset className="space-y-2 rounded-2xl border border-line p-4 text-sm">
          <legend className="px-1 text-xs uppercase tracking-[0.12em] text-muted">Options</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[var(--ember)]" checked={v.isAvailable} onChange={(e) => set("isAvailable", e.target.checked)} />
            Disponible à la commande
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[var(--ember)]" checked={v.isEditionOnly} onChange={(e) => set("isEditionOnly", e.target.checked)} />
            Réservé à une édition (commandable seulement pendant son édition)
          </label>
        </fieldset>
        {supplements.length > 0 ? (
          <fieldset className="rounded-2xl border border-line p-4">
            <legend className="px-1 text-xs uppercase tracking-[0.12em] text-muted">Suppléments proposés</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {supplements.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--ember)]"
                    checked={v.supplementIds.includes(s.id)}
                    onChange={(e) =>
                      set("supplementIds", e.target.checked ? [...v.supplementIds, s.id] : v.supplementIds.filter((x) => x !== s.id))
                    }
                  />
                  {s.name} <span className="text-muted">{formatEuros(s.priceCents)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" disabled={busy}>
            Enregistrer
          </Button>
          {v.id ? (
            <Button variant="secondary" size="lg" onClick={remove}>
              Supprimer
            </Button>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Aperçu</p>
        <ProductImage src={/^\/images\/[\w./-]+$/.test(v.imageUrl) ? v.imageUrl : null} alt="" size={200} />
      </div>
    </form>
  );
}
