// src/app/checkout/failed/page.tsx
import Link from "next/link";

export default function CheckoutFailed() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-white">Paiement refusé ❌</h1>
      <p className="mt-2 text-neutral-400">
        Nous n’avons pas pu finaliser votre paiement. Réessayez ou utilisez un autre moyen.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/checkout"
          className="rounded-md border border-neutral-200 bg-white text-black px-4 py-2 text-sm"
        >
          Réessayer
        </Link>
        <Link
          href="/cart"
          className="rounded-md border border-neutral-800 bg-neutral-900 text-white px-4 py-2 text-sm"
        >
          Retour au panier
        </Link>
      </div>
    </main>
  );
}