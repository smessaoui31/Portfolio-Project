"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Masquer le footer sur la page d'accueil
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="mt-12 border-t border-border/80 py-8 text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} O'Frero Pizza — Fait par Messaoui Sofian</p>
      <Link href="/landing" className="mt-1 inline-block underline-offset-4 hover:text-foreground hover:underline">
        À propos de ce projet
      </Link>
    </footer>
  );
}