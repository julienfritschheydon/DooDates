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
    await page.screenshot({ path: `test-results/step-1-workspace.png` });

    const quizTitle = "Test Ultra Simple Quizz";

    // 2. Renseigner le titre du quiz
    const titleInput = page.getByTestId("quiz-title-input");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(quizTitle);
    await page.screenshot({ path: `test-results/step-2-title-filled.png` });

    // 3. Ajouter une question minimale
    const addQuestionButton = page.getByTestId("add-question-button");
    await expect(addQuestionButton).toBeVisible({ timeout: 5000 });
    await addQuestionButton.click();

    await waitForReactStable(page, { browserName });

    // Remplir la question
    const questionInput = page.getByPlaceholder("Entrez la question...").first();
    await expect(questionInput).toBeVisible();
    await questionInput.fill("Quelle est la capitale de la France ?");

    // Remplir les options
    const option1 = page.getByPlaceholder("✓ Bonne réponse").first();
    await option1.fill("Paris");

    const option2 = page.getByPlaceholder("Option 2").first();
    await option2.fill("Londres");
    await page.screenshot({ path: `test-results/step-3-question-filled.png` });

    // 4. Sauvegarder / créer le quiz
    const saveButton = page.getByTestId("finalize-quizz");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // 5. Success Screen & Direct Navigation to Vote
    console.log("Looking for success screen...");
    await page.screenshot({ path: `test-results/step-5-pre-success.png` });

    const successScreen = page.getByTestId("quiz-success-screen");
    await expect(successScreen).toBeVisible({ timeout: 10000 });
    console.log("✅ Success screen visible");
    await page.screenshot({ path: `test-results/step-5-success-screen.png` });

    console.log("Clicking 'Voir le quiz' to go directly to voting...");
    const viewQuizButton = page.getByTestId("quiz-view-quiz");
    await expect(viewQuizButton).toBeVisible();
    await viewQuizButton.click();

    // 6. Voting Flow
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    const votePageUrl = page.url();
    console.log(`Current URL after clicking View Quiz: ${votePageUrl}`);
    await page.screenshot({ path: `test-results/step-6-vote-page.png` });

    // Verify we are on the vote page
    await expect(page).toHaveURL(/.*\/vote$/);
    await expect(page.getByText(quizTitle)).toBeVisible();

    // 6.1 Name & Start
    // Updated robust selector after QuizzVote.tsx update
    const nameInput = page.getByTestId("quizz-voter-name-input");
    if (await nameInput.isVisible()) {
      console.log("Filling voter name...");
      await nameInput.fill("Test Voter");
    }

    console.log("Starting quiz...");
    const startButton = page.getByTestId("quizzvote-commencer-le-quiz");
    await startButton.click();

    await waitForReactStable(page, { browserName });
    await page.screenshot({ path: `test-results/step-6-question-1.png` });

    // 6.2 Answer Question
    console.log(" answering question...");
    await expect(page.getByText("Quelle est la capitale de la France ?")).toBeVisible();

    const parisButton = page.getByRole("button", { name: "Paris" }).first();
    await parisButton.click();

    const validateButton = page.getByRole("button", { name: "Valider ma réponse" });
    await validateButton.click();

    await waitForReactStable(page, { browserName });
    await page.screenshot({ path: `test-results/step-6-feedback.png` });

    // 6.3 Feedback & Results
    console.log("Verifying feedback...");
    await expect(page.getByText("Correct !")).toBeVisible();

    const nextButton = page.getByRole("button", { name: "Voir mes résultats" });
    await nextButton.click();

    // 7. Verify Final Results
    await waitForReactStable(page, { browserName });
    await page.screenshot({ path: `test-results/step-7-results.png` });
    console.log("Verifying final results...");

    await expect(page.getByText("Quiz terminé !")).toBeVisible();
    await expect(page.getByText("100%")).toBeVisible();

    console.log("✅ Quiz E2E workflow completed cleanly (Create -> Vote -> Results)");
  });
});
