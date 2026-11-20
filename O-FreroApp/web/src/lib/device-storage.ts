// What this phone remembers for its owner. Never sent anywhere: read and written in the browser only.
import type { CartItem } from "@/components/cart/cart-store";
import type { FulfillmentMode } from "@/domain/types";

export interface LastOrder {
  lines: CartItem[];
  mode: FulfillmentMode;
  customer: { firstName: string; phone: string; email: string };
  address?: { line1: string; line2?: string; postalCode: string; city: string };
  savedAt: string;
}

const LAST_ORDER = "ofrero-last-order-v1";
const REORDER_FLAG = "ofrero-reorder";

function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: unknown): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or storage disabled: the site works without it.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export function saveLastOrder(order: LastOrder): void {
  write(local, LAST_ORDER, order);
}

export function readLastOrder(): LastOrder | null {
  const order = read<LastOrder>(local, LAST_ORDER);
  return order && Array.isArray(order.lines) && order.lines.length > 0 ? order : null;
}

export function forgetLastOrder(): void {
  write(local, LAST_ORDER, null);
}

/** Set when the cart was filled by "Recommander"; read once by the checkout. */
export function markReorder(): void {
  write(session, REORDER_FLAG, true);
}

export function isReorder(): boolean {
  return read<boolean>(session, REORDER_FLAG) === true;
}

/** Cleared once the order is placed, so a failed attempt keeps the flag. */
export function clearReorder(): void {
  write(session, REORDER_FLAG, null);
}

const REFERRAL = "ofrero-parrain";
const REFERRAL_DAYS = 30;

/** A referral code from a shared link, kept 30 days on this phone. */
export function saveReferralCode(code: string): void {
  write(local, REFERRAL, { code, expiresAt: Date.now() + REFERRAL_DAYS * 24 * 60 * 60_000 });
}

export function readReferralCode(): string | null {
  const saved = read<{ code: string; expiresAt: number }>(local, REFERRAL);
  if (!saved || typeof saved.code !== "string" || saved.expiresAt < Date.now()) return null;
  return saved.code;
}
