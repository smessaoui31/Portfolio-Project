"use client";

import { useEffect, useState } from "react";
import { getSlotsAction, quoteDeliveryAction, type DeliveryQuoteResult, type SlotsResult } from "@/app/actions/order";
import { useCart } from "@/components/cart/cart-store";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { normalizePostalCode } from "@/domain/delivery";
import type { FulfillmentMode } from "@/domain/types";
import { formatEuros } from "@/lib/money";
import { SITE } from "@/lib/site";
import { formatParisTime } from "@/lib/time";
import type { AddressDraft, CheckoutAccount } from "./types";

export function ModeStep({
  mode,
  onModeChange,
  slot,
  onSlotChange,
  address,
  onAddressChange,
  delivery,
  onDeliveryChange,
  account,
  onlinePayment,
  onContinue,
}: {
  mode: FulfillmentMode;
  onModeChange: (mode: FulfillmentMode) => void;
  slot: string | null;
  onSlotChange: (slot: string | null, asap?: boolean) => void;
  address: AddressDraft;
  onAddressChange: (address: AddressDraft) => void;
  delivery: DeliveryQuoteResult | null;
  onDeliveryChange: (quote: DeliveryQuoteResult | null) => void;
  account: CheckoutAccount | null;
  onlinePayment: boolean;
  onContinue: () => void;
}) {
  const lines = useCart((s) => s.lines);
  const [slots, setSlots] = useState<SlotsResult | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getSlotsAction(mode).then((result) => {
      if (cancelled) return;
      setSlots(result);
      onSlotChange(result && slot && result.slots.includes(slot) ? slot : null);
    });
    return () => {
      cancelled = true;
    };
    // Reload slots when the mode changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const postal = normalizePostalCode(address.postalCode);
  useEffect(() => {
    if (mode !== "DELIVERY" || !postal) {
      onDeliveryChange(null);
      return;
    }
    let cancelled = false;
    quoteDeliveryAction(postal, lines).then((q) => {
      if (!cancelled) onDeliveryChange(q);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, postal, lines]);

  const deliveryReady =
    mode === "PICKUP" || (delivery?.ok === true && address.line1.trim() !== "" && address.city.trim() !== "");
  const canContinue = Boolean(slot) && deliveryReady && (mode === "PICKUP" || onlinePayment);

  return (
    <div className="space-y-8">
      <Segmented
        label="Mode de commande"
        value={mode}
        options={[
          { value: "PICKUP", label: "À emporter" },
          { value: "DELIVERY", label: "Livraison" },
        ]}
        onChange={onModeChange}
      />

      {mode === "DELIVERY" && !onlinePayment ? (
        <p className="rounded-2xl border border-line-2 bg-surface p-4 text-sm text-muted-2">
          La livraison se paie en ligne, et le paiement en ligne est indisponible pour le moment. Tu peux commander à emporter ou
          nous appeler au {SITE.phoneDisplay}.
        </p>
      ) : null}

      {mode === "DELIVERY" && onlinePayment ? (
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Adresse de livraison</h2>
          {account && account.addresses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {account.addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAddressChange({ line1: a.line1, line2: a.line2 ?? "", postalCode: a.postalCode, city: a.city })}
                  className="rounded-full border border-line-2 px-3 py-1.5 text-sm text-muted-2 hover:border-fg hover:text-fg"
                >
                  {a.label || a.line1}
                </button>
              ))}
            </div>
          ) : null}
          <Field label="Adresse">
            {(p) => (
              <Input {...p} autoComplete="address-line1" value={address.line1} onChange={(e) => onAddressChange({ ...address, line1: e.target.value })} />
            )}
          </Field>
          <Field label="Complément (étage, code…)">
            {(p) => (
              <Input {...p} autoComplete="address-line2" value={address.line2} onChange={(e) => onAddressChange({ ...address, line2: e.target.value })} />
            )}
          </Field>
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <Field label="Code postal" error={delivery && !delivery.ok ? delivery.message : null}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={address.postalCode}
                  onChange={(e) => onAddressChange({ ...address, postalCode: e.target.value })}
                />
              )}
            </Field>
            <Field label="Ville">
              {(p) => (
                <Input {...p} autoComplete="address-level2" value={address.city} onChange={(e) => onAddressChange({ ...address, city: e.target.value })} />
              )}
            </Field>
          </div>
          {delivery?.ok ? (
            <p className="text-sm text-ok">
              Zone livrée · frais {formatEuros(delivery.feeCents)} · minimum {formatEuros(delivery.minOrderCents)}
            </p>
          ) : null}
          {delivery && !delivery.ok ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onModeChange("PICKUP")}>
                Passer en retrait
              </Button>
              <a href={SITE.phoneHref} className={buttonClasses("ghost")}>
                Appeler
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      {mode === "PICKUP" || onlinePayment ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">
            {mode === "PICKUP" ? "Créneau de retrait" : "Heure de livraison"}
            {slots ? ` · ${slots.serviceLabel}` : ""}
          </h2>
          {slots === undefined ? (
            <p className="mt-4 text-sm text-muted">Chargement des créneaux…</p>
          ) : slots === null ? (
            <p className="mt-4 text-sm text-muted-2">
              Aucun créneau disponible dans les prochains jours. Appelle-nous au {SITE.phoneDisplay}.
            </p>
          ) : (
            <>
              <button
                type="button"
                aria-pressed={slot === slots.asap}
                onClick={() => onSlotChange(slots.asap, true)}
                className="mt-4 flex w-full items-center justify-between rounded-2xl border border-line-2 px-4 py-3.5 text-left transition aria-pressed:border-ember aria-pressed:bg-ember/10"
              >
                <span className="font-semibold">Dès que possible</span>
                <span className="text-sm text-muted-2">
                  {formatParisTime(new Date(slots.asap))} · ~{slots.minutesToAsap} min
                </span>
              </button>
              <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Choisir une heure">
                {slots.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={slot === s}
                    onClick={() => onSlotChange(s, false)}
                    className="rounded-xl border border-line-2 py-2.5 text-sm tabular-nums transition hover:border-muted aria-pressed:border-ember aria-pressed:bg-ember aria-pressed:font-bold aria-pressed:text-ember-ink"
                  >
                    {mode === "DELIVERY" ? "~" : ""}
                    {formatParisTime(new Date(s))}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      <Button size="lg" className="w-full" onClick={onContinue} disabled={!canContinue}>
        Continuer
      </Button>
    </div>
  );
}
