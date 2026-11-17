/** Where to go after sign-in: an internal path only (no other host, no backslash tricks). */
export function safeNext(next: string | null, fallback = "/compte"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
