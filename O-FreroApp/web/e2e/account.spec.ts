import { expect, test, type Page } from "@playwright/test";
import { addFromMenu, checkoutPickupAtCounter, grantStamps, lastEmailLink, signIn, testEnv } from "./helpers";

test.describe.configure({ mode: "serial" });

const EMAIL = "e2e@exemple.fr";
const PASSWORD = "motdepasse-e2e";

async function completeOrderAsAdmin(page: Page, firstName: string) {
  await signIn(page, testEnv.ADMIN_EMAIL!, testEnv.ADMIN_PASSWORD!);
  await page.goto("/admin/commandes");
  await page.getByRole("link", { name: new RegExp(`· ${firstName}`) }).first().click();
  for (const step of ["Mettre au four", "Prête", "Récupérée"]) {
    await page.getByRole("button", { name: step, exact: true }).click();
    await expect(page.getByRole("button", { name: step, exact: true })).toHaveCount(0);
  }
}

test("a guest creates an account with the same e-mail and gets the order and its stamps", async ({ page, browser }) => {
  await addFromMenu(page, "Margarita", 2);
  await checkoutPickupAtCounter(page, { firstName: "Inès", email: EMAIL });
  await page.getByRole("link", { name: "Garder mes tampons" }).click();
  await expect(page.getByLabel("E-mail")).toHaveValue(EMAIL);

  await page.getByLabel("Prénom").fill("Inès");
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("heading", { name: "Vérifie ta boîte mail" })).toBeVisible();

  await page.goto(lastEmailLink(EMAIL, "Confirme"));
  await expect(page).toHaveURL(/\/compte\?verifie=1/);
  await expect(page.getByText("2 × Margarita")).toBeVisible();
  await expect(page.getByText("0 / 10")).toBeVisible();

  const admin = await browser.newPage();
  await completeOrderAsAdmin(admin, "Inès");
  await admin.close();

  await page.reload();
  // One stamp per pickup order, even with two pizzas.
  await expect(page.getByText("1 / 10")).toBeVisible();
});

test("an account with 10 stamps gets a free pizza", async ({ page }) => {
  grantStamps(EMAIL, 9);

  await signIn(page, EMAIL, PASSWORD);
  await expect(page.getByText("Ta pizza offerte t'attend")).toBeVisible();

  await addFromMenu(page, "Margarita", 1);
  await page.goto("/commande");
  await page.getByRole("button", { name: "19:30", exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByLabel("E-mail")).toHaveValue(EMAIL);
  await page.getByLabel("Téléphone").fill("0612345678");
  await page.getByLabel("Utiliser ma pizza offerte").check();
  await expect(page.getByText("Pizza offerte")).toBeVisible();
  await page.getByRole("radio", { name: /Payer au retrait/ }).click();
  await expect(page.getByRole("button", { name: /Valider la commande/ })).toContainText("0,00");
  await page.getByRole("button", { name: /Valider la commande/ }).click();
  await expect(page.getByText("dont 1 offerte")).toBeVisible();
});
