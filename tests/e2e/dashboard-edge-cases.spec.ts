import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { withConsoleGuard } from './utils';
import { setupTestEnvironment } from './helpers/test-setup';
import { waitForNetworkIdle, waitForElementReady, waitForReactStable } from './helpers/wait-helpers';
import { createTestConversations, clearTestData, createTestTags, createTestFolders, createTestConversation, createTestTag } from './helpers/test-data';
import { getTimeouts } from './config/timeouts';
import { safeIsVisible } from './helpers/safe-helpers';

/**
 * Tests E2E pour les cas limites du Dashboard
 * 
 * Tests 60-65 du document TESTS-MANUELS-DASHBOARD-COMPLET.md
 * 
 * @tags @dashboard @edge-cases @stability
 */
// Ces tests en mode serial ne fonctionnent correctement que sur Chromium
test.describe('Dashboard - Cas Limites', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(({ browserName }) => browserName !== 'chromium', 'Serial tests optimized for Chrome');

  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: true,
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /\[vite\] Failed to reload.*index\.css/i,
          /Failed to reload.*index\.css/i,
          /syntax errors or importing non-existent modules/i,
        ],
      },
    });
  });

  /**
   * Test 60: Dashboard vide
   * Vérifie que le message d'état vide s'affiche correctement
   */
  test('@edge - Dashboard vide - Affiche message "Aucune conversation"', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Nettoyer localStorage pour avoir un dashboard vide
      await clearTestData(page, { all: true });

      await page.goto("/date-polls/dashboard", { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Vérifier que le message "Aucune conversation" est affiché
      // Le Dashboard affiche "Aucune conversation" (pas "pour le moment")
      await expect(page.getByText("Aucune conversation", { exact: false })).toBeVisible({
        timeout: timeouts.element,
      });

      // Vérifier que le message "Commencez une conversation avec l'IA..." est affiché
      // Le Dashboard affiche "Commencez une conversation avec l'IA pour créer des sondages"
      await expect(
        page.getByText("Commencez une conversation avec l'IA", { exact: false })
      ).toBeVisible({ timeout: timeouts.element });
    });
  });

  /**
   * Test 61: Beaucoup de conversations (stabilité)
   * Vérifie que le dashboard fonctionne avec 50+ conversations sans crash
   */
  test('@edge @stability - Beaucoup de conversations (50+) - Dashboard fonctionne', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Créer 50+ conversations dans localStorage AVANT la navigation
      const conversations = Array.from({ length: 55 }, (_, i) => ({
        title: `Conversation de test ${i + 1}`,
        status: (i % 3 === 0 ? 'completed' : 'active') as 'active' | 'completed',
        firstMessage: `Premier message de la conversation ${i + 1}`,
        messageCount: i % 5,
        isFavorite: i % 7 === 0,
        tags: [],
        metadata: {},
      }));

      await createTestConversations(page, conversations);

      await page.goto("/date-polls/dashboard", { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Vérifier que le dashboard se charge sans erreur
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });

      // Attendre que les cartes se chargent avec timeout adapté au navigateur
      await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Vérifier que des cartes de conversation sont visibles
      const conversationCards = page.locator('[data-testid="poll-item"]');
      const cardCount = await conversationCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Vérifier que la pagination fonctionne (si elle existe)
      const pagination = page.locator('[role="navigation"]').filter({ hasText: /suivant|next/i });
      const hasPagination = await pagination.count();
      if (hasPagination > 0) {
        // Vérifier qu'on peut interagir avec la pagination sans crash
        const nextButton = pagination.first().getByRole("button", { name: /suivant|next/i });
        if (await safeIsVisible(nextButton)) {
          await nextButton.click();
          await waitForReactStable(page, { browserName });
          // Vérifier que la page ne crash pas
          await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });
        }
      }
    });
  });

  /**
   * Test 62: Beaucoup de tags (stabilité)
   * Vérifie que le menu des tags fonctionne avec 20+ tags sans crash
   */
  test('@edge @stability - Beaucoup de tags (20+) - Menu fonctionne', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Créer 20+ tags
      const tags = Array.from({ length: 25 }, (_, i) => {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        return {
          name: `Tag de test ${i + 1}`,
          color: colors[i % colors.length],
        };
      });
      await createTestTags(page, tags);

      // Créer une conversation pour pouvoir ouvrir le menu
      await createTestConversation(page, {
        title: 'Conversation pour test tags',
        status: 'completed',
        firstMessage: 'Premier message',
        messageCount: 1,
        isFavorite: false,
        tags: [],
        metadata: {},
      });

      await page.goto("/date-polls/dashboard", { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Attendre que les cartes se chargent
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Ouvrir le menu de la carte
      const menuButtons = conversationCard.locator("button");
      const menuButtonCount = await menuButtons.count();
      let menuButton = menuButtons.last();
      if (menuButtonCount > 1) {
        for (let i = menuButtonCount - 1; i >= 0; i--) {
          const btn = menuButtons.nth(i);
          if (await safeIsVisible(btn)) {
            menuButton = btn;
            break;
          }
        }
      }

      await menuButton.waitFor({ state: 'visible', timeout: timeouts.element });
      await menuButton.click();
      await waitForReactStable(page, { browserName });

      // Cliquer sur "Gérer les tags/dossier"
      const manageMenuItem = page.getByText("Gérer les tags/dossier");
      await expect(manageMenuItem).toBeVisible({ timeout: timeouts.element });
      await manageMenuItem.click();

      // Vérifier que le dialogue s'ouvre sans erreur
      await expect(page.getByText("Gérer les tags et le dossier")).toBeVisible({ timeout: timeouts.element });

      // Vérifier que les tags sont visibles dans le dialogue
      const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Gérer les tags et le dossier' });
      await expect(dialog).toBeVisible({ timeout: timeouts.element });

      // Vérifier qu'au moins quelques tags sont visibles (scroll peut être nécessaire)
      // Utiliser exact: true pour éviter les matches avec "Tag de test 10", "Tag de test 11", etc.
      const tag1 = dialog.getByText("Tag de test 1", { exact: true });
      await expect(tag1).toBeVisible({ timeout: timeouts.element });
    });
  });

  /**
   * Test 63: Beaucoup de dossiers (stabilité)
   * Vérifie que le menu des dossiers fonctionne avec 20+ dossiers sans crash
   */
  test('@edge @stability - Beaucoup de dossiers (20+) - Menu fonctionne', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Créer 20+ dossiers
      const folders = Array.from({ length: 25 }, (_, i) => {
        const icons = ['📁', '📂', '🗂️', '📋', '📊'];
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        return {
          name: `Dossier de test ${i + 1}`,
          color: colors[i % colors.length],
          icon: icons[i % icons.length],
        };
      });
      await createTestFolders(page, folders);

      // Créer une conversation pour pouvoir ouvrir le menu
      await createTestConversation(page, {
        title: 'Conversation pour test dossiers',
        status: 'completed',
        firstMessage: 'Premier message',
        messageCount: 1,
        isFavorite: false,
        tags: [],
        metadata: {},
      });

      await page.goto("/date-polls/dashboard", { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Attendre que les cartes se chargent
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Ouvrir le menu de la carte
      const menuButtons = conversationCard.locator("button");
      const menuButtonCount = await menuButtons.count();
      let menuButton = menuButtons.last();
      if (menuButtonCount > 1) {
        for (let i = menuButtonCount - 1; i >= 0; i--) {
          const btn = menuButtons.nth(i);
          if (await safeIsVisible(btn)) {
            menuButton = btn;
            break;
          }
        }
      }

      await menuButton.waitFor({ state: 'visible', timeout: timeouts.element });
      await menuButton.click();
      await waitForReactStable(page, { browserName });

      // Cliquer sur "Gérer les tags/dossier"
      const manageMenuItem = page.getByText("Gérer les tags/dossier");
      await expect(manageMenuItem).toBeVisible({ timeout: timeouts.element });
      await manageMenuItem.click();

      // Vérifier que le dialogue s'ouvre sans erreur
      await expect(page.getByText("Gérer les tags et le dossier")).toBeVisible({ timeout: timeouts.element });

      // Vérifier que les dossiers sont visibles dans le dialogue
      const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Gérer les tags et le dossier' });
      await expect(dialog).toBeVisible({ timeout: timeouts.element });

      // Vérifier qu'au moins un dossier est visible
      // Utiliser exact: true pour éviter les matches avec "Dossier de test 10", "Dossier de test 11", etc.
      const folder1 = dialog.getByText("Dossier de test 1", { exact: true });
      await expect(folder1).toBeVisible({ timeout: timeouts.element });
    });
  });

  /**
   * Test 64: Tags avec noms très longs
   * Vérifie qu'un tag avec 50+ caractères s'affiche correctement (tronqué si nécessaire)
   */
  test('@edge - Tags avec noms très longs (50+ caractères) - Affichage correct', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Créer un tag avec un nom très long
      const longTagName = 'Tag avec un nom extrêmement long qui dépasse largement les 50 caractères pour tester le troncature';
      await createTestTag(page, {
        name: longTagName,
        color: '#3b82f6',
      });

      // Créer une conversation avec ce tag
      await createTestConversation(page, {
        title: 'Conversation avec tag long',
        status: 'completed',
        firstMessage: 'Premier message',
        messageCount: 1,
        isFavorite: false,
        tags: [longTagName],
        metadata: {},
      });

      await page.goto("/date-polls/dashboard", { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Attendre que les cartes se chargent
      const conversationCard = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Vérifier que le tag s'affiche (même s'il est tronqué)
      // Le tag peut être tronqué, donc on vérifie juste qu'une partie du nom est visible
      const tagElement = conversationCard.getByText(longTagName.substring(0, 20), { exact: false });
      await expect(tagElement).toBeVisible({ timeout: timeouts.element });

      // Vérifier qu'il n'y a pas de problème de layout (la carte reste visible)
      await expect(conversationCard).toBeVisible({ timeout: timeouts.element });

      // Vérifier que le tag n'a pas cassé le layout en vérifiant la hauteur raisonnable
      const cardBox = await conversationCard.boundingBox();
      expect(cardBox).not.toBeNull();
      // La carte ne doit pas être déformée (hauteur raisonnable)
      if (cardBox) {
        expect(cardBox.height).toBeLessThan(1000); // Hauteur max raisonnable
      }
    });
  });

  /**
   * Test 65: Recherche avec caractères spéciaux
   * Vérifie que la recherche fonctionne avec des caractères spéciaux sans erreur
   */
  test('@edge - Recherche avec caractères spéciaux - Fonctionne correctement', async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Créer des conversations avec des caractères spéciaux dans les titres
      await createTestConversations(page, [
        {
          title: 'Conversation avec é, è, à, ç',
          status: 'active',
          firstMessage: 'Premier message avec caractères spéciaux',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
        {
          title: 'Conversation @ # $ % & *',
          status: 'active',
          firstMessage: 'Message avec symboles',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
        {
          title: 'Conversation normale',
          status: 'active',
          firstMessage: 'Message normal',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
      ]);

      await page.goto("/date-polls/dashboard", { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Tester différents caractères spéciaux
      const specialCharacters = [
        { char: 'é', expectedMatch: true },
        { char: '@', expectedMatch: true },
        { char: '#', expectedMatch: true },
        { char: '&', expectedMatch: true },
        { char: '€', expectedMatch: false }, // Pas dans les titres
      ];

      for (const { char, expectedMatch } of specialCharacters) {
        // Trouver le champ de recherche
        const searchInput = page.locator('input[type="search"], input[placeholder*="Rechercher"], input[placeholder*="Search"]').first();
        await searchInput.waitFor({ state: 'visible', timeout: timeouts.element });

        // Effectuer la recherche
        await searchInput.fill(char);
        await waitForReactStable(page, { browserName }); // Attendre que la recherche se déclenche

        // Vérifier qu'il n'y a pas d'erreur
        const errorMessages = page.locator("text=/error|erreur/i");
        const errorCount = await errorMessages.count();
        expect(errorCount).toBe(0);

        // Si on s'attend à un match, vérifier qu'au moins une carte est visible
        if (expectedMatch) {
          const cards = page.locator('[data-testid="poll-item"]');
          const cardCount = await cards.count();
          expect(cardCount).toBeGreaterThan(0);
        }

        // Vider la recherche pour le prochain test
        await searchInput.clear();
        await waitForReactStable(page, { browserName });
      }

      // Vérifier que le dashboard reste fonctionnel après les recherches
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });
    });
  });
});
