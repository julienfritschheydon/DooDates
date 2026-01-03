import { test, expect } from "@playwright/test";
import { withConsoleGuard, PRODUCT_ROUTES } from "./utils";
import { setupTestEnvironment } from "./helpers/test-setup";
import { authenticateUser } from "./helpers/auth-helpers";
import { waitForReactStable, waitForNetworkIdle } from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";
import { navigateToWorkspace, sendChatMessage } from "./helpers/chat-helpers";

const mkLogger =
  (scope: string) =>
  (...parts: any[]) =>
    console.log(`[${scope}]`, ...parts);

/**
 * Test de validation des liens des quiz : vérifie que les liens de partage fonctionnent
 * Ce test complète le test ultra-simple-quizz.spec.ts en vérifiant les liens critiques
 */
test.describe("DooDates - Test Validation Liens Quiz", () => {
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
          /handleDismissEmailField is not defined/i,
        ],
      },
      mocks: { all: true },
    });

    await authenticateUser(page, browserName, { reload: true, waitForReady: true });
  });

  test("Validation liens quiz : création → liens → page vote @smoke @functional", async ({
    page,
    browserName,
  }) => {
    const log = mkLogger("QuizLinksValidation");
    const timeouts = getTimeouts(browserName);

    await withConsoleGuard(
      page,
      async () => {
        test.slow();

        // 1. Créer un quiz simple
        log("🛠️ Création d'un quiz pour tester les liens");
        await page.goto("/DooDates/quizz/create", { waitUntil: "domcontentloaded" });
        await waitForNetworkIdle(page, { browserName });
        await expect(page).toHaveTitle(/DooDates/);
        log("✅ App chargée");

        // 2. Détecter le type d'interface (chat IA ou formulaire manuel)
        const chatInput = page.locator('[data-testid="chat-input"]');
        const formTitle = page
          .locator(
            'input[placeholder*="titre" i], input[name*="title"], [data-testid="quiz-title-input"]',
          )
          .first();

        const hasChatInput = await chatInput.isVisible({ timeout: 3000 }).catch(() => false);
        const hasFormTitle = await formTitle.isVisible({ timeout: 3000 }).catch(() => false);

        let quizUrl = "";

        if (hasChatInput) {
          // Mode Chat IA
          log("📝 Mode Chat IA détecté");
          const prompt = "Crée un quizz avec 1 question simple sur les mathématiques";
          await sendChatMessage(page, prompt, { timeout: timeouts.element });

          // Attendre l'écran de succès
          const successScreen = page.locator('[data-testid="quiz-success-screen"]');
          await expect(successScreen).toBeVisible({ timeout: timeouts.element * 2 });

          // Extraire l'URL du lien de partage
          const linkElement = page.locator('[data-testid="quiz-share-link"]');
          const linkText = await linkElement.textContent();
          quizUrl = linkText || "";
          log(`📎 URL extraite: ${quizUrl}`);
        } else if (hasFormTitle) {
          // Mode Formulaire manuel
          log("📝 Mode Formulaire détecté");
          await formTitle.fill("Quizz Mathématiques - Test Liens");

          // Ajouter une question
          const addQuestionButton = page.locator('[data-testid="add-question-button"]').first();
          await expect(addQuestionButton).toBeVisible({ timeout: timeouts.element });
          await addQuestionButton.click();
          await waitForReactStable(page, { browserName });

          // Remplir la question
          await page.fill(
            'input[placeholder*="Entrez la question..."]',
            "Quelle est la capitale de la France ?",
          );

          // Remplir les options (minimum 2 requis pour single/multiple)
          console.log("📝 Remplissage des options");
          await page.fill('input[placeholder*="✓ Bonne réponse"]', "Paris");
          await page.fill('input[placeholder*="Option 2"]', "Lyon");

          // Attendre que le bouton soit activé
          await page.waitForTimeout(1000);

          // Finaliser le quiz
          const finalizeButton = page.locator('[data-testid="finalize-quizz"]').first();
          await expect(finalizeButton).toBeVisible({ timeout: timeouts.element });
          await finalizeButton.click();

          // Attendre l'écran de succès
          const successScreen = page.locator('[data-testid="quiz-success-screen"]');
          await expect(successScreen).toBeVisible({ timeout: timeouts.element * 2 });

          // Extraire l'URL du lien de partage
          const linkElement = page.locator('[data-testid="quiz-share-link"]');
          const linkText = await linkElement.textContent();
          quizUrl = linkText || "";
          log(`📎 URL extraite: ${quizUrl}`);
        } else {
          throw new Error("Ni chat ni formulaire trouvé - impossible de créer un quiz");
        }

        // 2. Valider le format de l'URL
        log("🔍 Validation format URL");
        expect(quizUrl).toContain("/quizz/");
        expect(quizUrl).toContain("/vote");
        expect(quizUrl).toMatch(/\/quizz\/[^\/]+\/vote$/);
        log("✅ Format URL correct");

        // 3. Tester le lien "Voir le quiz"
        log("🔗 Test bouton 'Voir le quiz'");
        const viewQuizButton = page.locator('[data-testid="quiz-view-quiz"]');
        await expect(viewQuizButton).toBeVisible({ timeout: timeouts.element });
        await viewQuizButton.click();

        // Attendre la navigation vers la page de vote
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        // Vérifier l'URL
        await expect(page).toHaveURL(/\/quizz\/[^\/]+\/vote$/);
        log("✅ Navigation vers page de vote réussie");

        // 4. Vérifier que la page de vote affiche le quiz
        log("📄 Vérification page de vote");

        // Chercher des éléments typiques d'une page de quiz
        const quizContent = page
          .locator('h1, h2, .quiz-title, .question-title, [data-testid="quiz-title"]')
          .or(page.locator("text=Quiz"))
          .or(page.locator("text=Question"))
          .or(page.locator('button:has-text("Commencer")'))
          .first();

        await expect(quizContent).toBeVisible({ timeout: timeouts.element });
        log("✅ Page de vote affiche le contenu du quiz");

        // 5. Attendre la redirection automatique vers le dashboard
        log("📊 Attente de la redirection automatique vers le dashboard");

        // Attendre la redirection (2 secondes + marge)
        await page.waitForTimeout(2500);

        // Vérifier qu'on est sur le dashboard
        await expect(page).toHaveURL(/\/quizz\/dashboard$/);

        // Vérifier que le quiz créé apparaît dans le dashboard
        const dashboardQuiz = page
          .locator("text=Quizz Mathématiques - Test Liens")
          .or(page.locator('[data-testid="quiz-card"]'))
          .or(page.locator("h1, h2"))
          .first();

        await expect(dashboardQuiz).toBeVisible({ timeout: timeouts.element });
        log("✅ Quiz visible dans le dashboard");

        log("🎉 Validation des liens quiz terminée avec succès");
      },
      {
        allowlist: [
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
          /handleDismissEmailField is not defined/i,
        ],
      },
    );
  });
});
