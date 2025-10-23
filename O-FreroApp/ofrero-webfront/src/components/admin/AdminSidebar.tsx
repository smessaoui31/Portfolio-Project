"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/customers", label: "Clients" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="p-3">
      <div className="px-2 py-2">
        <div className="text-xs uppercase tracking-wider text-neutral-500">
          Administration
        </div>
      </div>
      <ul className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block rounded-md px-3 py-2 text-sm transition
                ${active
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-300 hover:bg-neutral-800/60 hover:text-white"
                }`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}