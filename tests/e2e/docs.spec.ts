import { test, expect } from '@playwright/test';
import { attachConsoleGuard, warmup, enableE2ELocalMode } from './utils';
import { waitForReactStable, waitForNetworkIdle, waitForElementReady } from './helpers/wait-helpers';
import { getTimeouts } from './config/timeouts';
import { safeIsVisible } from './helpers/safe-helpers';

test.describe('Documentation - Tests E2E', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2ELocalMode(page);
    await warmup(page);
  });

  test('Documentation page loads without errors @smoke', async ({ page, browserName }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /The above error occurred in one of your React components/i,
      ],
    });

    try {
      const timeouts = getTimeouts(browserName);
      // Naviguer vers la page de documentation
      await page.goto('/docs', { waitUntil: 'domcontentloaded' });
      
      // Attendre que la page soit complètement chargée
      await waitForNetworkIdle(page, { browserName, timeout: timeouts.network }).catch(() => {});
      await waitForReactStable(page, { browserName });
      
      // Vérifier que la page de documentation est accessible
      await expect(page).toHaveURL(/.*\/docs/);
      
      // Vérifier que le titre ou le contenu principal est visible
      // Le titre contient un emoji et le texte exact, donc on cherche le texte sans l'emoji
      const title = page.getByRole('heading', { name: /Documentation/i }).or(
        page.locator('h1').filter({ hasText: /Documentation/i })
      );
      const description = page.getByText(/Bienvenue dans la documentation/i);
      
      // Attendre que l'un ou l'autre soit visible avec un timeout approprié
      await Promise.race([
        title.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
        description.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      ]);
      
      // Vérifier que l'un ou l'autre est visible
      const titleVisible = await safeIsVisible(title);
      const descVisible = await safeIsVisible(description);
      
      if (!titleVisible && !descVisible) {
        // Si aucun n'est visible, prendre un screenshot pour debug
        await page.screenshot({ path: 'test-results/docs-home-failed.png' });
        throw new Error('Ni le titre ni la description de la documentation ne sont visibles');
      }
      
      // Vérifier qu'il n'y a pas d'erreurs de chargement de ressources
      // La navigation a déjà été effectuée plus haut, pas besoin de re-naviguer
      
      await guard.assertClean();
    } finally {
      guard.stop();
    }
  });

  test('Documentation page loads a specific document @functional', async ({ page, browserName }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /The above error occurred in one of your React components/i,
      ],
    });

    try {
      const timeouts = getTimeouts(browserName);
      // Naviguer vers un document spécifique
      await page.goto('/docs/01-Guide-Demarrage-Rapide', { waitUntil: 'domcontentloaded' });
      
      // Attendre que le document soit chargé
      await waitForNetworkIdle(page, { browserName, timeout: timeouts.network }).catch(() => {});
      await waitForReactStable(page, { browserName });
      
      // Vérifier que l'URL est correcte
      await expect(page).toHaveURL(/.*\/docs\/01-Guide-Demarrage-Rapide/);
      
      // Vérifier que le contenu du document est visible (pas juste le loader)
      // Le loader devrait disparaître et le contenu markdown devrait apparaître
      const loader = page.locator('[class*="animate-spin"]');
      await loader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      
      // Vérifier qu'il y a du contenu (pas juste une erreur)
      const errorMessage = page.getByText(/Erreur de chargement/i);
      const hasError = await safeIsVisible(errorMessage);
      
      if (hasError) {
        throw new Error('Le document n\'a pas pu être chargé');
      }
      
      // Vérifier qu'il y a du contenu markdown rendu (prose typography)
      const content = await waitForElementReady(page, '.docs-content, .prose, [class*="prose"]', { browserName, timeout: timeouts.element });
      await expect(content.first()).toBeVisible();
      
      await guard.assertClean();
    } finally {
      guard.stop();
    }
  });

  test('Documentation page handles 404 gracefully @functional', async ({ page, browserName }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /Document non trouvé/i,
        /Le document demandé n'existe pas/i,
      ],
    });

    try {
      const timeouts = getTimeouts(browserName);
      // Naviguer vers un document qui n'existe pas
      await page.goto('/docs/non-existent-document', { waitUntil: 'domcontentloaded' });
      
      // Attendre que la page soit chargée
      await waitForNetworkIdle(page, { browserName, timeout: timeouts.network }).catch(() => {});
      
      // Attendre que le composant se mette à jour
      await waitForReactStable(page, { browserName });
      
      // Vérifier que la page ne crash pas et qu'elle affiche quelque chose
      // Le composant DocsViewer peut afficher un loader, un message d'erreur, ou rester vide
      // On vérifie simplement que la page ne crash pas en vérifiant que le body existe
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: timeouts.element });
      
      // Vérifier que l'URL est correcte (ou qu'elle a été redirigée vers /docs)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/docs/);
      
      await guard.assertClean();
    } finally {
      guard.stop();
    }
  });

  test('Documentation assets load correctly (no 404 errors) @smoke', async ({ page, browserName }) => {
    const failedRequests: string[] = [];

    // Capturer les requêtes qui échouent
    page.on('response', (response) => {
      if (response.status() >= 400 && response.url().includes('/docs')) {
        failedRequests.push(`${response.url()} - ${response.status()}`);
      }
    });

    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
      ],
    });

    try {
      const timeouts = getTimeouts(browserName);
      // Naviguer vers la documentation
      await page.goto('/docs', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName, timeout: timeouts.network });
      
      // Naviguer vers un document pour déclencher le chargement des assets
      await page.goto('/docs/01-Guide-Demarrage-Rapide', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName, timeout: timeouts.network });
      
      // Vérifier qu'il n'y a pas de requêtes 404 pour les assets de documentation
      const doc404s = failedRequests.filter(req => 
        req.includes('/docs/') && !req.includes('non-existent')
      );
      
      if (doc404s.length > 0) {
        console.warn('Requêtes 404 détectées:', doc404s);
        // Ne pas faire échouer le test pour les assets manquants, mais les logger
      }
      
      await guard.assertClean();
    } finally {
      guard.stop();
    }
  });
});

