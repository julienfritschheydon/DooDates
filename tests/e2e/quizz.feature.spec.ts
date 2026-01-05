import { test, expect } from "./fixtures";
import { navigateToWorkspace, waitForChatInput } from "./helpers/chat-helpers";

/**
 * Tests API+UI pour la feature Quizz
 *
 * Pattern API+UI :
 * - Test API pur : vérifie le contrat backend (Playwright request)
 * - Test UI miroir : vérifie que le frontend reflète fidèlement l'état backend
 *
 * Features couvertes :
 * - Création de quizz (via IA et manuelle)
 * - Vote sur quizz (questions, réponses, scoring)
 * - Résultats et scores
 * - Types de questions (QCM, vrai/faux, etc.)
 */

test.describe("Quizz - API Contract", () => {
  test.skip(() => true, "API endpoints not implemented yet - skipping until backend is ready");

  test("API - Création et récupération Quizz", async ({ request }) => {
    // 1. Créer un Quizz via API
    const createPayload = {
      title: "Quizz JavaScript",
      description: "Testez vos connaissances en JavaScript",
      questions: [
        {
          id: "q1",
          type: "single",
          title: "Quel mot-clé pour déclarer une constante ?",
          options: ["var", "let", "const", "function"],
          correctAnswer: "const",
          points: 10,
        },
        {
          id: "q2",
          type: "boolean",
          title: "JavaScript est un langage typé dynamiquement",
          correctAnswer: true,
          points: 5,
        },
      ],
      type: "quizz",
    };

    const createResponse = await request.post("/api/quizz", {
      data: createPayload,
    });

    expect(createResponse.status()).toBe(200);
    const createdQuizz = await createResponse.json();
    expect(createdQuizz).toMatchObject({
      title: createPayload.title,
      description: createPayload.description,
      type: "quizz",
    });
    expect(createdQuizz.id).toBeDefined();
    expect(createdQuizz.slug).toBeDefined();

    // 2. Récupérer le Quizz créé
    const getResponse = await request.get(`/api/quizz/${createdQuizz.slug}`);
    expect(getResponse.status()).toBe(200);

    const retrievedQuizz = await getResponse.json();
    expect(retrievedQuizz).toMatchObject(createdQuizz);
    expect(retrievedQuizz.questions).toEqual(createPayload.questions);

    // 3. Vérifier que le quizz apparaît dans la liste
    const listResponse = await request.get("/api/quizz");
    expect(listResponse.status()).toBe(200);

    const quizzList = await listResponse.json();
    const foundQuizz = quizzList.find((q: any) => q.id === createdQuizz.id);
    expect(foundQuizz).toBeDefined();
    expect(foundQuizz.title).toBe(createPayload.title);
  });

  test("API - Vote et scoring Quizz", async ({ request }) => {
    // 1. Créer un Quizz
    const quizzData = {
      title: "Quizz Culture G",
      questions: [
        {
          id: "q1",
          type: "single",
          title: "Capitale de la France ?",
          options: ["Londres", "Berlin", "Paris", "Madrid"],
          correctAnswer: "Paris",
          points: 10,
        },
        {
          id: "q2",
          type: "multiple",
          title: "Quels sont des langages de programmation ?",
          options: ["JavaScript", "HTML", "Python", "CSS"],
          correctAnswer: ["JavaScript", "Python"],
          points: 20,
        },
      ],
      type: "quizz",
    };

    const createResponse = await request.post("/api/quizz", { data: quizzData });
    const quizz = await createResponse.json();

    // 2. Voter sur le Quizz
    const votePayload = {
      quizzId: quizz.id,
      participantName: "Alice",
      answers: [
        { questionId: "q1", answer: "Paris" },
        { questionId: "q2", answer: ["JavaScript", "Python"] },
      ],
    };

    const voteResponse = await request.post(`/api/quizz/${quizz.slug}/submit`, {
      data: votePayload,
    });

    expect(voteResponse.status()).toBe(200);
    const voteResult = await voteResponse.json();
    expect(voteResult.success).toBe(true);
    expect(voteResult.score).toBeDefined();
    expect(voteResult.totalPoints).toBe(30); // 10 + 20
    expect(voteResult.correctAnswers).toBe(2);

    // 3. Récupérer les résultats
    const resultsResponse = await request.get(`/api/quizz/${quizz.slug}/results`);
    expect(resultsResponse.status()).toBe(200);

    const results = await resultsResponse.json();
    expect(results.totalParticipants).toBe(1);
    expect(results.participants).toHaveLength(1);
    expect(results.participants[0].name).toBe(votePayload.participantName);
    expect(results.participants[0].score).toBe(voteResult.score);

    // 4. Vérifier les statistiques par question
    expect(results.questionStats).toBeDefined();
    expect(results.questionStats["q1"]).toBeDefined();
    expect(results.questionStats["q1"].correctCount).toBe(1);
    expect(results.questionStats["q1"].totalAnswers).toBe(1);
  });

  test("API - Leaderboard et exports Quizz", async ({ request }) => {
    // 1. Créer un Quizz
    const quizzData = {
      title: "Quizz Maths",
      questions: [
        {
          id: "q1",
          type: "single",
          title: "2 + 2 = ?",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4",
          points: 10,
        },
      ],
      type: "quizz",
    };

    const createResponse = await request.post("/api/quizz", { data: quizzData });
    const quizz = await createResponse.json();

    // 2. Ajouter plusieurs participants
    const participants = [
      { name: "John", answers: [{ questionId: "q1", answer: "4" }] },
      { name: "Jane", answers: [{ questionId: "q1", answer: "3" }] },
      { name: "Bob", answers: [{ questionId: "q1", answer: "4" }] },
    ];

    for (const participant of participants) {
      await request.post(`/api/quizz/${quizz.slug}/submit`, {
        data: {
          quizzId: quizz.id,
          participantName: participant.name,
          answers: participant.answers,
        },
      });
    }

    // 3. Vérifier le leaderboard
    const leaderboardResponse = await request.get(`/api/quizz/${quizz.slug}/leaderboard`);
    expect(leaderboardResponse.status()).toBe(200);

    const leaderboard = await leaderboardResponse.json();
    expect(leaderboard.rankings).toHaveLength(3);
    expect(leaderboard.rankings[0].score).toBe(10); // John et Bob ex-aequo
    expect(leaderboard.rankings[2].score).toBe(0); // Jane

    // 4. Tester les exports
    const exportFormats = ["csv", "json"];

    for (const format of exportFormats) {
      const exportResponse = await request.get(`/api/quizz/${quizz.slug}/export?format=${format}`);

      expect(exportResponse.status()).toBe(200);

      if (format === "json") {
        const exportData = await exportResponse.json();
        expect(exportData.quizz).toBeDefined();
        expect(exportData.results).toBeDefined();
        expect(exportData.leaderboard).toBeDefined();
      } else {
        const contentType = exportResponse.headers()["content-type"];
        expect(contentType).toBe("text/csv");
        const content = await exportResponse.text();
        expect(content).toContain(quizz.title);
        expect(content).toContain("John");
        expect(content).toContain("Jane");
      }
    }
  });
});

