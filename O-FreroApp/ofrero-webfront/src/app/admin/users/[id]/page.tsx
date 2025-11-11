// src/app/admin/users/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiAuthed } from "@/lib/api";

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
    const confirm = window.confirm("Supprimer cet utilisateur ? Action irréversible.");
    if (!confirm) return;
    try {
      setDeleting(true);
      await apiAuthed(`/admin/users/${id}`, { method: "DELETE" });
      router.push("/admin/users");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur lors de la suppression.");
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
        <h1 className="text-xl font-semibold text-white">User details</h1>
        <button
          onClick={() => router.back()}
          className="rounded-md border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800/70"
        >
          ← Back
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        {loading ? (
          <div className="text-neutral-400">Loading…</div>
        ) : err ? (
          <div className="text-red-400 text-sm">{err}</div>
        ) : !user ? (
          <div className="text-neutral-400">User not found.</div>
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
                onClick={handleDelete}
                disabled={deleting}
                className={`rounded-md border px-4 py-2 text-sm transition ${
                  deleting
                    ? "cursor-not-allowed border-neutral-700 bg-neutral-800 text-neutral-400"
                    : "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                }`}
              >
                {deleting ? "Deleting…" : "Delete user"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-sm text-white mt-0.5">{value ?? "—"}</div>
    </div>
  );
}