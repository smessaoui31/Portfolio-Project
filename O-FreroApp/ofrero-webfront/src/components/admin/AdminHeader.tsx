"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminHeader() {
  const { email } = useAuth();

  return (
    <header className="flex items-center justify-between gap-3">
      {/* Search (placeholder) */}
      <div className="flex-1">
        <div className="relative">
          <input
            placeholder="Rechercher (commandes, clients, produits…) — bientôt"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle theme — on branchera le vrai switch dark/light ensuite */}
        <button
          type="button"
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800/70"
          title="Basculer le thème (vient après)"
          onClick={() => alert("Le basculement de thème arrive juste après 😉")}
        >
          Thème
        </button>

        {/* Compte */}
        <Link
          href="/me"
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/70"
          title={email ?? undefined}
        >
          {email ?? "Compte"}
        </Link>
      </div>
    </header>
  );
}