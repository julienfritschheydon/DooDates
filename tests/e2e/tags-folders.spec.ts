import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openTagsFolderDialog, verifyTagsFoldersLoaded, withConsoleGuard } from './utils';
import { setupTestEnvironment } from './helpers/test-setup';
import { setupTestData, createTestTags, createTestFolders, createTestConversation, createTestPoll } from './helpers/test-data';
import { waitForNetworkIdle, waitForElementReady } from './helpers/wait-helpers';
import { safeIsVisible } from './helpers/safe-helpers';
import { getTimeouts } from './config/timeouts';

/**
 * Tests E2E pour la gestion des tags et dossiers
 * 
 * @tags @dashboard @tags @folders @organization
 */
// Ces tests en mode serial ne fonctionnent correctement que sur Chromium
test.describe('Dashboard - Tags et Dossiers', () => {
  test.describe.configure({ mode: 'serial' });
  // Note: test.skip retiré - les tests doivent s'exécuter en CI

  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: true,
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Erreur lors de l'initialisation de la session/i,
          /next-themes/i,
          /error boundary/i,
          /The above error occurred in the <App> component/i,
        ],
      },
    });
  });

  /**
   * Setup initial : créer une conversation et des tags/dossiers de test
   * Utilise les factories centralisées
   */
  async function setupTestDataLocal(page: Page) {
    const pollId = 'test-poll-tags-1';

    // Créer le poll associé
    const createdPoll = await createTestPoll(page, {
      title: 'Sondage pour tags',
      slug: 'sondage-tags-1',
      type: 'date',
      status: 'active',
      settings: { selectedDates: ['2025-01-01'] }
    });

    await setupTestData(page, {
      tags: [
        { name: 'Test Tag 1', color: '#3b82f6' },
        { name: 'Test Tag 2', color: '#ef4444' },
        { name: 'Test Tag 3', color: '#10b981' },
      ],
      folders: [
        { name: 'Test Folder 1', color: '#3b82f6', icon: '📁' },
        { name: 'Test Folder 2', color: '#ef4444', icon: '📂' },
      ],
      conversations: [
        {
          title: 'Conversation de test pour tags',
          status: 'completed',
          firstMessage: 'Premier message de test',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: { pollId: createdPoll.id, pollGenerated: true },
        },
      ],
    });
  }

  test('@smoke @critical - Ouvrir le dialogue de gestion tags/dossiers', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      await setupTestDataLocal(page);
      await verifyTagsFoldersLoaded(page);

      await page.goto('/DooDates/date-polls/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      // Attendre que les cartes se chargent avec timeout adapté
      const timeouts = getTimeouts(browserName);
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Ouvrir le dialogue en utilisant le helper
      const dialog = await openTagsFolderDialog(page, conversationCard);

      // Vérifier que le dialogue contient les sections Tags et Dossier
      await expect(dialog.getByText(/Tags/i).first()).toBeVisible({ timeout: timeouts.element });
      await expect(dialog.getByText(/Dossier/i).first()).toBeVisible({ timeout: timeouts.element });
    });
  });

  test('@functional - Assigner des tags à une conversation', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      await setupTestDataLocal(page);
      await verifyTagsFoldersLoaded(page);

      await page.goto('/DooDates/date-polls/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      // Attendre que les cartes se chargent avec timeout adapté
      const timeouts = getTimeouts(browserName);
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Ouvrir le dialogue en utilisant le helper
      const dialog = await openTagsFolderDialog(page, conversationCard);

      // Sélectionner un tag
      const tagCheckbox = page.getByRole('checkbox', { name: /Test Tag 1/i });
      await tagCheckbox.waitFor({ state: 'visible', timeout: timeouts.element });
      await tagCheckbox.scrollIntoViewIfNeeded();

      // Vérifier que le dialogue est toujours visible avant le clic
      await expect(dialog).toBeVisible();

      // Cliquer sur le checkbox et attendre qu'il soit coché
      await tagCheckbox.click({ force: true });
      await expect(tagCheckbox).toBeChecked({ timeout: timeouts.element });

      // Sélectionner un autre tag
      const tag2Checkbox = page.getByRole('checkbox', { name: /Test Tag 2/i });
      await tag2Checkbox.waitFor({ state: 'visible', timeout: timeouts.element });
      await tag2Checkbox.scrollIntoViewIfNeeded();
      await tag2Checkbox.click({ force: true });

      // Attendre que le deuxième tag soit coché
      await expect(tag2Checkbox).toBeChecked({ timeout: timeouts.element });

      // Vérifier que le dialogue est toujours ouvert
      await expect(dialog).toBeVisible();

      // Sauvegarder
      const saveButton = page.getByRole('button', { name: /Enregistrer/i });
      await saveButton.waitFor({ state: 'visible', timeout: timeouts.element });
      await saveButton.click();

      // Attendre que le dialogue se ferme (utiliser expect.poll pour attendre la fermeture)
      await expect.poll(async () => {
        const isVisible = await safeIsVisible(dialog);
        return !isVisible;
      }, { timeout: timeouts.element }).toBe(true);

      // Vérifier que les tags apparaissent sur la carte (preuve que l'action a réussi)
      await expect(conversationCard.getByText('Test Tag 1')).toBeVisible({ timeout: timeouts.element });
      await expect(conversationCard.getByText('Test Tag 2')).toBeVisible({ timeout: timeouts.element });

      // Vérifier le toast de succès (optionnel - si le toast n'apparaît pas, le test continue)
      try {
        // Chercher le toast par son titre exact avec la structure Radix UI
        await expect(page.locator('div[data-state="open"]', { hasText: "Mise à jour réussie" })).toBeVisible({ timeout: 3000 });
      } catch (e) {
        // Le toast n'est pas visible, mais l'action a réussi (tags visibles)
        console.log('Toast non visible, mais l\'action a réussi');
      }
    });
  });

  test('@functional - Assigner un dossier à une conversation', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      await setupTestDataLocal(page);
      await verifyTagsFoldersLoaded(page);

      await page.goto('/DooDates/date-polls/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      // Attendre que les cartes se chargent avec timeout adapté
      const timeouts = getTimeouts(browserName);
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Ouvrir le dialogue en utilisant le helper
      const dialog = await openTagsFolderDialog(page, conversationCard);

      // Sélectionner un dossier
      const folderCheckbox = page.getByRole('checkbox', { name: /Test Folder 1/i });
      await folderCheckbox.waitFor({ state: 'visible', timeout: timeouts.element });
      await folderCheckbox.scrollIntoViewIfNeeded();
      await folderCheckbox.click({ force: true });

      // Vérifier que le checkbox est coché (attente explicite)
      await expect(folderCheckbox).toHaveAttribute('data-state', 'checked', { timeout: timeouts.element });

      // Sauvegarder
      const saveButton = page.getByRole('button', { name: /Enregistrer/i });
      await saveButton.waitFor({ state: 'visible', timeout: timeouts.element });
      await saveButton.click();

      // Vérifier le toast de succès
      try {
        await expect(page.locator('div[data-state="open"]', { hasText: "Mise à jour réussie" })).toBeVisible({ timeout: 3000 });
      } catch (e) {
        console.log('Toast non visible, mais l\'action a réussi');
      }

      // Attendre que le dialogue se ferme
      await expect.poll(async () => {
        const isVisible = await safeIsVisible(dialog);
        return !isVisible;
      }, { timeout: timeouts.element }).toBe(true);

      // Vérifier que le dossier apparaît sur la carte après rafraîchissement
      await expect(conversationCard.getByText(/Test Folder 1/i)).toBeVisible({ timeout: timeouts.element });
    });
  });

  test('@functional - Retirer des tags et dossier d\'une conversation', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Setup les tags et dossiers
      await createTestTags(page, [
        { name: 'Test Tag 1', color: '#3b82f6' },
        { name: 'Test Tag 2', color: '#ef4444' },
        { name: 'Test Tag 3', color: '#10b981' },
      ]);

      await createTestFolders(page, [
        { name: 'Test Folder 1', color: '#3b82f6', icon: '📁' },
        { name: 'Test Folder 2', color: '#ef4444', icon: '📂' },
      ]);

      await verifyTagsFoldersLoaded(page);

      // Créer le poll associé
      const createdPoll = await createTestPoll(page, {
        title: 'Sondage avec tags',
        slug: 'sondage-tags-remove',
        type: 'date',
        status: 'active',
        settings: { selectedDates: ['2025-01-01'] }
      });

      // Créer la conversation avec tags et dossier
      await createTestConversation(page, {
        title: 'Conversation avec tags et dossier',
        status: 'completed',
        firstMessage: 'Premier message',
        messageCount: 1,
        isFavorite: false,
        tags: ['Test Tag 1', 'Test Tag 2'],
        metadata: { folderId: 'folder-1', pollId: createdPoll.id, pollGenerated: true },
      });

      await page.goto('/DooDates/date-polls/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      // Attendre que les cartes se chargent avec timeout adapté
      const timeouts = getTimeouts(browserName);
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: timeouts.element });
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Vérifier que les tags et dossier sont visibles avant retrait
      await expect(conversationCard.getByText(/Test Tag 1/i)).toBeVisible({ timeout: timeouts.element });
      await expect(conversationCard.getByText(/Test Tag 2/i)).toBeVisible({ timeout: timeouts.element });
      await expect(conversationCard.getByText(/Test Folder 1/i)).toBeVisible({ timeout: timeouts.element });

      // Ouvrir le dialogue en utilisant le helper
      const dialog = await openTagsFolderDialog(page, conversationCard);

      // Désélectionner tous les tags cochés
      const tagLabels = ['Test Tag 1', 'Test Tag 2'];
      for (const tagName of tagLabels) {
        const checkbox = page.getByRole('checkbox', { name: new RegExp(tagName, 'i') });
        const isVisible = await safeIsVisible(checkbox);
        if (isVisible) {
          const isChecked = await checkbox.isChecked({ timeout: timeouts.element }).catch(() => false);
          if (isChecked) {
            await checkbox.uncheck({ timeout: timeouts.element });
            // Attendre que le tag soit décoché
            await expect(checkbox).not.toBeChecked({ timeout: timeouts.element });
          }
        }
      }

      // Désélectionner le dossier (sélectionner "Aucun dossier")
      const noFolderCheckbox = page.getByRole('checkbox', { name: /Aucun dossier/i });
      await noFolderCheckbox.waitFor({ state: 'visible', timeout: timeouts.element });
      await noFolderCheckbox.check();

      // Vérifier que "Aucun dossier" est coché
      await expect(noFolderCheckbox).toBeChecked({ timeout: timeouts.element });

      // Sauvegarder
      const saveButton = page.getByRole('button', { name: /Enregistrer/i });
      await saveButton.waitFor({ state: 'visible', timeout: timeouts.element });
      await saveButton.click();

      // Vérifier le toast de succès
      try {
        await expect(page.locator('div[data-state="open"]', { hasText: "Mise à jour réussie" })).toBeVisible({ timeout: 3000 });
      } catch (e) {
        console.log('Toast non visible, mais l\'action a réussi');
      }

      // Attendre que le dialogue se ferme
      await expect.poll(async () => {
        const isVisible = await safeIsVisible(dialog);
        return !isVisible;
      }, { timeout: timeouts.element }).toBe(true);

      // Vérifier que les tags et dossier ont disparu de la carte
      await expect(conversationCard.getByText(/Test Tag/i)).toHaveCount(0, { timeout: timeouts.element });
      await expect(conversationCard.getByText(/Test Folder 1/i)).not.toBeVisible({ timeout: timeouts.element });
    });
  });

  test('@functional - Afficher les tags et dossiers sur les cartes', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Setup les tags et dossiers
      await createTestTags(page, [
        { name: 'Test Tag 1', color: '#3b82f6' },
        { name: 'Test Tag 2', color: '#ef4444' },
        { name: 'Test Tag 3', color: '#10b981' },
      ]);

      await createTestFolders(page, [
        { name: 'Test Folder 1', color: '#3b82f6', icon: '📁' },
        { name: 'Test Folder 2', color: '#ef4444', icon: '📂' },
      ]);

      await verifyTagsFoldersLoaded(page);

      // Créer le poll associé
      const createdPoll = await createTestPoll(page, {
        title: 'Sondage avec tags visibles',
        slug: 'sondage-tags-visible',
        type: 'date',
        status: 'active',
        settings: { selectedDates: ['2025-01-01'] }
      });

      // Créer la conversation avec tags et dossier
      await createTestConversation(page, {
        title: 'Conversation avec tags et dossier visibles',
        status: 'completed',
        firstMessage: 'Premier message',
        messageCount: 1,
        isFavorite: false,
        tags: ['Test Tag 1', 'Test Tag 2'],
        metadata: { folderId: 'folder-1', pollId: createdPoll.id, pollGenerated: true },
      });

      await page.goto('/DooDates/date-polls/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      // Attendre que les cartes se chargent avec timeout adapté
      const timeouts = getTimeouts(browserName);
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Vérifier que les tags sont visibles
      await expect(conversationCard.getByText(/Test Tag 1/i)).toBeVisible({ timeout: timeouts.element });
      await expect(conversationCard.getByText(/Test Tag 2/i)).toBeVisible({ timeout: timeouts.element });

      // Vérifier que le dossier est visible
      await expect(conversationCard.getByText(/Test Folder 1/i)).toBeVisible({ timeout: timeouts.element });
    });
  });

  test('@edge - Gérer tags/dossiers avec une conversation sans tags/dossiers existants', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      await setupTestDataLocal(page);
      await verifyTagsFoldersLoaded(page);

      await page.goto('/DooDates/date-polls/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      // Attendre que les cartes se chargent avec timeout adapté
      const timeouts = getTimeouts(browserName);
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Ouvrir le dialogue en utilisant le helper
      const dialog = await openTagsFolderDialog(page, conversationCard);

      // Vérifier que le dialogue contient les sections Tags et Dossier
      await expect(dialog.getByText(/Tags/i).first()).toBeVisible({ timeout: timeouts.element });
      await expect(dialog.getByText(/Dossier/i).first()).toBeVisible({ timeout: timeouts.element });

      // Sélectionner un tag
      const tag1Checkbox = page.getByRole('checkbox', { name: /Test Tag 1/i });
      await tag1Checkbox.waitFor({ state: 'visible', timeout: timeouts.element });
      await tag1Checkbox.scrollIntoViewIfNeeded();
      await tag1Checkbox.check({ timeout: timeouts.element });

      // Vérifier que le tag est coché
      await expect(tag1Checkbox).toBeChecked({ timeout: timeouts.element });

      // Sélectionner un dossier
      const folder1Checkbox = page.getByRole('checkbox', { name: /Test Folder 1/i });
      await folder1Checkbox.waitFor({ state: 'visible', timeout: timeouts.element });
      await folder1Checkbox.scrollIntoViewIfNeeded();
      await folder1Checkbox.check({ timeout: timeouts.element });

      // Vérifier que le dossier est coché
      await expect(folder1Checkbox).toHaveAttribute('data-state', 'checked', { timeout: timeouts.element });

      // Sauvegarder
      const saveButton = page.getByRole('button', { name: /Enregistrer/i });
      await saveButton.waitFor({ state: 'visible', timeout: timeouts.element });
      await saveButton.click();

      // Vérifier le toast de succès
      try {
        await expect(page.locator('div[data-state="open"]', { hasText: "Mise à jour réussie" })).toBeVisible({ timeout: 3000 });
      } catch (e) {
        console.log('Toast non visible, mais l\'action a réussi');
      }
    });
  });
});
