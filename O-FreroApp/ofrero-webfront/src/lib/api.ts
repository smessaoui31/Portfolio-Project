// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:5050";

/** Récupère le token stocké (côté client uniquement) */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const auth = localStorage.getItem("auth");
    if (!auth) return null;
    const parsed = JSON.parse(auth);
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

/** Requête API simple (sans token, pour le SSR) */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...init });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/** Version authentifiée (client-side, token automatique) */
export async function apiAuthed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers as HeadersInit);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...init, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}