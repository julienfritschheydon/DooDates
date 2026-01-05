// Imports Playwright et helpers E2E utilisés dans le scénario ultra simple.
import { test, expect } from "@playwright/test";
import { withConsoleGuard, waitForCopySuccess, PRODUCT_ROUTES } from "./utils";
import { setupTestEnvironment } from "./helpers/test-setup";
import { waitForNetworkIdle, waitForReactStable } from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";
import { createDatePollWithTimeSlots, PollCreationResult } from "./helpers/poll-date-helpers";
import {
  navigateToPollVotingPage,
  performDashboardActions,
} from "./helpers/poll-navigation-helpers";
import { authenticateUser } from "./helpers/auth-helpers";

// Simple scoped logger
function mkLogger(scope: string) {
  return (...parts: any[]) => console.log(`[${scope}]`, ...parts);
}

/**
 * Test E2E "Ultra Simple 2" : vérifie qu'un sondage date peut être créé via IA,
 * consulté côté votant puis retrouvé dans le dashboard en utilisant uniquement les helpers partagés.
 */
test.describe("DooDates - Test Ultra Simple 2 (avec helpers)", () => {
  test.describe.configure({ mode: "serial" });

  // ...

  test.beforeEach(async ({ page, browserName }) => {
    // Prépare l'environnement complet (mode local, mocks, garde console) avant chaque test.
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: false,
      navigation: { path: PRODUCT_ROUTES.datePoll.landing },
      consoleGuard: {
        enabled: false,
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /The above error occurred in one of your React components/i,
          /The above error occurred in the .* component/i,
          /Erreur préchargement/i,
          /calendrier JSON/i,
          /TimeSlot Functions/i,
          /Sondage avec slug .* non trouvé/i,
          /DooDatesError/i,
          /\[vite\] Failed to reload.*\.css/i,
          /\[vite\] Failed to reload \/src\/index\.css/i,
          /vite.*reload.*css/i,
          /Can't find variable: requestIdleCallback/i,
          /requestIdleCallback is not defined/i,
          /Access to fetch.*has been blocked by CORS policy/i,
          /No 'Access-Control-Allow-Origin' header/i,
          /No dates selected for poll creation/i,
          /Erreur lors de la sauvegarde/i,
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
        ],
      },
      mocks: { all: true },
    });

    // Authenticate user to avoid guest mode issues
    await authenticateUser(page, browserName, { reload: true, waitForReady: true });
  });

  // Workflow principal: création date poll via IA, navigation votant, vérifs dashboard.
  // ⚠️ SKIP : Bug connu - titre du poll écrasé par titre de conversation (voir Planning.md)
  test("Workflow complet : Création DatePoll → Dashboard (avec helpers) @critical", async ({
    page,
    browserName,
  }, testInfo) => {
    const timeouts = getTimeouts(browserName);
    const log = mkLogger("UltraSimple2");

    // Détecter si c'est un navigateur mobile pour activer le mode adapté dans les helpers.
    const projectName = testInfo.project.name;
    const isMobileBrowser = projectName === "Mobile Safari" || projectName === "Mobile Chrome";

    await withConsoleGuard(
      page,
      async () => {
        // Les helpers enchaînent plusieurs actions → on marque le test comme lent pour Playwright.
        test.slow();
        // Sanity check: l'app doit charger correctement avant de lancer la suite.
        await expect(page).toHaveTitle(/);
        console.log("✅ App chargée");

        // 🆕 UTILISATION DES HELPERS - Création complète du poll en UNE ligne !
        // Le helper gère : prompt IA, sélection des dates, validation et publication.
        const pollResult: PollCreationResult = await createDatePollWithTimeSlots(
          page,
          browserName,
          {
            title: "Test E2E Ultra Simple 2 (avec helpers)",
            mobileMode: isMobileBrowser,
            skipTimeSlots: true,
            aiPrompt:
              'Peux-tu créer un sondage "Test E2E Ultra Simple 2" avec trois dates espacées et quelques créneaux horaires ?',
          },
        );

        console.log(`🎯 Poll créé: ${pollResult.title} (slug: ${pollResult.pollSlug})`);

        // 🆕 UTILISATION DES HELPERS - Navigation vers la page votant
        // Vérifie que la page publique se charge et que le slug fonctionne.
        await navigateToPollVotingPage(page, browserName, pollResult.pollSlug, pollResult.title);

        // 🆕 UTILISATION DES HELPERS - Actions dashboard (copie lien + vérifications)
        // Ici on simule l'utilisateur qui copie le lien et vérifie la présence du sondage.
        await performDashboardActions(page, browserName, {
          copyLink: true,
          verifyPollVisible: true,
          expectedTitle: pollResult.title,
          dashboardUrl: PRODUCT_ROUTES.datePoll.dashboard,
        });

        console.log("🎉 WORKFLOW COMPLET RÉUSSI (avec helpers)");
        log("Test completed successfully!");
      },
      {
        allowlist: [
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
        ],
      },
    );
  });
});
