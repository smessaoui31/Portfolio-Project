// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/ui/Navbar";
import PageTransition from "@/components/ui/PageTransition";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "O’Frero Pizza",
  description: "Pizzeria — Four au feu de bois détenu par deux frères",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-black">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased`}>
        {/* Barre de progression lors des changements de page */}
        <NextTopLoader
          color="#ffffff"
          initialPosition={0.15}
          crawlSpeed={150}
          height={2}
          crawl
          showSpinner={false}
          easing="ease"
          speed={300}
          shadow="0 0 10px #ffffff50, 0 0 5px #ffffff30"
          zIndex={9999}
        />

        <AuthProvider>
          <CartProvider>
            <Navbar />
            {/* Transition smooth entre les pages */}
            <PageTransition>{children}</PageTransition>

            <footer className="mt-12 border-t border-neutral-800/80 py-8 text-center text-sm text-neutral-500">
              © {new Date().getFullYear()} O’Frero Pizza — Fait par Messaoui Sofian
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}