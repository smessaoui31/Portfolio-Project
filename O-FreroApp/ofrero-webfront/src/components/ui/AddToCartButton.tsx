"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiAuthed } from "@/lib/api";

type Props = {
  productId: string;
};

export default function AddToCartButton({ productId }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleAdd() {
    setErr(null);
    setOk(false);

    if (!token) {
      setErr("Veuillez vous connecter pour ajouter au panier.");
      return;
    }

    try {
      setLoading(true);
      await apiAuthed("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        disabled={loading}
        onClick={handleAdd}
        className="w-full rounded-md bg-white text-black font-medium py-2 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Ajout..." : "Ajouter au panier"}
      </button>
      {ok && <span className="text-xs text-emerald-400">Ajouté ✅</span>}
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}