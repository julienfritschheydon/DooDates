import { test, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForReactStable, waitForElementReady } from '../../helpers/wait-helpers';
import { setupAllMocks } from '../../global-setup';
import { PRODUCT_ROUTES } from '../../utils';

/**
 * Ultra Simple Quizz: création manuelle minimale → vérification dans le dashboard Quizz.
 *
 * Objectif: avoir un scénario de référence pour le produit Quizz, cohérent avec
 * les workflows ultra-simples Date/Form, sans dépendre d’IA ni de logique avancée.
 */

test.describe('Quizz - Ultra Simple Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page);
  });

  test('Ultra Simple Quizz : création → dashboard', async ({ page, browserName }) => {
    // 1. Aller directement sur le workspace Quizz
    await page.goto(PRODUCT_ROUTES.quizz.workspace, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    await expect(page).toHaveURL(/DooDates\/.*\/quizz\/workspace\//);

    const quizTitle = 'Test Ultra Simple Quizz';

    // 2. Renseigner le titre du quiz
    const titleInput = page.getByPlaceholder(/Titre du quiz|Ex: Quiz/i).first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(quizTitle);

    // 3. Ajouter une question minimale
    const addQuestionButton = page.getByRole('button', { name: /Ajouter/i }).first();
    await expect(addQuestionButton).toBeVisible();
    await addQuestionButton.click();

    await waitForReactStable(page, { browserName });

    const questionInputs = page.locator('input[placeholder*="question" i], input[placeholder*="Question" i]');
    const questionCount = await questionInputs.count();
    if (questionCount > 0) {
      await questionInputs.first().fill('Quelle est la capitale de la France ?');
    }

    // 4. Sauvegarder / créer le quiz
    const saveButton = page
      .getByRole('button', { name: /Créer le quiz|Sauvegarder|Publier le quiz/i })
      .first();
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // 5. Aller sur le dashboard Quizz et vérifier la présence du quiz
    await page.goto(PRODUCT_ROUTES.quizz.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    await expect(page).toHaveURL(/DooDates\/.*\/quizz\/dashboard\//);
    await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();

    // Vérifier qu'au moins un élément de liste est présent
    const listItem = await waitForElementReady(page, '[data-testid="poll-item"], [data-testid="quiz-item"], main', {
      browserName,
    });

    // Si la structure est générique poll-item, vérifier qu'au moins un item contient le titre du quiz
    const matchingItem = page
      .locator('[data-testid="poll-item"], [data-testid="quiz-item"], main')
      .filter({ hasText: quizTitle })
      .first();

    await expect(matchingItem).toBeVisible();
  });
});
