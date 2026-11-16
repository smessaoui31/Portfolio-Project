import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth, type AuthSession } from "@/lib/auth";

export type Session = AuthSession;

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Admin pages and actions: anyone else gets a 404. */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") notFound();
  return session;
}

/** Account pages: guests are sent to the sign-in page. */
export async function requireUser(next = "/compte"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/compte/connexion?suite=${encodeURIComponent(next)}`);
  return session;
}
