"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/supplements", label: "Suppléments" },
  { href: "/admin/choix", label: "Choix" },
  { href: "/admin/editions", label: "Éditions" },
  { href: "/admin/votes", label: "Votes" },
  { href: "/admin/livraison", label: "Livraison" },
  { href: "/admin/horaires", label: "Horaires" },
  { href: "/admin/fidelite", label: "Fidélité" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
];

export function AdminNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav aria-label="Administration" className="print:hidden">
      <div className="flex items-center gap-3 px-4 py-4 md:px-5">
        <Image src="/logo.png" alt="" width={68} height={48} className="h-8 w-auto" />
        <span className="font-display text-xl">Admin</span>
      </div>
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-6">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active(link.href) ? "page" : undefined}
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-2 transition hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg"
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li className="md:mt-4 md:border-t md:border-line md:pt-4">
          <Link href="/" className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted hover:text-fg">
            Voir le site
          </Link>
        </li>
      </ul>
    </nav>
  );
}
