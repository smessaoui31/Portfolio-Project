"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type MouseEvent } from "react";
import { useCart } from "@/components/cart/cart-store";
import { centerOf, useCartFx } from "@/components/motion/CartFx";
import { Odometer } from "@/components/motion/Odometer";
import { SNAPPY } from "@/components/motion/springs";
import { Button } from "@/components/ui/Button";
import { ChoiceInput } from "@/components/ui/ChoiceInput";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { choiceText, defaultChoices, resolveChoices, type LineChoice, type OptionSlot } from "@/domain/options";
import { COOKING_LABELS, SUPPLEMENT_FAMILIES, type Cooking } from "@/domain/types";
import { haptic } from "@/lib/haptics";
import { formatEuros } from "@/lib/money";
import type { MenuProduct } from "@/server/catalog";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";

const COOKINGS = (Object.keys(COOKING_LABELS) as Cooking[]).map((value) => ({ value, label: COOKING_LABELS[value] }));

/** Time the "Ajouté" state stays on screen before the sheet closes and the pizza flies to the cart. */
const ADDED_MS = 480;

function Row({
  type,
  name,
  checked,
  onChange,
  label,
  priceCents,
  highlight,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  priceCents: number;
  /** Shared id of the sliding background of a single-choice list. */
  highlight?: string;
}) {
  return (
    <li className="relative">
      {highlight && checked ? (
        <motion.span layoutId={highlight} className="absolute inset-0 rounded-[15px] bg-ember/10" transition={SNAPPY} />
      ) : null}
      <label className="relative flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
        <ChoiceInput type={type} name={name} checked={checked} onChange={onChange} />
        <span className="flex-1">{label}</span>
        {priceCents > 0 ? <span className="text-muted-2 tabular-nums">+ {formatEuros(priceCents)}</span> : null}
      </label>
    </li>
  );
}

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
  const burst = useCartFx((s) => s.burst);
  const fly = useCartFx((s) => s.fly);
  const image = useRef<HTMLDivElement>(null);
  const [cooking, setCooking] = useState<Cooking>("NORMAL");
  const [supplementIds, setSupplementIds] = useState<string[]>([]);
  const [choices, setChoices] = useState<LineChoice[]>(() => (product ? defaultChoices(product.optionSlots) : []));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // Reopening the same product starts from the "Ajouter" state again.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setAdded(false);
  }

  if (!product) return null;

  const supplementsCents = product.supplements.filter((s) => supplementIds.includes(s.id)).reduce((sum, s) => sum + s.priceCents, 0);
  const resolved = resolveChoices(product.optionSlots, choices);
  const choicesCents = resolved.ok ? resolved.choices.reduce((sum, c) => sum + c.unitPriceCents, 0) : 0;
  const total = (product.unitPriceCents + choicesCents + supplementsCents) * quantity;

  function toggle(id: string) {
    haptic(6);
    setSupplementIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function pick(slot: OptionSlot, optionId: string) {
    haptic(6);
    setChoices((current) => {
      const others = current.filter((c) => c.slotId !== slot.id);
      const mine = current.filter((c) => c.slotId === slot.id);
      if (slot.maxSelect === 1) return [...others, { slotId: slot.id, optionId }];
      if (mine.some((c) => c.optionId === optionId)) return [...others, ...mine.filter((c) => c.optionId !== optionId)];
      return mine.length < slot.maxSelect ? [...current, { slotId: slot.id, optionId }] : current;
    });
  }

  function onAdd(event: MouseEvent<HTMLButtonElement>) {
    if (!product || !resolved.ok || added) return;
    add({
      productId: product.id,
      quantity,
      cooking: product.isPizza ? cooking : "NORMAL",
      supplementIds,
      choices: resolved.choices.map(({ slotId, optionId }) => ({ slotId, optionId })),
      name: product.name,
      imageUrl: product.imageUrl,
      supplementNames: product.supplements.filter((s) => supplementIds.includes(s.id)).map((s) => s.name),
      choiceNames: resolved.choices.map(choiceText),
    });
    // The moment: embers burst from the button, then the pizza flies into the cart.
    haptic([10, 40, 16]);
    burst(centerOf(event.currentTarget.getBoundingClientRect()));
    setAdded(true);
    const from = image.current?.getBoundingClientRect();
    window.setTimeout(() => {
      onOpenChange(false);
      if (from) fly(from, product.imageUrl);
    }, ADDED_MS);
  }

  const label = product.soldOut ? "Épuisé" : resolved.ok ? "Ajouter au panier" : "Fais tes choix";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={product.name}
      description={product.description ?? undefined}
      footer={
        <Button size="lg" className="w-full justify-between overflow-hidden" onClick={onAdd} disabled={product.soldOut || !resolved.ok}>
          <AnimatePresence mode="popLayout" initial={false}>
            {added ? (
              <motion.span
                key="added"
                className="flex items-center gap-2"
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={SNAPPY}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <motion.path
                    d="M3 8.5l3.2 3L13 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                  />
                </svg>
                Ajouté
              </motion.span>
            ) : (
              <motion.span key={label} exit={{ y: -18, opacity: 0 }} transition={SNAPPY}>
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          <Odometer value={formatEuros(total)} />
        </Button>
      }
    >
      <div className="flex justify-center py-2">
        <motion.div
          ref={image}
          initial={{ scale: 0.6, rotate: -40, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 16, delay: 0.08 }}
        >
          <ProductImage src={product.imageUrl} alt={product.name} size={208} />
        </motion.div>
      </div>

      {product.optionSlots.map((slot) => {
        const single = slot.maxSelect === 1;
        return (
          <section key={slot.id} className="mt-6">
            <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">
              {slot.label}
              {slot.minSelect > 0 ? <span className="normal-case tracking-normal text-muted-2"> (obligatoire)</span> : null}
            </h3>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {slot.options.map((option) => (
                <Row
                  key={option.id}
                  type={single ? "radio" : "checkbox"}
                  name={`slot-${slot.id}`}
                  checked={choices.some((c) => c.slotId === slot.id && c.optionId === option.id)}
                  onChange={() => pick(slot, option.id)}
                  label={option.name}
                  priceCents={option.priceCents}
                  highlight={single ? `highlight-${slot.id}` : undefined}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {product.isPizza ? (
        <section className="mt-6">
          <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">Cuisson</h3>
          <Segmented label="Cuisson" value={cooking} options={COOKINGS} onChange={setCooking} />
        </section>
      ) : null}

      {SUPPLEMENT_FAMILIES.map((family) => {
        const supplements = product.supplements.filter((s) => s.family === family.value);
        if (supplements.length === 0) return null;
        return (
          <section key={family.value} className="mt-6">
            <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">Suppléments · {family.label}</h3>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {supplements.map((s) => (
                <Row
                  key={s.id}
                  type="checkbox"
                  checked={supplementIds.includes(s.id)}
                  onChange={() => toggle(s.id)}
                  label={s.name}
                  priceCents={s.priceCents}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-6 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.14em] text-muted">Quantité</h3>
        <QuantityStepper label="Quantité" value={quantity} onChange={setQuantity} />
      </section>
    </Sheet>
  );
}
