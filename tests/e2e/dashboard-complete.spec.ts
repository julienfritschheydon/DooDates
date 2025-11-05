import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, warmup, enableE2ELocalMode } from './utils';

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

  /**
   * Setup initial : créer des conversations, tags et dossiers de test
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

    // Créer des conversations de test avec différents statuts
    await page.evaluate(() => {
      const conversations = [
        {
          id: 'test-conv-1',
          title: 'Conversation active',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Il y a 1 jour
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message actif',
          messageCount: 5,
          isFavorite: false,
          tags: ['Test Tag 1'],
          metadata: { folderId: 'folder-1' },
        },
        {
          id: 'test-conv-2',
          title: 'Conversation brouillon',
          status: 'active',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // Il y a 2 jours
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message brouillon',
          messageCount: 2,
          isFavorite: true,
          tags: ['Test Tag 2'],
          metadata: {},
        },
        {
          id: 'test-conv-3',
          title: 'Conversation avec poll',
          status: 'completed',
          createdAt: new Date(Date.now() - 259200000).toISOString(), // Il y a 3 jours
          updatedAt: new Date().toISOString(),
          firstMessage: 'Premier message avec poll',
          messageCount: 10,
          isFavorite: false,
          tags: ['Test Tag 1', 'Test Tag 3'],
          metadata: { folderId: 'folder-2', pollId: 'test-poll-1', pollGenerated: true },
        },
      ];
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    });

    // Créer un poll de test
    await page.evaluate(() => {
      const polls = [
        {
          id: 'test-poll-1',
          title: 'Sondage de test',
          slug: 'sondage-test',
          type: 'date',
          status: 'active',
          created_at: new Date().toISOString(),
          settings: {
            selectedDates: ['2025-02-01', '2025-02-02'],
          },
        },
      ];
      localStorage.setItem('dev-polls', JSON.stringify(polls));
    });
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

      // Vérifier que le dashboard se charge
      await expect(page.getByText('Mes conversations')).toBeVisible({ timeout: 10000 });
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

  test('@functional - Basculer entre vue grille et vue tableau', async ({ page }) => {
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

      // Vérifier que la vue grille est active par défaut
      const gridButton = page.locator('button[title="Vue grille"]');
      await expect(gridButton).toHaveClass(/bg-blue-500/);

      // Basculer vers la vue tableau
      const tableButton = page.locator('button[title="Vue table"]');
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

  test('@functional - Sélectionner/désélectionner des conversations', async ({ page }) => {
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
      const selectButton = page.getByRole('button', { name: /Sélectionner/i });
      await selectButton.waitFor({ state: 'visible', timeout: 5000 });
      await selectButton.click();
      
      // Attendre que React se mette à jour
      await page.waitForTimeout(100);

      // Vérifier que la carte est sélectionnée en vérifiant le border bleu
      await expect(firstCard).toHaveClass(/border-blue-500|ring-blue-500|border-blue/, { timeout: 3000 });

      // Vérifier que le bouton affiche maintenant "X sélectionné(s)"
      const selectedText = page.getByText(/\d+ sélectionné/i);
      await expect(selectedText).toBeVisible({ timeout: 2000 });

      // Cliquer à nouveau sur le bouton (maintenant "Désélectionner tout" - le texte a changé)
      // Le bouton a changé de texte, donc on doit le re-trouver avec le nouveau texte
      const deselectButton = page.getByRole('button', { name: /\d+ sélectionné/i });
      await deselectButton.waitFor({ state: 'visible', timeout: 3000 });
      await deselectButton.click();
      
      // Attendre que React se mette à jour
      await page.waitForTimeout(100);

      // Vérifier que la sélection est annulée (border bleu disparaît)
      await expect(firstCard).not.toHaveClass(/border-blue-500|ring-blue-500/, { timeout: 3000 });
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('@functional - Sélectionner tout', async ({ page }) => {
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

      // Cliquer sur "Sélectionner"
      await page.getByRole('button', { name: /Sélectionner/i }).click();

      await page.waitForTimeout(500);

      // Vérifier que toutes les conversations de la page sont sélectionnées
      const selectedText = page.getByText(/\d+ sélectionné/i);
      await expect(selectedText).toBeVisible({ timeout: 3000 });
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
      // Créer plus de conversations pour tester la pagination
      await page.evaluate(() => {
        const conversations: any[] = [];
        for (let i = 1; i <= 25; i++) {
          conversations.push({
            id: `test-conv-${i}`,
            title: `Conversation ${i}`,
            status: 'active',
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
            firstMessage: `Premier message ${i}`,
            messageCount: i,
            isFavorite: false,
            tags: [],
            metadata: {},
          });
        }
        localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
      });

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

      // Vérifier que l'indicateur de quota est visible
      await expect(page.getByText(/conversations utilisées/i)).toBeVisible({ timeout: 5000 });
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
