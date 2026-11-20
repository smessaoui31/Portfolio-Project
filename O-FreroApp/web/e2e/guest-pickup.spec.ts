import { expect, test } from "@playwright/test";
import { checkoutPickupAtCounter, openCart } from "./helpers";

test("a guest orders the pizza of the moment for pickup and pays at the counter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("La pizza de mémé");
  await expect(page.getByText("Disparaît dans")).toBeVisible();

  await page.getByRole("button", { name: /^Commander/ }).first().click();
  await page.getByRole("radio", { name: "Bien cuite" }).click();
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();
  await openCart(page);

  const cart = page.getByRole("dialog", { name: "Ton panier" });
  await expect(cart.getByText("10,00 €").first()).toBeVisible();
  await expect(cart.getByText(/Taille : Médium 26 cm/)).toBeVisible();
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
  await page.getByRole("button", { name: /^Margarita,/ }).click();
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();
  await page.goto("/commande");
  await expect(page.getByRole("button", { name: "19:30", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "19:15", exact: true })).toHaveCount(0);
});

test("a guest composes a Menu Tribu with two pizzas", async ({ page }) => {
  await page.goto("/carte");
  await page.getByRole("button", { name: /^Menu Tribu,/ }).click();
  const sheet = page.getByRole("dialog", { name: "Menu Tribu" });
  await expect(sheet.getByRole("button", { name: /Fais tes choix/ })).toBeDisabled();

  const slot = (label: string) => sheet.locator("section", { has: page.getByRole("heading", { name: new RegExp(`^${label}`) }) });
  await slot("Pizza 1").getByRole("radio", { name: /^Reine/ }).check();
  await slot("Pizza 2").getByRole("radio", { name: /^Duchesse/ }).check();
  await expect(sheet.getByRole("button", { name: /Ajouter au panier/ })).toContainText("30,90");
  await sheet.getByRole("button", { name: /Ajouter au panier/ }).click();
  await expect(sheet.getByRole("button", { name: /Ajouté/ })).toBeVisible();
  await openCart(page);

  const cart = page.getByRole("dialog", { name: "Ton panier" });
  await expect(cart.getByText(/Pizza 1 : Reine/)).toBeVisible();
  await expect(cart.getByText(/Pizza 2 : Duchesse/)).toBeVisible();
  await expect(cart.getByText("30,90 €").first()).toBeVisible();
});
