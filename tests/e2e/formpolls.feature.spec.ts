import { test, expect } from "./fixtures";
import { navigateToWorkspace, waitForChatInput } from "./helpers/chat-helpers";

/**
 * Tests API+UI pour la feature FormPolls
 * 
 * Pattern API+UI :
 * - Test API pur : vérifie le contrat backend (Playwright request)
 * - Test UI miroir : vérifie que le frontend reflète fidèlement l'état backend
 * 
 * Features couvertes :
 * - Création de FormPoll (via IA et manuelle)
 * - Vote sur FormPoll (questions simples, matrices, conditionnelles)
 * - Résultats et exports
 */

test.describe("FormPolls - API Contract", () => {
  test.skip(() => true, "API endpoints not implemented yet - skipping until backend is ready");
  test("API - Création et récupération FormPoll", async ({ request }) => {
    // 1. Créer un FormPoll via API
    const createPayload = {
      title: "Formulaire test API",
      description: "Description du formulaire",
      questions: [
        {
          id: "q1",
          type: "single",
          title: "Question simple",
          options: ["Oui", "Non"],
          required: true
        }
      ],
      type: "form"
    };

    const createResponse = await request.post("/api/formpolls", {
      data: createPayload
    });

    expect(createResponse.status()).toBe(200);
    const createdPoll = await createResponse.json();
    expect(createdPoll).toMatchObject({
      title: createPayload.title,
      description: createPayload.description,
      type: "form"
    });
    expect(createdPoll.id).toBeDefined();
    expect(createdPoll.slug).toBeDefined();

    // 2. Récupérer le FormPoll créé
    const getResponse = await request.get(`/api/formpolls/${createdPoll.slug}`);
    expect(getResponse.status()).toBe(200);
    
    const retrievedPoll = await getResponse.json();
    expect(retrievedPoll).toMatchObject(createdPoll);
    expect(retrievedPoll.questions).toEqual(createPayload.questions);

    // 3. Vérifier que le poll apparaît dans la liste
    const listResponse = await request.get("/api/formpolls");
    expect(listResponse.status()).toBe(200);
    
    const polls = await listResponse.json();
    const foundPoll = polls.find((p: any) => p.id === createdPoll.id);
    expect(foundPoll).toBeDefined();
    expect(foundPoll.title).toBe(createPayload.title);
  });

  test("API - Vote et résultats FormPoll", async ({ request }) => {
    // 1. Créer un FormPoll
    const pollData = {
      title: "Sondage vote API",
      questions: [
        {
          id: "q1",
          type: "single",
          title: "Aimez-vous les tests ?",
          options: ["Oui", "Non"],
          required: true
        },
        {
          id: "q2",
          type: "multiple",
          title: "Quels frameworks ?",
          options: ["React", "Vue", "Angular"],
          required: false
        }
      ],
      type: "form"
    };

    const createResponse = await request.post("/api/formpolls", { data: pollData });
    const poll = await createResponse.json();

    // 2. Voter sur le FormPoll
    const votePayload = {
      pollId: poll.id,
      responses: [
        { questionId: "q1", value: "Oui" },
        { questionId: "q2", value: ["React", "Vue"] }
      ]
    };

    const voteResponse = await request.post(`/api/formpolls/${poll.slug}/vote`, {
      data: votePayload
    });

    expect(voteResponse.status()).toBe(200);
    const voteResult = await voteResponse.json();
    expect(voteResult.success).toBe(true);

    // 3. Récupérer les résultats
    const resultsResponse = await request.get(`/api/formpolls/${poll.slug}/results`);
    expect(resultsResponse.status()).toBe(200);

    const results = await resultsResponse.json();
    expect(results.totalVotes).toBe(1);
    expect(results.responses).toHaveLength(1);
    expect(results.responses[0]).toMatchObject(votePayload.responses);

    // 4. Vérifier les statistiques par question
    expect(results.statistics).toBeDefined();
    expect(results.statistics["q1"]).toBeDefined();
    expect(results.statistics["q1"]["Oui"]).toBe(1);
    expect(results.statistics["q1"]["Non"]).toBe(0);
  });

  test("API - Exports FormPolls", async ({ request }) => {
    // 1. Créer un FormPoll avec des votes
    const pollData = {
      title: "Sondage export API",
      questions: [
        {
          id: "q1",
          type: "single",
          title: "Question export",
          options: ["A", "B"],
          required: true
        }
      ],
      type: "form"
    };

    const createResponse = await request.post("/api/formpolls", { data: pollData });
    const poll = await createResponse.json();

    // Ajouter un vote
    await request.post(`/api/formpolls/${poll.slug}/vote`, {
      data: {
        pollId: poll.id,
        responses: [{ questionId: "q1", value: "A" }]
      }
    });

    // 2. Tester les exports
    const formats = ["csv", "json", "markdown"];
    
    for (const format of formats) {
      const exportResponse = await request.get(
        `/api/formpolls/${poll.slug}/export?format=${format}`
      );
      
      expect(exportResponse.status()).toBe(200);
      
      if (format === "json") {
        const exportData = await exportResponse.json();
        expect(exportData.poll).toBeDefined();
        expect(exportData.responses).toBeDefined();
        expect(exportData.statistics).toBeDefined();
      } else {
        const contentType = exportResponse.headers()["content-type"];
        if (format === "csv") {
          expect(contentType).toBe("text/csv");
        } else if (format === "markdown") {
          expect(contentType).toBe("text/markdown");
        }
        const content = await exportResponse.text();
        expect(content).toContain(poll.title);
        expect(content).toContain("A");
      }
    }
  });
});

