import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, warmup, enableE2ELocalMode } from './utils';

/**
 * Tests E2E pour la gestion des tags et dossiers
 * 
 * @tags @dashboard @tags @folders @organization
 */
test.describe('Dashboard - Tags et Dossiers', () => {
  test.describe.configure({ mode: 'serial' });

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
    try {
      await enableE2ELocalMode(page);
      await warmup(page);
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  /**
   * Setup initial : créer une conversation et des tags/dossiers de test
   */
  async function setupTestData(page: Page) {
    // Créer des tags de test
    await page.evaluate(() => {
      const tags = [
        { id: 'tag-1', name: 'Test Tag 1', color: '#3b82f6', createdAt: new Date().toISOString() },
        { id: 'tag-2', name: 'Test Tag 2', color: '#ef4444', createdAt: new Date().toISOString() },
        { id: 'tag-3', name: 'Test Tag 3', color: '#10b981', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('doodates_tags', JSON.stringify(tags));
    });

    // Créer des dossiers de test
    await page.evaluate(() => {
      const folders = [
        { id: 'folder-1', name: 'Test Folder 1', color: '#3b82f6', icon: '📁', createdAt: new Date().toISOString() },
        { id: 'folder-2', name: 'Test Folder 2', color: '#ef4444', icon: '📂', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('doodates_folders', JSON.stringify(folders));
    });

    // Créer une conversation de test
    await page.evaluate(() => {
      const conversations = [
        {
          id: 'test-conv-1',
          title: 'Conversation de test pour tags',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message de test',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
      ];
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    });
  }

  test('@smoke @critical - Ouvrir le dialogue de gestion tags/dossiers', async ({ page }) => {
    // Réutiliser le guard du beforeEach qui a déjà l'allowlist configurée
    // Ne pas créer un nouveau guard pour éviter les erreurs GoogleGenerativeAI
    await setupTestData(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Attendre que les cartes se chargent
    await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

    // Trouver la carte de conversation
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached' });

    // Trouver le bouton menu - chercher un bouton dans la carte qui contient une icône SVG
    // Le bouton menu est généralement dans le coin supérieur droit de la carte
    const menuButtons = conversationCard.locator('button');
    const menuButtonCount = await menuButtons.count();
    
    // Prendre le dernier bouton (généralement le menu est en dernier)
    let menuButton = menuButtons.last();
    
    // Si plusieurs boutons, chercher celui qui ouvre un menu (dropdown)
    if (menuButtonCount > 1) {
      for (let i = menuButtonCount - 1; i >= 0; i--) {
        const btn = menuButtons.nth(i);
        const isVisible = await btn.isVisible();
        if (isVisible) {
          menuButton = btn;
          break;
        }
      }
    }
    
    await menuButton.waitFor({ state: 'visible', timeout: 5000 });
    await menuButton.click();
    
    // Attendre un peu que le menu s'ouvre
    await page.waitForTimeout(500);

    // Attendre que le menu s'ouvre et contient "Gérer les tags/dossier"
    const manageMenuItem = page.getByText('Gérer les tags/dossier');
    await expect(manageMenuItem).toBeVisible({ timeout: 5000 });

    // Cliquer sur "Gérer les tags/dossier"
    await manageMenuItem.click();
    
    // Attendre un peu que le dialogue s'ouvre
    await page.waitForTimeout(500);

    // Vérifier que le dialogue s'ouvre avec le titre
    await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });
  });

  test.skip('@functional - Assigner des tags à une conversation', async ({ page }) => {
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
      await setupTestData(page);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Ouvrir le dialogue
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();
      
      // Trouver le bouton menu
      const menuButtons = conversationCard.locator('button');
      const menuButtonCount = await menuButtons.count();
      let menuButton = menuButtons.last();
      if (menuButtonCount > 1) {
        for (let i = menuButtonCount - 1; i >= 0; i--) {
          const btn = menuButtons.nth(i);
          const isVisible = await btn.isVisible();
          if (isVisible) {
            menuButton = btn;
            break;
          }
        }
      }
      
      await menuButton.waitFor({ state: 'visible', timeout: 5000 });
      await menuButton.click();
      await page.waitForTimeout(500);
      
      await page.getByText('Gérer les tags/dossier').click();
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });

      // S'assurer que le dialogue est ouvert
      const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Gérer les tags et le dossier' });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Sélectionner un tag - trouver le conteneur div avec les classes flex items-center space-x-2
      // qui contient le texte "Test Tag 1" dans le dialogue
      const tag1Text = dialog.getByText('Test Tag 1').first();
      await tag1Text.waitFor({ state: 'visible', timeout: 5000 });
      
      // Trouver le conteneur parent (div.flex.items-center.space-x-2) qui contient ce texte
      const tag1Container = tag1Text.locator('..').locator('..').first(); // span -> label -> div
      await tag1Container.waitFor({ state: 'visible', timeout: 3000 });
      await tag1Container.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      
      // Trouver le checkbox Radix UI dans ce conteneur
      const tag1Checkbox = tag1Container.locator('[role="checkbox"]').first();
      await tag1Checkbox.waitFor({ state: 'visible', timeout: 3000 });
      
      // Vérifier que le dialogue est toujours visible avant le clic
      await expect(dialog).toBeVisible({ timeout: 2000 });
      
      // Cliquer sur le checkbox
      await tag1Checkbox.click({ force: true });
      
      // Attendre que l'état change (peut être asynchrone)
      await page.waitForTimeout(300);

      // Vérifier que le dialogue est toujours ouvert après le clic
      // Attendre un peu plus longtemps pour permettre les re-renders
      await page.waitForTimeout(500);
      
      // Re-questionner le dialogue pour s'assurer qu'il n'est pas stale
      const dialogStillOpen = page.locator('[role="dialog"]').filter({ hasText: 'Gérer les tags et le dossier' });
      
      // Vérifier plusieurs fois avec des timeouts courts pour gérer les cas où le dialogue pourrait être temporairement invisible
      let retries = 0;
      const maxRetries = 10;
      while (retries < maxRetries) {
        try {
          await expect(dialogStillOpen).toBeVisible({ timeout: 1000 });
          break; // Le dialogue est visible, on peut continuer
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            // Si après tous les essais le dialogue n'est toujours pas visible, c'est une erreur
            throw new Error(`Le dialogue n'est pas visible après ${maxRetries} tentatives. Il s'est peut-être fermé après le premier clic.`);
          }
          // Attendre un peu avant de réessayer
          await page.waitForTimeout(300);
        }
      }

      // Sélectionner un autre tag - chercher uniquement dans le dialogue
      // Le conteneur des tags a max-h-48 et overflow-y-auto, donc il faut peut-être scroller
      const tagsContainer = dialogStillOpen.locator('div[class*="max-h"]').filter({ hasText: /Tags/i }).or(
        dialogStillOpen.locator('div').filter({ has: page.getByText('Test Tag 1') }).first().locator('..').first()
      ).first();
      
      // Scroller vers le bas pour rendre "Test Tag 2" visible
      await tagsContainer.evaluate((el) => {
        const scrollable = el.querySelector('[class*="overflow-y"]') || el;
        scrollable.scrollTop = scrollable.scrollHeight;
      });
      await page.waitForTimeout(500);
      
      const tag2Text = dialogStillOpen.getByText('Test Tag 2').first();
      await tag2Text.waitFor({ state: 'visible', timeout: 5000 });
      
      const tag2Container = tag2Text.locator('..').locator('..').first(); // span -> label -> div
      await tag2Container.waitFor({ state: 'visible', timeout: 3000 });
      await tag2Container.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      
      const tag2Checkbox = tag2Container.locator('[role="checkbox"]').first();
      await tag2Checkbox.waitFor({ state: 'visible', timeout: 3000 });
      await tag2Checkbox.click({ force: true });
      
      // Attendre que l'état change
      await page.waitForTimeout(500);

      // Sauvegarder
      const saveButton = page.getByRole('button', { name: /Enregistrer/i });
      await saveButton.waitFor({ state: 'visible', timeout: 3000 });
      await saveButton.click();

      // Vérifier le toast de succès
      await expect(page.getByText(/Mise à jour réussie/i)).toBeVisible({ timeout: 5000 });

      // Attendre que le dialogue se ferme et que la carte se rafraîchisse
      await page.waitForTimeout(1500);
      
      // Vérifier que les tags apparaissent sur la carte - utiliser une recherche plus flexible
      const tagsOnCard = conversationCard.getByText('Test Tag 1');
      await expect(tagsOnCard).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test.skip('@functional - Assigner un dossier à une conversation', async ({ page }) => {
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
      await setupTestData(page);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Ouvrir le dialogue
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();
      const menuButton = conversationCard.locator('button').filter({ has: page.locator('svg') }).first();
      await menuButton.click();
      await page.getByText('Gérer les tags/dossier').click();
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible();

      // Sélectionner un dossier (trouver via le label associé)
      const folderLabel = page.getByText('Test Folder 1').first();
      await folderLabel.waitFor({ state: 'visible', timeout: 3000 });
      const folderCheckbox = folderLabel.locator('..').locator('input[type="checkbox"]').first();
      await folderCheckbox.check();

      // Sauvegarder
      await page.getByRole('button', { name: /Enregistrer/i }).click();

      // Vérifier le toast de succès
      await expect(page.getByText(/Mise à jour réussie/i)).toBeVisible({ timeout: 3000 });

      // Vérifier que le dossier apparaît sur la carte
      await page.waitForTimeout(1000); // Attendre le rafraîchissement
      const folderOnCard = conversationCard.locator('text=Test Folder 1');
      await expect(folderOnCard).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test.skip('@functional - Retirer des tags et dossier d\'une conversation', async ({ page }) => {
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
      // Créer une conversation avec tags et dossier
      await page.evaluate(() => {
        const conversations = [
          {
            id: 'test-conv-2',
            title: 'Conversation avec tags et dossier',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            firstMessage: 'Premier message',
            messageCount: 1,
            isFavorite: false,
            tags: ['Test Tag 1', 'Test Tag 2'],
            metadata: { folderId: 'folder-1' },
          },
        ];
        localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
      });

      await setupTestData(page);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Ouvrir le dialogue
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();
      const menuButton = conversationCard.locator('button').filter({ has: page.locator('svg') }).first();
      await menuButton.click();
      await page.getByText('Gérer les tags/dossier').click();
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible();

      // Désélectionner tous les tags
      // Trouver les labels des tags et leurs checkboxes associées
      const tagLabels = ['Test Tag 1', 'Test Tag 2', 'Test Tag 3'];
      for (const tagName of tagLabels) {
        const tagLabel = page.getByText(tagName).first();
        if (await tagLabel.isVisible()) {
          const checkbox = tagLabel.locator('..').locator('input[type="checkbox"]').first();
          if (await checkbox.isChecked()) {
            await checkbox.uncheck();
          }
        }
      }

      // Désélectionner le dossier (sélectionner "Aucun dossier")
      const noFolderLabel = page.getByText('Aucun dossier').first();
      const noFolderCheckbox = noFolderLabel.locator('..').locator('input[type="checkbox"]').first();
      await noFolderCheckbox.check();

      // Sauvegarder
      await page.getByRole('button', { name: /Enregistrer/i }).click();

      // Vérifier le toast de succès
      await expect(page.getByText(/Mise à jour réussie/i)).toBeVisible({ timeout: 3000 });

      // Vérifier que les tags et dossier ont disparu de la carte
      await page.waitForTimeout(1000);
      const tagsOnCard = conversationCard.locator('text=Test Tag');
      await expect(tagsOnCard).toHaveCount(0, { timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Afficher les tags et dossiers sur les cartes', async ({ page }) => {
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
      // Créer une conversation avec tags et dossier
      await page.evaluate(() => {
        const conversations = [
          {
            id: 'test-conv-3',
            title: 'Conversation avec tags et dossier visibles',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            firstMessage: 'Premier message',
            messageCount: 1,
            isFavorite: false,
            tags: ['Test Tag 1', 'Test Tag 2'],
            metadata: { folderId: 'folder-1' },
          },
        ];
        localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
      });

      await setupTestData(page);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Attendre que les cartes se chargent
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();

      // Vérifier que les tags sont visibles
      await expect(conversationCard.locator('text=Test Tag 1')).toBeVisible({ timeout: 5000 });
      await expect(conversationCard.locator('text=Test Tag 2')).toBeVisible({ timeout: 5000 });

      // Vérifier que le dossier est visible
      await expect(conversationCard.locator('text=Test Folder 1')).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test.skip('@edge - Gérer tags/dossiers avec une conversation sans tags/dossiers existants', async ({ page }) => {
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
      await setupTestData(page);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Ouvrir le dialogue
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();
      const menuButton = conversationCard.locator('button').filter({ has: page.locator('svg') }).first();
      await menuButton.click();
      await page.getByText('Gérer les tags/dossier').click();
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible();

      // Vérifier que le dialogue s'ouvre sans erreur
      await expect(page.getByText(/Tags/i)).toBeVisible();
      await expect(page.getByText(/Dossier/i)).toBeVisible();

      // Sélectionner un tag et un dossier
      const tag1Label = page.getByText('Test Tag 1').first();
      const tag1Checkbox = tag1Label.locator('..').locator('input[type="checkbox"]').first();
      await tag1Checkbox.check();

      const folder1Label = page.getByText('Test Folder 1').first();
      const folder1Checkbox = folder1Label.locator('..').locator('input[type="checkbox"]').first();
      await folder1Checkbox.check();

      // Sauvegarder
      await page.getByRole('button', { name: /Enregistrer/i }).click();

      // Vérifier le succès
      await expect(page.getByText(/Mise à jour réussie/i)).toBeVisible({ timeout: 3000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
