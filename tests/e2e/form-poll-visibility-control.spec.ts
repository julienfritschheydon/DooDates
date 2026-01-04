import { test, expect } from "@playwright/test";

test.describe("Form Poll - Visibility Control", () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer localStorage avant chaque test
    await page.goto("http://localhost:8080/DooDates");
    await page.evaluate(() => localStorage.clear());
  });

  test("should create form with public visibility", async ({ page }) => {
    // Créer un formulaire avec visibilité publique
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire public");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    // Remplir le formulaire
    await page.fill('[data-testid="poll-title"]', "Test Public Form");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question publique");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 2");

    // Définir la visibilité comme publique
    await page.selectOption('[data-testid="visibility-setting"]', "public");

    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);

    // Vérifier que le formulaire est accessible publiquement
    const formUrl = page.url();
    await page.goto(formUrl);

    // Vérifier que tout le monde peut voir le formulaire
    const formTitle = await page.locator('[data-testid="form-title"]').textContent();
    expect(formTitle).toBe("Test Public Form");

    // Vérifier que les résultats sont visibles
    const resultsSection = await page.locator('[data-testid="results-section"]').count();
    expect(resultsSection).toBeGreaterThan(0);
  });

  test("should create form with voters-only visibility", async ({ page }) => {
    // Créer un formulaire avec visibilité réservée aux votants
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire réservé aux votants");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    await page.fill('[data-testid="poll-title"]', "Test Voters Only Form");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question votants");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option A");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option B");

    // Définir la visibilité comme réservée aux votants
    await page.selectOption('[data-testid="visibility-setting"]', "voters");

    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);

    const formUrl = page.url();

    // Accéder au formulaire sans avoir voté
    await page.goto(formUrl);

    // Vérifier que le formulaire est visible mais les résultats ne le sont pas
    const formTitle = await page.locator('[data-testid="form-title"]').textContent();
    expect(formTitle).toBe("Test Voters Only Form");

    const resultsMessage = await page.locator('[data-testid="results-voters-only"]').count();
    expect(resultsMessage).toBeGreaterThan(0);

    // Voter et vérifier que les résultats deviennent visibles
    await page.fill('[data-testid="voter-name"]', "Test Voter");
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);

    const resultsSection = await page.locator('[data-testid="results-section"]').count();
    expect(resultsSection).toBeGreaterThan(0);
  });

  test("should create form with private visibility", async ({ page }) => {
    // Créer un formulaire avec visibilité privée
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire privé");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    await page.fill('[data-testid="poll-title"]', "Test Private Form");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question privée");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option X");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option Y");

    // Définir la visibilité comme privée
    await page.selectOption('[data-testid="visibility-setting"]', "private");

    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);

    const formUrl = page.url();

    // Simuler un utilisateur non-créateur
    await page.evaluate(() => localStorage.clear());
    await page.goto(formUrl);

    // Vérifier que l'accès est refusé
    const accessDenied = await page.locator('[data-testid="access-denied"]').count();
    expect(accessDenied).toBeGreaterThan(0);

    // Simuler le créateur
    await page.evaluate(() => {
      localStorage.setItem("form_creator", "true");
    });
    await page.reload();

    // Vérifier que le créateur peut accéder
    const formTitle = await page.locator('[data-testid="form-title"]').textContent();
    expect(formTitle).toBe("Test Private Form");
  });

  test("should handle visibility changes after creation", async ({ page }) => {
    // Créer un formulaire public
    await page.fill(
      '[data-testid="chat-input"]',
      "Crée un formulaire pour test changement visibilité",
    );
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    await page.fill('[data-testid="poll-title"]', "Test Visibility Change");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");

    await page.selectOption('[data-testid="visibility-setting"]', "public");
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);

    const formUrl = page.url();

    // Voter sur le formulaire
    await page.goto(formUrl);
    await page.fill('[data-testid="voter-name"]', "Test Voter");
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);

    // Accéder aux paramètres et changer la visibilité
    await page.click('[data-testid="settings-button"]');
    await page.selectOption('[data-testid="visibility-setting"]', "voters");
    await page.click('[data-testid="save-settings"]');
    await page.waitForTimeout(1000);

    // Vérifier que la visibilité a changé
    await page.reload();
    const resultsMessage = await page.locator('[data-testid="results-voters-only"]').count();
    expect(resultsMessage).toBeGreaterThan(0);
  });

  test("should respect visibility for multiple voters", async ({ page }) => {
    // Créer un formulaire avec visibilité votants
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire pour test multiples votants");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    await page.fill('[data-testid="poll-title"]', "Test Multiple Voters");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question test");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option A");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option B");

    await page.selectOption('[data-testid="visibility-setting"]', "voters");
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);

    const formUrl = page.url();

    // Premier votant
    await page.goto(formUrl);
    await page.fill('[data-testid="voter-name"]', "Voter 1");
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);

    // Vérifier que les résultats sont visibles pour le votant
    const resultsSection1 = await page.locator('[data-testid="results-section"]').count();
    expect(resultsSection1).toBeGreaterThan(0);

    // Deuxième votant
    await page.evaluate(() => localStorage.clear());
    await page.goto(formUrl);
    await page.fill('[data-testid="voter-name"]', "Voter 2");
    await page.click('[data-testid="option-1"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);

    // Vérifier que les résultats sont visibles pour le deuxième votant
    const resultsSection2 = await page.locator('[data-testid="results-section"]').count();
    expect(resultsSection2).toBeGreaterThan(0);

    // Non-votant
    await page.evaluate(() => localStorage.clear());
    await page.goto(formUrl);

    // Vérifier que les résultats ne sont pas visibles pour le non-votant
    const resultsMessage = await page.locator('[data-testid="results-voters-only"]').count();
    expect(resultsMessage).toBeGreaterThan(0);
  });

  test("should handle visibility with anonymous voting", async ({ page }) => {
    // Créer un formulaire avec votes anonymes
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire avec votes anonymes");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    await page.fill('[data-testid="poll-title"]', "Test Anonymous Voting");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question anonyme");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 1");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option 2");

    await page.selectOption('[data-testid="visibility-setting"]', "voters");
    await page.check('[data-testid="allow-anonymous-voting"]');

    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);

    const formUrl = page.url();

    // Voter anonymement
    await page.goto(formUrl);
    await page.check('[data-testid="anonymous-vote"]');
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForTimeout(2000);

    // Vérifier que le vote est enregistré et que les résultats sont visibles
    const resultsSection = await page.locator('[data-testid="results-section"]').count();
    expect(resultsSection).toBeGreaterThan(0);

    // Vérifier que le vote est anonyme
    const anonymousVote = await page.locator('[data-testid="anonymous-voter"]').count();
    expect(anonymousVote).toBeGreaterThan(0);
  });

  test("should prevent unauthorized visibility changes", async ({ page }) => {
    // Créer un formulaire privé
    await page.fill('[data-testid="chat-input"]', "Crée un formulaire privé pour test sécurité");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    await page.fill('[data-testid="poll-title"]', "Test Security Form");
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-title"]', "Question sécurité");
    await page.click('[data-testid="add-option"]');
    await page.fill('[data-testid="option-label"]', "Option X");

    await page.selectOption('[data-testid="visibility-setting"]', "private");
    await page.click('[data-testid="finalize-form"]');
    await page.waitForTimeout(2000);

    const formUrl = page.url();

    // Simuler un utilisateur non-créateur
    await page.evaluate(() => localStorage.clear());
    await page.goto(formUrl);

    // Tenter d'accéder aux paramètres
    const settingsButton = await page.locator('[data-testid="settings-button"]').count();
    expect(settingsButton).toBe(0);

    // Tenter d'accéder directement aux paramètres
    await page.goto(`${formUrl}/settings`);

    // Vérifier que l'accès est refusé
    const accessDenied = await page.locator('[data-testid="access-denied"]').count();
    expect(accessDenied).toBeGreaterThan(0);
  });
});
