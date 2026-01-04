import { test, expect } from "@playwright/test";

test.describe("🔒 RGPD - Composants Invité", () => {
  test("RGPD-VERIF-01: La page d'accueil charge la bannière invité", async ({ page }) => {
    await page.goto("/DooDates/");
    // Attendre un peu pour le chargement du quota et du useEffect
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const bodyContent = await page.textContent("body");
    expect(bodyContent).toMatch(/Mode Invité/i);
  });

  test("RGPD-VERIF-02: Le créateur de formulaire affiche le champ email pour les invités", async ({
    page,
  }) => {
    await page.goto("/DooDates/form/workspace/form");
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
  });

  test("RGPD-VERIF-03: Le créateur de sondage de dates affiche le champ email pour les invités", async ({
    page,
  }) => {
    await page.goto("/DooDates/date/workspace/date");
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
  });
});
