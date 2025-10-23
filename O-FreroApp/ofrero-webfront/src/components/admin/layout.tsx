import type { Metadata } from "next";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "Admin • O’Frero Pizza",
  description: "Tableau de bord administrateur",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit lg:sticky lg:top-20 rounded-2xl border border-neutral-800 bg-neutral-900/50">
            <AdminSidebar />
          </aside>

          {/* Content */}
          <section className="space-y-4">
            <AdminHeader />
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              {children}
            </div>
          </section>
        </div>
      </div>
    </AdminGuard>
  );
}