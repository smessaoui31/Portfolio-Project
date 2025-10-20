"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-md transition
        ${active ? "text-white bg-neutral-800" : "text-neutral-300 hover:text-white hover:bg-neutral-800/60"}`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { token, role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-black/70 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-neutral-800 text-lg">🍕</div>
          <span className="text-white font-semibold tracking-tight">O’Frero Pizza</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/" label="Menu" />
          <NavLink href="/about" label="À propos" />
          <NavLink href="/contact" label="Contact" />
        </div>

        {/* Right side: admin badge + auth + cart */}
        <div className="flex items-center gap-2">
          {role === "ADMIN" && (
            <span className="hidden md:inline text-xs rounded-full px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300">
              Admin
            </span>
          )}

          {/* Auth actions (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {token ? (
              <button
                onClick={logout}
                className="text-sm rounded-md px-3 py-2 bg-white text-black hover:opacity-90"
              >
                Se déconnecter
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm rounded-md px-3 py-2 bg-white text-black hover:opacity-90"
              >
                Se connecter
              </Link>
            )}
          </div>

          {/* Cart (simple placeholder pour l’instant) */}
          <Link
            href="/cart"
            className="relative rounded-md border border-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-800/60"
          >
            Panier
            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/10 px-1 text-xs text-white">
              0
            </span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="ml-2 rounded-md p-2 text-neutral-300 hover:bg-neutral-800/60 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-neutral-800/80 bg-black/90 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink href="/" label="Menu" onClick={() => setOpen(false)} />
            <NavLink href="/about" label="À propos" onClick={() => setOpen(false)} />
            <NavLink href="/contact" label="Contact" onClick={() => setOpen(false)} />

            {/* Auth actions (mobile) */}
            <div className="mt-2 flex items-center gap-2">
              {role === "ADMIN" && (
                <span className="text-xs rounded-full px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300">
                  Admin
                </span>
              )}
              {token ? (
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="text-sm rounded-md px-3 py-2 bg-white text-black hover:opacity-90"
                >
                  Se déconnecter
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm rounded-md px-3 py-2 bg-white text-black hover:opacity-90"
                >
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}