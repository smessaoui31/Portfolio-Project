// src/app/checkout/success/page.tsx
import Link from "next/link";

export default function CheckoutSuccess() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-white">🎉 Paiement réussi</h1>
      <p className="mt-2 text-neutral-400">
        Merci pour votre commande ! Un email de confirmation vous sera envoyé.
      </p>
      <div className="mt-6">
        <Link
          href="/menu"
          className="rounded-md border border-neutral-200 bg-white text-black px-4 py-2 text-sm"
        >
          Retour au menu
        </Link>
      </div>
    </main>
  );
}