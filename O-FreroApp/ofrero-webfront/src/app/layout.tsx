
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "O’Frero • Pizzeria",
  description: "Commandez vos pizzas O’Frero en ligne.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

function NavBar() {
  return (
    <header className="border-b border-neutral-800 bg-black/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* Si tu as un logo dans /public/ofrero-pizza-logo.png, dé-commente l'image ci-dessous */}
          {/* <img src="/ofrero-pizza-logo.png" alt="O’Frero" className="h-8 w-8" /> */}
          <span className="text-xl font-semibold tracking-wide text-white">
            O’Frero
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-neutral-200 hover:text-white transition">
            Accueil
          </Link>
          <Link href="/menu" className="text-neutral-200 hover:text-white transition">
            Menu
          </Link>
          <Link href="/cart" className="text-neutral-200 hover:text-white transition">
            Panier
          </Link>
          <Link href="/account" className="inline-flex items-center rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-100 hover:bg-neutral-900 transition">
            Compte
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-400">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} O’Frero. Tous droits réservés.</p>
          <div className="flex gap-5">
            <Link href="/mentions" className="hover:text-neutral-200 transition">Mentions légales</Link>
            <Link href="/cgv" className="hover:text-neutral-200 transition">CGV</Link>
            <Link href="/contact" className="hover:text-neutral-200 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-black text-neutral-100 antialiased">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}