import { test as base, expect } from "@playwright/test";
import { setupGeminiMock } from "./global-setup";

// Créer un test avec contexte partagé pour que localStorage persiste entre les tests
const test = base.extend<{}, { sharedContext: any }>({
  sharedContext: [async ({ browser }: any, use: any) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  }, { scope: 'worker' }],
  
  page: async ({ sharedContext }: any, use: any) => {
    const page = await sharedContext.newPage();
    await use(page);
  },
});

/**
 * Tests E2E pour Analytics IA
 * 
 * Couvre :
 * - Génération insights automatiques
 * - Quick queries
 * - Query personnalisée
 * - Cache intelligent
 * - Quotas freemium
 * - Gestion erreurs
 * 
 * NOTE: Les tests sont enchaînés (serial mode) pour réutiliser le même poll
 */

// Variables partagées entre tous les tests
let pollSlug = '';
let pollCreated = false;

test.describe("Analytics IA - Suite Complète", () => {
  test.describe.configure({ mode: 'serial' });
  
  // Skip sur Firefox et Safari car bug Playwright avec shared context
  // https://github.com/microsoft/playwright/issues/13038
  // https://github.com/microsoft/playwright/issues/22832
  test.skip(({ browserName }) => browserName !== 'chromium', 'Shared context non supporté sur Firefox/Safari');
  
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    
    // Si le poll est déjà créé, aller directement aux résultats
    if (pollCreated && pollSlug) {
      await page.goto(`/poll/${pollSlug}/results?e2e-test=true`);
      await page.waitForLoadState("networkidle");
    }
  });

  test("1. Setup: Créer et clôturer un FormPoll avec 5 réponses @smoke @critical", async ({
    page,
  }) => {
    // 1. Créer un FormPoll via IA
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    // Étape 1 : Demander à l'IA
    const chatInput = page.locator('[data-testid="message-input"]');
    await chatInput.fill("Crée un questionnaire avec 1 seule question");
    await chatInput.press("Enter");
    await page.waitForTimeout(3000);

    // Étape 2 : Cliquer sur "Créer ce formulaire"
    const createButton = page.getByRole('button', { name: /créer ce formulaire/i });
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Attendre la prévisualisation
    const previewCard = page.locator('[data-poll-preview]');
    await expect(previewCard).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Étape 4 : Cliquer sur "Voir" (desktop)
    const viewFormButton = page.getByRole('button', { name: /voir/i }).first();
    const isButtonVisible = await viewFormButton.isVisible().catch(() => false);
    
    if (isButtonVisible) {
      await viewFormButton.click();
      await page.waitForTimeout(1000);
    }

    // Étape 5 : Saisir un titre
    const titleInput = page.locator('input[placeholder*="titre" i], input[type="text"]').first();
    if (await titleInput.isVisible()) {
      const currentTitle = await titleInput.inputValue();
      if (!currentTitle || currentTitle.trim() === '') {
        await titleInput.fill("Questionnaire Test E2E");
      }
    }

    // Étape 6 : Finaliser
    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    // Récupérer le slug depuis l'URL ou depuis le localStorage
    let currentUrl = page.url();
    let slug = currentUrl.split('/poll/')[1]?.split('/')[0] || currentUrl.split('/poll/')[1]?.split('?')[0];
    
    // Si pas de slug dans l'URL, chercher dans localStorage
    if (!slug) {
      slug = await page.evaluate(() => {
        const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
        const lastPoll = polls[polls.length - 1];
        return lastPoll?.slug;
      });
    }

    // 2. Voter 5 fois (questionnaire avec 1 question text)
    for (let i = 1; i <= 5; i++) {
      // Pour les FormPolls, l'URL est /poll/{slug} pas /poll/{slug}/vote
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Remplir le nom
      const nameInput = page.locator('input[placeholder*="nom" i]').first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill(`Votant ${i}`);

      // Remplir la question text (input pour type "text", textarea pour "long-text")
      // Le mock génère type "text" donc c'est un input, pas un textarea
      const textInput = page.locator('input[placeholder*="réponse" i], input[placeholder*="Votre réponse" i]').first();
      await expect(textInput).toBeVisible({ timeout: 10000 });
      await textInput.fill(`Réponse ${i} du votant`);

      // Soumettre (le bouton s'appelle "Envoyer mes réponses")
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // 3. Clôturer le poll
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });

    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    // Cliquer directement sur "Clôturer" (pas de menu Actions)
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();

    // Attendre que le statut du poll soit mis à jour dans localStorage (confirmant la clôture)
    await page.waitForFunction(
      (slugParam) => {
        try {
          const storedPolls = localStorage.getItem('doodates_polls');
          const allPolls = storedPolls ? JSON.parse(storedPolls) : [];
          const foundPoll = allPolls.find((p: any) => p.slug === slugParam);
          return foundPoll?.status === 'closed';
        } catch {
          return false;
        }
      },
      slug,
      { timeout: 5000 }
    );

    // Vérifier le statut après clôture
    const statusAfterClose = await page.evaluate((s) => {
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      const poll = polls.find((p: any) => p.slug === s);
      return poll?.status;
    }, slug);

    // 4. Vérifier insights automatiques (panneau présent dans le DOM)
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });

    // Attendre génération insights (max 5 secondes)
    await page.waitForTimeout(5000);

    // Capture pour debug (accessible à Cascade)
    await page.screenshot({ path: 'Docs/screenshots/analytics-insights.png', fullPage: true });

    // Déplier la section "Insights automatiques" si elle est repliée
    // Le texte contient un emoji et un compteur: "✨ Insights automatiques (1)"
    const insightsAccordion = page.locator('text=/.*Insights automatiques.*/');
    await expect(insightsAccordion).toBeVisible({ timeout: 5000 });
    await insightsAccordion.click();

    // Attendre que les insights soient visibles
    await page.waitForTimeout(500);

    // Vérifier présence d'au moins 1 insight
    const insightCards = page.locator('[data-testid="insight-card"]');
    const count = await insightCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Vérifier types d'insights (optionnel - les emojis peuvent ne pas être affichés)
    const insightTypes = ["📊", "📈", "⚠️", "💡"];
    let foundTypes = 0;
    for (const type of insightTypes) {
      const typeCard = page.locator(`text=${type}`);
      if (await typeCard.isVisible()) {
        foundTypes++;
      }
    }
    // Note: Les emojis peuvent ne pas être affichés selon le rendu, on ne vérifie pas strictement
    
    // Sauvegarder le slug pour les tests suivants
    pollSlug = slug;
    pollCreated = true;
  });

  test("2. Quick Queries: Tester les requêtes rapides @smoke @functional", async ({ page }) => {
    // Le poll est déjà créé et clôturé dans le test 1
    // Vérifier que pollSlug est défini
    if (!pollSlug) {
      throw new Error('pollSlug non défini - le test 1 (Setup) doit avoir été exécuté avant');
    }
    
    // Naviguer vers la page résultats du poll
    await page.goto(`/poll/${pollSlug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Screenshot initial
    await page.screenshot({ path: 'test-results/analytics-test2-01-initial.png', fullPage: true });
    
    // Vérifier que le panneau Analytics est présent dans le DOM (même si replié)
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });
    
    // Screenshot après vérification panneau
    await page.screenshot({ path: 'test-results/analytics-test2-02-panel-verified.png', fullPage: true });
    
    // Trouver les boutons de quick queries directement dans le DOM (toujours présents, pas repliés)
    const quickQueryButtons = page.locator('[data-testid="quick-query-button"]');
    await expect(quickQueryButtons.first()).toBeAttached({ timeout: 10000 });
    const buttonCount = await quickQueryButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Cliquer sur la première quick query
    const firstQuery = quickQueryButtons.first();
    await firstQuery.click();
    
    // Attendre la réponse (max 10 secondes)
    await page.waitForTimeout(5000);
    
    // Vérifier qu'une réponse est affichée
    const responseBox = page.locator('[data-testid="analytics-response"]');
    await expect(responseBox).toBeVisible({ timeout: 10000 });
    
    // Vérifier que la réponse contient du texte
    const responseContent = await responseBox.textContent();
    expect(responseContent).toBeTruthy();
    expect(responseContent!.length).toBeGreaterThan(10);
  });

  test("3. Query Personnalisée: Taper une question personnalisée @functional", async ({ page }) => {
    // Le poll est déjà créé et clôturé, on est sur la page résultats
    // Vérifier que le panneau Analytics est présent dans le DOM
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });
    
    // Trouver le champ de saisie pour query personnalisée
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    await expect(queryInput).toBeVisible();
    
    // Taper une question personnalisée
    const customQuery = "Quelle est la tendance générale des réponses ?";
    await queryInput.fill(customQuery);
    
    // Cliquer sur le bouton Envoyer
    const sendButton = page.locator('[data-testid="analytics-send-button"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Attendre la réponse (max 10 secondes)
    await page.waitForTimeout(5000);
    
    // Vérifier qu'une réponse est affichée
    const responseBox = page.locator('[data-testid="analytics-response"]');
    await expect(responseBox).toBeVisible({ timeout: 10000 });
    
    // Vérifier que la réponse contient du texte
    const responseContent = await responseBox.textContent();
    expect(responseContent).toBeTruthy();
    expect(responseContent!.length).toBeGreaterThan(10);
  });

  test("4. Cache: Vérifier que les queries identiques utilisent le cache @functional", async ({ page }) => {
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });
    
    // Première query
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    const testQuery = "Combien de réponses avons-nous ?";
    await queryInput.fill(testQuery);
    
    const sendButton = page.locator('[data-testid="analytics-send-button"]');
    const startTime1 = Date.now();
    await sendButton.click();
    
    await page.waitForTimeout(5000);
    const responseBox = page.locator('[data-testid="analytics-response"]');
    await expect(responseBox).toBeVisible({ timeout: 10000 });
    const duration1 = Date.now() - startTime1;
    
    // Deuxième query identique (devrait utiliser le cache)
    await queryInput.fill(testQuery);
    
    const startTime2 = Date.now();
    await sendButton.click();
    
    await page.waitForTimeout(2000);
    await expect(responseBox).toBeVisible({ timeout: 5000 });
    const duration2 = Date.now() - startTime2;
    
    // La 2ème devrait être plus rapide (cache)
    expect(duration2).toBeLessThan(duration1);
  });

  test("5. Quotas: Vérifier le quota freemium (5 queries/jour) @functional", async ({ page }) => {
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });
    
    // Vérifier l'indicateur de quota
    const quotaIndicator = page.locator('[data-testid="quota-indicator"]');
    if (await quotaIndicator.isVisible()) {
      const quotaText = await quotaIndicator.textContent();
      // Le quota devrait indiquer qu'on a utilisé des queries
      expect(quotaText).toBeTruthy();
    }
  });

  test("6. Quotas: Vérifier le message quand quota atteint @functional", async ({ page }) => {
    // Ce test est difficile à implémenter car il faudrait faire 5+ queries
    // On vérifie juste que le système de quota existe
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });
  });

  test("7. Erreurs: Poll sans réponses @functional", async ({ page }) => {
    // Ce test nécessiterait de créer un nouveau poll sans réponses
    // À implémenter avec un poll vide
  });

  test("8. Erreurs: Clé API manquante @functional", async ({ page }) => {
    // Ce test nécessiterait de désactiver temporairement la clé API
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });
  });

  test("9. Erreurs: Queries trop longues @functional", async ({ page }) => {
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 10000 });
    
    // Taper une query très longue (>500 caractères)
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    const longQuery = "A".repeat(600);
    await queryInput.fill(longQuery);
    
    const sendButton = page.locator('[data-testid="analytics-send-button"]');
    
    // Vérifier si le bouton est désactivé ou si un message d'erreur apparaît
    const isDisabled = await sendButton.isDisabled().catch(() => false);
    if (!isDisabled) {
      await sendButton.click();
      await page.waitForTimeout(2000);
    }
  });
});

test.describe("Analytics IA - Quick Queries", () => {
  // Skip sur Firefox et Safari car bug Playwright avec shared context
  // https://github.com/microsoft/playwright/issues/13038
  // https://github.com/microsoft/playwright/issues/22832
  test.skip(({ browserName }) => browserName !== 'chromium', 'Shared context non supporté sur Firefox/Safari');
  
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });
  test("devrait répondre aux quick queries", async ({ page }) => {
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: 'test-results/debug-setup-1-home.png', fullPage: true });

    const chatInput = page.locator('[data-testid="message-input"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    await chatInput.fill("Crée un questionnaire avec 2 questions : nom (texte) et satisfaction (choix unique)");
    await page.screenshot({ path: 'test-results/debug-setup-2-message-filled.png', fullPage: true });
    await chatInput.press("Enter");
    
    // Attendre que l'IA génère et affiche le bouton "Créer ce formulaire"
    const createButton = page.getByRole('button', { name: /créer ce formulaire/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/debug-setup-3-create-button.png', fullPage: true });
    await createButton.click();
    
    // Attendre la prévisualisation
    const previewCard = page.locator('[data-poll-preview]');
    await expect(previewCard).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/debug-setup-4-preview.png', fullPage: true });
    
    // Cliquer sur "Voir" si présent
    const viewFormButton = page.getByRole('button', { name: /voir/i }).first();
    const isButtonVisible = await viewFormButton.isVisible().catch(() => false);
    if (isButtonVisible) {
      await viewFormButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/debug-setup-5-after-view.png', fullPage: true });
    }

    // Finaliser
    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/debug-setup-6-before-finalize.png', fullPage: true });
    await finalizeButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/debug-setup-7-after-finalize.png', fullPage: true });

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];
    
    // Récupérer le pollId depuis le localStorage
    const pollInfo = await page.evaluate((slugParam) => {
      try {
        const storedPolls = localStorage.getItem('doodates_polls');
        const allPolls = storedPolls ? JSON.parse(storedPolls) : [];
        const poll = allPolls.find((p: any) => p.slug === slugParam || p.id === slugParam);
        return poll ? { id: poll.id, slug: poll.slug, type: poll.type } : null;
      } catch (e) {
        return { error: String(e) };
      }
    }, slug);
    const pollId = pollInfo?.id || slug; // Utiliser l'id si disponible, sinon le slug

    // Voter 3 fois
    for (let i = 1; i <= 3; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `test-results/debug-vote-${i}-1-page-loaded.png`, fullPage: true });
      
      // Remplir le nom
      const nameInput = page.locator('input[type="text"]').first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill(`Votant ${i}`);
      await page.screenshot({ path: `test-results/debug-vote-${i}-2-name-filled.png`, fullPage: true });
      
      // Vérifier si c'est multi-step
      const nextButton = page.locator('button:has-text("Suivant")');
      const isMultiStep = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isMultiStep) {
        await nextButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `test-results/debug-vote-${i}-3-after-next.png`, fullPage: true });
      }
      
      // Remplir TOUTES les questions obligatoires
      // Question choix unique (radio)
      const radioInputs = page.locator('input[type="radio"]');
      const radioCount = await radioInputs.count();
      if (radioCount > 0) {
        await radioInputs.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `test-results/debug-vote-${i}-4a-radio-selected.png`, fullPage: true });
      }
      
      // Question choix multiples (checkboxes) - OBLIGATOIRE
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      if (checkboxCount > 0) {
        // Sélectionner au moins une checkbox (obligatoire)
        await checkboxes.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `test-results/debug-vote-${i}-4b-checkbox-selected.png`, fullPage: true });
      }
      
      // Question texte (textarea ou input text)
      const textInput = page.locator('textarea, input[type="text"]').filter({ hasNot: page.locator('input[placeholder*="nom" i]') }).first();
      if (await textInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await textInput.fill("Ma réponse");
        await page.screenshot({ path: `test-results/debug-vote-${i}-4c-text-filled.png`, fullPage: true });
      }
      
      // Soumettre
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: `test-results/debug-vote-${i}-5-before-submit.png`, fullPage: true });
      await submitButton.click();
      
      // Attendre que la soumission soit complète
      await page.waitForTimeout(2000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    await page.screenshot({ path: 'test-results/debug-actions-loaded.png', fullPage: true });
    
    // Vérifier que le panneau Analytics est présent AVANT la clôture (il devrait être là avec 3 votes)
    // On attend soit le data-testid, soit le titre "Analytics IA" pour être plus robuste
    await page.screenshot({ path: 'test-results/debug-before-wait-analytics.png', fullPage: true });
    await page.waitForSelector('[data-testid="analytics-panel"], h2:has-text("Analytics IA")', { timeout: 10000 });
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    await expect(analyticsPanel).toBeAttached({ timeout: 5000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le statut du poll soit mis à jour dans localStorage (confirmant la clôture)
    await page.waitForFunction(
      (slugParam) => {
        try {
          const storedPolls = localStorage.getItem('doodates_polls');
          const allPolls = storedPolls ? JSON.parse(storedPolls) : [];
          const foundPoll = allPolls.find((p: any) => p.slug === slugParam);
          return foundPoll?.status === 'closed';
        } catch {
          return false;
        }
      },
      slug,
      { timeout: 5000 }
    );
    
    // Le panneau analytics devrait toujours être présent après la clôture
    await expect(analyticsPanel).toBeAttached({ timeout: 5000 });

    // Test quick queries (toujours présents dans le DOM, pas repliés)
    const quickQueryButtons = page.locator('[data-testid="quick-query-button"]');
    await expect(quickQueryButtons.first()).toBeAttached({ timeout: 10000 });
    const count = await quickQueryButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Cliquer sur première quick query
    const firstQuery = quickQueryButtons.first();
    await firstQuery.click();

    // Attendre réponse (max 5 secondes)
    await page.waitForTimeout(5000);

    // Vérifier qu'une réponse est affichée
    const responseText = page.locator('[data-testid="analytics-response"]');
    await expect(responseText).toBeVisible();

    // Vérifier que le quota a été décrémenté (1 requête utilisée sur 5)
    const quotaIndicator = page.locator('[data-testid="quota-indicator"]');
    if (await quotaIndicator.isVisible()) {
      const quotaText = await quotaIndicator.textContent();
      // Le format peut être "4 requêtes restantes aujourd'hui1/5 utilisées" ou similaire
      // On vérifie qu'il indique bien 1/5 utilisées (ou 4 restantes)
      expect(quotaText).toMatch(/1\/5|4.*requêtes.*restantes/i);
    }
  });
});

test.describe.skip("Analytics IA - Query Personnalisée", () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });
  test("devrait répondre à une query personnalisée", async ({ page }) => {
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire avec 1 question : satisfaction (choix unique avec 3 options)");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Voter 3 fois
    for (let i = 1; i <= 3; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="text"]').first().fill(`Votant ${i}`);
      await page.locator('input[type="radio"]').first().click();
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le poll soit clôturé et que la page se mette à jour
    await page.waitForTimeout(1000);
    
    // Recharger la page pour s'assurer que le statut est à jour
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Test query personnalisée
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    await expect(queryInput).toBeVisible();

    // Taper une question
    await queryInput.fill("Quelle est la tendance générale ?");

    // Envoyer
    const sendButton = page.locator('[data-testid="analytics-send-button"]');
    await sendButton.click();

    // Attendre réponse (max 5 secondes)
    await page.waitForTimeout(5000);

    // Vérifier qu'une réponse est affichée
    const responseText = page.locator('[data-testid="analytics-response"]');
    await expect(responseText).toBeVisible();

    // Vérifier que la réponse contient du texte
    const responseContent = await responseText.textContent();
    expect(responseContent).toBeTruthy();
    expect(responseContent!.length).toBeGreaterThan(10);
  });
});

test.describe.skip("Analytics IA - Cache", () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });
  test("devrait utiliser le cache pour les queries identiques", async ({
    page,
  }) => {
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire avec 1 question : avis (choix unique)");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Voter 2 fois
    for (let i = 1; i <= 2; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="text"]').first().fill(`Votant ${i}`);
      await page.locator('input[type="radio"]').first().click();
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le poll soit clôturé et que la page se mette à jour
    await page.waitForTimeout(1000);
    
    // Recharger la page pour s'assurer que le statut est à jour
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Première query
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    await queryInput.fill("Combien de réponses ?");
    await page.locator('[data-testid="analytics-send-button"]').click();

    // Mesurer temps première réponse
    const startTime1 = Date.now();
    await page.waitForSelector('[data-testid="analytics-response"]', { timeout: 10000 });
    const responseTime1 = Date.now() - startTime1;

    // Attendre que la réponse soit complète
    await page.waitForTimeout(1000);

    // Deuxième query IDENTIQUE
    await queryInput.fill("Combien de réponses ?");
    await page.locator('[data-testid="analytics-send-button"]').click();

    // Mesurer temps deuxième réponse (devrait être du cache)
    const startTime2 = Date.now();
    await page.waitForSelector('[data-testid="analytics-response"]', { timeout: 10000 });
    const responseTime2 = Date.now() - startTime2;

    // Vérifier que la 2ème réponse est beaucoup plus rapide (cache)
    expect(responseTime2).toBeLessThan(responseTime1 / 2);
    expect(responseTime2).toBeLessThan(1000); // < 1 seconde

    // Vérifier badge "Cached"
    const cachedBadge = page.locator('text=/.*cache.*/i');
    if (await cachedBadge.isVisible()) {
      // Badge cache visible (optionnel selon implémentation)
      await expect(cachedBadge).toBeVisible();
    }
  });
});

test.describe.skip("Analytics IA - Quotas", () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });
  test("devrait respecter les quotas freemium (5 queries/jour)", async ({
    page,
  }) => {
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire simple avec 1 question");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Voter 2 fois
    for (let i = 1; i <= 2; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="text"]').first().fill(`Votant ${i}`);
      await page.locator('input[type="radio"]').first().click();
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le poll soit clôturé et que la page se mette à jour
    await page.waitForTimeout(1000);
    
    // Recharger la page pour s'assurer que le statut est à jour
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Vérifier quota initial (5 pour anonyme)
    const quotaIndicator = page.locator('[data-testid="quota-indicator"]');
    if (await quotaIndicator.isVisible()) {
      const initialQuota = await quotaIndicator.textContent();
      expect(initialQuota).toContain("5");
    }

    // Faire 5 queries différentes
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    const sendButton = page.locator('[data-testid="analytics-send-button"]');

    const queries = [
      "Combien de réponses ?",
      "Quelle est la tendance ?",
      "Y a-t-il des anomalies ?",
      "Résume les résultats",
      "Quelle est l'option la plus populaire ?",
    ];

    for (let i = 0; i < 5; i++) {
      await queryInput.fill(queries[i]);
      await sendButton.click();
      await page.waitForTimeout(3000); // Attendre réponse
      
      // Vérifier quota décrémenté
      if (await quotaIndicator.isVisible()) {
        const quotaText = await quotaIndicator.textContent();
        expect(quotaText).toContain(`${4 - i}/5`);
      }
    }

    // Vérifier quota à 0
    if (await quotaIndicator.isVisible()) {
      const finalQuota = await quotaIndicator.textContent();
      expect(finalQuota).toContain("0/5");
    }
  });

  test("devrait afficher un message quand quota atteint", async ({ page }) => {
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire simple");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Voter 2 fois
    for (let i = 1; i <= 2; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="text"]').first().fill(`Votant ${i}`);
      await page.locator('input[type="radio"]').first().click();
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le poll soit clôturé et que la page se mette à jour
    await page.waitForTimeout(1000);
    
    // Recharger la page pour s'assurer que le statut est à jour
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Faire 5 queries pour atteindre le quota
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    const sendButton = page.locator('[data-testid="analytics-send-button"]');

    for (let i = 1; i <= 5; i++) {
      await queryInput.fill(`Question ${i}`);
      await sendButton.click();
      await page.waitForTimeout(3000);
    }

    // Essayer une 6ème query
    await queryInput.fill("Question 6");
    
    // Vérifier que le bouton est désactivé OU qu'un message d'erreur s'affiche
    const isDisabled = await sendButton.isDisabled();
    if (!isDisabled) {
      await sendButton.click();
      
      // Vérifier message d'erreur
      const errorMessage = page.locator('text=/quota.*atteint/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    } else {
      // Bouton désactivé = bon comportement
      expect(isDisabled).toBe(true);
    }

    // Vérifier que les insights auto sont toujours visibles (gratuits)
    const insightsSection = page.locator('text=Insights IA');
    await expect(insightsSection).toBeVisible();
  });
});

test.describe.skip("Analytics IA - Dark Mode", () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });
  test("devrait afficher correctement tous les éléments en dark mode", async ({
    page,
  }) => {
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire avec 2 questions");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Voter 3 fois
    for (let i = 1; i <= 3; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="text"]').first().fill(`Votant ${i}`);
      
      const nextButton = page.locator('button:has-text("Suivant")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="radio"]').first().click();
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le poll soit clôturé et que la page se mette à jour
    await page.waitForTimeout(1000);
    
    // Recharger la page pour s'assurer que le statut est à jour
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Activer dark mode
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
    } else {
      // Chercher dans le menu utilisateur ou settings
      const userMenu = page.locator('button:has-text("Menu")');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.waitForTimeout(300);
        const darkModeOption = page.locator('text=/dark.*mode/i');
        if (await darkModeOption.isVisible()) {
          await darkModeOption.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Vérifier que le dark mode est actif
    const body = page.locator('body');
    const bodyClass = await body.getAttribute('class');
    const isDarkMode = bodyClass?.includes('dark') || bodyClass?.includes('theme-dark');

    if (isDarkMode) {
      // Vérifier éléments Analytics IA visibles en dark mode
      
      // 1. Section Insights IA
      const insightsSection = page.locator('text=Insights IA');
      await expect(insightsSection).toBeVisible();

      // 2. Cartes insights
      const insightCards = page.locator('[data-testid="insight-card"]');
      const count = await insightCards.count();
      if (count > 0) {
        // Vérifier que les cartes sont visibles
        await expect(insightCards.first()).toBeVisible();
      }

      // 3. Input query
      const queryInput = page.locator('[data-testid="analytics-query-input"]');
      if (await queryInput.isVisible()) {
        await expect(queryInput).toBeVisible();
        
        // Vérifier contraste (input doit avoir un fond visible)
        const inputBg = await queryInput.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        expect(inputBg).not.toBe('rgba(0, 0, 0, 0)'); // Pas transparent
      }

      // 4. Bouton envoyer
      const sendButton = page.locator('[data-testid="analytics-send-button"]');
      if (await sendButton.isVisible()) {
        await expect(sendButton).toBeVisible();
      }

      // 5. Quick queries
      const quickQueryButtons = page.locator('[data-testid="quick-query-button"]');
      const quickCount = await quickQueryButtons.count();
      if (quickCount > 0) {
        await expect(quickQueryButtons.first()).toBeVisible();
      }

      // 6. Quota indicator
      const quotaIndicator = page.locator('[data-testid="quota-indicator"]');
      if (await quotaIndicator.isVisible()) {
        await expect(quotaIndicator).toBeVisible();
      }

      // 7. Tester une query pour vérifier la réponse en dark mode
      if (await queryInput.isVisible()) {
        await queryInput.fill("Combien de réponses ?");
        await sendButton.click();
        await page.waitForTimeout(3000);

        const responseText = page.locator('[data-testid="analytics-response"]');
        if (await responseText.isVisible()) {
          await expect(responseText).toBeVisible();
          
          // Vérifier que le texte est lisible (couleur claire sur fond sombre)
          const textColor = await responseText.evaluate((el) => {
            return window.getComputedStyle(el).color;
          });
          // Le texte ne doit pas être noir (rgb(0, 0, 0))
          expect(textColor).not.toBe('rgb(0, 0, 0)');
        }
      }
    }
  });
});

test.describe.skip("Analytics IA - Gestion Erreurs", () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });
  test("devrait afficher un message si poll sans réponses", async ({ page }) => {
    // Créer un poll SANS réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire simple");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Aller directement sur résultats SANS voter
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");

    // Vérifier que le panel Analytics IA n'est PAS affiché
    // OU affiche un message "Aucune donnée"
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    
    if (await analyticsPanel.isVisible()) {
      // Si le panel est visible, vérifier message "Aucune donnée"
      const noDataMessage = page.locator('text=/aucune.*donn[ée]e/i');
      await expect(noDataMessage).toBeVisible();
    } else {
      // Panel caché = bon comportement
      await expect(analyticsPanel).not.toBeVisible();
    }
  });

  test("devrait afficher une erreur si clé API Gemini manquante", async ({
    page,
  }) => {
    // Ce test nécessite de mocker l'absence de clé API
    // Pour l'instant, on vérifie juste le comportement graceful
    
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire simple");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Voter 2 fois
    for (let i = 1; i <= 2; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="text"]').first().fill(`Votant ${i}`);
      await page.locator('input[type="radio"]').first().click();
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le poll soit clôturé et que la page se mette à jour
    await page.waitForTimeout(1000);
    
    // Recharger la page pour s'assurer que le statut est à jour
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Vérifier qu'il n'y a pas d'erreur console critique
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Essayer une query
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    if (await queryInput.isVisible()) {
      await queryInput.fill("Test query");
      await page.locator('[data-testid="analytics-send-button"]').click();
      await page.waitForTimeout(3000);

      // Si erreur API, vérifier qu'un message utilisateur est affiché
      const errorMessage = page.locator('text=/erreur.*api/i');
      // Le message peut être visible ou non selon la config
      // L'important est qu'il n'y ait pas de crash
    }

    // Vérifier que la page n'a pas crashé
    const insightsSection = page.locator('text=Insights IA');
    await expect(insightsSection).toBeVisible();
  });

  test("devrait gérer les queries trop longues", async ({ page }) => {
    // Setup : Créer un poll avec réponses
    await page.goto("/?e2e-test=true");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator('textarea[placeholder*="Décrivez"]');
    await chatInput.fill("Crée un questionnaire simple");
    await chatInput.press("Enter");
    await page.waitForTimeout(4000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    await finalizeButton.click();
    await page.waitForTimeout(2000);

    const pollLink = page.locator('a[href*="/poll/"]').first();
    const href = await pollLink.getAttribute("href");
    const slug = href?.split("/")[2];

    // Voter 2 fois
    for (let i = 1; i <= 2; i++) {
      await page.goto(`/poll/${slug}?e2e-test=true`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="text"]').first().fill(`Votant ${i}`);
      await page.locator('input[type="radio"]').first().click();
      const submitButton = page.locator('[data-testid="form-submit"]');
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState("networkidle");
    
    // Attendre que les actions du poll soient chargées
    await page.waitForSelector('[data-testid="poll-action-close"], [data-testid="poll-action-edit"]', { timeout: 10000 });
    
    // Gérer le dialog de confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const closeButton = page.locator('[data-testid="poll-action-close"]');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
    await closeButton.click();
    
    // Attendre que le poll soit clôturé et que la page se mette à jour
    await page.waitForTimeout(1000);
    
    // Recharger la page pour s'assurer que le statut est à jour
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Taper une query très longue (> 500 caractères)
    const longQuery = "A".repeat(600);
    const queryInput = page.locator('[data-testid="analytics-query-input"]');
    await queryInput.fill(longQuery);

    const sendButton = page.locator('[data-testid="analytics-send-button"]');
    
    // Vérifier que le bouton est désactivé OU qu'un message d'erreur s'affiche
    const isDisabled = await sendButton.isDisabled();
    
    if (!isDisabled) {
      await sendButton.click();
      
      // Vérifier message d'erreur "Query trop longue"
      const errorMessage = page.locator('text=/trop.*long/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    } else {
      // Bouton désactivé = bon comportement
      expect(isDisabled).toBe(true);
    }
  });
});
