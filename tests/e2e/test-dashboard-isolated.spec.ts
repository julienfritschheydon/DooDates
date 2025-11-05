import { test, expect } from "@playwright/test";
import { attachConsoleGuard, enableE2ELocalMode } from "./utils";

test.describe("Dashboard - Tests Isolés", () => {
  test.beforeEach(async ({ page }) => {
    // Setup localStorage AVANT navigation (via addInitScript)
    await page.addInitScript(() => {
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
      await page.goto("/test/dashboard/selection", { waitUntil: "domcontentloaded" });

      // Attendre que la carte soit visible
      const card = page.locator('[data-testid="poll-item"]').first();
      await expect(card).toBeVisible({ timeout: 3000 });

      // Screenshot initial
      await page.screenshot({ path: "test-results/selection-initial.png", fullPage: true });

      // Vérifier que la carte n'est pas sélectionnée initialement
      await expect(card).not.toHaveClass(/border-blue-500|ring-blue-500/, { timeout: 1000 });

      // Cliquer sur le checkbox pour sélectionner
      const checkbox = card.locator('div[class*="w-6"][class*="h-6"][class*="border-2"]').first();
      await checkbox.waitFor({ state: "visible", timeout: 3000 });
      await checkbox.scrollIntoViewIfNeeded();

      await checkbox.click({ force: true });

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
      await page.goto("/test/dashboard/folder", { waitUntil: "domcontentloaded" });

      // Attendre que le dialogue soit ouvert
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Screenshot du dialogue ouvert
      await dialog.screenshot({ path: "test-results/folder-dialog-open.png" });

      // Utiliser getByRole pour trouver le checkbox Radix UI (plus robuste)
      const folderCheckbox = page.getByRole("checkbox", { name: /Test Folder 1/i });
      await folderCheckbox.waitFor({ state: "visible", timeout: 3000 });
      await folderCheckbox.scrollIntoViewIfNeeded();

      // Vérifier l'état initial (non coché)
      const initialState = await folderCheckbox.getAttribute("data-state");
      console.log("État initial checkbox dossier:", initialState);

      // Cliquer sur le checkbox
      await folderCheckbox.click({ force: true });

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

