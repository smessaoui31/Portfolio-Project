export type FulfillmentMode = "PICKUP" | "DELIVERY";
export type PaymentMethod = "ONLINE" | "AT_PICKUP";
export type Cooking = "NORMAL" | "WELL_DONE" | "EXTRA_CRISPY";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "RECEIVED"
  | "IN_OVEN"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "NOT_COLLECTED"
  | "CANCELLED"
  | "FAILED";

/** One opening service. weekday: ISO, 1 = Monday ... 7 = Sunday. Times "HH:MM" in Paris. */
export interface ServiceWindowLike {
  weekday: number;
  opensAt: string;
  closesAt: string;
}

export interface CartLineInput {
  productId: string;
  quantity: number;
  cooking: Cooking;
  supplementIds: string[];
}

export const COOKING_LABELS: Record<Cooking, string> = {
  NORMAL: "Normale",
  WELL_DONE: "Bien cuite",
  EXTRA_CRISPY: "Extra croustillante",
};
