"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cartCount, useCart, useCartReady } from "@/components/cart/cart-store";
import { SITE } from "@/lib/site";
import { BagIcon, PhoneIcon, UserIcon } from "./icons";

const LINKS = [
  { href: "/carte", label: "La carte" },
  { href: "/editions", label: "Les éditions" },
] as const;

export function Header() {
  const pathname = usePathname();
  const ready = useCartReady();
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link href="/" className="shrink-0" aria-label={`${SITE.name}, accueil`}>
          <Image src="/logo.png" alt="" width={102} height={72} priority className="h-9 w-auto" />
        </Link>

        <nav aria-label="Navigation principale" className="ml-2 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-sm text-muted-2 transition hover:text-fg aria-[current=page]:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/carte" className="rounded-lg px-3 py-2 text-sm text-muted-2 hover:text-fg md:hidden">
            La carte
          </Link>
          <a
            href={SITE.phoneHref}
            className="hidden items-center gap-2 rounded-xl border border-line-2 px-3 py-2 text-sm text-muted-2 transition hover:text-fg lg:inline-flex"
          >
            <PhoneIcon className="size-4" />
            {SITE.phoneDisplay}
          </a>
          <Link
            href="/compte"
            aria-label="Mon compte"
            className="grid size-10 place-items-center rounded-xl text-muted-2 transition hover:bg-surface-2 hover:text-fg"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={ready && count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}
            className="relative grid size-10 place-items-center rounded-xl text-muted-2 transition hover:bg-surface-2 hover:text-fg"
          >
            <BagIcon />
            {ready && count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-ember px-1 text-[11px] font-bold text-ember-ink">
                {count}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
