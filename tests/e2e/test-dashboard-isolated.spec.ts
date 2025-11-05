import { test, expect } from "@playwright/test";
import { attachConsoleGuard } from "../helpers/consoleGuard";

test.describe("Dashboard - Tests Isolés", () => {
  test.beforeEach(async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /GoogleGenerativeAI/i,
        /API key/i,
        /Error fetching from/i,
        /API key not valid/i,
        /generativelanguage\.googleapis\.com/i,
      ],
    });

    // Setup test data
    await page.evaluate(() => {
      // Créer une conversation de test
      const conversations = [
        {
          id: "test-conv-1",
          title: "Test Conversation",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: "Premier message de test",
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
      ];
      localStorage.setItem("doodates_conversations", JSON.stringify(conversations));

      // Créer des tags de test
      const tags = [
        { id: "tag-1", name: "Test Tag 1", color: "#3b82f6" },
        { id: "tag-2", name: "Test Tag 2", color: "#10b981" },
      ];
      localStorage.setItem("doodates_tags", JSON.stringify(tags));

      // Créer des dossiers de test
      const folders = [
        { id: "folder-1", name: "Test Folder 1", icon: "📁", color: "#f59e0b" },
      ];
      localStorage.setItem("doodates_folders", JSON.stringify(folders));
    });
  });

  test("Test isolé - Sélection d'une carte (border bleu)", async ({ page }) => {
    await page.goto("/test/dashboard/selection", { waitUntil: "networkidle" });

    // Screenshot initial
    await page.screenshot({ path: "test-results/selection-initial.png", fullPage: true });

    // Attendre que la carte soit visible
    const card = page.locator('[data-testid="poll-item"]').first();
    await expect(card).toBeVisible({ timeout: 5000 });

    // Screenshot de la carte avant sélection
    await card.screenshot({ path: "test-results/selection-card-before.png" });

    // Vérifier que la carte n'est pas sélectionnée initialement
    await expect(card).not.toHaveClass(/border-blue-500|ring-blue-500/, { timeout: 1000 });

    // Cliquer sur le checkbox pour sélectionner
    const checkbox = card.locator('div[class*="w-6"][class*="h-6"][class*="border-2"]').first();
    await checkbox.waitFor({ state: "visible", timeout: 5000 });
    await checkbox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Screenshot du checkbox avant clic
    await checkbox.screenshot({ path: "test-results/selection-checkbox-before.png" });

    await checkbox.click({ force: true });

    // Attendre que la sélection se mette à jour
    await page.waitForTimeout(500);

    // Screenshot de la carte après sélection
    await card.screenshot({ path: "test-results/selection-card-after.png" });
    await page.screenshot({ path: "test-results/selection-after.png", fullPage: true });

    // Vérifier que la carte est sélectionnée - VÉRIFIER LES CLASSES CSS RÉELLES
    const cardClasses = await card.getAttribute("class");
    console.log("Classes CSS de la carte après sélection:", cardClasses);

    // Screenshot de la console avec les classes
    const checkboxElement = await checkbox.elementHandle();
    if (checkboxElement) {
      await checkboxElement.screenshot({ path: "test-results/selection-checkbox-after.png" });
    }

    // Vérifier avec une regex plus flexible
    expect(cardClasses).toMatch(/border-blue-500|ring-blue-500|border-blue/);
  });

  test("Test isolé - Sélection d'un dossier dans le dialogue", async ({ page }) => {
    await page.goto("/test/dashboard/folder", { waitUntil: "networkidle" });

    // Screenshot initial
    await page.screenshot({ path: "test-results/folder-initial.png", fullPage: true });

    // Attendre que le dialogue soit ouvert
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Screenshot du dialogue ouvert
    await dialog.screenshot({ path: "test-results/folder-dialog-open.png" });
    await page.screenshot({ path: "test-results/folder-dialog-full.png", fullPage: true });

    // Utiliser getByRole pour trouver le checkbox Radix UI (plus robuste)
    // Radix UI Checkbox utilise role="checkbox" et aria-label ou label associé
    const folderCheckbox = page.getByRole("checkbox", { name: /Test Folder 1/i });
    await folderCheckbox.waitFor({ state: "visible", timeout: 5000 });
    await folderCheckbox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Screenshot de la section dossier avant clic
    const folderSection = dialog.locator('text=Dossier').locator('..').first();
    await folderSection.screenshot({ path: "test-results/folder-section-before.png" });

    // Vérifier l'état initial (non coché)
    const initialState = await folderCheckbox.getAttribute("data-state");
    console.log("État initial checkbox dossier:", initialState);

    // Screenshot du checkbox avant clic
    const checkboxElement = await folderCheckbox.elementHandle();
    if (checkboxElement) {
      await checkboxElement.screenshot({ path: "test-results/folder-checkbox-before.png" });
    }

    // Cliquer sur le checkbox
    await folderCheckbox.click({ force: true });

    // Attendre que la checkbox soit cochée
    await page.waitForTimeout(500);

    // Screenshot après clic
    await folderSection.screenshot({ path: "test-results/folder-section-after.png" });
    await dialog.screenshot({ path: "test-results/folder-dialog-after.png" });

    if (checkboxElement) {
      await checkboxElement.screenshot({ path: "test-results/folder-checkbox-after.png" });
    }

    // Vérifier que la checkbox est cochée en utilisant l'attribut data-state de Radix UI
    await expect(folderCheckbox).toHaveAttribute("data-state", "checked", { timeout: 3000 });

    // Screenshot final
    await page.screenshot({ path: "test-results/folder-final.png", fullPage: true });
  });
});

