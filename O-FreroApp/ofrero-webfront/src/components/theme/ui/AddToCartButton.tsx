// src/components/ui/AddToCartButton.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

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
  const { add } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleAdd() {
    if (!token) {
      toast.error("Veuillez vous connecter pour ajouter au panier", {
        duration: 3000,
      });
      return;
    }
    try {
      setLoading(true);
      await add(productId, quantity);

      if ("vibrate" in navigator) {
        try { (navigator as any).vibrate?.(25); } catch {}
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);

      toast.success("Produit ajouté au panier", {
        description: `Quantité: ${quantity}`,
        duration: 2000,
      });
    } catch (e: any) {
      console.error("Erreur ajout panier:", e);
      const errorMsg = e?.message || "Erreur lors de l'ajout au panier.";
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        toast.error("Session expirée", {
          description: "Veuillez vous reconnecter",
          duration: 4000,
        });
      } else {
        toast.error("Erreur", {
          description: errorMsg,
          duration: 3000,
        });
      }
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