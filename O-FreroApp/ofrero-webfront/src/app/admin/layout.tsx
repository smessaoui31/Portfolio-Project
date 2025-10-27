// src/app/admin/layout.tsx
import type { Metadata } from "next";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin • O’Frero Pizza",
  description: "Tableau de bord administrateur",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      {/* AdminShell already handles sidebar/header/content */}
      <AdminShell>
        {children}
      </AdminShell>
    </AdminGuard>
  );
}