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

export interface SlotsResult {
  slots: string[];
  asap: string;
  serviceLabel: string;
  minutesToAsap: number;
}

export async function getSlotsAction(mode: FulfillmentMode): Promise<SlotsResult | null> {
  if (mode !== "PICKUP" && mode !== "DELIVERY") return null;
  const at = now();
  const result = computeSlots(await getSlotOptions(mode, at));
  if (!result) return null;
  return {
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
