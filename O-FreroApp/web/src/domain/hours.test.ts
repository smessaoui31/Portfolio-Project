import { expect, test } from "vitest";
import { groupServiceWindows } from "./hours";

const HOURS = [
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

test("groupServiceWindows merges consecutive days with the same services", () => {
  expect(groupServiceWindows(HOURS)).toEqual([
    { days: "Lun – Jeu", services: "11:30–13:30 · 18:00–22:00" },
    { days: "Vendredi", services: "18:00–22:00" },
    { days: "Sam – Dim", services: "12:00–13:30 · 18:00–22:00" },
  ]);
});

test("closed days are listed as closed", () => {
  expect(groupServiceWindows([{ weekday: 2, opensAt: "18:00", closesAt: "22:00" }])).toEqual([
    { days: "Lundi", services: "Fermé" },
    { days: "Mardi", services: "18:00–22:00" },
    { days: "Mer – Dim", services: "Fermé" },
  ]);
});
