import { expect, test } from "vitest";
import { currentEdition, editionBounds, editionLabel, editionProgress, pastEditions, splitRemaining } from "./editions";

const ed = (id: string, number: number, start: string, end: string) => ({ id, number, ...editionBounds(start, end) });
const E7 = ed("e7", 7, "2026-11-01", "2026-12-31");
const E6 = ed("e6", 6, "2026-09-01", "2026-10-31");
const E8 = ed("e8", 8, "2027-01-01", "2027-02-28");

test("editionBounds uses Paris midnights with an exclusive end", () => {
  expect(E7.startsAt.toISOString()).toBe("2026-10-31T23:00:00.000Z");
  expect(E7.endsAt.toISOString()).toBe("2026-12-31T23:00:00.000Z");
});

test("currentEdition uses an exclusive end", () => {
  expect(currentEdition([E6, E7, E8], new Date("2026-12-31T22:59:59Z"))?.id).toBe("e7");
  expect(currentEdition([E6, E7], new Date("2026-12-31T23:00:00Z"))).toBeNull();
  expect(currentEdition([E6, E7, E8], new Date("2026-12-31T23:00:00Z"))?.id).toBe("e8");
});

test("currentEdition prefers the latest start when editions overlap", () => {
  const special = ed("x", 9, "2026-12-01", "2026-12-15");
  expect(currentEdition([E7, special], new Date("2026-12-05T12:00:00Z"))?.id).toBe("x");
});

test("pastEditions are ended ones, newest first", () => {
  expect(pastEditions([E6, E8, E7], new Date("2027-01-05T12:00:00Z")).map((e) => e.number)).toEqual([7, 6]);
});

test("editionProgress on day 23 of 61", () => {
  const p = editionProgress(E7, new Date("2026-11-23T12:00:00Z"));
  expect(p.dayIndex).toBe(23);
  expect(p.totalDays).toBe(61);
  expect(p.remainingMs).toBe(E7.endsAt.getTime() - new Date("2026-11-23T12:00:00Z").getTime());
  expect(p.ratio).toBeGreaterThan(0.35);
  expect(p.ratio).toBeLessThan(0.38);
});

test("editionProgress counts days across a DST change", () => {
  const spring = ed("s", 1, "2027-03-01", "2027-04-30");
  expect(editionProgress(spring, new Date("2027-04-30T21:00:00Z"))).toMatchObject({ dayIndex: 61, totalDays: 61 });
});

test("splitRemaining", () => {
  expect(splitRemaining(((38 * 24 + 4) * 60 + 12) * 60000)).toEqual({ days: 38, hours: 4, minutes: 12 });
  expect(splitRemaining(-5)).toEqual({ days: 0, hours: 0, minutes: 0 });
});

test("editionLabel gives the number and the Paris months", () => {
  expect(editionLabel(E7)).toEqual({ number: "N°07", short: "NOV — DÉC", long: "NOVEMBRE — DÉCEMBRE" });
  expect(editionLabel(ed("x", 12, "2027-03-01", "2027-03-31"))).toEqual({ number: "N°12", short: "MARS", long: "MARS" });
});
