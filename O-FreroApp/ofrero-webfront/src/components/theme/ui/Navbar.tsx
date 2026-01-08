"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/theme/ui/button"; // Shadcn UI
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
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
  const cartCtx = useCart();

  const count =
    typeof (cartCtx as any)?.count === "number"
      ? (cartCtx as any).count
      : Array.isArray((cartCtx as any)?.items)
        ? (cartCtx as any).items.reduce(
            (n: number, it: any) => n + (it?.quantity ?? 1),
            0
          )
        : 0;
  const safeCount = Number.isFinite(count as any) ? (count as number) : 0;
  const plural = safeCount > 1 ? "s" : "";

  const badgeRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!badgeRef.current) return;
    badgeRef.current.classList.remove("badge-bump");
    badgeRef.current.offsetWidth;
    badgeRef.current.classList.add("badge-bump");
  }, [safeCount]);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-black/70 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 w-full">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform hover:scale-[1.03] active:scale-100 min-w-0"
        >
          <div className="relative h-12 w-12 rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-2">
            <Image
              src="/ofrero-pizza-logo.png"
              alt="O’Frero Pizza"
              fill
              className="object-contain"
              sizes="(min-width:1024px) 4rem, (min-width:768px) 3.5rem, 3rem"
              priority
            />
          </div>
          <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent truncate">
            O’Frero Pizza
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/" label="Accueil" />
          <NavLink href="/menu" label="La Carte" />
          <NavLink href="/about" label="À propos" />
          <NavLink href="/contact" label="Contact" />
        </div>

        {/* Right zone */}
        <div className="flex items-center gap-3">
          {token ? (
            <>
              {/* Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/orders"
                  className="rounded-md border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 transition"
                >
                  Mes commandes
                </Link>

                {role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/15 transition"
                  >
                    Admin
                  </Link>
                )}

                <Button
                  onClick={logout}
                  variant="ghost"
                  className="text-sm text-white border border-neutral-700 hover:bg-neutral-800"
                >
                  Se déconnecter
                </Button>
              </div>

              {/* Déconnexion — mobile (icône 🔓) */}
              <Button
                onClick={logout}
                size="icon"
                variant="ghost"
                className="md:hidden border border-neutral-700 text-white hover:bg-neutral-800 hover:text-red-400 transition transform active:scale-95"
                title="Se déconnecter"
              >
                <Unlock className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              {/* Connexion — desktop */}
              <Button
                asChild
                variant="outline"
                className="hidden md:inline-flex border-neutral-200 bg-white text-black hover:bg-neutral-100 text-sm"
              >
                <Link href="/login">Se connecter</Link>
              </Button>

              {/* Connexion — mobile (icône 🔒) */}
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="md:hidden border border-neutral-700 text-white hover:bg-neutral-800 hover:text-emerald-400 transition transform active:scale-95"
                title="Se connecter"
              >
                <Link href="/login">
                  <Lock className="h-5 w-5" />
                </Link>
              </Button>
            </>
          )}

          {/* Panier */}
          <Link
            href="/cart"
            className="relative rounded-md border border-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-800/60"
            aria-label={`Panier (${safeCount} article${plural})`}
          >
            Panier
            <span
              ref={badgeRef}
              className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/10 px-1 text-xs text-white"
            >
              {safeCount}
            </span>
          </Link>

          {/* Menu mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 md:hidden text-neutral-300 hover:bg-neutral-800/60"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-controls="mobile-drawer"
            aria-expanded={open}
          >
            ☰
          </Button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        id="mobile-drawer"
        className={`md:hidden border-t border-neutral-800/80 bg-black/90 px-4 transition-[max-height,opacity] duration-200 overflow-hidden ${open ? "max-h-96 opacity-100 py-3" : "max-h-0 opacity-0 py-0"}`}
      >
        {open && (
          <div className="flex flex-col gap-1">
            <NavLink href="/" label="Accueil" onClick={() => setOpen(false)} />
            <NavLink href="/menu" label="Menu" onClick={() => setOpen(false)} />
            <NavLink href="/about" label="À propos" onClick={() => setOpen(false)} />
            <NavLink href="/contact" label="Contact" onClick={() => setOpen(false)} />

            {token && (
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-md border border-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800/60"
              >
                Mes commandes
              </Link>
            )}

            {role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/15 transition"
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}