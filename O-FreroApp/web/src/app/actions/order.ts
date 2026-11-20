"use server";

import { quoteDelivery } from "@/domain/delivery";
import { computeSlots, serviceLabel } from "@/domain/slots";
import type { CartLineInput, FulfillmentMode } from "@/domain/types";
import { now } from "@/lib/clock";
import { getSession } from "@/lib/session";
import { orderErrorMessage, placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/server/orders";
import { getActiveZones, getSlotOptions } from "@/server/settings";
import { quoteCartAction } from "./cart";
import type { RatingScore } from "@/domain/ratings";
import { rateOrder } from "@/server/ratings";
import { atParisTime, formatParisDay } from "@/lib/time";
import { matchSlotsFor } from "@/server/match-nights";

export interface SlotsResult {
  slots: string[];
  asap: string;
  serviceLabel: string;
  minutesToAsap: number;
  /** On match nights, the evening of the match, bookable from the day before. */
  match: { title: string; dayLabel: string; slots: string[] } | null;
}

export async function getSlotsAction(mode: FulfillmentMode): Promise<SlotsResult | null> {
  if (mode !== "PICKUP" && mode !== "DELIVERY") return null;
  const at = now();
  const [result, match] = await Promise.all([getSlotOptions(mode, at).then(computeSlots), matchSlotsFor(mode, at)]);
  if (!result) return null;
  const matchSlots = match ? match.slots.map((s) => s.toISOString()) : [];
  const sameAsNow = matchSlots.length > 0 && matchSlots.every((s) => result.slots.some((r) => r.toISOString() === s));
  return {
    match:
      match && !sameAsNow ? { title: match.title, dayLabel: formatParisDay(atParisTime(match.day, "12:00")), slots: matchSlots } : null,
    slots: result.slots.map((s) => s.toISOString()),
    asap: result.asap.toISOString(),
    serviceLabel: serviceLabel(result.asap, at),
    minutesToAsap: Math.max(0, Math.round((result.asap.getTime() - at.getTime()) / 60_000)),
  };
}

export type DeliveryQuoteResult =
  | { ok: true; feeCents: number; minOrderCents: number; zoneName: string }
  | { ok: false; message: string };

export async function quoteDeliveryAction(
  postalCode: string,
  lines: CartLineInput[],
  rewardLineIndex?: number,
): Promise<DeliveryQuoteResult> {
  const cart = await quoteCartAction(lines, rewardLineIndex);
  if (!cart.ok) return { ok: false, message: cart.message };
  const quote = quoteDelivery(postalCode, cart.quote.subtotalCents - cart.quote.rewardCents, await getActiveZones());
  if (!quote.ok) return { ok: false, message: orderErrorMessage(quote.reason, { minOrderCents: quote.minOrderCents }) };
  return { ok: true, feeCents: quote.feeCents, minOrderCents: quote.zone.minOrderCents, zoneName: quote.zone.name };
}

export async function rateOrderAction(token: string, score: RatingScore, comment?: string) {
  return rateOrder(token, score, comment);
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const session = await getSession();
  return placeOrder(input, { userId: session?.user.id ?? null, now: now() });
}
