// src/app/checkout/failed/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

export default function CheckoutFailed() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-950/30 p-8 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
          <XCircle className="h-7 w-7 text-rose-400" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-white">Paiement refusé</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Nous n'avons pas pu finaliser votre paiement. Réessayez ou utilisez un autre moyen.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/checkout"
            className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-black hover:opacity-90"
          >
            Réessayer
          </Link>
          <Link
            href="/cart"
            className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800/60"
          >
            Retour au panier
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
