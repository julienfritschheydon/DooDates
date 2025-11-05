import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, warmup, enableE2ELocalMode } from './utils';

/**
 * Tests E2E pour les cas limites du Dashboard
 * 
 * Tests 60-65 du document TESTS-MANUELS-DASHBOARD-COMPLET.md
 * 
 * @tags @dashboard @edge-cases @stability
 */
test.describe('Dashboard - Cas Limites', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /GoogleGenerativeAI/i,
        /API key/i,
        /Error fetching from/i,
        /API key not valid/i,
        /generativelanguage\.googleapis\.com/i,
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
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
   * Test 60: Dashboard vide
   * Vérifie que le message d'état vide s'affiche correctement
   */
  test('@edge - Dashboard vide - Affiche message "Aucune conversation"', async ({ page }) => {
    // Nettoyer localStorage pour avoir un dashboard vide
    await page.evaluate(() => {
      localStorage.removeItem('doodates_conversations');
      localStorage.removeItem('doodates_tags');
      localStorage.removeItem('doodates_folders');
    });

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Vérifier que le message "Aucune conversation" est affiché
    // Le Dashboard affiche "Aucune conversation" (pas "pour le moment")
    await expect(page.getByText('Aucune conversation', { exact: false })).toBeVisible({
      timeout: 5000,
    });

    // Vérifier que le message "Commencez une conversation avec l'IA..." est affiché
    // Le Dashboard affiche "Commencez une conversation avec l'IA pour créer des sondages"
    await expect(
      page.getByText("Commencez une conversation avec l'IA", { exact: false })
    ).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 61: Beaucoup de conversations (stabilité)
   * Vérifie que le dashboard fonctionne avec 50+ conversations sans crash
   */
  test('@edge @stability - Beaucoup de conversations (50+) - Dashboard fonctionne', async ({ page }) => {
    // Créer 50+ conversations dans localStorage AVANT la navigation
    await page.evaluate(() => {
      const conversations: any[] = [];
      for (let i = 1; i <= 55; i++) {
        conversations.push({
          id: `test-conv-${i}`,
          title: `Conversation de test ${i}`,
          status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'active' : 'active',
          createdAt: new Date(Date.now() - i * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: `Premier message de la conversation ${i}`,
          messageCount: i % 5,
          isFavorite: i % 7 === 0,
          tags: [],
          metadata: {},
        });
      }
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    });

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Vérifier que le dashboard se charge sans erreur
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Attendre que les cartes se chargent (comme dans les autres tests)
    // Utiliser waitFor avec un timeout plus long pour WebKit qui peut être plus lent
    await page.waitForSelector('[data-testid="poll-item"]', { timeout: 15000 });

    // Vérifier que des cartes de conversation sont visibles
    const conversationCards = page.locator('[data-testid="poll-item"]');
    const cardCount = await conversationCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Vérifier que la pagination fonctionne (si elle existe)
    const pagination = page.locator('[role="navigation"]').filter({ hasText: /suivant|next/i });
    const hasPagination = await pagination.count();
    if (hasPagination > 0) {
      // Vérifier qu'on peut interagir avec la pagination sans crash
      const nextButton = pagination.first().getByRole('button', { name: /suivant|next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        // Vérifier que la page ne crash pas
        await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  /**
   * Test 62: Beaucoup de tags (stabilité)
   * Vérifie que le menu des tags fonctionne avec 20+ tags sans crash
   */
  test('@edge @stability - Beaucoup de tags (20+) - Menu fonctionne', async ({ page }) => {
    // Créer 20+ tags
    await page.evaluate(() => {
      const tags: any[] = [];
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let i = 1; i <= 25; i++) {
        tags.push({
          id: `tag-${i}`,
          name: `Tag de test ${i}`,
          color: colors[i % colors.length],
          createdAt: new Date().toISOString(),
        });
      }
      localStorage.setItem('doodates_tags', JSON.stringify(tags));
    });

    // Créer une conversation pour pouvoir ouvrir le menu
    await page.evaluate(() => {
      const conversations = [
        {
          id: 'test-conv-tags',
          title: 'Conversation pour test tags',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
      ];
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    });

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Attendre que les cartes se chargent
    await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached' });

    // Ouvrir le menu de la carte
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

    // Cliquer sur "Gérer les tags/dossier"
    const manageMenuItem = page.getByText('Gérer les tags/dossier');
    await expect(manageMenuItem).toBeVisible({ timeout: 5000 });
    await manageMenuItem.click();

    // Vérifier que le dialogue s'ouvre sans erreur
    await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });

    // Vérifier que les tags sont visibles dans le dialogue
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Gérer les tags et le dossier' });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Vérifier qu'au moins quelques tags sont visibles (scroll peut être nécessaire)
    // Utiliser exact: true pour éviter les matches avec "Tag de test 10", "Tag de test 11", etc.
    const tag1 = dialog.getByText('Tag de test 1', { exact: true });
    await expect(tag1).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 63: Beaucoup de dossiers (stabilité)
   * Vérifie que le menu des dossiers fonctionne avec 20+ dossiers sans crash
   */
  test('@edge @stability - Beaucoup de dossiers (20+) - Menu fonctionne', async ({ page }) => {
    // Créer 20+ dossiers
    await page.evaluate(() => {
      const folders: any[] = [];
      const icons = ['📁', '📂', '🗂️', '📋', '📊'];
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let i = 1; i <= 25; i++) {
        folders.push({
          id: `folder-${i}`,
          name: `Dossier de test ${i}`,
          color: colors[i % colors.length],
          icon: icons[i % icons.length],
          createdAt: new Date().toISOString(),
        });
      }
      localStorage.setItem('doodates_folders', JSON.stringify(folders));
    });

    // Créer une conversation pour pouvoir ouvrir le menu
    await page.evaluate(() => {
      const conversations = [
        {
          id: 'test-conv-folders',
          title: 'Conversation pour test dossiers',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
      ];
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    });

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Attendre que les cartes se chargent
    await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
    const conversationCard = page.locator('[data-testid="poll-item"]').first();
    await conversationCard.waitFor({ state: 'attached' });

    // Ouvrir le menu de la carte
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

    // Cliquer sur "Gérer les tags/dossier"
    const manageMenuItem = page.getByText('Gérer les tags/dossier');
    await expect(manageMenuItem).toBeVisible({ timeout: 5000 });
    await manageMenuItem.click();

    // Vérifier que le dialogue s'ouvre sans erreur
    await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });

    // Vérifier que les dossiers sont visibles dans le dialogue
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Gérer les tags et le dossier' });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Vérifier qu'au moins un dossier est visible
    // Utiliser exact: true pour éviter les matches avec "Dossier de test 10", "Dossier de test 11", etc.
    const folder1 = dialog.getByText('Dossier de test 1', { exact: true });
    await expect(folder1).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 64: Tags avec noms très longs
   * Vérifie qu'un tag avec 50+ caractères s'affiche correctement (tronqué si nécessaire)
   */
  test('@edge - Tags avec noms très longs (50+ caractères) - Affichage correct', async ({ page }) => {
    // Créer un tag avec un nom très long
    const longTagName = 'Tag avec un nom extrêmement long qui dépasse largement les 50 caractères pour tester le troncature';
    await page.evaluate((tagName) => {
      const tags = [
        {
          id: 'tag-long',
          name: tagName,
          color: '#3b82f6',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('doodates_tags', JSON.stringify(tags));
    }, longTagName);

    // Créer une conversation avec ce tag
    await page.evaluate((tagName) => {
      const conversations = [
        {
          id: 'test-conv-long-tag',
          title: 'Conversation avec tag long',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message',
          messageCount: 1,
          isFavorite: false,
          tags: [tagName],
          metadata: {},
        },
      ];
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    }, longTagName);

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Attendre que les cartes se chargent
    await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
    const conversationCard = page.locator('[data-testid="poll-item"]').first();

    // Vérifier que le tag s'affiche (même s'il est tronqué)
    // Le tag peut être tronqué, donc on vérifie juste qu'une partie du nom est visible
    const tagElement = conversationCard.getByText(longTagName.substring(0, 20), { exact: false });
    await expect(tagElement).toBeVisible({ timeout: 5000 });

    // Vérifier qu'il n'y a pas de problème de layout (la carte reste visible)
    await expect(conversationCard).toBeVisible({ timeout: 5000 });

    // Vérifier que le tag n'a pas cassé le layout en vérifiant la hauteur raisonnable
    const cardBox = await conversationCard.boundingBox();
    expect(cardBox).not.toBeNull();
    // La carte ne doit pas être déformée (hauteur raisonnable)
    if (cardBox) {
      expect(cardBox.height).toBeLessThan(1000); // Hauteur max raisonnable
    }
  });

  /**
   * Test 65: Recherche avec caractères spéciaux
   * Vérifie que la recherche fonctionne avec des caractères spéciaux sans erreur
   */
  test('@edge - Recherche avec caractères spéciaux - Fonctionne correctement', async ({ page }) => {
    // Créer des conversations avec des caractères spéciaux dans les titres
    await page.evaluate(() => {
      const conversations = [
        {
          id: 'test-conv-special-1',
          title: 'Conversation avec é, è, à, ç',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message avec caractères spéciaux',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
        {
          id: 'test-conv-special-2',
          title: 'Conversation @ # $ % & *',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: 'Message avec symboles',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
        {
          id: 'test-conv-special-3',
          title: 'Conversation normale',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: 'Message normal',
          messageCount: 1,
          isFavorite: false,
          tags: [],
          metadata: {},
        },
      ];
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    });

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

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
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });

      // Effectuer la recherche
      await searchInput.fill(char);
      await page.waitForTimeout(500); // Attendre que la recherche se déclenche

      // Vérifier qu'il n'y a pas d'erreur
      const errorMessages = page.locator('text=/error|erreur/i');
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
      await page.waitForTimeout(300);
    }

    // Vérifier que le dashboard reste fonctionnel après les recherches
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
  });
});

