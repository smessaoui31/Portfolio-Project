"use client"; // ✅ obligatoire

import { motion, useReducedMotion } from "framer-motion";
import AddToCartButton from "../ui/AddToCartButton";
import type { Variants } from "framer-motion"; 

type Category = { id: string; name: string } | null;
type Product = {
  id: string;
  name: string;
  priceCents: number;
  description?: string | null;
  category?: Category;
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ProductsGrid({ products }: { products: Product[] }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div // ✅ pas <div>
      variants={container} // ✅ reconnu
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {products.map((p) => (
        <motion.article // ✅ pas <article>
          key={p.id}
          variants={prefersReducedMotion ? undefined : card} // ✅ OK
          whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }}
          className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition"
        >
          <div className="aspect-square bg-neutral-800/60 grid place-items-center text-6xl">🍕</div>
          <div className="p-5 space-y-2">
            {/* ... */}
            <AddToCartButton productId={p.id} />
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}