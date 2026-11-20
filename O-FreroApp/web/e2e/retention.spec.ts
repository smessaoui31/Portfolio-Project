import { expect, test } from "@playwright/test";
import { addFromMenu, checkoutPickupAtCounter, signIn, testEnv } from "./helpers";

test("a guest reorders the last order from the home page in two taps", async ({ page }) => {
  await addFromMenu(page, "Margarita", 2);
  await checkoutPickupAtCounter(page, { firstName: "Léa", email: "lea.recommande@exemple.fr" });

  await page.goto("/");
  const card = page.getByRole("region", { name: "Ta dernière commande" });
  await expect(card).toContainText("2 × Margarita");
  await card.getByRole("button", { name: /Recommander/ }).click();
  await expect(page).toHaveURL(/\/commande$/);

  await page.getByRole("button", { name: "19:30", exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByLabel("Prénom")).toHaveValue("Léa");
  await expect(page.getByLabel("E-mail")).toHaveValue("lea.recommande@exemple.fr");
  await expect(page.getByText("2 × Margarita")).toBeVisible();
});

test("forgetting the remembered order hides the card", async ({ page }) => {
  await addFromMenu(page, "Margarita", 1);
  await checkoutPickupAtCounter(page, { firstName: "Tom", email: "tom@exemple.fr" });
  await page.goto("/");
  await page.getByRole("button", { name: "Oublier ces informations" }).click();
  await expect(page.getByRole("region", { name: "Ta dernière commande" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Ta dernière commande" })).toHaveCount(0);
});

test("a completed order can be rated from its tracking page", async ({ page, browser }) => {
  await addFromMenu(page, "Reine", 1);
  await checkoutPickupAtCounter(page, { firstName: "Zoé", email: "zoe.note@exemple.fr" });
  const tracking = page.url();

  const admin = await browser.newPage();
  await signIn(admin, testEnv.ADMIN_EMAIL!, testEnv.ADMIN_PASSWORD!);
  await admin.goto("/admin/commandes");
  await admin.getByRole("link", { name: /· Zoé/ }).click();
  for (const step of ["Mettre au four", "Prête", "Récupérée"]) {
    await admin.getByRole("button", { name: step, exact: true }).click();
    await expect(admin.getByRole("button", { name: step, exact: true })).toHaveCount(0);
  }
  await admin.close();

  await page.goto(tracking);
  await expect(page.getByRole("heading", { name: "Alors, c'était comment ?" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Excellent" }).click();
  await page.getByLabel("Un mot pour les frères (facultatif)").fill("La pâte est parfaite");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Merci, c'est noté.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Merci, c'est noté.")).toBeVisible();
});
