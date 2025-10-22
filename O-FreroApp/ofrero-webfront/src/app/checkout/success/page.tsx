"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const sp = useSearchParams();
  const orderId = sp.get("orderId");

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-semibold text-white">Paiement réussi</h1>
      <p className="mt-2 text-neutral-400">
        Merci pour votre commande{orderId ? ` #${orderId}` : ""} !
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5"
      >
        Retour au menu
      </Link>
    </div>
  );
}