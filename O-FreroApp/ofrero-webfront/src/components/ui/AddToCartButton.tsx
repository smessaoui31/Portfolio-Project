"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  className?: string;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  className = "",
}: AddToCartButtonProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleAdd() {
    if (!token) {
      alert("Veuillez vous connecter pour ajouter au panier.");
      return;
    }
    try {
      setLoading(true);
      await apiAuthed("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });

      // mini vibration (si supporté)
      if ("vibrate" in navigator) {
        try { (navigator as any).vibrate?.(20); } catch {}
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l’ajout au panier.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      aria-live="polite"
      className={`
        group w-full rounded-md py-2 text-sm font-medium
        transition-all duration-300 inline-flex items-center justify-center gap-2
        ${success ? "bg-green-600 text-white" : "bg-white text-black hover:bg-neutral-200"}
        ${loading ? "opacity-70 cursor-wait" : ""}
        ${className}
      `}
    >
      {/* zone icône fixe pour éviter les décalages/chevauchements */}
      <span className="inline-flex items-center justify-center w-5">
        <AnimatePresence mode="wait" initial={false}>
          {success ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="inline-flex"
            >
              <Check className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="cart"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="inline-flex"
            >
              <ShoppingCart className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* texte animé */}
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.span
            key="txt-success"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Ajouté !
          </motion.span>
        ) : (
          <motion.span
            key="txt-default"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? "Ajout..." : "Ajouter au panier"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}