// src/components/ui/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

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
  const { count } = useCart();

  // Glow qui suit la souris (variables CSS --x / --y)
  const [pos, setPos] = useState({ x: 50, y: 50 });
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPos({ x, y });
  }

  // Badge du panier : petite anim à chaque changement de count
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!badgeRef.current) return;
    badgeRef.current.classList.remove("badge-bump");
    // force reflow pour relancer l’animation
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    badgeRef.current.offsetWidth;
    badgeRef.current.classList.add("badge-bump");
  }, [count]);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-black/70 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo → accueil */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform hover:scale-[1.03] active:scale-100"
        >
          <div
            className="relative h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16
                       rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950
                       p-2 shadow-[0_0_20px_rgba(255,255,255,0.05)]
                       hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]
                       transition-all duration-300 ease-out"
          >
            <Image
              src="/ofrero-pizza-logo.png"
              alt="O’Frero Pizza"
              fill
              className="object-contain"
              sizes="(min-width:1024px) 4rem, (min-width:768px) 3.5rem, 3rem"
              priority
            />
          </div>

          <span
            className="text-lg md:text-xl font-semibold tracking-tight text-white
                       bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent"
          >
            O’Frero Pizza
          </span>
        </Link>

        {/* Middle: liens */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/" label="Accueil" />
          <NavLink href="/menu" label="Menu" />
          <NavLink href="/about" label="À propos" />
          <NavLink href="/contact" label="Contact" />
        </div>

        {/* Right: auth + commandes + panier */}
        <div
          className="relative flex items-center gap-3"
          onMouseMove={onMove}
          style={{ ["--x" as any]: `${pos.x}%`, ["--y" as any]: `${pos.y}%` }}
        >
          {token ? (
            <>
              {/* Mes commandes (visible si connecté) */}
              <Link
                href="/orders"
                className="rounded-md border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-sm text-white transition-all hover:bg-neutral-800 hover:-translate-y-0.5"
                title="Voir mes commandes"
              >
                Mes commandes
              </Link>

              <span className="hidden sm:inline text-neutral-400 text-sm" title={email ?? undefined}>
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
                  aria-hidden
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
                  aria-hidden
                  className="
                    pointer-events-none absolute inset-y-0 -left-20 w-16
                    bg-gradient-to-r from-white/0 via-white/30 to-white/0
                    opacity-0 group-hover:opacity-100
                    [animation:btn-shine_1000ms_ease]
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
                aria-hidden
                className="
                  pointer-events-none absolute inset-0 -z-10
                  opacity-0 transition-opacity duration-300
                  group-hover:opacity-100
                  before:absolute before:inset-0 before:-z-10
                  before:bg-[radial-gradient(200px_120px_at_var(--x,50%)_var(--y,50%),rgba(0,0,0,0.07),transparent_60%)]
                "
              />
              <span
                aria-hidden
                className="
                  pointer-events-none absolute inset-y-0 -left-20 w-16
                  bg-gradient-to-r from-black/0 via-black/20 to-black/0
                  opacity-0 group-hover:opacity-100
                  [animation:btn-shine_1000ms_ease]
                "
              />
              Se connecter
            </Link>
          )}

          {/* Panier (avec badge animé) */}
          <Link
            href="/cart"
            className="relative rounded-md border border-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-800/60"
            aria-label={`Ouvrir le panier (${count} article${count > 1 ? "s" : ""})`}
          >
            Panier
            <span className="sr-only"> — {count} article{count > 1 ? "s" : ""}</span>
            <span
              ref={badgeRef}
              className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/10 px-1 text-xs text-white"
            >
              {count}
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="ml-2 rounded-md p-2 text-neutral-300 hover:bg-neutral-800/60 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
        >
          ☰
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-neutral-800/80 bg-black/90 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink href="/" label="Accueil" />
            <NavLink href="/menu" label="Menu" />
            <NavLink href="/about" label="À propos" />
            <NavLink href="/contact" label="Contact" />

            {/* Mes commandes (mobile, seulement connecté) */}
            {token && (
              <Link
                href="/orders"
                className="mt-2 inline-flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/60"
              >
                <span>Mes commandes</span>
              </Link>
            )}

            {/* Panier + compteur aussi dans le menu mobile */}
            <Link
              href="/cart"
              className="mt-2 inline-flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/60"
            >
              <span>Panier</span>
              <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/10 px-1 text-xs text-white">
                {count}
              </span>
            </Link>

            {token ? (
              <button
                onClick={logout}
                className="mt-3 text-left rounded-md px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition"
              >
                Se déconnecter
              </button>
            ) : (
              <Link
                href="/login"
                className="mt-3 rounded-md px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition"
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