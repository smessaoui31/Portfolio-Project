/**
 * Current time for business logic. OFRERO_NOW (ISO date) overrides it in development,
 * in tests, and in end-to-end runs (E2E=1), never in a normal production server.
 */
export function now(): Date {
  const fixed = process.env.OFRERO_NOW;
  const allowed = process.env.NODE_ENV !== "production" || process.env.E2E === "1";
  return fixed && allowed ? new Date(fixed) : new Date();
}
