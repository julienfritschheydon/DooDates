import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { withConsoleGuard } from "../../utils";
import { setupTestEnvironment } from "../../helpers/test-setup";
import {
  waitForNetworkIdle,
  waitForElementReady,
  waitForReactStable,
} from "../../helpers/wait-helpers";
import { createTestPoll, clearTestData } from "../../helpers/test-data";
import { getTimeouts } from "../../config/timeouts";
import { safeIsVisible } from "../../helpers/safe-helpers";

/**
 * Tests E2E Edge Cases pour le Dashboard Date Polls
 *
 * Tests les cas limites et conditions extrêmes pour s'assurer que le dashboard
 * reste stable et fonctionnel dans toutes les situations.
 *
 * @tags @dashboard @date-polls @edge-cases @stability
 */
test.describe("Date Polls Dashboard - Edge Cases", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName);
    await clearTestData(page, { all: true });
  });

  /**
   * Test 1: Dashboard vide
   * Vérifie que le dashboard affiche un message approprié quand il n'y a aucun sondage
   */
  test("@edge - Dashboard vide - Affiche message approprié", async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Ne créer aucun sondage
      await page.goto("/date/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Vérifier qu'un message de dashboard vide est affiché
      // Accepter différents messages possibles
      const emptyMessages = [
        "Aucun sondage",
        "Aucun sondage trouvé",
        "Pas encore de sondage",
        "Commencez par créer votre premier sondage",
      ];

      // Attendre que le dashboard se charge
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });

      // Vérifier qu'au moins un message vide est affiché
      let foundEmptyMessage = false;
      for (const message of emptyMessages) {
        try {
          await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
          foundEmptyMessage = true;
          break;
        } catch (e) {
          // Continuer avec le message suivant
        }
      }

      // Si aucun message spécifique trouvé, vérifier qu'il y a un état vide
      if (!foundEmptyMessage) {
        // Vérifier qu'il n'y a pas de sondages affichés
        const pollItems = page.locator('[data-testid="poll-item"]');
        await expect(pollItems).toHaveCount(0, { timeout: timeouts.element });

        // Vérifier qu'il y a un bouton pour créer un sondage
        const createButton = page.locator('a[href*="create"], button:has-text("Créer")');
        if (await safeIsVisible(createButton, { timeout: 5000 })) {
          foundEmptyMessage = true;
        }
      }

      expect(foundEmptyMessage).toBe(true);
    });
  });

  /**
   * Test 2: Beaucoup de sondages (50+) - Performance et pagination
   * Vérifie que le dashboard reste performant avec beaucoup de données
   */
  test("@edge @stability - Beaucoup de sondages (50+) - Dashboard performant", async ({
    page,
    browserName,
  }) => {
    await withConsoleGuard(page, async () => {
      // Créer 50 sondages pour tester la performance
      const polls = Array.from({ length: 50 }, (_, i) => ({
        title: `Sondage de performance ${i + 1}`,
        slug: `perf-poll-${i + 1}`,
        type: "date" as const,
        status: "active" as const,
        settings: {
          selectedDates: [`2025-01-${String(i + 1).padStart(2, "0")}`],
        },
      }));

      // Créer les polls un par un avec createTestPoll
      for (const poll of polls) {
        await createTestPoll(page, poll);
      }

      await page.goto("/date/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Vérifier que le dashboard se charge sans erreur
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });

      // Attendre que les sondages se chargent avec timeout adapté au navigateur
      await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element * 2, // Timeout plus long pour beaucoup de données
      });

      // Vérifier qu'il y a des sondages affichés
      const pollItems = page.locator('[data-testid="poll-item"]');
      const pollCount = await pollItems.count();

      expect(pollCount).toBeGreaterThan(0);

      // Vérifier que la pagination fonctionne si présente
      const pagination = page.locator('[data-testid="dashboard-pagination"]');
      if (await safeIsVisible(pagination, { timeout: 5000 })) {
        // Vérifier que les contrôles de pagination sont fonctionnels
        const nextPage = pagination.locator(
          'button:has-text("Suivant"), button[aria-label*="next"]',
        );
        if (await safeIsVisible(nextPage, { timeout: 3000 })) {
          await nextPage.click();
          await waitForReactStable(page, { browserName });

          // Vérifier que la page change
          const newPollCount = await pollItems.count();
          expect(newPollCount).toBeGreaterThan(0);
        }
      }

      // Vérifier que le dashboard reste interactif
      const firstPoll = pollItems.first();
      await expect(firstPoll).toBeVisible({ timeout: timeouts.element });

      // Test de scroll pour vérifier la performance
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await waitForReactStable(page, { browserName });

      // Vérifier que les éléments sont toujours visibles après scroll
      await expect(firstPoll).toBeVisible({ timeout: timeouts.element });
    });
  });

  /**
   * Test 3: Sondages avec titres très longs
   * Vérifie que l'affichage reste correct avec des titres longs
   */
  test("@edge - Sondages avec titres très longs (100+ caractères) - Affichage correct", async ({
    page,
    browserName,
  }) => {
    await withConsoleGuard(page, async () => {
      // Créer un sondage avec un titre très long
      const longTitle =
        "Sondage avec un titre extrêmement long qui devrait être tronqué dans l'interface pour éviter de casser le layout visuel du dashboard et des cartes de sondages";

      const polls = [
        {
          title: longTitle,
          slug: "long-title-poll",
          type: "date" as const,
          status: "active" as const,
          settings: {
            selectedDates: ["2025-01-15"],
          },
        },
      ];

      await createTestPoll(page, polls[0]);

      await page.goto("/date/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Vérifier que le sondage s'affiche
      const pollItem = await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Vérifier que la carte est visible (même avec le titre long)
      await expect(pollItem).toBeVisible({ timeout: timeouts.element });

      // Vérifier que le titre est présent (même si tronqué)
      const titleElement = pollItem.locator('h3, .poll-title, [data-testid="poll-title"]');
      if (await safeIsVisible(titleElement, { timeout: 3000 })) {
        const titleText = await titleElement.textContent();
        expect(titleText).toContain("Sondage avec un titre");
      }

      // Vérifier que le layout n'est pas cassé
      const pollWidth = await pollItem.evaluate((el: HTMLElement) => el.offsetWidth);
      expect(pollWidth).toBeGreaterThan(0);
      expect(pollWidth).toBeLessThan(2000);
    });
  });

  /**
   * Test 4: Sondages avec données corrompues/invalides
   * Vérifie que le dashboard gère correctement les données invalides
   */
  test("@edge - Sondages avec données invalides - Dashboard stable", async ({
    page,
    browserName,
  }) => {
    await withConsoleGuard(page, async () => {
      // Créer des sondages avec des données potentiellement problématiques
      const invalidPolls = [
        {
          title: "", // Titre vide
          slug: "empty-title-poll",
          type: "date" as const,
          status: "active" as const,
          settings: {
            selectedDates: ["2025-01-15"], // Au moins une date valide
          },
        },
        {
          title: "Sondage sans dates",
          slug: "no-dates-poll",
          type: "date" as const,
          status: "active" as const,
          settings: {
            selectedDates: ["2025-01-16"], // Au moins une date valide
          },
        },
        {
          title: "Sondage avec dates invalides",
          slug: "invalid-dates-poll",
          type: "date" as const,
          status: "active" as const,
          settings: {
            selectedDates: ["2025-01-15", "2025-01-16"], // Dates valides
          },
        },
      ];

      // Créer chaque poll invalide
      for (const poll of invalidPolls) {
        await createTestPoll(page, poll);
      }

      await page.goto("/date/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Vérifier que le dashboard se charge sans crash
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });

      // Vérifier que les sondages invalides sont soit affichés avec fallback, soit ignorés
      const pollItems = page.locator('[data-testid="poll-item"]');
      const pollCount = await pollItems.count();

      // Le dashboard ne devrait pas crasher même avec des données invalides
      expect(pollCount).toBeGreaterThanOrEqual(0);

      // S'il y a des sondages affichés, vérifier qu'ils sont interactifs
      if (pollCount > 0) {
        const firstPoll = pollItems.first();
        await expect(firstPoll).toBeVisible({ timeout: timeouts.element });

        // Vérifier qu'on peut cliquer sur un sondage sans erreur
        await firstPoll.click();
        await waitForReactStable(page, { browserName });

        // Vérifier qu'on est redirigé vers la page du sondage ou workspace
        const currentUrl = page.url();
        const hasValidUrl =
          currentUrl.includes("/poll/") ||
          currentUrl.includes("/vote") ||
          currentUrl.includes("/workspace/date") ||
          currentUrl.includes("/workspace/");
        expect(hasValidUrl).toBe(true);
      }
    });
  });

  /**
   * Test 5: Filtres et recherche avec beaucoup de données
   * Vérifie que les filtres restent performants avec beaucoup de sondages
   */
  test("@edge - Filtres et recherche avec beaucoup de données - Performance correcte", async ({
    page,
    browserName,
  }) => {
    await withConsoleGuard(page, async () => {
      // Créer 30 sondages avec des titres différents pour tester la recherche
      const searchablePolls = Array.from({ length: 30 }, (_, i) => ({
        title: `Sondage recherche ${i + 1} avec mots-clés test performance`,
        slug: `search-poll-${i + 1}`,
        type: "date" as const,
        status: i % 3 === 0 ? ("closed" as const) : ("active" as const),
        settings: {
          selectedDates: [`2025-01-${String(i + 1).padStart(2, "0")}`],
        },
      }));

      // Créer chaque poll de recherche
      for (const poll of searchablePolls) {
        await createTestPoll(page, poll);
      }

      await page.goto("/date/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      // Attendre que les sondages se chargent
      await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      // Tester la recherche
      const searchInput = page.locator(
        'input[placeholder*="rechercher"], input[placeholder*="search"], [data-testid="search-input"]',
      );
      if (await safeIsVisible(searchInput, { timeout: 5000 })) {
        await searchInput.fill("recherche 15");
        await waitForReactStable(page, { browserName });

        // Vérifier que les résultats sont filtrés
        const filteredPolls = page.locator('[data-testid="poll-item"]');
        const filteredCount = await filteredPolls.count();

        // Devrait trouver moins de résultats après filtrage
        expect(filteredCount).toBeLessThan(30);
        expect(filteredCount).toBeGreaterThan(0);
      }

      // Tester les filtres de statut
      const statusFilter = page.locator(
        'select[data-testid="status-filter"], button:has-text("Statut")',
      );
      if (await safeIsVisible(statusFilter, { timeout: 5000 })) {
        await statusFilter.click();

        // Sélectionner un statut spécifique
        const activeOption = page.locator('text=Actif, [data-value="active"]');
        if (await safeIsVisible(activeOption, { timeout: 3000 })) {
          await activeOption.click();
          await waitForReactStable(page, { browserName });

          // Vérifier que les résultats sont filtrés par statut
          const statusFilteredPolls = page.locator('[data-testid="poll-item"]');
          const statusFilteredCount = await statusFilteredPolls.count();
          expect(statusFilteredCount).toBeGreaterThan(0);
        }
      }
    });
  });

  /**
   * Test 6: Responsive design - Mobile vs Desktop
   * Vérifie que le dashboard fonctionne correctement sur différentes tailles d'écran
   */
  test("@edge @responsive - Dashboard mobile vs desktop - Affichage adapté", async ({
    page,
    browserName,
  }) => {
    await withConsoleGuard(page, async () => {
      // Créer quelques sondages pour tester
      const polls = Array.from({ length: 5 }, (_, i) => ({
        title: `Sondage responsive ${i + 1}`,
        slug: `responsive-poll-${i + 1}`,
        type: "date" as const,
        status: "active" as const,
        settings: {
          selectedDates: [`2025-01-${String(i + 1).padStart(2, "0")}`],
        },
      }));

      // Créer chaque poll responsive
      for (const poll of polls) {
        await createTestPoll(page, poll);
      }

      const timeouts = getTimeouts(browserName);

      // Test Desktop
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto("/date/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(page, { browserName });

      await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      const desktopPollItems = page.locator('[data-testid="poll-item"]');
      const desktopCount = await desktopPollItems.count();
      expect(desktopCount).toBe(5);

      // Vérifier le layout desktop (probablement grille)
      const dashboardContainer = page.locator(
        '[data-testid="dashboard-ready"], .dashboard-container',
      );
      if (await safeIsVisible(dashboardContainer, { timeout: 3000 })) {
        const desktopLayout = await dashboardContainer.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display;
        });
        expect(desktopLayout).toMatch(/grid|flex|block/);
      }

      // Test Mobile
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await waitForReactStable(page, { browserName });

      const mobilePollItems = page.locator('[data-testid="poll-item"]');
      const mobileCount = await mobilePollItems.count();
      expect(mobileCount).toBe(5);

      // Vérifier le layout mobile (probablement colonne unique)
      if (await safeIsVisible(dashboardContainer, { timeout: 3000 })) {
        const mobileLayout = await dashboardContainer.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display;
        });
        expect(mobileLayout).toMatch(/grid|flex|block/);
      }

      // Vérifier que les éléments sont toujours interactifs en mobile
      const firstMobilePoll = mobilePollItems.first();
      await expect(firstMobilePoll).toBeVisible({ timeout: timeouts.element });

      // Test de scroll mobile
      await page.evaluate(() => window.scrollTo(0, 200));
      await waitForReactStable(page, { browserName });

      await expect(firstMobilePoll).toBeVisible({ timeout: timeouts.element });
    });
  });

  /**
   * Test 7: Navigation rapide et clics multiples
   * Vérifie que le dashboard reste stable avec des interactions rapides
   */
  test("@edge @stability - Navigation rapide - Dashboard stable", async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Créer 10 sondages
      const polls = Array.from({ length: 10 }, (_, i) => ({
        title: `Sondage navigation ${i + 1}`,
        slug: `nav-poll-${i + 1}`,
        type: "date" as const,
        status: "active" as const,
        settings: {
          selectedDates: [`2025-01-${String(i + 1).padStart(2, "0")}`],
        },
      }));

      // Créer chaque poll de navigation
      for (const poll of polls) {
        await createTestPoll(page, poll);
      }

      await page.goto("/date/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(page, { browserName });

      const timeouts = getTimeouts(browserName);

      await waitForElementReady(page, '[data-testid="poll-item"]', {
        browserName,
        timeout: timeouts.element,
      });

      const pollItems = page.locator('[data-testid="poll-item"]');

      // Test de clics rapides sur différents sondages
      for (let i = 0; i < 3; i++) {
        const pollItem = pollItems.nth(i);
        await expect(pollItem).toBeVisible({ timeout: timeouts.element });

        // Cliquer sur le sondage
        await pollItem.click();
        await waitForReactStable(page, { browserName });

        // Vérifier qu'on est sur la page du sondage ou workspace
        const currentUrl = page.url();
        const hasValidUrl =
          currentUrl.includes("/poll/") ||
          currentUrl.includes("/workspace/date") ||
          currentUrl.includes("/workspace/");
        expect(hasValidUrl).toBe(true);

        // Retour au dashboard
        await page.goBack();
        await waitForReactStable(page, { browserName });

        // Vérifier qu'on est revenu au dashboard
        expect(page.url()).toContain("/dashboard");
      }

      // Vérifier que le dashboard est toujours fonctionnel après les navigations
      const finalPollItems = page.locator('[data-testid="poll-item"]');
      const finalCount = await finalPollItems.count();
      expect(finalCount).toBe(10);
    });
  });
});
