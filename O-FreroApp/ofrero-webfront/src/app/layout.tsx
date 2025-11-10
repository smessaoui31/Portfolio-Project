// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/theme/ui/Navbar";
import PageTransition from "@/components/theme/ui/PageTransition";
import NextTopLoader from "nextjs-toploader";
import ToasterProvider from "@/components/theme/ui/ToasterProvider";
import Footer from "@/components/theme/ui/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "O'Frero Pizza",
  description: "Pizzeria — Four au feu de bois détenu par deux frères",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-black">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased`}>
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
        <ToasterProvider />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <PageTransition>{children}</PageTransition>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}