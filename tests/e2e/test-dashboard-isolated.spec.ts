import { test, expect } from "@playwright/test";
import { attachConsoleGuard, enableE2ELocalMode } from "./utils";

// Activer les traces et vidéo pour voir ce qui se passe (top-level requis)
test.use({
  trace: 'on',
  video: 'on',
});

test.describe("Dashboard - Tests Isolés", () => {
  test.beforeEach(async ({ page }) => {
    // Pages isolées - pas besoin de localStorage car les pages sont complètement autonomes
    await enableE2ELocalMode(page);
  });

  test("Test isolé - Sélection d'une carte (border bleu)", async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /GoogleGenerativeAI/i,
        /API key/i,
        /Error fetching from/i,
        /API key not valid/i,
        /generativelanguage\.googleapis\.com/i,
      ],
    });
    try {
      console.log("📸 Navigation vers /test/dashboard/selection");
      await page.goto("/test/dashboard/selection", { waitUntil: "domcontentloaded" });
      console.log("✅ Page chargée");

      // Attendre que la carte soit visible
      console.log("🔍 Recherche de la carte...");
      const card = page.locator('[data-testid="poll-item"]').first();
      await expect(card).toBeVisible({ timeout: 3000 });
      console.log("✅ Carte trouvée et visible");

      // Screenshot initial
      await page.screenshot({ path: "test-results/selection-initial.png", fullPage: true });

      // Vérifier que la carte n'est pas sélectionnée initialement
      await expect(card).not.toHaveClass(/border-blue-500|ring-blue-500/, { timeout: 1000 });

      // Cliquer sur le checkbox pour sélectionner
      console.log("🔍 Recherche du checkbox...");
      const checkbox = card.locator('div[class*="w-6"][class*="h-6"][class*="border-2"]').first();
      await checkbox.waitFor({ state: "visible", timeout: 3000 });
      console.log("✅ Checkbox trouvé");
      await checkbox.scrollIntoViewIfNeeded();
      console.log("🖱️ Clic sur le checkbox...");
      await checkbox.click({ force: true });
      console.log("✅ Clic effectué");

      // Attendre que la sélection se mette à jour (vérification automatique par toHaveClass)
      await expect(card).toHaveClass(/border-blue-500|ring-blue-500|border-blue/, { timeout: 2000 });

      // Screenshot après sélection (essentiel pour debug)
      await page.screenshot({ path: "test-results/selection-after.png", fullPage: true });
      const cardClasses = await card.getAttribute("class");
      console.log("Classes CSS de la carte après sélection:", cardClasses);
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test("Test isolé - Sélection d'un dossier dans le dialogue", async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /GoogleGenerativeAI/i,
        /API key/i,
        /Error fetching from/i,
        /API key not valid/i,
        /generativelanguage\.googleapis\.com/i,
      ],
    });
    try {
      console.log("📸 Navigation vers /test/dashboard/folder");
      await page.goto("/test/dashboard/folder", { waitUntil: "domcontentloaded" });
      console.log("✅ Page chargée");

      // Attendre que le dialogue soit ouvert
      console.log("🔍 Recherche du dialogue...");
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      console.log("✅ Dialogue ouvert et visible");

      // Screenshot du dialogue ouvert
      await dialog.screenshot({ path: "test-results/folder-dialog-open.png" });

      // Utiliser getByRole pour trouver le checkbox Radix UI (plus robuste)
      console.log("🔍 Recherche du checkbox 'Test Folder 1'...");
      const folderCheckbox = page.getByRole("checkbox", { name: /Test Folder 1/i });
      await folderCheckbox.waitFor({ state: "visible", timeout: 3000 });
      console.log("✅ Checkbox trouvé");
      await folderCheckbox.scrollIntoViewIfNeeded();

      // Vérifier l'état initial (non coché)
      const initialState = await folderCheckbox.getAttribute("data-state");
      console.log("📊 État initial checkbox dossier:", initialState);

      // Cliquer sur le checkbox
      console.log("🖱️ Clic sur le checkbox...");
      await folderCheckbox.click({ force: true });
      console.log("✅ Clic effectué");

      // Vérifier que la checkbox est cochée (vérification automatique avec timeout)
      await expect(folderCheckbox).toHaveAttribute("data-state", "checked", { timeout: 2000 });

      // Screenshot après clic (essentiel pour debug)
      await dialog.screenshot({ path: "test-results/folder-dialog-after.png" });
      await page.screenshot({ path: "test-results/folder-final.png", fullPage: true });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});

