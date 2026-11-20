import { describe, expect, test } from "vitest";
import { formatParisTime, parisDateKey } from "@/lib/time";
import { computeSlots, eveningSlots, isValidSlot, serviceLabel, type SlotOptions } from "./slots";
import type { ServiceWindowLike } from "./types";

const HOURS: ServiceWindowLike[] = [
  ...[1, 2, 3, 4].flatMap((weekday) => [
    { weekday, opensAt: "11:30", closesAt: "13:30" },
    { weekday, opensAt: "18:00", closesAt: "22:00" },
  ]),
  { weekday: 5, opensAt: "18:00", closesAt: "22:00" },
  ...[6, 7].flatMap((weekday) => [
    { weekday, opensAt: "12:00", closesAt: "13:30" },
    { weekday, opensAt: "18:00", closesAt: "22:00" },
  ]),
];

const P = (iso: string) => new Date(iso);
const opts = (now: string, extra: Partial<SlotOptions> = {}): SlotOptions => ({
  now: P(now),
  hours: HOURS,
  closures: [],
  leadMinutes: 15,
  ...extra,
});

describe("computeSlots", () => {
  test("Thursday 19:02 pickup starts at 19:30 and ends at 21:45", () => {
    const r = computeSlots(opts("2026-11-19T18:02:00Z"))!;
    expect(r.slots.map(formatParisTime)).toEqual([
      "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30", "21:45",
    ]);
    expect(formatParisTime(r.asap)).toBe("19:30");
  });

  test("exact quarter stays on the quarter", () => {
    expect(formatParisTime(computeSlots(opts("2026-11-19T18:00:00Z"))!.asap)).toBe("19:15");
  });

  test("21:40 Thursday rolls to Friday 18:00", () => {
    const r = computeSlots(opts("2026-11-19T20:40:00Z"))!;
    expect(parisDateKey(r.asap)).toBe("2026-11-20");
    expect(formatParisTime(r.asap)).toBe("18:00");
    expect(r.slots.every((s) => parisDateKey(s) === "2026-11-20")).toBe(true);
  });

  test("Friday noon (no lunch service) gives Friday 18:00", () => {
    const r = computeSlots(opts("2026-11-20T11:00:00Z"))!;
    expect(r.asap.toISOString()).toBe("2026-11-20T17:00:00.000Z");
  });

  test("closure skips the day", () => {
    const r = computeSlots(opts("2026-11-20T11:00:00Z", { closures: ["2026-11-20"] }))!;
    expect(parisDateKey(r.asap)).toBe("2026-11-21");
    expect(formatParisTime(r.asap)).toBe("12:00");
  });

  test("before opening gives the opening slot", () => {
    const r = computeSlots(opts("2026-11-16T09:00:00Z"))!;
    expect(parisDateKey(r.asap)).toBe("2026-11-16");
    expect(formatParisTime(r.asap)).toBe("11:30");
    expect(r.slots.map(formatParisTime).at(-1)).toBe("13:15");
  });

  test("delivery lead of 30 minutes", () => {
    expect(formatParisTime(computeSlots(opts("2026-11-19T18:02:00Z", { leadMinutes: 30 }))!.asap)).toBe("19:45");
  });

  test("slots across DST spring-forward", () => {
    const r = computeSlots(opts("2027-03-27T22:00:00Z"))!;
    expect(r.asap.toISOString()).toBe("2027-03-28T10:00:00.000Z");
  });

  test("returns null when nothing opens within the search window", () => {
    expect(computeSlots(opts("2026-11-19T18:02:00Z", { hours: [] }))).toBeNull();
  });
});

describe("isValidSlot", () => {
  test("rejects too early, off-quarter, and later-service slots", () => {
    const o = opts("2026-11-19T18:02:00Z");
    expect(isValidSlot(P("2026-11-19T18:30:00Z"), o)).toBe(true);
    expect(isValidSlot(P("2026-11-19T18:15:00Z"), o)).toBe(false);
    expect(isValidSlot(P("2026-11-19T18:37:00Z"), o)).toBe(false);
    expect(isValidSlot(P("2026-11-20T17:00:00Z"), o)).toBe(false);
  });
});

describe("serviceLabel", () => {
  test.each([
    ["2026-11-19T18:30:00Z", "2026-11-19T18:02:00Z", "ce soir"],
    ["2026-11-16T10:30:00Z", "2026-11-16T09:00:00Z", "ce midi"],
    ["2026-11-20T17:00:00Z", "2026-11-19T20:40:00Z", "demain soir"],
    ["2026-11-21T11:00:00Z", "2026-11-20T11:00:00Z", "demain midi"],
    ["2026-11-21T11:00:00Z", "2026-11-19T20:40:00Z", "samedi midi"],
  ])("slot %s seen at %s is %s", (slot, now, label) => {
    expect(serviceLabel(new Date(slot), new Date(now))).toBe(label);
  });
});

describe("delivery cutoff", () => {
  // Saturday 2026-11-21: 12:00-13:30 and 18:00-22:00.
  test("delivery stops 30 minutes before the lunch closing", () => {
    const r = computeSlots(opts("2026-11-21T10:00:00Z", { leadMinutes: 30, lastSlotBeforeCloseMinutes: 30 }))!;
    expect(formatParisTime(r.slots.at(-1)!)).toBe("13:00");
  });

  test("pickup keeps its lunch slots until closing", () => {
    expect(formatParisTime(computeSlots(opts("2026-11-21T10:00:00Z"))!.slots.at(-1)!)).toBe("13:15");
  });

  test("evening: last delivery 21:30, last pickup 21:45", () => {
    const delivery = computeSlots(opts("2026-11-21T18:00:00Z", { leadMinutes: 30, lastSlotBeforeCloseMinutes: 30 }))!;
    expect(formatParisTime(delivery.slots.at(-1)!)).toBe("21:30");
    expect(formatParisTime(computeSlots(opts("2026-11-21T18:00:00Z"))!.slots.at(-1)!)).toBe("21:45");
  });
});

describe("eveningSlots (match nights)", () => {
  test("gives tomorrow's evening service the day before", () => {
    const s = eveningSlots(opts("2026-11-20T10:00:00Z"), "2026-11-21");
    expect(formatParisTime(s[0])).toBe("18:00");
    expect(formatParisTime(s.at(-1)!)).toBe("21:45");
  });

  test("stops 30 minutes before closing for delivery", () => {
    const s = eveningSlots(opts("2026-11-20T10:00:00Z", { leadMinutes: 30, lastSlotBeforeCloseMinutes: 30 }), "2026-11-21");
    expect(formatParisTime(s.at(-1)!)).toBe("21:30");
  });

  test("on the day itself, keeps the lead time", () => {
    const s = eveningSlots(opts("2026-11-21T18:02:00Z"), "2026-11-21");
    expect(formatParisTime(s[0])).toBe("19:30");
  });

  test("respects closures and closed days", () => {
    expect(eveningSlots(opts("2026-11-20T10:00:00Z", { closures: ["2026-11-21"] }), "2026-11-21")).toEqual([]);
    expect(eveningSlots(opts("2026-11-20T10:00:00Z", { hours: [] }), "2026-11-21")).toEqual([]);
  });
});
