import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, warmup, enableE2ELocalMode, openTagsFolderDialog, verifyTagsFoldersLoaded } from './utils';

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
        /Erreur lors de l'initialisation de la session/i,
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
    await setupTestData(page);
    await verifyTagsFoldersLoaded(page);
    
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Attendre que les cartes se chargent
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached', timeout: 10000 });

    // Ouvrir le dialogue en utilisant le helper
    const dialog = await openTagsFolderDialog(page, conversationCard);

    // Vérifier que le dialogue contient les sections Tags et Dossier
    await expect(dialog.getByText(/Tags/i).first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText(/Dossier/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('@functional - Assigner des tags à une conversation', async ({ page }) => {
    await setupTestData(page);
    await verifyTagsFoldersLoaded(page);
    
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Attendre que les cartes se chargent
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached', timeout: 10000 });

    // Ouvrir le dialogue en utilisant le helper
    const dialog = await openTagsFolderDialog(page, conversationCard);

    // Sélectionner un tag
    const tagCheckbox = page.getByRole('checkbox', { name: /Test Tag 1/i });
    await tagCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await tagCheckbox.scrollIntoViewIfNeeded();
    
    // Vérifier que le dialogue est toujours visible avant le clic
    await expect(dialog).toBeVisible();
    
    // Cliquer sur le checkbox et attendre qu'il soit coché
    await tagCheckbox.click({ force: true });
    await expect(tagCheckbox).toBeChecked({ timeout: 3000 });

    // Sélectionner un autre tag
    const tag2Checkbox = page.getByRole('checkbox', { name: /Test Tag 2/i });
    await tag2Checkbox.waitFor({ state: 'visible', timeout: 5000 });
    await tag2Checkbox.scrollIntoViewIfNeeded();
    await tag2Checkbox.click({ force: true });
    
    // Attendre que le deuxième tag soit coché
    await expect(tag2Checkbox).toBeChecked({ timeout: 3000 });
    
    // Vérifier que le dialogue est toujours ouvert
    await expect(dialog).toBeVisible();

    // Sauvegarder
    const saveButton = page.getByRole('button', { name: /Enregistrer/i });
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    // Vérifier le toast de succès
    await expect(page.getByText(/Mise à jour réussie/i).first()).toBeVisible({ timeout: 5000 });

    // Attendre que le dialogue se ferme (utiliser expect.poll pour attendre la fermeture)
    await expect.poll(async () => {
      const isVisible = await dialog.isVisible().catch(() => false);
      return !isVisible;
    }, { timeout: 5000 }).toBe(true);
    
    // Vérifier que les tags apparaissent sur la carte après rafraîchissement
    await expect(conversationCard.getByText('Test Tag 1')).toBeVisible({ timeout: 5000 });
    await expect(conversationCard.getByText('Test Tag 2')).toBeVisible({ timeout: 5000 });
  });

  test('@functional - Assigner un dossier à une conversation', async ({ page }) => {
    await setupTestData(page);
    await verifyTagsFoldersLoaded(page);
    
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Attendre que les cartes se chargent
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached', timeout: 10000 });

    // Ouvrir le dialogue en utilisant le helper
    const dialog = await openTagsFolderDialog(page, conversationCard);

    // Sélectionner un dossier
    const folderCheckbox = page.getByRole('checkbox', { name: /Test Folder 1/i });
    await folderCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await folderCheckbox.scrollIntoViewIfNeeded();
    await folderCheckbox.click({ force: true });
    
    // Vérifier que le checkbox est coché (attente explicite)
    await expect(folderCheckbox).toHaveAttribute('data-state', 'checked', { timeout: 3000 });

    // Sauvegarder
    const saveButton = page.getByRole('button', { name: /Enregistrer/i });
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    // Vérifier le toast de succès
    await expect(page.getByText(/Mise à jour réussie/i).first()).toBeVisible({ timeout: 5000 });

    // Attendre que le dialogue se ferme
    await expect.poll(async () => {
      const isVisible = await dialog.isVisible().catch(() => false);
      return !isVisible;
    }, { timeout: 5000 }).toBe(true);

    // Vérifier que le dossier apparaît sur la carte après rafraîchissement
    await expect(conversationCard.getByText(/Test Folder 1/i)).toBeVisible({ timeout: 5000 });
  });

  test('@functional - Retirer des tags et dossier d\'une conversation', async ({ page }) => {
    // Setup les tags et dossiers
    await page.evaluate(() => {
      const tags = [
        { id: 'tag-1', name: 'Test Tag 1', color: '#3b82f6', createdAt: new Date().toISOString() },
        { id: 'tag-2', name: 'Test Tag 2', color: '#ef4444', createdAt: new Date().toISOString() },
        { id: 'tag-3', name: 'Test Tag 3', color: '#10b981', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('doodates_tags', JSON.stringify(tags));

      const folders = [
        { id: 'folder-1', name: 'Test Folder 1', color: '#3b82f6', icon: '📁', createdAt: new Date().toISOString() },
        { id: 'folder-2', name: 'Test Folder 2', color: '#ef4444', icon: '📂', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('doodates_folders', JSON.stringify(folders));
    });
    await verifyTagsFoldersLoaded(page);

    // Créer la conversation avec tags et dossier
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
    
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Attendre que les cartes se chargent (timeout plus long pour Safari/WebKit)
    await page.waitForSelector('[data-testid="poll-item"]', { timeout: 15000 });
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached', timeout: 5000 });

    // Vérifier que les tags et dossier sont visibles avant retrait
    await expect(conversationCard.getByText(/Test Tag 1/i)).toBeVisible({ timeout: 5000 });
    await expect(conversationCard.getByText(/Test Tag 2/i)).toBeVisible({ timeout: 5000 });
    await expect(conversationCard.getByText(/Test Folder 1/i)).toBeVisible({ timeout: 5000 });

    // Ouvrir le dialogue en utilisant le helper
    const dialog = await openTagsFolderDialog(page, conversationCard);

    // Désélectionner tous les tags cochés
    const tagLabels = ['Test Tag 1', 'Test Tag 2'];
    for (const tagName of tagLabels) {
      const checkbox = page.getByRole('checkbox', { name: new RegExp(tagName, 'i') });
      const isVisible = await checkbox.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        const isChecked = await checkbox.isChecked({ timeout: 2000 }).catch(() => false);
        if (isChecked) {
          await checkbox.uncheck({ timeout: 3000 });
          // Attendre que le tag soit décoché
          await expect(checkbox).not.toBeChecked({ timeout: 2000 });
        }
      }
    }

    // Désélectionner le dossier (sélectionner "Aucun dossier")
    const noFolderCheckbox = page.getByRole('checkbox', { name: /Aucun dossier/i });
    await noFolderCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await noFolderCheckbox.check();
    
    // Vérifier que "Aucun dossier" est coché
    await expect(noFolderCheckbox).toBeChecked({ timeout: 2000 });

    // Sauvegarder
    const saveButton = page.getByRole('button', { name: /Enregistrer/i });
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    // Vérifier le toast de succès
    await expect(page.getByText(/Mise à jour réussie/i).first()).toBeVisible({ timeout: 5000 });

    // Attendre que le dialogue se ferme
    await expect.poll(async () => {
      const isVisible = await dialog.isVisible().catch(() => false);
      return !isVisible;
    }, { timeout: 5000 }).toBe(true);

    // Vérifier que les tags et dossier ont disparu de la carte
    await expect(conversationCard.getByText(/Test Tag/i)).toHaveCount(0, { timeout: 5000 });
    await expect(conversationCard.getByText(/Test Folder 1/i)).not.toBeVisible({ timeout: 5000 });
  });

  test('@functional - Afficher les tags et dossiers sur les cartes', async ({ page }) => {
    // Setup les tags et dossiers
    await page.evaluate(() => {
      const tags = [
        { id: 'tag-1', name: 'Test Tag 1', color: '#3b82f6', createdAt: new Date().toISOString() },
        { id: 'tag-2', name: 'Test Tag 2', color: '#ef4444', createdAt: new Date().toISOString() },
        { id: 'tag-3', name: 'Test Tag 3', color: '#10b981', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('doodates_tags', JSON.stringify(tags));

      const folders = [
        { id: 'folder-1', name: 'Test Folder 1', color: '#3b82f6', icon: '📁', createdAt: new Date().toISOString() },
        { id: 'folder-2', name: 'Test Folder 2', color: '#ef4444', icon: '📂', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('doodates_folders', JSON.stringify(folders));
    });
    await verifyTagsFoldersLoaded(page);

    // Créer la conversation avec tags et dossier
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
    
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Attendre que les cartes se chargent
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached', timeout: 10000 });

    // Vérifier que les tags sont visibles
    await expect(conversationCard.getByText(/Test Tag 1/i)).toBeVisible({ timeout: 5000 });
    await expect(conversationCard.getByText(/Test Tag 2/i)).toBeVisible({ timeout: 5000 });

    // Vérifier que le dossier est visible
    await expect(conversationCard.getByText(/Test Folder 1/i)).toBeVisible({ timeout: 5000 });
  });

  test('@edge - Gérer tags/dossiers avec une conversation sans tags/dossiers existants', async ({ page }) => {
    await setupTestData(page);
    await verifyTagsFoldersLoaded(page);
    
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Attendre que les cartes se chargent
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached', timeout: 10000 });

    // Ouvrir le dialogue en utilisant le helper
    const dialog = await openTagsFolderDialog(page, conversationCard);

    // Vérifier que le dialogue contient les sections Tags et Dossier
    await expect(dialog.getByText(/Tags/i).first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText(/Dossier/i).first()).toBeVisible({ timeout: 3000 });

    // Sélectionner un tag
    const tag1Checkbox = page.getByRole('checkbox', { name: /Test Tag 1/i });
    await tag1Checkbox.waitFor({ state: 'visible', timeout: 5000 });
    await tag1Checkbox.scrollIntoViewIfNeeded();
    await tag1Checkbox.check({ timeout: 3000 });
    
    // Vérifier que le tag est coché
    await expect(tag1Checkbox).toBeChecked({ timeout: 2000 });

    // Sélectionner un dossier
    const folder1Checkbox = page.getByRole('checkbox', { name: /Test Folder 1/i });
    await folder1Checkbox.waitFor({ state: 'visible', timeout: 5000 });
    await folder1Checkbox.scrollIntoViewIfNeeded();
    await folder1Checkbox.check({ timeout: 3000 });
    
    // Vérifier que le dossier est coché
    await expect(folder1Checkbox).toHaveAttribute('data-state', 'checked', { timeout: 2000 });

    // Sauvegarder
    const saveButton = page.getByRole('button', { name: /Enregistrer/i });
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    // Vérifier le toast de succès
    await expect(page.getByText(/Mise à jour réussie/i).first()).toBeVisible({ timeout: 5000 });
  });
});
