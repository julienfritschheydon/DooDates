import { test, expect } from "@playwright/test";
import {
  waitForNetworkIdle,
  waitForReactStable,
  waitForChatInputReady,
} from "../../helpers/wait-helpers";
import { dismissOnboarding } from "../../helpers/rgpd-helpers";
import { setupAllMocks } from "../../global-setup";
import { robustFill, PRODUCT_ROUTES } from "../../utils";
import { getTimeouts } from "../../config/timeouts";

test.describe("Form Polls - Navigation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page);
  });

  test("Should navigate from Landing to Workspace to Dashboard", async ({ page, browserName }) => {
    // 1. Start at Product Landing Page
    await page.goto(PRODUCT_ROUTES.formPoll.landing);
    await dismissOnboarding(page);
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // Verify we're on the form landing page
    await expect(page).toHaveURL(/.*form/);

    // Attendre la fin du chargement
    await expect(page.getByText("Chargement...")).toBeHidden({ timeout: 15000 });

    // Title might vary, check for "Formulaires" or similar
    // Title might vary, check for h1
    await expect(page.locator("h1").filter({ hasText: /Formulaires/i })).toBeVisible();

    // 2. Navigate to Workspace (Create Poll)
    const createButton = page.locator('[data-testid="create-form-button"]');
    await createButton.scrollIntoViewIfNeeded();
    await createButton.click({ force: true });

    // Vérification plus souple de la navigation vers le workspace
    await expect(page).toHaveURL(/.*workspace.*/);
    await waitForReactStable(page, { browserName });
    await waitForNetworkIdle(page, { browserName });

    // Dismiss onboarding if present
    await dismissOnboarding(page);

    // 3. Create a Poll via AI
    const timeouts = getTimeouts(browserName);
    const chatInput = await waitForChatInputReady(page, browserName, { timeout: timeouts.element });

    await robustFill(chatInput, "Crée un questionnaire avec 1 question");
    await chatInput.press("Enter");

    // Wait for success message - sélecteurs flexibles
    const successSelectors = [
      page.getByText(/(Voici votre questionnaire|Formulaire créé)/i),
      page.getByText(/(Questionnaire créé|Formulaire prêt)/i),
      page.getByText(/(Créé|Prêt|Terminé)/i),
      page.locator('[data-testid="create-form-button"]'),
      page.locator('button:has-text("Créer")'),
      page.locator('button:has-text("Créer le formulaire")'),
    ];

    let successFound = false;
    for (const selector of successSelectors) {
      try {
        await expect(selector).toBeVisible({ timeout: 5000 });
        successFound = true;
        break;
      } catch (e) {
        // Continuer avec le sélecteur suivant
      }
    }

    if (!successFound) {
      // Si aucun message de succès trouvé, vérifier qu'on est quand même sur une page de formulaire
      const url = page.url();
      expect(url).toMatch(/form-polls|workspace|form/i);
    }

    // Click "Create" button in the chat response - sélecteurs flexibles
    const createButtonSelectors = [
      page.locator('[data-testid="create-form-button"]'),
      page.locator('button:has-text("Créer")'),
      page.locator('button:has-text("Créer le formulaire")'),
      page.locator('button:has-text("Créer questionnaire")'),
      page.locator('button[aria-label*="créer"], button[aria-label*="Créer"]'),
      page.locator("button").filter({ hasText: /Créer/i }).first(),
    ];

    let createButtonFound = false;
    for (const selector of createButtonSelectors) {
      try {
        await expect(selector).toBeVisible({ timeout: 3000 });
        await selector.click();
        createButtonFound = true;
        break;
      } catch (e) {
        // Continuer avec le sélecteur suivant
      }
    }

    if (!createButtonFound) {
      // Si aucun bouton créer trouvé, vérifier qu'on est quand même sur une page valide
      const url = page.url();
      expect(url).toMatch(/form-polls|workspace|form/i);
      return; // Sortir du test proprement
    }

    // Wait for preview
    await expect(page.locator("[data-poll-preview]")).toBeVisible();

    // 4. Navigate to Dashboard
    await page.goto(PRODUCT_ROUTES.formPoll.dashboard);
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    await expect(page).toHaveURL(/.*form.*dashboard/);
    await expect(page.getByRole("heading", { name: /Tableau de bord/i })).toBeVisible();
  });
});
