"use client";

import { useEffect, useState } from "react";
import { quoteCartAction, type QuoteResult } from "@/app/actions/cart";
import { useCart } from "@/components/cart/cart-store";
import { StampHint } from "@/components/loyalty/StampHint";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { canRedeem } from "@/domain/loyalty";
import { COOKING_LABELS, type FulfillmentMode, type PaymentMethod } from "@/domain/types";
import { formatEuros } from "@/lib/money";
import type { CheckoutAccount, CustomerDraft } from "./types";

export function DetailsStep({
  mode,
  summary,
  customer,
  onCustomerChange,
  payment,
  onPaymentChange,
  rewardLineIndex,
  onRewardChange,
  deliveryFeeCents,
  account,
  onlinePayment,
  placing,
  error,
  onBack,
  onSubmit,
}: {
  mode: FulfillmentMode;
  summary: string;
  customer: CustomerDraft;
  onCustomerChange: (customer: CustomerDraft) => void;
  payment: PaymentMethod;
  onPaymentChange: (payment: PaymentMethod) => void;
  rewardLineIndex: number | undefined;
  onRewardChange: (index: number | undefined) => void;
  deliveryFeeCents: number;
  account: CheckoutAccount | null;
  onlinePayment: boolean;
  placing: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const lines = useCart((s) => s.lines);
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    quoteCartAction(lines, rewardLineIndex).then((q) => {
      if (!cancelled) setQuote(q);
    });
    return () => {
      cancelled = true;
    };
  }, [lines, rewardLineIndex]);

  const priced = quote?.ok ? quote.quote : null;
  const total = priced ? priced.subtotalCents - priced.rewardCents + deliveryFeeCents : null;
  const rewardAvailable = Boolean(account && canRedeem(account.balance, account.stampsForReward));
  const pizzaLines = priced ? priced.lines.map((l, i) => ({ ...l, index: i })).filter((l) => l.isPizza) : [];
  const valid =
    customer.firstName.trim() !== "" && customer.phone.replace(/\D/g, "").length >= 10 && /\S+@\S+\.\S+/.test(customer.email);

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <button type="button" onClick={onBack} className="text-sm text-muted-2 underline-offset-4 hover:text-fg hover:underline">
        ← {summary}
      </button>

      <section>
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Ta commande</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {lines.map((line, i) => (
            <li key={`${line.productId}-${i}`} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="font-semibold">
                  {line.quantity} × {line.name}
                </span>
                <span className="block text-xs text-muted">
                  {[COOKING_LABELS[line.cooking], ...(line.choiceNames ?? []), ...line.supplementNames.map((n) => `+ ${n}`)].join(" · ")}
                </span>
              </span>
              <span className="font-semibold tabular-nums">{priced?.lines[i] ? formatEuros(priced.lines[i].lineTotalCents) : "…"}</span>
            </li>
          ))}
        </ul>
        {quote && !quote.ok ? <p className="mt-3 text-sm text-danger">{quote.message}</p> : null}
      </section>

      <StampHint
        mode={mode}
        loyalty={
          account
            ? { signedIn: true, balance: account.balance, stampsForReward: account.stampsForReward }
            : { signedIn: false, balance: 0, stampsForReward: 10 }
        }
      />

      {mode === "PICKUP" && rewardAvailable && pizzaLines.length > 0 ? (
        <section className="rounded-2xl bg-fg p-4 text-ember-ink">
          <label className="flex items-center gap-3 font-semibold">
            <input
              type="checkbox"
              className="size-4 accent-[var(--ember)]"
              checked={rewardLineIndex !== undefined}
              onChange={(e) => onRewardChange(e.target.checked ? pizzaLines[0].index : undefined)}
            />
            Utiliser ma pizza offerte
          </label>
          {rewardLineIndex !== undefined && pizzaLines.length > 1 ? (
            <select
              className="mt-3 w-full rounded-xl border border-[#b9a58f] bg-transparent px-3 py-2 text-sm"
              value={rewardLineIndex}
              onChange={(e) => onRewardChange(Number(e.target.value))}
              aria-label="Pizza offerte"
            >
              {pizzaLines.map((l) => (
                <option key={l.index} value={l.index}>
                  {l.name}
                </option>
              ))}
            </select>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Tes coordonnées</h2>
        <Field label="Prénom">
          {(p) => (
            <Input {...p} autoComplete="given-name" value={customer.firstName} onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })} required />
          )}
        </Field>
        <Field label="Téléphone" hint="Pour te prévenir si besoin.">
          {(p) => (
            <Input {...p} type="tel" autoComplete="tel" value={customer.phone} onChange={(e) => onCustomerChange({ ...customer, phone: e.target.value })} required />
          )}
        </Field>
        <Field label="E-mail" hint="Tu recevras la confirmation et le lien de suivi.">
          {(p) => (
            <Input {...p} type="email" autoComplete="email" value={customer.email} onChange={(e) => onCustomerChange({ ...customer, email: e.target.value })} required />
          )}
        </Field>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Paiement</h2>
        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Moyen de paiement">
          {onlinePayment ? (
            <PaymentOption checked={payment === "ONLINE"} onSelect={() => onPaymentChange("ONLINE")} title="Payer en ligne" detail="Carte, Apple Pay, Google Pay" />
          ) : null}
          {mode === "PICKUP" ? (
            <PaymentOption checked={payment === "AT_PICKUP"} onSelect={() => onPaymentChange("AT_PICKUP")} title="Payer au retrait" detail="Sur place, au moment de récupérer ta commande" />
          ) : null}
        </div>
      </section>

      <section className="space-y-2 border-t border-line pt-5 text-sm">
        {priced ? (
          <>
            <Row label="Sous-total" value={formatEuros(priced.subtotalCents)} />
            {priced.rewardCents > 0 ? <Row label="Pizza offerte" value={`− ${formatEuros(priced.rewardCents)}`} /> : null}
            {mode === "DELIVERY" ? <Row label="Livraison" value={formatEuros(deliveryFeeCents)} /> : null}
          </>
        ) : null}
        <div className="flex items-baseline justify-between pt-2">
          <span className="font-semibold">Total</span>
          <span className="font-display text-4xl tabular-nums">{total === null ? "…" : formatEuros(total)}</span>
        </div>
      </section>

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full justify-between" disabled={!valid || !priced || placing}>
        <span>{placing ? "Envoi…" : payment === "ONLINE" ? "Payer" : "Valider la commande"}</span>
        <span className="tabular-nums">{total === null ? "" : formatEuros(total)}</span>
      </Button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-2">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function PaymentOption({ checked, onSelect, title, detail }: { checked: boolean; onSelect: () => void; title: string; detail: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-2xl border border-line-2 px-4 py-3 text-left transition aria-checked:border-ember"
    >
      <span className={`size-4 shrink-0 rounded-full border-2 ${checked ? "border-[5px] border-ember" : "border-muted"}`} aria-hidden />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
    </button>
  );
}
