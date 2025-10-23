"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/admin", label: "Aperçu" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/users", label: "Utilisateurs" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { email, logout } = useAuth();

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="border-r border-neutral-800/80 bg-neutral-950">
        <div className="px-4 py-4">
          <Link href="/" className="block text-lg font-semibold text-white">
            O’Frero Admin
          </Link>
          <p className="mt-1 text-xs text-neutral-400">
            Connecté en tant que <span className="text-neutral-300">{email}</span>
          </p>
        </div>

        <nav className="mt-4 space-y-1 px-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm transition
                  ${active ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800/60 hover:text-white"}
                `}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <button
            onClick={logout}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900/70 px-3 py-2 text-sm text-white hover:bg-neutral-800 transition"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        {/* Topbar simple */}
        <div className="sticky top-16 z-10 border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur">
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
            <div className="text-sm text-neutral-400">
              Tableau de bord — administration
            </div>
            <Link
              href="/"
              className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800/60"
            >
              Retour au site
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </div>
    </div>
  );
}