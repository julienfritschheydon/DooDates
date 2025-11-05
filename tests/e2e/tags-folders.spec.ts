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

  test('@functional - Assigner des tags à une conversation', async ({ page }) => {
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

      // Sélectionner un tag - utiliser getByRole (comme dans les tests isolés qui marchent)
      const tagCheckbox = page.getByRole('checkbox', { name: /Test Tag 1/i });
      await tagCheckbox.waitFor({ state: 'visible', timeout: 3000 });
      await tagCheckbox.scrollIntoViewIfNeeded();
      
      // Vérifier que le dialogue est toujours visible avant le clic
      await expect(dialog).toBeVisible({ timeout: 2000 });
      
      // Cliquer sur le checkbox
      await tagCheckbox.click({ force: true });
      
      // Attendre que React se mette à jour
      await page.waitForTimeout(100);

      // Vérifier que le dialogue est toujours ouvert après le clic
      await expect(dialog).toBeVisible({ timeout: 2000 });

      // Sélectionner un autre tag - utiliser getByRole (comme dans les tests isolés qui marchent)
      const tag2Checkbox = page.getByRole('checkbox', { name: /Test Tag 2/i });
      await tag2Checkbox.waitFor({ state: 'visible', timeout: 3000 });
      await tag2Checkbox.scrollIntoViewIfNeeded();
      await tag2Checkbox.click({ force: true });
      
      // Attendre que React se mette à jour
      await page.waitForTimeout(100);
      
      // Vérifier que le dialogue est toujours ouvert
      await expect(dialog).toBeVisible({ timeout: 2000 });

      // Sauvegarder
      const saveButton = page.getByRole('button', { name: /Enregistrer/i });
      await saveButton.waitFor({ state: 'visible', timeout: 3000 });
      await saveButton.click();

      // Vérifier le toast de succès (utiliser .first() pour éviter strict mode violation)
      // Le texte apparaît dans le toast visible ET dans l'élément aria-live, on prend le premier
      await expect(page.getByText(/Mise à jour réussie/i).first()).toBeVisible({ timeout: 5000 });

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

  test('@functional - Assigner un dossier à une conversation', async ({ page }) => {
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

      // Ouvrir le dialogue avec sélecteur robuste
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();
      await conversationCard.waitFor({ state: 'attached' });
      
      // Sélecteur robuste : chercher tous les boutons et prendre le dernier visible
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
      await page.waitForTimeout(500); // Attendre que le menu s'ouvre
      
      const manageMenuItem = page.getByText('Gérer les tags/dossier');
      await expect(manageMenuItem).toBeVisible({ timeout: 5000 });
      await manageMenuItem.click();
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });

      // Sélectionner un dossier - utiliser getByRole (comme dans les tests isolés qui marchent)
      const folderCheckbox = page.getByRole('checkbox', { name: /Test Folder 1/i });
      await folderCheckbox.waitFor({ state: 'visible', timeout: 3000 });
      await folderCheckbox.scrollIntoViewIfNeeded();
      await folderCheckbox.click({ force: true });
      
      // Attendre que React se mette à jour
      await page.waitForTimeout(100);
      
      // Vérifier que le checkbox est coché
      await expect(folderCheckbox).toHaveAttribute('data-state', 'checked', { timeout: 2000 });

      // Sauvegarder
      await page.getByRole('button', { name: /Enregistrer/i }).click();

      // Vérifier le toast de succès (utiliser .first() pour éviter strict mode violation)
      // Le texte apparaît dans le toast visible ET dans l'élément aria-live, on prend le premier
      await expect(page.getByText(/Mise à jour réussie/i).first()).toBeVisible({ timeout: 3000 });

      // Vérifier que le dossier apparaît sur la carte
      // Le dossier est affiché comme "📁 Test Folder 1" (icône + nom)
      await page.waitForTimeout(1000); // Attendre le rafraîchissement
      // Utiliser getByText avec le nom du dossier dans le contexte de la carte
      const folderOnCard = conversationCard.getByText(/Test Folder 1/i);
      await expect(folderOnCard).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Retirer des tags et dossier d\'une conversation', async ({ page }) => {
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

      // Ouvrir le dialogue avec sélecteur robuste
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();
      await conversationCard.waitFor({ state: 'attached' });
      
      // Sélecteur robuste : chercher tous les boutons et prendre le dernier visible
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
      await page.waitForTimeout(500); // Attendre que le menu s'ouvre
      
      const manageMenuItem = page.getByText('Gérer les tags/dossier');
      await expect(manageMenuItem).toBeVisible({ timeout: 5000 });
      await manageMenuItem.click();
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });

      // Désélectionner tous les tags - utiliser getByRole (comme dans les tests qui marchent)
      const tagLabels = ['Test Tag 1', 'Test Tag 2', 'Test Tag 3'];
      for (const tagName of tagLabels) {
        try {
          const checkbox = page.getByRole('checkbox', { name: new RegExp(tagName, 'i') });
          const isVisible = await checkbox.isVisible({ timeout: 2000 }).catch(() => false);
          if (isVisible) {
            const isChecked = await checkbox.isChecked({ timeout: 2000 }).catch(() => false);
            if (isChecked) {
              await checkbox.uncheck({ timeout: 3000 });
            }
          }
        } catch (error) {
          // Tag non trouvé, continuer
        }
      }

      // Désélectionner le dossier (sélectionner "Aucun dossier") - utiliser getByRole
      const noFolderCheckbox = page.getByRole('checkbox', { name: /Aucun dossier/i });
      await noFolderCheckbox.waitFor({ state: 'visible', timeout: 3000 });
      await noFolderCheckbox.check();

      // Sauvegarder
      await page.getByRole('button', { name: /Enregistrer/i }).click();

      // Vérifier le toast de succès (utiliser .first() pour éviter strict mode violation)
      await expect(page.getByText(/Mise à jour réussie/i).first()).toBeVisible({ timeout: 3000 });

      // Vérifier que les tags et dossier ont disparu de la carte
      await page.waitForTimeout(1000);
      // Utiliser getByText pour une recherche plus flexible
      const tagsOnCard = conversationCard.getByText(/Test Tag/i);
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

      // Vérifier que les tags sont visibles - utiliser getByText (comme dans les autres tests corrigés)
      const tag1OnCard = conversationCard.getByText(/Test Tag 1/i);
      await expect(tag1OnCard).toBeVisible({ timeout: 5000 });
      
      const tag2OnCard = conversationCard.getByText(/Test Tag 2/i);
      await expect(tag2OnCard).toBeVisible({ timeout: 5000 });

      // Vérifier que le dossier est visible - utiliser getByText
      const folderOnCard = conversationCard.getByText(/Test Folder 1/i);
      await expect(folderOnCard).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@edge - Gérer tags/dossiers avec une conversation sans tags/dossiers existants', async ({ page }) => {
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

      // Ouvrir le dialogue avec sélecteur robuste
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      const conversationCard = page.locator('[data-testid="poll-item"]').first();
      await conversationCard.waitFor({ state: 'attached' });
      
      // Sélecteur robuste : chercher tous les boutons et prendre le dernier visible
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
      await page.waitForTimeout(500); // Attendre que le menu s'ouvre
      
      const manageMenuItem = page.getByText('Gérer les tags/dossier');
      await expect(manageMenuItem).toBeVisible({ timeout: 5000 });
      await manageMenuItem.click();
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });

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
