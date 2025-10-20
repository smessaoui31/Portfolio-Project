"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-ash">
      <nav className="container h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          O’Frero
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="btn">Panier</Link>
          <Link href="/login" className="btn">Se connecter</Link>
        </div>
      </nav>
    </header>
  );
}