test.describe("Quizz - UI Mirror", () => {
  test.skip(
    () => true,
    "UI tests need data-testid alignment - skipping until components are properly tagged",
  );

  test("UI - Création et participation Quizz", async ({ page }) => {
    test.skip(
      page.context()?.browser()?.browserType()?.name() !== "chromium",
      "UI tests limités à Chromium",
    );

    // 1. Naviguer vers le workspace
    await navigateToWorkspace(page, "chromium");
    await waitForChatInput(page);

    // 2. Créer un Quizz via l'IA
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill("Crée un quizz de 5 questions sur les connaissances générales");
    await chatInput.press("Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // 3. Vérifier que le quizz est créé
    await expect(page.locator('[data-testid="quizz-preview"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="Questions"')).toBeVisible({ timeout: 10000 });

    // 4. Vérifier les types de questions
    await expect(page.locator('[data-testid="question-list"]')).toBeVisible({ timeout: 10000 });
    const questionCards = page.locator('[data-testid="question-card"]');
    const questionCount = await questionCards.count();
    expect(questionCount).toBeGreaterThan(0);

    // 5. Finaliser le quizz
    const finalizeButton = page.locator('[data-testid="finalize-quizz"]');
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await finalizeButton.click();

    // 6. Vérifier l'écran de succès
    await expect(page.locator('text="Quizz publié !"')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible({ timeout: 10000 });

    // 7. Naviguer vers la participation
    const playQuizzButton = page.locator('[data-testid="play-quizz"]');
    await expect(playQuizzButton).toBeVisible({ timeout: 10000 });
    await playQuizzButton.click();

    // 8. Participer au quizz
    await expect(page.locator('[data-testid="quizz-play"]')).toBeVisible({ timeout: 15000 });

    // Ajouter nom du participant
    const nameInput = page.locator('[data-testid="participant-name"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("Test Player");

    // Commencer le quizz
    const startButton = page.locator('[data-testid="start-quizz"]');
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();

    // 9. Répondre aux questions
    await expect(page.locator('[data-testid="question-container"]')).toBeVisible({
      timeout: 15000,
    });

    // Pour chaque question, répondre et passer à la suivante
    for (let i = 0; i < Math.min(questionCount, 5); i++) {
      // Attendre que la question s'affiche
      await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});

      // Répondre à la question (première option disponible)
      const answerOption = page.locator('[data-testid="answer-option"]').first();
      if (await answerOption.isVisible()) {
        await answerOption.click();
      }

      // Passer à la question suivante ou soumettre
      const nextButton = page.locator('[data-testid="next-question"]');
      const submitButton = page.locator('[data-testid="submit-quizz"]');

      if (await submitButton.isVisible()) {
        await submitButton.click();
        break; // Dernière question
      } else if (await nextButton.isVisible()) {
        await nextButton.click();
      }
    }

    // 10. Vérifier les résultats
    await expect(page.locator('[data-testid="quizz-results"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="Votre score"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible({ timeout: 5000 });
  });

  test("UI - Types de questions et scoring", async ({ page }) => {
    test.skip(
      page.context()?.browser()?.browserType()?.name() !== "chromium",
      "UI tests limités à Chromium",
    );

    // 1. Naviguer vers le workspace
    await navigateToWorkspace(page, "chromium");
    await waitForChatInput(page);

    // 2. Créer un quizz avec différents types de questions
    const complexPrompt = `
    Crée un quizz varié avec :
    1. Question QCM à choix unique
    2. Question QCM à choix multiples  
    3. Question Vrai/Faux
    4. Question texte court
    Chaque question vaut 10 points
    `;

    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(complexPrompt);
    await chatInput.press("Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // 3. Vérifier les différents types de questions
    await expect(page.locator('[data-testid="quizz-preview"]')).toBeVisible({ timeout: 15000 });

    // Vérifier les badges de type de question
    await expect(page.locator('[data-testid="question-type-single"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="question-type-multiple"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="question-type-boolean"]')).toBeVisible({
      timeout: 5000,
    });

    // 4. Finaliser et tester le jeu
    const finalizeButton = page.locator('[data-testid="finalize-quizz"]');
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await finalizeButton.click();

    await page.waitForSelector('text="Quizz publié !"', { timeout: 10000 });
    const playQuizzButton = page.locator('[data-testid="play-quizz"]');
    await playQuizzButton.click();

    // 5. Tester les différents types de réponses
    await expect(page.locator('[data-testid="quizz-play"]')).toBeVisible({ timeout: 15000 });

    const nameInput = page.locator('[data-testid="participant-name"]');
    await nameInput.fill("Multi Type Player");

    const startButton = page.locator('[data-testid="start-quizz"]');
    await startButton.click();

    // 6. Vérifier l'affichage des points par question
    await expect(page.locator('[data-testid="question-points"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="10 points"')).toBeVisible({ timeout: 5000 });

    // 7. Tester les différents types d'interface
    // QCM choix unique
    const singleChoice = page.locator('[data-testid="single-choice"]');
    if (await singleChoice.isVisible()) {
      const option = singleChoice.locator("input[type='radio']").first();
      await option.click();
    }

    // Passer à la question suivante
    const nextButton = page.locator('[data-testid="next-question"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // QCM choix multiples
    const multipleChoice = page.locator('[data-testid="multiple-choice"]');
    if (await multipleChoice.isVisible()) {
      const checkboxes = multipleChoice.locator("input[type='checkbox']");
      const count = await checkboxes.count();
      if (count > 0) {
        await checkboxes.first().click();
        await checkboxes.nth(1).click();
      }
    }

    // Continuer jusqu'à la fin
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Vrai/Faux
    const booleanQuestion = page.locator('[data-testid="boolean-question"]');
    if (await booleanQuestion.isVisible()) {
      const trueButton = booleanQuestion.locator('[data-testid="true-answer"]');
      await trueButton.click();
    }

    // Soumettre et voir le score détaillé
    const submitButton = page.locator('[data-testid="submit-quizz"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // 8. Vérifier le scoring détaillé
    await expect(page.locator('[data-testid="detailed-score"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="question-breakdown"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("UI - Leaderboard et exports Quizz", async ({ page }) => {
    test.skip(
      page.context()?.browser()?.browserType()?.name() !== "chromium",
      "UI tests limités à Chromium",
    );

    // 1. Naviguer vers le dashboard
    await page.goto("//DooDates/dashboard");
    await page.waitForLoadState("networkidle");

    // 2. Trouver un quizz existant
    const quizzCard = page.locator('[data-testid="quizz-card"]').first();

    if (await quizzCard.isVisible()) {
      await quizzCard.click();
    } else {
      // Créer un nouveau quizz si aucun n'existe
      await navigateToWorkspace(page, "chromium");
      await waitForChatInput(page);

      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill("Crée un quizz rapide de 3 questions");
      await chatInput.press("Enter");

      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const finalizeButton = page.locator('[data-testid="finalize-quizz"]');
      await finalizeButton.click();

      await page.waitForSelector('text="Quizz publié !"', { timeout: 10000 });
      const dashboardButton = page.locator('[data-testid="go-to-dashboard"]');
      await dashboardButton.click();
    }

    // 3. Accéder aux résultats et leaderboard
    await page.waitForSelector('[data-testid="quizz-results"]', { timeout: 10000 });
    const resultsButton = page.locator('[data-testid="view-results"]');
    if (await resultsButton.isVisible()) {
      await resultsButton.click();
    }

    // 4. Vérifier le leaderboard
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="rankings-table"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="Classement"')).toBeVisible({ timeout: 5000 });

    // 5. Vérifier les options d'export
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible({ timeout: 15000 });

    const exportButtons = page.locator('[data-testid^="export-"]');
    const exportCount = await exportButtons.count();

    if (exportCount > 0) {
      // Tester l'export CSV
      const csvExport = page.locator('[data-testid="export-csv"]');
      if (await csvExport.isVisible()) {
        await csvExport.click();
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}); // Attendre le téléchargement
      }
    }

    // 6. Vérifier les statistiques du quizz
    await expect(page.locator('[data-testid="quizz-statistics"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="Participants"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="Score moyen"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="Meilleur score"')).toBeVisible({ timeout: 5000 });

    // 7. Tester le partage des résultats
    const shareResults = page.locator('[data-testid="share-results"]');
    if (await shareResults.isVisible()) {
      await shareResults.click();
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible({ timeout: 10000 });

      const copyLinkButton = page.locator('[data-testid="copy-results-link"]');
      if (await copyLinkButton.isVisible()) {
        await copyLinkButton.click();
        await expect(page.locator('text="Lien copié"')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
