"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm rounded-md transition
        ${active
          ? "text-white bg-neutral-800"
          : "text-neutral-300 hover:text-white hover:bg-neutral-800/60"
        }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { token, role, email, logout } = useAuth();

  // ---- Glow qui suit la souris (variables CSS --x / --y) ----
  const [pos, setPos] = useState({ x: 50, y: 50 });
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPos({ x, y });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-black/70 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-neutral-800 text-lg">🍕</div>
          <span className="text-white font-semibold tracking-tight">
            O’Frero Pizza
          </span>
        </Link>

        {/* Middle: links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/" label="Menu" />
          <NavLink href="/about" label="À propos" />
          <NavLink href="/contact" label="Contact" />
        </div>

        {/* Right: auth actions (avec glow/shine) */}
        <div
          className="flex items-center gap-3"
          onMouseMove={onMove}
          style={{ ["--x" as any]: `${pos.x}%`, ["--y" as any]: `${pos.y}%` }}
        >
          {token ? (
            <>
              <span className="hidden sm:inline text-neutral-400 text-sm">
                {email}
              </span>
              {role === "ADMIN" && (
                <span className="text-xs rounded-full px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300">
                  Admin
                </span>
              )}

              {/* Déconnexion — dark, glow + shine */}
              <button
                onClick={logout}
                className="
                  group relative inline-flex items-center justify-center
                  rounded-md border border-neutral-700 bg-neutral-900/70
                  px-4 py-1.5 text-sm font-medium text-white
                  shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]
                  transition-all duration-300
                  hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
                  focus:outline-none focus:ring-2 focus:ring-white/15
                  overflow-hidden
                "
              >
                {/* glow radial */}
                <span
                  className="
                    pointer-events-none absolute inset-0 -z-10
                    opacity-0 transition-opacity duration-300
                    group-hover:opacity-100
                    before:absolute before:inset-0 before:-z-10
                    before:bg-[radial-gradient(200px_120px_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.12),transparent_60%)]
                  "
                />
                {/* shine */}
                <span
                  className="
                    pointer-events-none absolute inset-y-0 -left-20 w-16
                    bg-gradient-to-r from-white/0 via-white/30 to-white/0
                    opacity-0 group-hover:opacity-100
                    [animation:btn-shine_900ms_ease]
                  "
                />
                Se déconnecter
              </button>
            </>
          ) : (
            // Connexion — version claire
            <Link
              href="/login"
              className="
                group relative inline-flex items-center justify-center
                rounded-md border border-neutral-200 bg-white
                px-4 py-1.5 text-sm font-medium text-black
                shadow-sm transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]
                active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-black/15
                overflow-hidden
              "
            >
              <span
                className="
                  pointer-events-none absolute inset-0 -z-10
                  opacity-0 transition-opacity duration-300
                  group-hover:opacity-100
                  before:absolute before:inset-0 before:-z-10
                  before:bg-[radial-gradient(200px_120px_at_var(--x,50%)_var(--y,50%),rgba(0,0,0,0.07),transparent_60%)]
                "
              />
              <span
                className="
                  pointer-events-none absolute inset-y-0 -left-20 w-16
                  bg-gradient-to-r from-black/0 via-black/20 to-black/0
                  opacity-0 group-hover:opacity-100
                  [animation:btn-shine_900ms_ease]
                "
              />
              Se connecter
            </Link>
          )}

          {/* Panier (placeholder) */}
          <Link
            href="/cart"
            className="relative rounded-md border border-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-800/60"
          >
            Panier
            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/10 px-1 text-xs text-white">
              0
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="ml-2 rounded-md p-2 text-neutral-300 hover:bg-neutral-800/60 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          ☰
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-neutral-800/80 bg-black/90 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink href="/" label="Menu" />
            <NavLink href="/about" label="À propos" />
            <NavLink href="/contact" label="Contact" />
            {token ? (
              <button
                onClick={logout}
                className="mt-2 text-left text-neutral-300 hover:text-white transition"
              >
                Se déconnecter
              </button>
            ) : (
              <Link
                href="/login"
                className="mt-2 text-neutral-300 hover:text-white transition"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}