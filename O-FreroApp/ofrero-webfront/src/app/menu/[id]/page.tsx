// src/components/product/AddToCartOptions.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Supplement = { id: string; name: string; priceCents: number; isAvailable: boolean };

export default function AddToCartOptions({ productId }: { productId: string }) {
  const { token } = useAuth();
  const [cooking, setCooking] = useState<"NORMAL"|"WELL_DONE"|"EXTRA_CRISPY">("NORMAL");
  const [supps, setSupps] = useState<Supplement[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // récupère les suppléments disponibles pour ce produit
        const data = await api<Supplement[]>(`/supplements/product/${productId}`);
        setSupps(data);
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, [productId]);

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function addToCart() {
    setError("");
    try {
      const supplementIds = Object.entries(selected).filter(([,v]) => v).map(([id]) => id);
      await apiAuthed("/cart/add", {
        method: "POST",
        body: JSON.stringify({
          productId,
          quantity: qty,
          cooking,
          supplementIds,
        }),
      });
      // tu peux déclencher un toast “ajouté !”
    } catch (e: any) {
      setError(e?.message || "Erreur d’ajout au panier");
    }
  }

  const extraCents = supps
    .filter(s => selected[s.id])
    .reduce((sum, s) => sum + s.priceCents, 0) * qty;

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div>
        <label className="text-sm text-neutral-300">Cuisson</label>
        <select
          value={cooking}
          onChange={(e) => setCooking(e.target.value as any)}
          className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-700"
        >
          <option value="NORMAL">Normale</option>
          <option value="WELL_DONE">Bien cuite</option>
          <option value="EXTRA_CRISPY">Très cuite</option>
        </select>
      </div>

      <div>
        <div className="text-sm text-neutral-300 mb-2">Suppléments</div>
        <div className="space-y-2">
          {supps.map((s) => (
            <label key={s.id} className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!selected[s.id]}
                  onChange={() => toggle(s.id)}
                  className="accent-white"
                />
                <span className="text-white text-sm">{s.name}</span>
              </div>
              <span className="text-neutral-300 text-sm">+ {(s.priceCents/100).toFixed(2)} €</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQty((q) => Math.max(1, q-1))}
            className="rounded-md border border-neutral-800 px-3 py-2 text-white hover:bg-neutral-800/70"
          >−</button>
          <span className="min-w-[2ch] text-center text-white">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(20, q+1))}
            className="rounded-md border border-neutral-800 px-3 py-2 text-white hover:bg-neutral-800/70"
          >+</button>
        </div>

        <div className="text-sm text-neutral-300">
          Suppléments: <span className="text-white font-medium">+ {(extraCents/100).toFixed(2)} €</span>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <button
        onClick={addToCart}
        disabled={!token}
        className={`w-full rounded-md px-4 py-2 text-sm font-medium transition ${token ? "bg-white text-black hover:opacity-90" : "bg-white/60 text-black/70 cursor-not-allowed"}`}
      >
        Ajouter au panier
      </button>
    </div>
  );
}