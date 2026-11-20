import { expect, test } from "@playwright/test";
import { addFromMenu } from "./helpers";

test("delivery checks the postal code against the zones", async ({ page }) => {
  await addFromMenu(page, "Margarita", 2);
  await page.goto("/commande");
  await page.getByRole("radio", { name: "Livraison" }).click();
  await page.getByLabel("Adresse", { exact: true }).fill("12 rue des Lois");

  await page.getByLabel("Code postal").fill("75001");
  await expect(page.getByText(/Nous ne livrons pas encore à cette adresse/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Passer en retrait" })).toBeVisible();

  await page.getByLabel("Code postal").fill("31 100");
  await expect(page.getByText(/Zone livrée · frais 3,00/)).toBeVisible();
  await page.getByRole("button", { name: /~20:00/ }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Livraison", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("radio", { name: /Payer au retrait/ })).toHaveCount(0);
});

test("pays a delivery online with a Stripe test card", async ({ page }) => {
  test.skip(process.env.E2E_STRIPE !== "1", "Needs real Stripe test keys in .env.test, E2E_STRIPE=1 and `stripe listen` forwarding to /api/stripe/webhook.");
  await addFromMenu(page, "Margarita", 2);
  await page.goto("/commande");
  await page.getByRole("radio", { name: "Livraison" }).click();
  await page.getByLabel("Adresse", { exact: true }).fill("12 rue des Lois");
  await page.getByLabel("Code postal").fill("31100");
  await page.getByRole("button", { name: /~20:00/ }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Prénom").fill("Sam");
  await page.getByLabel("Téléphone").fill("0612345678");
  await page.getByLabel("E-mail").fill("sam@exemple.fr");
  await page.getByRole("button", { name: /^Payer/ }).click();
  const card = page.frameLocator("iframe[title*='paiement'], iframe[title*='payment']").first();
  await card.getByPlaceholder(/1234/).fill("4242424242424242");
  await card.getByPlaceholder(/MM/).fill("12 / 34");
  await card.getByPlaceholder(/CVC|Code/).fill("123");
  await page.getByRole("button", { name: /^Payer/ }).click();
  await expect(page).toHaveURL(/\/suivi\/.+paye=1/, { timeout: 60_000 });
  await expect(page.getByText("Livraison vers")).toBeVisible({ timeout: 60_000 });
});
