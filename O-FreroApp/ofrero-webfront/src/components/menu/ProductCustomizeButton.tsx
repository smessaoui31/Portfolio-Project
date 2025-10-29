// src/components/menu/ProductCustomizeButton.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";

type CookingLevel = "NORMAL" | "WELL_DONE" | "EXTRA_CRISPY";

type ProductSupplement = {
  supplementId: string;
  name: string;
  priceCents: number; // déjà overridé côté API si besoin
};

async function fetchProductSupplements(productId: string): Promise<ProductSupplement[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5050";
  const res = await fetch(`${base}/products/${productId}/supplements`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default function ProductCustomizeButton({
  productId,
  priceCents,
  className = "",
}: {
  productId: string;
  priceCents: number;
  className?: string;
}) {
  const { add, loading } = useCart();

  // UI state
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [cooking, setCooking] = useState<CookingLevel>("NORMAL");
  const [supplements, setSupplements] = useState<ProductSupplement[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loadingSupp, setLoadingSupp] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingSupp(true);
      setErr(null);
      try {
        const list = await fetchProductSupplements(productId);
        setSupplements(list);
        // reset sélection
        const initial: Record<string, boolean> = {};
        list.forEach((s) => (initial[s.supplementId] = false));
        setChecked(initial);
      } catch (e: any) {
        setErr(e?.message || "Erreur de chargement des suppléments");
      } finally {
        setLoadingSupp(false);
      }
    })();
  }, [open, productId]);

  const total = useMemo(() => {
    const base = priceCents * qty;
    const extras = supplements.reduce((sum, s) => (checked[s.supplementId] ? sum + s.priceCents : sum), 0);
    return base + extras * qty; // suppléments comptés par unité
  }, [priceCents, qty, supplements, checked]);

  const supplementIds = useMemo(
    () => supplements.filter((s) => checked[s.supplementId]).map((s) => s.supplementId),
    [supplements, checked]
  );

  async function handleAdd() {
    await add(productId, qty, { cooking, supplementIds });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-full rounded-md bg-white text-black px-3 py-2 text-sm font-medium hover:opacity-90 ${className}`}
      >
        Personnaliser
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-xl">
            <div className="border-b border-neutral-800 px-5 py-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Personnaliser</h3>
              <button
                className="rounded-md px-2 py-1 text-neutral-400 hover:bg-neutral-800/60"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Quantité */}
              <div className="space-y-2">
                <div className="text-sm text-neutral-300">Quantité</div>
                <div className="inline-flex items-center rounded-md border border-neutral-800">
                  <button
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className={`px-3 py-1 text-sm ${
                      qty <= 1 ? "cursor-not-allowed text-neutral-600" : "text-neutral-200 hover:bg-neutral-800/60"
                    }`}
                  >
                    −
                  </button>
                  <span className="px-4 py-1 text-sm tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-800/60"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cuisson */}
              <div className="space-y-2">
                <div className="text-sm text-neutral-300">Cuisson</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["NORMAL", "WELL_DONE", "EXTRA_CRISPY"] as CookingLevel[]).map((c) => (
                    <label
                      key={c}
                      className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm transition ${
                        cooking === c
                          ? "border-white/30 bg-white/10"
                          : "border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cooking"
                        value={c}
                        checked={cooking === c}
                        onChange={() => setCooking(c)}
                        className="hidden"
                      />
                      {labelCooking(c)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Suppléments */}
              <div className="space-y-2">
                <div className="text-sm text-neutral-300">Suppléments</div>
                {loadingSupp ? (
                  <div className="text-sm text-neutral-400">Chargement…</div>
                ) : err ? (
                  <div className="text-sm text-red-300">{err}</div>
                ) : supplements.length === 0 ? (
                  <div className="text-sm text-neutral-500">Aucun supplément disponible.</div>
                ) : (
                  <ul className="space-y-2 max-h-44 overflow-auto pr-1">
                    {supplements.map((s) => (
                      <li key={s.supplementId} className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-white"
                            checked={!!checked[s.supplementId]}
                            onChange={(e) =>
                              setChecked((prev) => ({ ...prev, [s.supplementId]: e.target.checked }))
                            }
                          />
                          <span className="text-sm text-neutral-200">{s.name}</span>
                        </label>
                        <span className="text-sm text-neutral-300">+ {(s.priceCents / 100).toFixed(2)} €</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-800 px-5 py-4 flex items-center justify-between">
              <div className="text-sm text-neutral-400">
                Total : <span className="text-white font-semibold">{(total / 100).toFixed(2)} €</span>
              </div>
              <button
                disabled={loading}
                onClick={handleAdd}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  loading ? "bg-white/60 text-black/70 cursor-wait" : "bg-white text-black hover:opacity-90"
                }`}
              >
                {loading ? "Ajout…" : "Ajouter au panier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function labelCooking(c: CookingLevel) {
  switch (c) {
    case "WELL_DONE":
      return "Bien cuite";
    case "EXTRA_CRISPY":
      return "Extra croustillante";
    default:
      return "Normale";
  }
}