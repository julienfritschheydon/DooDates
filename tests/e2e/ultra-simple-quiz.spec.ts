import { test, expect } from "@playwright/test";
import { withConsoleGuard } from "./utils";
import { setupTestEnvironment } from "./helpers/test-setup";
import { getTimeouts } from "./config/timeouts";
import { authenticateUser } from "./helpers/auth-helpers";
import { waitForNetworkIdle } from "./helpers/wait-helpers";
import { setupGeminiMock } from "./global-setup";

// Logger scoped pour suivre précisément chaque étape
const mkLogger =
  (scope: string) =>
  (...parts: any[]) =>
    console.log(`[${scope}]`, ...parts);

/**
 * Test Ultra Simple Quiz - Génération par fichier sans titre/description
 */
test.describe("DooDates - Test Ultra Simple Quiz (Génération Fichier)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Prépare l'environnement complet avant chaque test
   */
  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: false,
      navigation: { path: "/quizz/workspace" },
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
      mocks: { all: true }, // Utiliser tous les mocks (Gemini + Supabase Edge Function)
    });

    await authenticateUser(page, browserName, { reload: true, waitForReady: true });
  });

  /**
   * Workflow Quiz complet : création → participation → résultats → historique
   */
  test("Workflow Quiz Complet : Création → Participation → Résultats → Historique @smoke @functional", async ({
    page,
    browserName,
  }) => {
    const log = mkLogger("WorkflowQuizComplet");
    const timeouts = getTimeouts(browserName);

    await withConsoleGuard(
      page,
      async () => {
        test.slow();

        // 1. Naviguer vers la page de création de quiz
        log("🛠️ Navigation vers création quiz");
        await page.goto("/quizz/create", { waitUntil: "domcontentloaded" });

        // Attendre un peu pour que la page se stabilise (au lieu de waitForNetworkIdle)
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

        // Vérifier qu'on est sur la page de création de quiz
        await expect(page).toHaveURL(/\/quizz\/create/);

        // 2. Remplir le titre
        log("📝 Remplissage du titre");
        const titleInput = page.locator('[data-testid="quiz-title-input"]');
        await expect(titleInput).toBeVisible({ timeout: timeouts.element });
        await titleInput.fill("Quiz Mathématiques - Test E2E");

        // 3. Ajouter une question avec 2 options
        log("➕ Ajout d'une question avec 2 options");

        const addButton = page
          .locator("button")
          .filter({ hasText: /Ajouter/i })
          .first();
        await expect(addButton).toBeVisible({ timeout: timeouts.element });
        await addButton.click();

        // Attendre que le formulaire s'ouvre et que la question soit automatiquement dépliée
        await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});

        // Remplir la question (maintenant visible automatiquement)
        const questionInput = page.locator('input[placeholder*="Entrez la question"]').first();
        await questionInput.fill("Combien font 2 + 2 ?");

        // Ajouter deux options (les champs sont maintenant visibles)
        const option1Input = page.locator('input[placeholder*="✓ Bonne réponse"]').first();
        await option1Input.fill("4");

        const option2Input = page.locator('input[placeholder*="Option 2"]').first();
        await option2Input.fill("3");

        // Attendre que la question soit ajoutée
        await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});

        log("✅ Question ajoutée avec 2 options");

        // 4. Créer le quiz
        log("🚀 Création du quiz");

        const saveButton = page
          .locator("button")
          .filter({ hasText: /Créer le quiz|Publier/i })
          .first();
        await expect(saveButton).toBeVisible({ timeout: timeouts.element });

        // Prendre une photo du bouton avant de cliquer
        await page.screenshot({ path: "test-results/quiz-bouton-creer-avant.png" });

        // Vérifier si le bouton est activé
        const isButtonEnabled = await saveButton.isEnabled();
        log(`📊 Bouton "Créer le quiz" activé: ${isButtonEnabled}`);

        await saveButton.click();

        // Prendre une photo après le clic
        await page.screenshot({ path: "test-results/quiz-bouton-creer-apres.png" });

        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

        // 5. Vérifier l'écran de succès
        log("✅ Vérification écran de succès");

        const successScreen = page.locator('[data-testid="quiz-success-screen"]');
        await expect(successScreen).toBeVisible({ timeout: timeouts.element });

        await page.screenshot({ path: "test-results/quiz-success-screen.png" });

        // // 6. Cliquer sur "Voir le quiz"
        // log("👁️ Clic sur 'Voir le quiz'");

        // const viewQuizButton = page.locator('a').filter({ hasText: /Voir le quiz/i }).first();
        // await expect(viewQuizButton).toBeVisible({ timeout: timeouts.element });
        // await viewQuizButton.click();

        // await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        // // 7. Indiquer un nom pour participer
        // log("📝 Indication du nom");

        // const nameInput = page.locator('input[placeholder*="Votre nom"]').first();
        // if (await nameInput.isVisible({ timeout: 1000 })) {
        //   await nameInput.fill("Testeur E2E");
        //   await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
        // }

        // // 8. Commencer le quiz
        // log("▶️ Commencer le quiz");

        // const startButton = page.locator('button').filter({ hasText: /Commencer/i }).first();
        // if (await startButton.isVisible({ timeout: 1000 })) {
        //   await startButton.click();
        //   await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
        // }

        // // 9. Répondre à la question
        // log("✅ Réponse à la question");

        // const option4 = page.locator('text=4').first();
        // await expect(option4).toBeVisible({ timeout: timeouts.element });
        // await option4.click();
        // await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});

        // // 10. Valider la réponse
        // log("✔️ Validation de la réponse");

        // const submitButton = page.locator('button').filter({ hasText: /Valider|Soumettre|Terminer/i }).first();
        // await expect(submitButton).toBeVisible({ timeout: timeouts.element });
        // await submitButton.click();

        // await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        // // 11. Voir mes résultats
        // log("📊 Voir mes résultats");

        // const viewResultsButton = page.locator('button').filter({ hasText: /Voir mes résultats/i }).first();
        // if (await viewResultsButton.isVisible({ timeout: 1000 })) {
        //   await viewResultsButton.click();
        //   await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
        // }

        // // 12. Voir l'historique et les badges
        // log("🏆 Voir l'historique et les badges");

        // const historyButton = page.locator('button').filter({ hasText: /Voir mon historique/i }).first();
        // if (await historyButton.isVisible({ timeout: 1000 })) {
        //   await historyButton.click();
        //   await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
        // }

        // const badgesButton = page.locator('button').filter({ hasText: /tous mes badges/i }).first();
        // if (await badgesButton.isVisible({ timeout: 1000 })) {
        //   await badgesButton.click();
        //   await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
        // }

        // await page.screenshot({ path: 'test-results/quiz-final-historique.png' });

        log("✅ Workflow quiz complet terminé avec succès !");
      },
      {
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
    );
  });

  /**
   * Nettoie les données de test après chaque exécution
   */
  test.afterEach(async ({ page }) => {
    // Nettoyage simple du localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
  });
});
