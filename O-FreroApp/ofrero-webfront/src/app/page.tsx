// src/app/page.tsx
import { Suspense } from "react";
import MenuContent from "./menu-content";

export const revalidate = 0; // pas de cache (force un fetch à chaque fois)

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 min-h-screen bg-neutral-950 text-neutral-100">
      {/* --- Header --- */}
      <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            🍕 O’Frero Pizza
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Des pizzas maison, boissons et desserts — en noir & blanc.
          </p>
        </div>
        <div className="text-neutral-500 text-sm mt-4 md:mt-0">
          Fraîcheur, qualité et passion depuis 2025.
        </div>
      </header>

      {/* --- Contenu principal --- */}
      <Suspense fallback={<div className="text-zinc-400">Chargement…</div>}>
        <MenuContent />
      </Suspense>

      {/* --- Footer --- */}
      <footer className="mt-16 py-8 text-center text-neutral-500 text-sm border-t border-neutral-800">
        © 2025 O’Frero Pizza — Fait avec ❤️ et Next.js
      </footer>
    </main>
  );
}