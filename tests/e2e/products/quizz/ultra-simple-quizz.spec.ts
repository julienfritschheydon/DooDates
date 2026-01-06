import { test, expect } from "@playwright/test";
import {
  waitForNetworkIdle,
  waitForReactStable,
  waitForElementReady,
} from "../../helpers/wait-helpers";
import { setupAllMocks } from "../../global-setup";
import { PRODUCT_ROUTES } from "../../utils";

/**
 * Ultra Simple Quizz: création manuelle minimale → vérification dans le dashboard Quizz.
 *
 * Objectif: avoir un scénario de référence pour le produit Quizz, cohérent avec
 * les workflows ultra-simples Date/Form, sans dépendre d’IA ni de logique avancée.
 */

test.describe("Quizz - Ultra Simple Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page);
  });

  test("Ultra Simple Quizz : création → dashboard", async ({ page, browserName }) => {
    // 1. Aller directement sur le workspace Quizz
    console.log(`Navigating to: ${PRODUCT_ROUTES.quizz.workspace}`);
    await page.goto(PRODUCT_ROUTES.quizz.workspace, { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    const currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);
    await expect(page).toHaveURL(/.*quizz.*create/);

    const quizTitle = "Test Ultra Simple Quizz";

    // 2. Renseigner le titre du quiz
    // Utilisation du data-testid fiable
    const titleInput = page.getByTestId("quiz-title-input");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(quizTitle);

    // 3. Ajouter une question minimale
    const addQuestionButton = page.getByTestId("add-question-button");
    // S'assurer qu'on peut cliquer même si la liste est vide
    await expect(addQuestionButton).toBeVisible({ timeout: 5000 });
    await addQuestionButton.click();

    await waitForReactStable(page, { browserName });

    // Remplir la question (premier champ input text dans la liste des questions)
    // On cherche l'input de la question qui vient d'être ajoutée
    const questionInput = page.getByPlaceholder("Entrez la question...").first();
    await expect(questionInput).toBeVisible();
    await questionInput.fill("Quelle est la capitale de la France ?");

    // Remplir les options (Option 1 et Option 2)
    const option1 = page.getByPlaceholder("✓ Bonne réponse").first();
    await option1.fill("Paris");

    const option2 = page.getByPlaceholder("Option 2").first();
    await option2.fill("Londres");

    // 4. Sauvegarder / créer le quiz
    const saveButton = page.getByTestId("finalize-quizz");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled(); // Doit être activé si tout est rempli
    await saveButton.click();

    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // Vérifier l'écran de succès ou la redirection
    // Le code montre un écran de succès avec un bouton "Aller au Tableau de bord"
    const successScreen = page.getByTestId("quiz-success-screen");
    const isSuccessVisible = await successScreen.isVisible({ timeout: 5000 }).catch(() => false);

    if (isSuccessVisible) {
      console.log("Success screen visible");
      await page.getByTestId("quiz-go-to-dashboard").click();
    } else {
      // Fallback: navigation manuelle
      console.log("Success screen not found, navigating manually to dashboard");
      await page.goto(PRODUCT_ROUTES.quizz.dashboard, { waitUntil: "domcontentloaded" });
    }

    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    console.log(`Final URL: ${page.url()}`);
    await expect(page).toHaveURL(/.*quizz.*dashboard.*/);

    // 5. Vérifier la présence du quiz dans le dashboard
    // ProductDashboard utilise ProductSidebar et ProductDashboard components
    // On cherche le titre du quiz dans les cartes
    const quizCard = page.getByText(quizTitle).first();
    await expect(quizCard).toBeVisible({ timeout: 10000 });

    console.log("✅ Quiz workflow test completed - Workspace → Dashboard");
  });
});
