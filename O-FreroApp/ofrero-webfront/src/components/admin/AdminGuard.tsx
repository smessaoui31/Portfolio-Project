"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { token, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // pas connecté → login
    if (!token) router.replace("/login");
    // connecté mais pas admin → accueil
    else if (role !== "ADMIN") router.replace("/");
  }, [token, role, router]);

  if (!token || role !== "ADMIN") {
    return (
      <main className="min-h-[60vh] grid place-items-center text-neutral-400">
        Vérification des droits…
      </main>
    );
  }
  return <>{children}</>;
}