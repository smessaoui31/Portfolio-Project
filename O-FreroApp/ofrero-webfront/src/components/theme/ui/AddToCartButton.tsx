// src/components/ui/AddToCartButton.tsx
"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import FlyingCartAnimation from "@/components/theme/ui/FlyingCartAnimation";
import ConfettiEffect from "@/components/theme/ui/ConfettiEffect";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  className?: string;
  productImage?: string;
  productName?: string;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  className = "",
  productImage,
  productName,
}: AddToCartButtonProps) {
  const { token } = useAuth();
  const { add, isGuest } = useCart();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Flying cart animation state
  const [flyingCartStart, setFlyingCartStart] = useState<{ x: number; y: number } | null>(null);
  const [flyingCartEnd, setFlyingCartEnd] = useState<{ x: number; y: number } | null>(null);

  // Confetti state
  const [confettiPosition, setConfettiPosition] = useState<{ x: number; y: number } | null>(null);

  async function handleAdd() {
    try {
      setLoading(true);

      // Get button position for animations
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Trigger confetti
        setConfettiPosition({ x: centerX, y: centerY });

        // Get cart icon position
        const cartIcon = document.querySelector('[aria-label*="Panier"]');
        if (cartIcon) {
          const cartRect = cartIcon.getBoundingClientRect();
          setFlyingCartStart({ x: centerX - 40, y: centerY - 40 });
          setFlyingCartEnd({
            x: cartRect.left + cartRect.width / 2 - 40,
            y: cartRect.top + cartRect.height / 2 - 40,
          });
        }
      }

      await add(productId, quantity, { productName });

      // Haptic feedback
      if ("vibrate" in navigator) {
        try { (navigator as any).vibrate?.(25); } catch {}
      }

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1500);

      // Custom toast with animation
      toast.success("Produit ajouté au panier", {
        description: `Quantité: ${quantity}`,
        duration: 2500,
        className: "!bg-emerald-500/10 !border-emerald-500/40 !text-emerald-200",
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
    <>
      <button
        ref={buttonRef}
        onClick={handleAdd}
        disabled={loading || isSuccess}
        aria-live="polite"
        className={`
          group w-full rounded-md py-2 text-sm font-medium
          transition-all duration-300 inline-flex items-center justify-center gap-2
          relative overflow-hidden
          ${isSuccess ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-neutral-200"}
          ${loading ? "opacity-90 cursor-wait" : ""}
          ${className}
        `}
      >
        {/* Pulse effect on isSuccess */}
        {isSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-md bg-emerald-400"
          />
        )}

        <span className="relative inline-flex items-center justify-center w-5">
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.2 } }}
                className="inline-flex"
              >
                <Loader2 className="h-5 w-5" />
              </motion.span>
            ) : isSuccess ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
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
          {isSuccess ? (
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

      {/* Flying cart animation */}
      <FlyingCartAnimation
        startPosition={flyingCartStart}
        endPosition={flyingCartEnd}
        productImage={productImage}
        onComplete={() => {
          setFlyingCartStart(null);
          setFlyingCartEnd(null);
        }}
      />

      {/* Confetti effect */}
      <ConfettiEffect
        position={confettiPosition}
        onComplete={() => setConfettiPosition(null)}
      />
    </>
  );
}
