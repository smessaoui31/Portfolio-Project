// src/components/AddToCartButton.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";

export default function AddToCartButton({ productId }: { productId: string }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!token) {
      alert("Connecte-toi pour ajouter au panier.");
      return;
    }
    try {
      setLoading(true);
      await apiClient("/cart/items", {
        method: "POST",
        token,
        body: { productId, quantity: 1 },
      });
    } catch (e: any) {
      alert(e.message ?? "Erreur ajout panier");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={add}
      disabled={loading}
      className="mt-2 w-full rounded-lg bg-white text-black py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Ajout..." : "Ajouter au panier"}
    </button>
  );
}