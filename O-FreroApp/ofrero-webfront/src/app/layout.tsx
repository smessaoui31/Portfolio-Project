// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from "next-view-transitions";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Navbar from "@/components/theme/ui/Navbar";
import NextTopLoader from "nextjs-toploader";
import ToasterProvider from "@/components/theme/ui/ToasterProvider";
import Footer from "@/components/theme/ui/Footer";
import FloatingCartButton from "@/components/theme/ui/FloatingCartButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "O'Frero Pizza",
  description: "Pizzeria — Four au feu de bois détenu par deux frères",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransitions>
      <html lang="fr" suppressHydrationWarning>
        <body className={`${inter.className} bg-background text-foreground antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <div className="grain-overlay" aria-hidden />
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
            <QueryProvider>
              <AuthProvider>
                <CartProvider>
                  <Navbar />
                  <div className="relative min-h-screen">{children}</div>
                  <FloatingCartButton />
                  <Footer />
                </CartProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}