test.describe("FormPolls - UI Mirror", () => {
  test.skip(() => true, "UI tests need data-testid alignment - skipping until components are properly tagged");
  test("UI - Création et vote FormPoll", async ({ page }) => {
    test.skip(page.context()?.browser()?.browserType()?.name() !== "chromium", "UI tests limités à Chromium");
    // 1. Naviguer vers le workspace
    await navigateToWorkspace(page, "chromium");
    await waitForChatInput(page);

    // 2. Créer un FormPoll via l'IA
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill("Crée un formulaire avec une question simple sur les préférences de café");
    await chatInput.press("Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // 3. Vérifier que le formulaire est créé
    await expect(page.locator('[data-testid="poll-preview"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="Question simple"')).toBeVisible({ timeout: 10000 });

    // 4. Finaliser le formulaire
    const finalizeButton = page.locator('[data-testid="finalize-poll"]');
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await finalizeButton.click();

    // 5. Vérifier l'écran de succès
    await expect(page.locator('[data-testid="view-form"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible({ timeout: 10000 });

    // 6. Copier le lien et naviguer vers le vote
    const copyButton = page.locator('[data-testid="copy-link"]');
    await expect(copyButton).toBeVisible({ timeout: 10000 });
    await copyButton.click();

    // Attendre le toast de confirmation
    await expect(page.locator('text="Lien copié"')).toBeVisible({ timeout: 5000 });

    // 7. Naviguer vers le formulaire de vote
    const viewFormButton = page.locator('[data-testid="view-form"]');
    await expect(viewFormButton).toBeVisible({ timeout: 10000 });
    await viewFormButton.click();

    // 8. Voter sur le formulaire
    await expect(page.locator('[data-testid="form-poll-vote"]')).toBeVisible({ timeout: 15000 });
    
    // Répondre à la question
    const optionButton = page.locator("input[type='radio']").first();
    await expect(optionButton).toBeVisible({ timeout: 10000 });
    await optionButton.check();

    // Soumettre le vote
    const submitButton = page.locator('[data-testid="submit-vote"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();

    // 9. Vérifier la confirmation de vote
    await expect(page.locator('text="Merci pour votre réponse"')).toBeVisible({ timeout: 15000 });
  });

  test("UI - Questions conditionnelles et matrices", async ({ page }) => {
    test.skip(page.context()?.browser()?.browserType()?.name() !== "chromium", "UI tests limités à Chromium");
    // 1. Naviguer vers le workspace
    await navigateToWorkspace(page, "chromium");
    await waitForChatInput(page);

    // 2. Créer un formulaire complexe
    const complexPrompt = `
    Crée un formulaire avec :
    1. Question simple : "Aimez-vous le chocolat ?" (Oui/Non)
    2. Question conditionnelle : Si NON, "Pourquoi ?"
    3. Question matrice : Évaluez 3 saveurs sur 3 critères
    `;

    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(complexPrompt);
    await chatInput.press("Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 20000 });

    // 3. Vérifier la présence des différents types de questions
    await expect(page.locator('[data-testid="poll-preview"]')).toBeVisible();
    await expect(page.locator('text="Aimez-vous le chocolat ?"')).toBeVisible();

    // 4. Finaliser et tester le vote
    const finalizeButton = page.locator('[data-testid="finalize-poll"]');
    await finalizeButton.click();

    // Attendre l'écran de succès puis naviguer vers le vote
    await page.waitForSelector('text="Formulaire publié !"', { timeout: 10000 });
    const viewFormButton = page.locator('[data-testid="view-form"]');
    await viewFormButton.click();

    // 5. Tester les questions conditionnelles
    await expect(page.locator('[data-testid="form-poll-vote"]')).toBeVisible();
    
    // La question conditionnelle ne doit pas être visible initialement
    await expect(page.locator('text="Pourquoi ?"')).not.toBeVisible();

    // Répondre "Non" à la première question
    await page.locator('input[value="Non"]').check();

    // La question conditionnelle doit maintenant apparaître
    await expect(page.locator('text="Pourquoi ?"')).toBeVisible();

    // 6. Tester la question matrice
    await expect(page.locator("table")).toBeVisible(); // Les matrices sont rendues en tableaux
    const matrixRadios = page.locator("table input[type='radio']");
    const count = await matrixRadios.count();
    
    // Vérifier qu'il y a des éléments à tester
    expect(count).toBeGreaterThan(0);

    // Remplir la matrice (sélectionner au moins une option par ligne)
    // Sélectionner une option par ligne (première colonne)
    for (let i = 0; i < count; i += 3) {
      await matrixRadios.nth(i).check();
    }

    // 7. Soumettre le formulaire complet
    const submitButton = page.locator('[data-testid="submit-vote"]');
    await submitButton.click();

    // 8. Vérifier la confirmation
    await expect(page.locator('text="Merci pour votre réponse"')).toBeVisible();
  });

  test("UI - Résultats et exports", async ({ page }) => {
    test.skip(page.context()?.browser()?.browserType()?.name() !== "chromium", "UI tests limités à Chromium");
    // 1. Naviguer vers le dashboard
    await page.goto("//DooDates/dashboard");
    await page.waitForLoadState("networkidle");

    // 2. Trouver un formulaire existant ou en créer un
    const existingForm = page.locator("[data-testid='form-poll-card']").first();
    
    if (await existingForm.isVisible()) {
      await existingForm.click();
    } else {
      // Créer un nouveau formulaire si aucun n'existe
      await navigateToWorkspace(page, "chromium");
      await waitForChatInput(page, 10000);
      
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill("Crée un sondage simple avec une question");
      await chatInput.press("Enter");
      
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });
      
      const finalizeButton = page.locator('[data-testid="finalize-poll"]');
      await finalizeButton.click();
      
      await page.waitForSelector('text="Formulaire publié !"', { timeout: 10000 });
      const dashboardButton = page.locator('[data-testid="go-to-dashboard"]');
      await dashboardButton.click();
    }

    // 3. Accéder aux résultats
    await expect(page.locator('[data-testid="poll-results"]')).toBeVisible({ timeout: 10000 });
    const resultsButton = page.locator('[data-testid="view-results"]');
    await expect(resultsButton).toBeVisible({ timeout: 10000 });
    if (await resultsButton.isVisible()) {
      await resultsButton.click();
    }

    // 4. Vérifier les statistiques
    await expect(page.locator("[data-testid='results-stats']")).toBeVisible({ timeout: 10000 });
    
    // 5. Tester les exports
    const exportButtons = page.locator("[data-testid^='export-']");
    const exportCount = await exportButtons.count();
    
    if (exportCount > 0) {
      // Tester le premier export disponible
      await exportButtons.first().click();
      
      // Vérifier que le téléchargement commence (ou que le contenu s'affiche)
      await page.waitForTimeout(2000); // Attendre le début du téléchargement
    }
  });
});
