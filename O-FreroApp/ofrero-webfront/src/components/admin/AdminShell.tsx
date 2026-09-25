"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { OrderNotificationSound } from "./OrderNotificationSound";
import AdminHeader from "./AdminHeader";

const links = [
  { href: "/admin", label: "Aperçu" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/users", label: "Utilisateurs" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { email, logout } = useAuth();

  return (
    <>
      <OrderNotificationSound />
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar */}
      <aside className="border-r border-border/80 bg-background">
        <div className="px-4 py-4">
          <Link href="/" className="block text-lg font-semibold text-foreground">
            O’Frero Admin
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Connecté en tant que <span className="text-foreground">{email}</span>
          </p>
        </div>

        <nav className="mt-4 space-y-1 px-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm transition
                  ${active ? "bg-secondary text-foreground" : "text-foreground hover:bg-accent/60 hover:text-foreground"}
                `}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <button
            onClick={logout}
            className="w-full rounded-md border border-border bg-card/70 px-3 py-2 text-sm text-foreground hover:bg-accent transition"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        {/* Topbar */}
        <div className="sticky top-16 z-10 border-b border-border/80 bg-background/70 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <AdminHeader />
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </div>
    </div>
    </>
  );
}