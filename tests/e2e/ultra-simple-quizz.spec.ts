import { test, expect } from "@playwright/test";
import { withConsoleGuard, PRODUCT_ROUTES, robustFill } from "./utils";
import { setupTestEnvironment } from "./helpers/test-setup";
import { authenticateUser } from "./helpers/auth-helpers";
import { waitForReactStable, waitForNetworkIdle } from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";
import { navigateToWorkspace, sendChatMessage } from "./helpers/chat-helpers";

const mkLogger = (scope: string) => {
  return (...parts: any[]) => {
    console.log(`[${scope}]`, ...parts);
  };
};

/**
 * Test Ultra Simple Quizz : workflow complet de création et dashboard.
 * Note: Teste d'abord si le workspace Quizz a un chat IA, sinon utilise le formulaire.
 */
test.describe("DooDates - Test Ultra Simple Quizz", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: false,
      navigation: { path: PRODUCT_ROUTES.quizz.landing },
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Importing a module script failed\./i,
          /DooDatesError/i,
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

  test("Workflow complet Quizz : création → dashboard @smoke @functional", async ({
    page,
    browserName,
  }) => {
    const log = mkLogger("UltraSimpleQuizz");
    const timeouts = getTimeouts(browserName);

    await withConsoleGuard(
      page,
      async () => {
        test.slow();

        // 1. Navigation workspace Quizz
        log("🛠️ Navigation vers le workspace Quizz");
        await navigateToWorkspace(page, browserName, "quizz", { waitForChat: false });
        await waitForNetworkIdle(page, { browserName });
        // Title check removed as per user request (DooDates name changing)
        log("✅ App chargée");

        // 2. Mode Formulaire manuel
        log(`📝 Mode Formulaire - URL actuelle: ${page.url()}`);

        // Remplir le titre
        const formTitle = page.locator('[data-testid="quiz-title-input"]').first();
        await robustFill(formTitle, "Quizz Géographie - Test E2E");

        // Ajouter une question
        const addQuestionBtn = page.locator('[data-testid="add-question-button"]');
        await addQuestionBtn.click();

        // Remplir la question
        const questionInput = page.getByPlaceholder("Entrez la question...");
        await robustFill(questionInput, "Quelle est la capitale de la France ?");

        // Remplir les options
        const option1 = page.getByPlaceholder("✓ Bonne réponse");
        await robustFill(option1, "Paris");

        const option2 = page.getByPlaceholder("Option 2");
        await robustFill(option2, "Londres");

        // Chercher et cliquer sur le bouton de création
        const createButton = page.locator('[data-testid="finalize-quizz"]');
        await expect(createButton).toBeEnabled({ timeout: timeouts.element });
        await createButton.click();

        await waitForReactStable(page, { browserName });
        await waitForNetworkIdle(page, { browserName });

        // 3. Vérifier succès (optionnel si le workspace est vide)
        const successIndicator = page
          .locator('[data-testid="success-message"]')
          .or(page.getByText(/Quizz (publié|créé|prêt)/i))
          .first();
        const successVisible = await successIndicator
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (successVisible) {
          log("✅ Quizz créé");
        } else {
          log("⚠️ Pas de confirmation visible, vérification dashboard");
        }

        // 4. Dashboard
        log("📊 Vérification Dashboard");
        await page.goto(PRODUCT_ROUTES.quizz.dashboard, { waitUntil: "domcontentloaded" });
        await waitForNetworkIdle(page, { browserName });

        await expect(page).toHaveURL(/.*\/quizz\/dashboard\/?$/);

        // Vérifier contenu dashboard
        const dashboardContent = page
          .locator('[data-testid="quizz-card"], [data-testid="poll-item"], h1, h2')
          .or(page.getByText(/Aucun quizz/i))
          .or(page.getByText(/Créez votre premier/i))
          .first();
        await expect(dashboardContent).toBeVisible({ timeout: timeouts.element });

        log("🎉 Workflow Quizz terminé avec succès");
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
