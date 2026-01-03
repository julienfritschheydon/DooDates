/**
 * Playwright Fixtures Réutilisables
 *
 * Permet de créer des contextes de test pré-configurés
 * pour éviter de répéter les setups coûteux dans chaque test.
 */

import { test as base, expect } from "@playwright/test";
import { Page } from "@playwright/test";
import { setupGeminiMock, setupAllMocksWithoutNavigation } from "./global-setup";
import { navigateToWorkspace, waitForChatInput } from "./helpers/chat-helpers";
import { authenticateUser } from "./helpers/auth-helpers";

export interface Poll {
  id: string;
  slug: string;
  title: string;
  status: "active" | "closed";
}

interface TestFixtures {
  // Page avec Gemini mock configuré
  mockedPage: any;

  // Page avec tous les mocks configurés
  mockedPageFull: Page;

  // Page authentifiée avec utilisateur mock
  authenticatedPage: Page;

  // Page naviguée vers workspace avec chat prêt
  workspacePage: Page;

  // Poll basique (actif)
  activePoll: Poll;

  // Poll avec 5 votes
  pollWithVotes: Poll;

  // Poll clôturé avec votes (prêt pour analytics)
  closedPollWithAnalytics: Poll;
}

/**
 * Helper: Créer un poll rapidement via IA
 * Optimisé pour la vitesse (pas de waits inutiles)
 */
async function createPollQuick(page: any): Promise<Poll> {
  await page.goto("/DooDates/workspace?e2e-test=true", { waitUntil: "domcontentloaded" });

  // Demander à l'IA
  const chatInput = page.locator('[data-testid="chat-input"]');
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await chatInput.fill("Crée un questionnaire avec 1 seule question");
  await chatInput.press("Enter");

  // Attendre réponse IA (auto-wait)
  const createButton = page.getByRole("button", { name: /créer ce formulaire/i });
  await expect(createButton).toBeVisible({ timeout: 10000 });
  await createButton.click();

  // Attendre prévisualisation
  const previewCard = page.locator("[data-poll-preview]");
  await expect(previewCard).toBeVisible({ timeout: 5000 });

  // Voir le formulaire si nécessaire
  const viewFormButton = page.getByRole("button", { name: /voir/i }).first();
  const isVisible = await viewFormButton.isVisible().catch(() => false);
  if (isVisible) {
    await viewFormButton.click();
  }

  // Saisir titre si vide
  const titleInput = page.locator('input[placeholder*="titre" i]').first();
  if (await titleInput.isVisible()) {
    const currentTitle = await titleInput.inputValue();
    if (!currentTitle || currentTitle.trim() === "") {
      await titleInput.fill("Test E2E Poll");
    }
  }

  // Finaliser (le bouton s'appelle "Publier le formulaire" dans FormEditor)
  const finalizeButton = page.getByRole("button", { name: /publier le formulaire/i });
  await expect(finalizeButton).toBeVisible({ timeout: 5000 });
  await finalizeButton.click();

  // Récupérer slug (auto-wait)
  await page.waitForURL(/\/poll\/.*/, { timeout: 10000 });
  const url = page.url();
  const slug = url.split("/poll/")[1]?.split("/")[0] || url.split("/poll/")[1]?.split("?")[0];

  return {
    id: slug,
    slug,
    title: "Test E2E Poll",
    status: "active",
  };
}

/**
 * Helper: Voter sur un poll
 * Optimisé pour la vitesse
 */
async function voteTimes(page: any, slug: string, times: number): Promise<void> {
  for (let i = 1; i <= times; i++) {
    await page.goto(`/DooDates/poll/${slug}?e2e-test=true`, { waitUntil: "domcontentloaded" });

    // Remplir nom
    const nameInput = page.locator('input[placeholder*="nom" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(`Votant ${i}`);

    // Remplir question text
    const textArea = page.locator("textarea").first();
    await expect(textArea).toBeVisible({ timeout: 5000 });
    await textArea.fill(`Réponse ${i}`);

    // Soumettre
    const submitButton = page.locator('button:has-text("Envoyer")');
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();

    // Attendre confirmation (auto-wait)
    await page.waitForURL(/\/poll\/.*\/results|\/poll\/.*\/confirmation/, { timeout: 10000 });
  }
}

/**
 * Helper: Clôturer un poll
 * Optimisé pour la vitesse
 */
async function closePoll(page: any, slug: string): Promise<void> {
  await page.goto(`/DooDates/poll/${slug}/results?e2e-test=true`, {
    waitUntil: "domcontentloaded",
  });

  // Cliquer sur "Clôturer"
  const closeButton = page.locator('button:has-text("Clôturer")');
  await expect(closeButton).toBeVisible({ timeout: 10000 });
  await closeButton.click();

  // Confirmer
  const confirmButton = page.locator('button:has-text("Confirmer")');
  if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmButton.click();
  }

  // Vérifier que le statut a changé
  await expect(page.locator("text=/clôturé|closed/i")).toBeVisible({ timeout: 5000 });
}

/**
 * Extension des fixtures Playwright
 */
export const test = base.extend<TestFixtures>({
  // Page avec Gemini mock
  mockedPage: async ({ page }: { page: any }, use: (page: any) => Promise<void>) => {
    await setupGeminiMock(page);
    await use(page);
  },

  // Page avec tous les mocks configurés
  mockedPageFull: async (
    { page, browserName }: { page: any; browserName: string },
    use: (page: any) => Promise<void>,
  ) => {
    await setupAllMocksWithoutNavigation(page);
    await use(page);
  },

  // Page authentifiée avec utilisateur mock
  authenticatedPage: async (
    { page, browserName }: { page: any; browserName: string },
    use: (page: any) => Promise<void>,
  ) => {
    await setupAllMocksWithoutNavigation(page);
    await authenticateUser(page, browserName, {
      reload: true,
      waitForReady: true,
    });
    await use(page);
  },

  // Page naviguée vers workspace avec chat prêt
  workspacePage: async (
    { page, browserName }: { page: Page; browserName: string },
    use: (page: Page) => Promise<void>,
  ) => {
    await setupAllMocksWithoutNavigation(page);
    await navigateToWorkspace(page, browserName);
    await waitForChatInput(page);
    await use(page);
  },

  // Poll actif simple
  activePoll: async ({ page }: { page: any }, use: (poll: any) => Promise<void>) => {
    await setupGeminiMock(page);
    const poll = await createPollQuick(page);
    await use(poll);
  },

  // Poll avec 5 votes
  pollWithVotes: async ({ page }: { page: any }, use: (poll: any) => Promise<void>) => {
    await setupGeminiMock(page);
    const poll = await createPollQuick(page);
    await voteTimes(page, poll.slug, 5);
    await use(poll);
  },

  // Poll clôturé avec analytics
  closedPollWithAnalytics: async ({ page }: { page: any }, use: (poll: any) => Promise<void>) => {
    await setupGeminiMock(page);
    const poll = await createPollQuick(page);
    await voteTimes(page, poll.slug, 5);
    await closePoll(page, poll.slug);
    await use(poll);
  },
});

export { expect };
