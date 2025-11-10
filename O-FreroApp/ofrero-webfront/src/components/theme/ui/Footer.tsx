"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  
  // Masquer le footer sur la page d'accueil
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="mt-12 border-t border-neutral-800/80 py-8 text-center text-sm text-neutral-500">
      © {new Date().getFullYear()} O'Frero Pizza — Fait par Messaoui Sofian
    </footer>
  );
}