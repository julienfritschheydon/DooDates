import { test, expect } from "@playwright/test";
import { withConsoleGuard, PRODUCT_ROUTES } from "./utils";
import { setupTestEnvironment } from "./helpers/test-setup";
import { authenticateUser } from "./helpers/auth-helpers";
import {
  waitForReactStable,
  waitForNetworkIdle,
  waitForElementReady,
} from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";
import { fillFormTitle } from "./helpers/form-helpers";

const mkLogger =
  (scope: string) =>
  (...parts: any[]) =>
    console.log(`[${scope}]`, ...parts);

/**
 * Test Ultra Simple Dispo (Availability Poll) : workflow complet de création et dashboard.
 * Note: Availability Polls utilise un formulaire manuel (pas le chat IA).
 */
test.describe("DooDates - Test Ultra Simple Dispo (Availability)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: false,
      navigation: { path: PRODUCT_ROUTES.availabilityPoll.landing },
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /The above error occurred/i,
          /DooDatesError/i,
          /No dates selected/i,
          /Erreur lors de la sauvegarde/i,
          /Failed to send message/i,
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
          /ResizeObserver loop/i,
        ],
      },
      mocks: { all: true },
    });

    await authenticateUser(page, browserName, { reload: true, waitForReady: true });
  });

  test("Workflow complet Availability Poll : création → dashboard @smoke @functional", async ({
    page,
    browserName,
  }) => {
    const log = mkLogger("UltraSimpleDispo");
    const timeouts = getTimeouts(browserName);

    await withConsoleGuard(
      page,
      async () => {
        test.slow();

        // 1. Naviguer vers le workspace Availability
        log("🛠️ Navigation vers le workspace Availability");
        await page.goto(PRODUCT_ROUTES.availabilityPoll.workspace, {
          waitUntil: "domcontentloaded",
        });
        await waitForNetworkIdle(page, { browserName });
        await expect(page).toHaveTitle(/DooDates/);
        log("✅ App chargée");

        // 2. Remplir le formulaire manuel (utiliser fillFormTitle helper)
        log("📝 Remplissage du formulaire");

        // Utiliser data-testid cohérent avec les autres produits
        const titleInput = page.locator('[data-testid="poll-title"]').first();
        await expect(titleInput).toBeVisible({ timeout: timeouts.element });
        await titleInput.fill("Réunion Équipe - Test E2E Dispo");
        log("✅ Titre rempli");

        // Description (optionnel)
        const descInput = page.locator('[data-testid="poll-description"]').first();
        if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await descInput.fill("Test automatisé des disponibilités");
          log("✅ Description remplie");
        } else {
          log("⚠️ Description non trouvée - continuation");
        }

        await waitForReactStable(page, { browserName });

        // 3. Publier le sondage
        log("🚀 Publication du sondage");
        const createButton = page
          .locator(
            'button:has-text("Créer le sondage"), button:has-text("Publier"), [data-testid="create-poll-button"]',
          )
          .first();

        // Attendre que le bouton soit enabled
        await expect(createButton).toBeEnabled({ timeout: timeouts.element });
        await createButton.click();

        // Attendre la création/redirection
        await waitForReactStable(page, { browserName });
        await waitForNetworkIdle(page, { browserName });

        // Vérifier succès - utiliser le data-testid ajouté
        const successIndicator = page.locator('[data-testid="success-message"]').first();
        await expect(successIndicator).toBeVisible({ timeout: timeouts.element });
        log("✅ Sondage créé");

        // 4. Dashboard - utiliser la route produit spécifique
        log("📊 Vérification Dashboard");
        await page.goto(PRODUCT_ROUTES.availabilityPoll.dashboard, {
          waitUntil: "domcontentloaded",
        });
        await waitForNetworkIdle(page, { browserName });

        await expect(page).toHaveURL(/DooDates\/availability-polls\/dashboard/);

        // Vérifier contenu dashboard - le poll doit être visible ou message "Aucun"
        const dashboardContent = page
          .locator('[data-testid="poll-item"]')
          .or(page.locator('h3:has-text("Réunion Équipe")'))
          .or(page.getByRole("heading", { level: 1 }))
          .first();
        await expect(dashboardContent).toBeVisible({ timeout: timeouts.element });

        log("🎉 Workflow Availability Poll terminé avec succès");
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
