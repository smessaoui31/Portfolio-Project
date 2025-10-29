// src/app/admin/users/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiAuthed } from "@/lib/api";

type Role = "USER" | "ADMIN";
type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
};

type AdminUserListResponse =
  | { items: AdminUser[]; total: number; page?: number; pageSize?: number }
  | AdminUser[];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiAuthed<AdminUserListResponse>("/admin/users");
      const list = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
      const totalCount = Array.isArray(data) ? list.length : Number((data as any)?.total ?? list.length);
      setUsers(list);
      setTotal(totalCount);
    } catch (e: any) {
      console.error("[admin/users] fetch error:", e);
      setErr(e?.message || "Failed to load users");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const rows = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  async function handleDelete(id: string) {
    const confirm = window.confirm("Supprimer cet utilisateur ? Cette action est irréversible.");
    if (!confirm) return;
    try {
      setBusyId(id);
      await apiAuthed(`/admin/users/${id}`, { method: "DELETE" });
      // Optimistic update ou refetch
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la suppression.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Users</h1>
        <div className="text-sm text-neutral-400">
          {loading ? "Loading…" : `${rows.length} / ${total}`}
          {err ? <span className="ml-2 text-red-400">— {err}</span> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-800 text-neutral-400">
            <tr>
              <th className="px-4 py-2 text-left">Full name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-neutral-400" colSpan={5}>Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-neutral-400" colSpan={5}>No users found.</td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-white">{u.fullName}</td>
                  <td className="px-4 py-3 text-neutral-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${
                        u.role === "ADMIN"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-neutral-700 bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-neutral-300 hover:text-white underline underline-offset-4"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={busyId === u.id}
                        className={`rounded-md border px-3 py-1 text-xs transition ${
                          busyId === u.id
                            ? "cursor-not-allowed border-neutral-700 bg-neutral-800 text-neutral-400"
                            : "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        }`}
                        title="Delete user"
                      >
                        {busyId === u.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}