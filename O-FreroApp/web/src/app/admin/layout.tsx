import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { NewOrderAlert } from "@/components/admin/NewOrderAlert";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin O'Frero" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-surface/40 md:sticky md:top-0 md:h-dvh md:border-r md:border-b-0 print:hidden">
        <AdminNav />
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 md:px-8 print:hidden">
          <p className="text-sm text-muted">Connecté : {session.user.email}</p>
          <NewOrderAlert />
        </header>
        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
