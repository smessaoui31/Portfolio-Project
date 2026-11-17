import { expect, test } from "vitest";
import { nextStatuses, STATUS_LABELS, TERMINAL_STATUSES, trackingSteps } from "./order-status";

test("nextStatuses depends on mode", () => {
  expect(nextStatuses("PENDING_PAYMENT", "PICKUP")).toEqual(["CANCELLED"]);
  expect(nextStatuses("RECEIVED", "DELIVERY")).toEqual(["IN_OVEN", "CANCELLED"]);
  expect(nextStatuses("IN_OVEN", "PICKUP")).toEqual(["READY", "CANCELLED"]);
  expect(nextStatuses("IN_OVEN", "DELIVERY")).toEqual(["OUT_FOR_DELIVERY", "CANCELLED"]);
  expect(nextStatuses("READY", "PICKUP")).toEqual(["COMPLETED", "NOT_COLLECTED"]);
  expect(nextStatuses("OUT_FOR_DELIVERY", "DELIVERY")).toEqual(["COMPLETED"]);
  for (const s of TERMINAL_STATUSES) expect(nextStatuses(s, "PICKUP")).toEqual([]);
});

test("labels are French", () => {
  expect(STATUS_LABELS.IN_OVEN).toBe("Au four");
  expect(STATUS_LABELS.NOT_COLLECTED).toBe("Non récupérée");
});

test("trackingSteps differ for pickup and delivery", () => {
  expect(trackingSteps("PICKUP").map((s) => s.label)).toEqual(["Reçue", "Au four", "Prête", "Récupérée"]);
  expect(trackingSteps("DELIVERY").map((s) => s.label)).toEqual(["Reçue", "Au four", "En livraison", "Livrée"]);
  expect(trackingSteps("DELIVERY").map((s) => s.status)).toEqual(["RECEIVED", "IN_OVEN", "OUT_FOR_DELIVERY", "COMPLETED"]);
});
