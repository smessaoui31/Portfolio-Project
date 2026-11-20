import { expect, test } from "vitest";
import { choiceText, defaultChoices, resolveChoices, type OptionSlot } from "./options";

const size: OptionSlot = {
  id: "s1",
  label: "Taille",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: "m", name: "Médium 26 cm", priceCents: 0 },
    { id: "l", name: "Large 33 cm", priceCents: 200 },
  ],
};
const pizza: OptionSlot = {
  id: "p1",
  label: "Pizza 1",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: "moment", name: "Pizza du moment", priceCents: 100 },
    { id: "reine", name: "Reine", priceCents: 0 },
  ],
};
const extras: OptionSlot = { id: "x", label: "Extras", minSelect: 0, maxSelect: 3, options: [{ id: "a", name: "A", priceCents: 50 }] };

test("resolves and prices a valid choice", () => {
  expect(resolveChoices([size], [{ slotId: "s1", optionId: "l" }])).toEqual({
    ok: true,
    choices: [{ slotId: "s1", optionId: "l", label: "Taille", name: "Large 33 cm", unitPriceCents: 200 }],
  });
});

test("a required slot left empty is incomplete", () => {
  expect(resolveChoices([size], [])).toEqual({ ok: false, code: "OPTIONS_INCOMPLETE" });
});

test("an unknown option or slot is not allowed", () => {
  expect(resolveChoices([size], [{ slotId: "s1", optionId: "zz" }])).toEqual({ ok: false, code: "OPTION_NOT_ALLOWED" });
  expect(resolveChoices([size], [{ slotId: "other", optionId: "l" }])).toEqual({ ok: false, code: "OPTION_NOT_ALLOWED" });
});

test("two options in a single-choice slot is incomplete", () => {
  expect(
    resolveChoices(
      [size],
      [
        { slotId: "s1", optionId: "m" },
        { slotId: "s1", optionId: "l" },
      ],
    ),
  ).toEqual({ ok: false, code: "OPTIONS_INCOMPLETE" });
});

test("a duplicated pair counts once", () => {
  const r = resolveChoices(
    [extras],
    [
      { slotId: "x", optionId: "a" },
      { slotId: "x", optionId: "a" },
    ],
  );
  expect(r.ok && r.choices).toHaveLength(1);
});

test("choices come back in slot order, whatever the input order", () => {
  const r = resolveChoices(
    [size, pizza],
    [
      { slotId: "p1", optionId: "reine" },
      { slotId: "s1", optionId: "m" },
    ],
  );
  expect(r.ok && r.choices.map((c) => c.slotId)).toEqual(["s1", "p1"]);
});

test("preselects only a free first option of a required single choice", () => {
  expect(defaultChoices([size, pizza, extras])).toEqual([{ slotId: "s1", optionId: "m" }]);
});

test("choiceText joins label and name", () => {
  expect(choiceText({ label: "Taille", name: "Large 33 cm" })).toBe("Taille : Large 33 cm");
});
