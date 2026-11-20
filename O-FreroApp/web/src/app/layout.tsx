import { MotionProvider } from "@/components/motion/MotionProvider";
import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });

export const metadata: Metadata = {
  title: { default: "O'Frero Pizza, pizzeria au feu de bois à Toulouse", template: "%s · O'Frero Pizza" },
  description:
    "Pizzas au feu de bois à Toulouse, à emporter ou en livraison. Commande en ligne, pizza du moment en édition limitée.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0d0a08",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${anton.variable}`}>
      <body className="min-h-dvh">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
