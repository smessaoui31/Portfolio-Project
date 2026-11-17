import { expect, test } from "@playwright/test";
import { checkoutPickupAtCounter } from "./helpers";

test("a guest orders the pizza of the moment for pickup and pays at the counter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Savoyarde d'hiver");
  await expect(page.getByText("Disparaît dans")).toBeVisible();

  await page.getByRole("button", { name: /^Commander/ }).first().click();
  await page.getByRole("radio", { name: "Bien cuite" }).click();
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();

  const cart = page.getByRole("dialog", { name: "Ton panier" });
  await expect(cart.getByText("14,90 €").first()).toBeVisible();
  await cart.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/commande$/);

  await checkoutPickupAtCounter(page, { firstName: "Léa", email: "lea@exemple.fr" });
  await expect(page.getByText("19:30", { exact: true })).toBeVisible();
  await expect(page.getByText(/à régler sur place/)).toBeVisible();
  await expect(page.getByText("Cette commande vaut 1 tampon")).toBeVisible();
  await expect(page.getByRole("button", { name: /Panier, \d/ })).toHaveCount(0);
});

test("a slot that is too early is not offered", async ({ page }) => {
  await page.goto("/carte");
  await page.getByRole("button", { name: /^Margherita,/ }).click();
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();
  await page.goto("/commande");
  await expect(page.getByRole("button", { name: "19:30", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "19:15", exact: true })).toHaveCount(0);
});
