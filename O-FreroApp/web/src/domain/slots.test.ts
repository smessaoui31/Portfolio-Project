import { describe, expect, test } from "vitest";
import { formatParisTime, parisDateKey } from "@/lib/time";
import { computeSlots, isValidSlot, type SlotOptions } from "./slots";
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
