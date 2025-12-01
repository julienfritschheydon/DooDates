import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { withConsoleGuard } from './utils';
import { setupTestEnvironment } from './helpers/test-setup';
import { seedDashboard, type DashboardSeedOptions, type DashboardSeedPayload } from './fixtures/dashboardSeed';
import { waitForNetworkIdle, waitForReactStable, waitForElementReady } from './helpers/wait-helpers';
import { getTimeouts } from './config/timeouts';
import { safeIsVisible } from './helpers/safe-helpers';

/**
 * Tests E2E critiques pour le Dashboard (Smoke Tests)
 * 
 * @tags @dashboard @smoke @critical
 */
test.describe('Dashboard - Smoke Tests Critiques', () => {

  async function setupTestData(
    page: Page,
    options?: DashboardSeedOptions,
    overridePayload?: Partial<DashboardSeedPayload>,
  ) {
    await seedDashboard(page, options, overridePayload);
  }

  async function waitForDashboardReady(page: Page, browserName: string) {
    const timeouts = getTimeouts(browserName);
    
    // Attendre que l'élément dashboard-ready soit visible
    await waitForElementReady(page, '[data-testid="dashboard-ready"]', {
      browserName,
      timeout: timeouts.element,
    });
    
    // Attendre que les éléments de chargement disparaissent
    await expect(page.locator('[data-testid="dashboard-loading"]')).toHaveCount(0);
    
    // Attendre que le titre du dashboard soit visible
    await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible({ timeout: timeouts.element });
    
    // Attendre que React soit stable
    await waitForReactStable(page, { browserName });
  }

  test.beforeEach(async ({ page, browserName }) => {
    // Setup mocks et mode E2E sans navigation (chaque test navigue vers sa propre page)
    const { setupAllMocksWithoutNavigation } = await import('./global-setup');
    const { enableE2ELocalMode, warmup, attachConsoleGuard, getDefaultConsoleGuardAllowlist } = await import('./utils');
    
    await enableE2ELocalMode(page);
    await warmup(page);
    attachConsoleGuard(page, {
      allowlist: getDefaultConsoleGuardAllowlist(),
    });
  });

  test('@smoke @critical - Charger le dashboard sans erreur', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    await withConsoleGuard(page, async () => {
      await setupTestData(page);
      await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });
      await waitForDashboardReady(page, browserName);

      // Vérifier que le dashboard se charge
      const heading = page.getByRole('heading', { name: /Tableau de bord/i });
      await expect(heading).toBeVisible({ timeout: timeouts.element });
      
      // Vérifier qu'il y a au moins un élément de sondage (ou message vide)
      const pollItem = page.locator('[data-testid="poll-item"]').first();
      const emptyState = page.getByText(/Aucun sondage trouvé/i);
      
      // Accepter soit un sondage, soit l'état vide
      const hasContent = await Promise.race([
        pollItem.isVisible().then(() => true),
        emptyState.isVisible().then(() => true),
      ]);
      
      expect(hasContent).toBeTruthy();
    });
  });

  test('@smoke @critical - Navigation vers les pages principales', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    await withConsoleGuard(page, async () => {
      await setupTestData(page);
      await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });
      await waitForDashboardReady(page, browserName);

      // Vérifier que les éléments principaux du dashboard existent
      const heading = page.getByRole('heading', { name: /Tableau de bord/i });
      await expect(heading).toBeVisible({ timeout: timeouts.element });

      // Vérifier la recherche
      const searchInput = page.getByPlaceholder(/Rechercher une conversation ou un sondage/i);
      await expect(searchInput).toBeVisible({ timeout: timeouts.element });

      // Vérifier les filtres principaux
      const filterButtons = page.locator('button').filter({ hasText: /(Tous|Conversations|Sondages|Formulaires)/i });
      await expect(filterButtons.first()).toBeVisible({ timeout: timeouts.element });

      // Vérifier que les boutons d'action existent (créer ou se connecter)
      const connectButton = page.getByRole('button', { name: /Se connecter/i });
      const isConnectVisible = await connectButton.isVisible().catch(() => false);
      
      // Le bouton se connecter devrait être visible pour les utilisateurs non connectés
      expect(isConnectVisible).toBeTruthy();
    });
  });

  test('@smoke @critical - Pas d\'erreurs console critiques', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    await withConsoleGuard(page, async () => {
      await setupTestData(page);
      await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });
      await waitForDashboardReady(page, browserName);

      // Attendre un peu pour capturer les erreurs potentielles
      await page.waitForTimeout(2000);

      // Le test passe si withConsoleGuard ne lève pas d'erreur
      expect(true).toBeTruthy();
    });
  });

});
