"use client";

import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/menu/ProductImage";
import { QuantityStepper } from "@/components/menu/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { COOKING_LABELS } from "@/domain/types";
import { formatEuros } from "@/lib/money";
import { StampHint } from "@/components/loyalty/StampHint";
import { cartCount, useCart } from "./cart-store";

export function CartSheet() {
  const router = useRouter();
  const { lines, open, quote, quoteError, setOpen, setQuantity, remove } = useCart();
  const count = cartCount(lines);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Ton panier"
      description={count > 0 ? `${count} article${count > 1 ? "s" : ""}` : "Il est vide pour l'instant."}
      footer={
        count > 0 ? (
          <div className="space-y-3">
            {quoteError ? <p className="text-sm text-danger">{quoteError}</p> : null}
            <div className="flex items-baseline justify-between text-sm text-muted-2">
              <span>Sous-total</span>
              <span className="text-lg font-semibold text-fg tabular-nums">{quote ? formatEuros(quote.subtotalCents) : "…"}</span>
            </div>
            <StampHint mode={null} />
            <Button size="lg" className="w-full" onClick={() => go("/commande")} disabled={Boolean(quoteError) || !quote}>
              Continuer
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => go("/carte")}>
              Ajouter autre chose
            </Button>
          </div>
        ) : (
          <Button size="lg" className="w-full" onClick={() => go("/carte")}>
            Voir la carte
          </Button>
        )
      }
    >
      {count === 0 ? (
        <p className="py-10 text-center text-muted-2">Choisis une pizza, elle sort du four en 15 minutes.</p>
      ) : (
        <ul className="divide-y divide-line">
          {lines.map((line, index) => (
            <li key={`${line.productId}-${index}`} className="flex gap-3 py-4">
              <ProductImage src={line.imageUrl} alt="" size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{line.name}</p>
                  <p className="font-semibold tabular-nums">
                    {quote?.lines[index] ? formatEuros(quote.lines[index].lineTotalCents) : ""}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {[
                    line.cooking !== "NORMAL" ? COOKING_LABELS[line.cooking] : null,
                    ...(line.choiceNames ?? []),
                    ...line.supplementNames.map((n) => `+ ${n}`),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <QuantityStepper label={`Quantité de ${line.name}`} value={line.quantity} onChange={(q) => setQuantity(index, q)} min={1} />
                  <button type="button" onClick={() => remove(index)} className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline">
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
