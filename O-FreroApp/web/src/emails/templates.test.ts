import { expect, test } from "vitest";
import { orderConfirmationEmail } from "./templates";

const base = {
  number: 42,
  firstName: "Karim",
  slotLabel: "jeudi 19 novembre, 19:30",
  modeLabel: "À emporter",
  totalLabel: "22,00 €",
  trackingUrl: "https://ofrero.test/suivi/abc",
  payAtPickup: true,
};

test("the confirmation lists items with their choices", () => {
  const mail = orderConfirmationEmail({ ...base, items: ["2 × Reine (Taille : Large 33 cm, + Chèvre)"] });
  expect(mail.text).toContain("2 × Reine (Taille : Large 33 cm, + Chèvre)");
  expect(mail.html).toContain("2 × Reine (Taille : Large 33 cm, + Chèvre)");
});

test("item lines are escaped in the HTML", () => {
  const mail = orderConfirmationEmail({ ...base, items: ["1 × <b>Reine</b>"] });
  expect(mail.html).toContain("1 × &lt;b&gt;Reine&lt;/b&gt;");
});
