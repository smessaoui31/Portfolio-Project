"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-store";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import {
  choiceText,
  defaultChoices,
  resolveChoices,
  type LineChoice,
  type OptionSlot,
} from "@/domain/options";
import {
  COOKING_LABELS,
  SUPPLEMENT_FAMILIES,
  type Cooking,
} from "@/domain/types";
import { formatEuros } from "@/lib/money";
import type { MenuProduct } from "@/server/catalog";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";

const COOKINGS = (Object.keys(COOKING_LABELS) as Cooking[]).map((value) => ({
  value,
  label: COOKING_LABELS[value],
}));

/** Customize then add a product. Mount with a `key` per product so its state resets. */
export function ProductSheet({
  product,
  open,
  onOpenChange,
}: {
  product: MenuProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useCart((s) => s.add);
  const setCartOpen = useCart((s) => s.setOpen);
  const [cooking, setCooking] = useState<Cooking>("NORMAL");
  const [supplementIds, setSupplementIds] = useState<string[]>([]);
  const [choices, setChoices] = useState<LineChoice[]>(() =>
    product ? defaultChoices(product.optionSlots) : [],
  );
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const supplementsCents = product.supplements
    .filter((s) => supplementIds.includes(s.id))
    .reduce((sum, s) => sum + s.priceCents, 0);
  const resolved = resolveChoices(product.optionSlots, choices);
  const choicesCents = resolved.ok
    ? resolved.choices.reduce((sum, c) => sum + c.unitPriceCents, 0)
    : 0;
  const total =
    (product.unitPriceCents + choicesCents + supplementsCents) * quantity;

  function toggle(id: string) {
    setSupplementIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  function pick(slot: OptionSlot, optionId: string) {
    setChoices((current) => {
      const others = current.filter((c) => c.slotId !== slot.id);
      const mine = current.filter((c) => c.slotId === slot.id);
      if (slot.maxSelect === 1)
        return [...others, { slotId: slot.id, optionId }];
      if (mine.some((c) => c.optionId === optionId))
        return [...others, ...mine.filter((c) => c.optionId !== optionId)];
      return mine.length < slot.maxSelect
        ? [...current, { slotId: slot.id, optionId }]
        : current;
    });
  }

  function onAdd() {
    if (!product || !resolved.ok) return;
    add({
      productId: product.id,
      quantity,
      cooking: product.isPizza ? cooking : "NORMAL",
      supplementIds,
      choices: resolved.choices.map(({ slotId, optionId }) => ({
        slotId,
        optionId,
      })),
      name: product.name,
      imageUrl: product.imageUrl,
      supplementNames: product.supplements
        .filter((s) => supplementIds.includes(s.id))
        .map((s) => s.name),
      choiceNames: resolved.choices.map(choiceText),
    });
    onOpenChange(false);
    setCartOpen(true);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={product.name}
      description={product.description ?? undefined}
      footer={
        <Button
          size="lg"
          className="w-full justify-between"
          onClick={onAdd}
          disabled={product.soldOut || !resolved.ok}
        >
          <span>
            {product.soldOut
              ? "Épuisé"
              : resolved.ok
                ? "Ajouter au panier"
                : "Fais tes choix"}
          </span>
          <span className="tabular-nums">{formatEuros(total)}</span>
        </Button>
      }
    >
      <div className="flex justify-center py-2">
        <ProductImage src={product.imageUrl} alt={product.name} size={208} />
      </div>

      {product.optionSlots.map((slot) => {
        const single = slot.maxSelect === 1;
        return (
          <section key={slot.id} className="mt-6">
            <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">
              {slot.label}
              {slot.minSelect > 0 ? (
                <span className="normal-case tracking-normal text-muted-2">
                  {" "}
                  (obligatoire)
                </span>
              ) : null}
            </h3>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {slot.options.map((option) => (
                <li key={option.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                    <input
                      type={single ? "radio" : "checkbox"}
                      name={`slot-${slot.id}`}
                      checked={choices.some(
                        (c) => c.slotId === slot.id && c.optionId === option.id,
                      )}
                      onChange={() => pick(slot, option.id)}
                      className="size-4 accent-[var(--ember)]"
                    />
                    <span className="flex-1">{option.name}</span>
                    {option.priceCents > 0 ? (
                      <span className="text-muted-2 tabular-nums">
                        + {formatEuros(option.priceCents)}
                      </span>
                    ) : null}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {product.isPizza ? (
        <section className="mt-6">
          <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">
            Cuisson
          </h3>
          <Segmented
            label="Cuisson"
            value={cooking}
            options={COOKINGS}
            onChange={setCooking}
          />
        </section>
      ) : null}

      {SUPPLEMENT_FAMILIES.map((family) => {
        const supplements = product.supplements.filter(
          (s) => s.family === family.value,
        );
        if (supplements.length === 0) return null;
        return (
          <section key={family.value} className="mt-6">
            <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">
              Suppléments · {family.label}
            </h3>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {supplements.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={supplementIds.includes(s.id)}
                      onChange={() => toggle(s.id)}
                      className="size-4 accent-[var(--ember)]"
                    />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-muted-2 tabular-nums">
                      + {formatEuros(s.priceCents)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-6 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.14em] text-muted">
          Quantité
        </h3>
        <QuantityStepper
          label="Quantité"
          value={quantity}
          onChange={setQuantity}
        />
      </section>
    </Sheet>
  );
}
