"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Sparkles, Settings2 } from "lucide-react";
import AddToCartButton from "@/components/theme/ui/AddToCartButton";
import ProductCustomizeButton from "@/components/menu/ProductCustomizeButton";
import type { Product } from "@/types";
import { useEffect, useState } from "react";

type ProductQuickViewProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  getProductImage: (p: Product) => string;
};

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  getProductImage,
}: ProductQuickViewProps) {
  if (!product) return null;

  const isPizza = (product.category?.name ?? "").toLowerCase() === "pizza";
  const [mouseY, setMouseY] = useState(0);
  const [showParticles, setShowParticles] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard navigation (ESC to close)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Mouse move parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMouseY(y);
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

  // Variants pour animations stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop avec blur progressif */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Modal container avec spring physics + swipe to close */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 150 || velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto md:w-full md:px-4"
          >
            <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl ring-1 ring-white/5"
            >
              {/* Close button avec animation */}
              <motion.button
                initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700/50 bg-neutral-900/90 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-neutral-800"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </motion.button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Image avec animation de reveal */}
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  className="relative aspect-square md:aspect-auto md:min-h-[400px] overflow-hidden bg-neutral-800/60"
                >
                  <motion.div
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ y: mouseY }}
                    className="h-full w-full"
                  >
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </motion.div>

                  {/* Prix avec animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-lg font-bold text-white shadow-xl backdrop-blur-md"
                  >
                    {(product.priceCents / 100).toFixed(2)} €
                  </motion.div>

                  {/* Gradient overlay subtil */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </motion.div>

                {/* Contenu avec stagger animations */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col p-4 sm:p-6 md:p-8"
                >
                  <div className="flex-1 space-y-4">
                    {/* Header avec badges */}
                    <motion.div variants={itemVariants}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {product.category && (
                            <div className="mb-2 inline-flex items-center rounded-lg border border-neutral-700/60 bg-neutral-800/60 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-neutral-300 backdrop-blur-sm">
                              {product.category.name}
                            </div>
                          )}
                          <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
                            {product.name}
                          </h2>
                        </div>
                        {product.isFeatured && (
                          <motion.div
                            initial={{ rotate: -10, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 400, damping: 15 }}
                            className="relative"
                            onHoverStart={() => setShowParticles(true)}
                            onHoverEnd={() => setShowParticles(false)}
                          >
                            <Sparkles className="h-6 w-6 text-emerald-400" />

                            {/* Particles effect */}
                            <AnimatePresence>
                              {showParticles && (
                                <>
                                  {[...Array(8)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                                      animate={{
                                        scale: [0, 1, 0],
                                        x: Math.cos((i * Math.PI * 2) / 8) * 30,
                                        y: Math.sin((i * Math.PI * 2) / 8) * 30,
                                        opacity: [1, 0.8, 0],
                                      }}
                                      exit={{ scale: 0, opacity: 0 }}
                                      transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeOut"
                                      }}
                                      className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400"
                                    />
                                  ))}
                                </>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Description */}
                    {product.description && (
                      <motion.p
                        variants={itemVariants}
                        className="text-sm leading-relaxed text-neutral-300 md:text-base"
                      >
                        {product.description}
                      </motion.p>
                    )}

                    {/* Badges informatifs */}
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
                      {product.isFeatured && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm">
                          <Sparkles className="h-4 w-4" />
                          Sélection du Chef
                        </span>
                      )}
                      {isPizza && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700/60 bg-neutral-800/60 px-3 py-1.5 text-sm text-neutral-400 backdrop-blur-sm">
                          <Settings2 className="h-4 w-4" />
                          Personnalisable
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {/* Actions avec stagger */}
                  <motion.div variants={itemVariants} className="space-y-2 pt-4 sm:space-y-3 sm:pt-6">
                    <AddToCartButton productId={product.id} />
                    {isPizza && (
                      <ProductCustomizeButton
                        productId={product.id}
                        priceCents={product.priceCents}
                      />
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
