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

        {/* Right: login / logout */}
        <div className="flex items-center gap-3">
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
              <button
                onClick={logout}
                className="text-sm rounded-lg px-3 py-1.5 bg-white text-black hover:opacity-90 transition"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm rounded-lg px-3 py-1.5 bg-white text-black hover:opacity-90 transition"
            >
              Se connecter
            </Link>
          )}
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