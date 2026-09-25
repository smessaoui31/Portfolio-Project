// src/app/admin/users/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiAuthed } from "@/lib/api";
import ConfirmDialog from "@/components/theme/ui/ConfirmDialog";

type Role = "USER" | "ADMIN";

type AdminUserDetail = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
  // ajoute d'autres champs si ton API en renvoie (addresses, orders count, etc.)
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function fetchUser() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiAuthed<AdminUserDetail>(`/admin/users/${id}`);
      setUser(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setConfirmOpen(false);
    try {
      setDeleting(true);
      await apiAuthed(`/admin/users/${id}`, { method: "DELETE" });
      router.push("/admin/users");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (id) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">User details</h1>
        <button
          onClick={() => router.back()}
          className="rounded-md border border-border px-3 py-1 text-sm text-foreground hover:bg-accent/70"
        >
          ← Back
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-4">
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : err ? (
          <div className="text-red-400 text-sm">{err}</div>
        ) : !user ? (
          <div className="text-muted-foreground">User not found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" value={user.fullName} />
              <Field label="Email" value={user.email} />
              <Field label="Role" value={user.role} />
              <Field
                label="Created"
                value={user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
              />
              {user.updatedAt && (
                <Field
                  label="Updated"
                  value={new Date(user.updatedAt).toLocaleString()}
                />
              )}
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className={`rounded-md border px-4 py-2 text-sm transition ${
                  deleting
                    ? "cursor-not-allowed border-border bg-secondary text-muted-foreground"
                    : "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                }`}
              >
                {deleting ? "Deleting…" : "Delete user"}
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer cet utilisateur ?"
        description={user ? `« ${user.fullName} » sera définitivement supprimé. Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground mt-0.5">{value ?? "—"}</div>
    </div>
  );
}