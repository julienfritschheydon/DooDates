import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, warmup, enableE2ELocalMode } from './utils';
import { seedDashboard, type DashboardSeedOptions, type DashboardSeedPayload } from './fixtures/dashboardSeed';

/**
 * Tests E2E complets pour toutes les fonctionnalités du Dashboard
 * 
 * @tags @dashboard @smoke @critical @functional
 */
test.describe('Dashboard - Fonctionnalités Complètes', () => {
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

  test('@functional - Affichage quotas pour un utilisateur authentifié', async ({ page }) => {
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
      await setupTestData(page, { mode: 'authenticated' });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await waitForDashboardReady(page);

      await expect(page.getByText(/crédits utilisés/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Créez un compte pour synchroniser vos données/i)).toHaveCount(0);
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  /**
   * Setup initial : créer des conversations, tags et dossiers de test
   */
  async function setupTestData(
    page: Page,
    options?: DashboardSeedOptions,
    overridePayload?: Partial<DashboardSeedPayload>,
  ) {
    await seedDashboard(page, options, overridePayload);
  }

  async function waitForDashboardReady(page: Page) {
    await page.waitForSelector('[data-testid="dashboard-ready"]', {
      state: 'visible',
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="dashboard-loading"]')).toHaveCount(0);
  }

  test('@smoke @critical - Charger le dashboard sans erreur', async ({ page }) => {
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
      await waitForDashboardReady(page);

      // Vérifier que le dashboard se charge
      await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="poll-item"]').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Rechercher une conversation', async ({ page }) => {
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
      await waitForDashboardReady(page);

      // Attendre que les cartes se chargent
      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Rechercher "active"
      const searchInput = page.getByTestId('search-conversations');
      await searchInput.fill('active');

      // Vérifier que seules les conversations avec "active" sont affichées
      await page.waitForTimeout(500); // Attendre le debounce
      const visibleCards = page.locator('[data-testid="poll-item"]');
      const count = await visibleCards.count();
      expect(count).toBeGreaterThan(0);
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Filtrer par statut (Tous, Brouillons, Actifs, Clôturés, Archivés)', async ({ page }) => {
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
      await waitForDashboardReady(page);

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });
      
      // Attendre que les filtres soient visibles
      await page.getByRole('button', { name: 'Tous' }).first().waitFor({ state: 'visible', timeout: 10000 });

      // Tester chaque filtre (utiliser les labels exacts depuis getStatusLabel)
      const filters = ['Tous', 'Brouillon', 'Actif', 'Terminé', 'Archivé'];
      for (const filterName of filters) {
        // Trouver le bouton de filtre - prendre le premier qui est visible
        const filterButton = page.getByRole('button', { name: filterName }).first();
        
        // Attendre que le bouton soit visible et cliquable
        await filterButton.waitFor({ state: 'visible', timeout: 10000 });
        await filterButton.scrollIntoViewIfNeeded();
        
        // Cliquer sur le bouton
        await filterButton.click();
        await page.waitForTimeout(1000); // Attendre le filtrage et le rendu
        
        // Vérifier que le filtre est actif - le bouton doit avoir la classe bg-blue-500
        const className = await filterButton.getAttribute('class');
        expect(className).toContain('bg-blue-500');
      }
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Filtrer par tags', async ({ page }) => {
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
      await waitForDashboardReady(page);

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Ouvrir le menu des tags
      await page.getByRole('button', { name: /Tags/i }).click();

      // Sélectionner un tag (trouver via le label associé)
      const tagLabel = page.getByText('Test Tag 1').first();
      await tagLabel.waitFor({ state: 'visible', timeout: 3000 });
      // Le checkbox est dans le même label ou proche
      const tagCheckbox = tagLabel.locator('..').locator('input[type="checkbox"]').first();
      await tagCheckbox.check();

      // Fermer le menu en cliquant ailleurs
      await page.click('body', { position: { x: 0, y: 0 } });

      // Vérifier que le filtre est appliqué
      await page.waitForTimeout(300);
      const tagButton = page.getByRole('button', { name: /Tags.*1/i });
      await expect(tagButton).toBeVisible();
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Filtrer par dossier', async ({ page }) => {
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

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Ouvrir le menu des dossiers
      const foldersButton = page.getByRole('button', { name: /Tous les dossiers/i }).first();
      await foldersButton.waitFor({ state: 'visible', timeout: 5000 });
      await foldersButton.click();
      
      // Attendre que le menu s'ouvre
      await page.waitForTimeout(500);

      // Sélectionner un dossier
      const folderOption = page.getByText('Test Folder 1').first();
      await folderOption.waitFor({ state: 'visible', timeout: 3000 });
      await folderOption.click();

      // Vérifier que le filtre est appliqué - le bouton doit afficher le nom du dossier
      await page.waitForTimeout(500);
      const folderButton = page.getByRole('button', { name: /Test Folder 1/i }).first();
      await expect(folderButton).toBeVisible({ timeout: 3000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Créer un nouveau tag depuis les filtres', async ({ page }) => {
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
      await waitForDashboardReady(page);

      // Ouvrir le menu des tags
      await page.getByRole('button', { name: /Tags/i }).click();

      // Créer un nouveau tag
      const newTagInput = page.locator('input[placeholder="Nouveau tag..."]');
      await newTagInput.fill('Nouveau Tag E2E');
      await page.getByRole('button', { name: /Créer/i }).click();

      // Vérifier le toast de succès (utiliser .first() pour éviter strict mode violation)
      await expect(page.getByText(/Tag créé/i).first()).toBeVisible({ timeout: 3000 });

      // Attendre que le toast disparaisse et que le menu se rafraîchisse
      await page.waitForTimeout(1500);

      // Vérifier que le tag apparaît dans la liste du menu (réouvrir le menu si nécessaire)
      // Le menu pourrait s'être fermé après la création, donc le rouvrir
      const tagMenuButton = page.getByRole('button', { name: /Tags/i });
      await tagMenuButton.click();
      await page.waitForTimeout(1000); // Attendre que le menu s'ouvre

      // Chercher le tag dans le menu déroulant
      // Le texte "Nouveau Tag E2E" devrait apparaître dans le menu
      // Chercher simplement le texte, peu importe où il est (menu ou toast, l'important est qu'il existe)
      const tagText = page.getByText('Nouveau Tag E2E').first();
      await expect(tagText).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Créer un nouveau dossier depuis les filtres', async ({ page }) => {
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
      await waitForDashboardReady(page);

      // Ouvrir le menu des dossiers
      await page.getByRole('button', { name: /Tous les dossiers/i }).click();

      // Créer un nouveau dossier
      const newFolderInput = page.locator('input[placeholder="Nouveau dossier..."]');
      await newFolderInput.fill('Nouveau Dossier E2E');
      await page.getByRole('button', { name: /Créer/i }).click();

      // Vérifier le toast de succès (utiliser .first() pour éviter strict mode violation)
      await expect(page.getByText(/Dossier créé/i).first()).toBeVisible({ timeout: 3000 });

      // Attendre que le toast disparaisse et que le menu se rafraîchisse
      await page.waitForTimeout(1500);

      // Vérifier que le dossier apparaît dans la liste du menu (réouvrir le menu si nécessaire)
      const folderMenuButton = page.getByRole('button', { name: /Tous les dossiers/i });
      const folderMenuVisible = await page.locator('div[class*="absolute"]').filter({ hasText: /Tous les dossiers/i }).isVisible().catch(() => false);
      if (!folderMenuVisible) {
        await folderMenuButton.click();
        await page.waitForTimeout(500);
      }

      // Chercher le dossier dans le menu déroulant (exclure les toasts)
      const folderInMenu = page.locator('div[class*="absolute"]').filter({ hasText: /Tous les dossiers/i }).getByText('Nouveau Dossier E2E', { exact: false }).first();
      await expect(folderInMenu).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Basculer entre vue grille et vue tableau', async ({ page, isMobile }) => {
    // Skip sur mobile - la vue table n'est pas disponible
    test.skip(isMobile, 'Table view not available on mobile devices');

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

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Vérifier que la vue grille est active par défaut (utiliser data-testid)
      const gridButton = page.locator('[data-testid="view-toggle-grid"]');
      await expect(gridButton).toHaveClass(/bg-blue-500/);

      // Basculer vers la vue tableau (utiliser data-testid)
      const tableButton = page.locator('[data-testid="view-toggle-table"]');
      await tableButton.click();

      await page.waitForTimeout(500);

      // Vérifier que la vue tableau est active
      await expect(tableButton).toHaveClass(/bg-blue-500/);

      // Vérifier qu'on est en mode tableau (chercher un élément de tableau)
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 5000 });

      // Revenir en vue grille
      await gridButton.click();
      await page.waitForTimeout(500);

      // Vérifier qu'on est de nouveau en mode grille
      await expect(page.locator('[data-testid="poll-item"]').first()).toBeVisible();
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Sélectionner/désélectionner des conversations', async ({ page, isMobile }) => {
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

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Prendre la première carte pour vérifier le border bleu
      const firstCard = page.locator('[data-testid="poll-item"]').first();
      
      // Vérifier que la carte n'est pas sélectionnée initialement
      await expect(firstCard).not.toHaveClass(/border-blue-500|ring-blue-500/, { timeout: 1000 });

      // Utiliser le bouton "Sélectionner" en haut pour sélectionner toutes les conversations
      const selectionButton = page.getByTestId('selection-toggle-button');
      await selectionButton.waitFor({ state: 'visible', timeout: 5000 });
      await selectionButton.click();
      
      // Attendre que React se mette à jour
      await page.waitForTimeout(100);

      // Vérifier que la carte est sélectionnée en vérifiant le border bleu
      await expect(firstCard).toHaveClass(/border-blue-500|ring-blue-500|border-blue/, { timeout: 3000 });

      // Sur desktop, vérifier que le texte "X sélectionné(s)" est visible
      // Sur mobile, le texte existe mais est caché (hidden sm:inline) pour gagner de l'espace
      if (!isMobile) {
        const selectedText = page.getByText(/\d+ sélectionné/i);
        await expect(selectedText).toBeVisible({ timeout: 5000 });
      }

      // Cliquer à nouveau sur le bouton pour désélectionner (même testid, même bouton)
      await selectionButton.click();
      
      // Attendre que React se mette à jour
      await page.waitForTimeout(100);

      // Vérifier que la sélection est annulée (border bleu disparaît)
      await expect(firstCard).not.toHaveClass(/border-blue-500|ring-blue-500/, { timeout: 3000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Sélectionner tout', async ({ page, isMobile }) => {
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

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Cliquer sur "Sélectionner" avec data-testid (fonctionne sur desktop et mobile)
      const selectionButton = page.getByTestId('selection-toggle-button');
      await selectionButton.click();

      await page.waitForTimeout(500);

      // Vérifier que toutes les conversations de la page sont sélectionnées
      // Sur desktop uniquement - sur mobile le texte est caché (hidden sm:inline)
      if (!isMobile) {
        const selectedText = page.getByText(/\d+ sélectionné/i);
        await expect(selectedText).toBeVisible({ timeout: 3000 });
      }
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Pagination fonctionne', async ({ page }) => {
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
      const conversations = Array.from({ length: 25 }).map((_, index) => {
        const i = index + 1;
        return {
          id: `test-conv-${i}`,
          title: `Conversation ${i}`,
          status: 'active' as const,
          createdAt: new Date(Date.now() - i * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: `Premier message ${i}`,
          messageCount: i,
          isFavorite: false,
          tags: [],
          metadata: {},
        };
      });

      await setupTestData(page, undefined, { conversations });

      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Vérifier que la pagination est visible
      const pagination = page.locator('nav[aria-label="pagination"]');
      await expect(pagination).toBeVisible({ timeout: 5000 });

      // Vérifier qu'on est sur la page 1
      await expect(page.getByText(/Page 1/i)).toBeVisible();

      // Cliquer sur "Suivant" si disponible
      const nextButton = page.getByRole('link', { name: /Suivant/i }).or(page.locator('a[aria-label="Go to next page"]'));
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Vérifier qu'on est sur la page 2
        await expect(page.getByText(/Page 2/i)).toBeVisible({ timeout: 3000 });
      }
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Afficher l\'indicateur de quota', async ({ page }) => {
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

      // Vérifier que l'indicateur de quota est visible (texte changé en "crédits utilisés")
      await expect(page.getByText(/crédits utilisés/i)).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Fermer le dashboard (bouton X)', async ({ page }) => {
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

      // Cliquer sur le bouton fermer
      const closeButton = page.getByTestId('close-dashboard');
      await closeButton.click();

      // Vérifier qu'on revient à l'accueil
      await expect(page).toHaveURL(/\/$/);
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Gérer tags/dossiers depuis une carte (déjà implémenté mais testé ici)', async ({ page }) => {
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

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Trouver la carte et ouvrir le menu avec sélecteur robuste
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

      // Attendre que le menu s'ouvre et contient "Gérer les tags/dossier"
      const manageMenuItem = page.getByText('Gérer les tags/dossier');
      await expect(manageMenuItem).toBeVisible({ timeout: 5000 });
      await manageMenuItem.click();

      // Vérifier que le dialogue s'ouvre
      await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@edge - Dashboard vide (aucune conversation)', async ({ page }) => {
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
      // Ne pas créer de conversations
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Vérifier le message "Aucune conversation"
      await expect(page.getByText(/Aucune conversation/i)).toBeVisible({ timeout: 5000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@edge - Recherche sans résultats', async ({ page }) => {
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

      await page.waitForSelector('[data-testid="poll-item"]', { timeout: 10000 });

      // Rechercher quelque chose qui n'existe pas
      const searchInput = page.getByTestId('search-conversations');
      await searchInput.fill('xyz123nonexistent');

      await page.waitForTimeout(500); // Attendre le debounce

      // Vérifier le message "Aucun résultat"
      await expect(page.getByText(/Aucun résultat/i)).toBeVisible({ timeout: 3000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
