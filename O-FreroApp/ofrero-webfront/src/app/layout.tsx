import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/ui/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "O’Frero Pizza",
  description: "Pizzeria — noir & blanc, Next.js + Tailwind",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-black">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased`}>
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-neutral-800/80 py-8 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} O’Frero Pizza — Fait avec ❤️
        </footer>
      </body>
    </html>
  );
}