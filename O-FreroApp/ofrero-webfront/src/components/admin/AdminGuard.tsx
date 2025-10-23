"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { ready, token, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return; // attendre l’hydratation
    if (!token || role !== "ADMIN") {
      const returnTo = encodeURIComponent(pathname || "/admin");
      router.replace(`/login?returnTo=${returnTo}`);
    }
  }, [ready, token, role, pathname, router]);

  if (!ready) {
    return (
      <main className="min-h-[50vh] grid place-items-center text-neutral-400">
        Initialisation…
      </main>
    );
  }

  if (!token || role !== "ADMIN") {
    return null; // on va être redirigé
  }

  return <>{children}</>;
}