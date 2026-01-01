import { test, expect } from "./fixtures";
import { navigateToWorkspace, waitForChatInput } from "./helpers/chat-helpers";

/**
 * Tests API+UI pour la feature Availability Polls
 * 
 * Pattern API+UI :
 * - Test API pur : vérifie le contrat backend (Playwright request)
 * - Test UI miroir : vérifie que le frontend reflète fidèlement l'état backend
 * 
 * Features couvertes :
 * - Création de sondages de disponibilité (via IA et manuelle)
 * - Vote sur disponibilités (sélection dates, participants)
 * - Résultats et visualisation des disponibilités
 * - Grouping de dates (weekends, semaines)
 */

test.describe("Availability Polls - API Contract", () => {
  test.skip(() => true, "API endpoints not implemented yet - skipping until backend is ready");

  test("API - Création et récupération Availability Poll", async ({ request }) => {
    // 1. Créer un Availability Poll via API
    const createPayload = {
      title: "Réunion d'équipe",
      description: "Disponibilités pour la prochaine réunion",
      dates: ["2025-01-15", "2025-01-16", "2025-01-17"],
      times: ["09:00", "14:00", "16:00"],
      type: "availability"
    };

    const createResponse = await request.post("/api/availability-polls", {
      data: createPayload
    });

    expect(createResponse.status()).toBe(200);
    const createdPoll = await createResponse.json();
    expect(createdPoll).toMatchObject({
      title: createPayload.title,
      description: createPayload.description,
      type: "availability"
    });
    expect(createdPoll.id).toBeDefined();
    expect(createdPoll.slug).toBeDefined();

    // 2. Récupérer le Availability Poll créé
    const getResponse = await request.get(`/api/availability-polls/${createdPoll.slug}`);
    expect(getResponse.status()).toBe(200);
    
    const retrievedPoll = await getResponse.json();
    expect(retrievedPoll).toMatchObject(createdPoll);
    expect(retrievedPoll.dates).toEqual(createPayload.dates);
    expect(retrievedPoll.times).toEqual(createPayload.times);

    // 3. Vérifier que le poll apparaît dans la liste
    const listResponse = await request.get("/api/availability-polls");
    expect(listResponse.status()).toBe(200);
    
    const polls = await listResponse.json();
    const foundPoll = polls.find((p: any) => p.id === createdPoll.id);
    expect(foundPoll).toBeDefined();
    expect(foundPoll.title).toBe(createPayload.title);
  });

  test("API - Vote et disponibilités Availability Poll", async ({ request }) => {
    // 1. Créer un Availability Poll
    const pollData = {
      title: "Planning sprint",
      dates: ["2025-01-20", "2025-01-21", "2025-01-22"],
      times: ["10:00", "15:00"],
      type: "availability"
    };

    const createResponse = await request.post("/api/availability-polls", { data: pollData });
    const poll = await createResponse.json();

    // 2. Voter sur le Availability Poll
    const votePayload = {
      pollId: poll.id,
      participantName: "John Doe",
      availabilities: [
        { date: "2025-01-20", time: "10:00", available: true },
        { date: "2025-01-20", time: "15:00", available: false },
        { date: "2025-01-21", time: "10:00", available: true },
        { date: "2025-01-21", time: "15:00", available: true },
        { date: "2025-01-22", time: "10:00", available: false },
        { date: "2025-01-22", time: "15:00", available: false }
      ]
    };

    const voteResponse = await request.post(`/api/availability-polls/${poll.slug}/vote`, {
      data: votePayload
    });

    expect(voteResponse.status()).toBe(200);
    const voteResult = await voteResponse.json();
    expect(voteResult.success).toBe(true);

    // 3. Récupérer les résultats
    const resultsResponse = await request.get(`/api/availability-polls/${poll.slug}/results`);
    expect(resultsResponse.status()).toBe(200);

    const results = await resultsResponse.json();
    expect(results.totalVotes).toBe(1);
    expect(results.participants).toHaveLength(1);
    expect(results.participants[0].name).toBe(votePayload.participantName);

    // 4. Vérifier les statistiques de disponibilité
    expect(results.statistics).toBeDefined();
    expect(results.statistics["2025-01-20"]).toBeDefined();
    expect(results.statistics["2025-01-20"]["10:00"]).toEqual({ available: 1, total: 1 });
    expect(results.statistics["2025-01-20"]["15:00"]).toEqual({ available: 0, total: 1 });
  });

  test("API - Grouping et exports Availability Polls", async ({ request }) => {
    // 1. Créer un Availability Poll avec plusieurs dates
    const pollData = {
      title: "Sondage grouping",
      dates: [
        "2025-01-10", "2025-01-11", // Weekend
        "2025-01-13", "2025-01-14", "2025-01-15", // Semaine
        "2025-01-17", "2025-01-18"  // Weekend suivant
      ],
      times: ["09:00"],
      type: "availability"
    };

    const createResponse = await request.post("/api/availability-polls", { data: pollData });
    const poll = await createResponse.json();

    // 2. Ajouter un vote
    await request.post(`/api/availability-polls/${poll.slug}/vote`, {
      data: {
        pollId: poll.id,
        participantName: "Alice",
        availabilities: pollData.dates.map(date => ({
          date,
          time: "09:00",
          available: true
        }))
      }
    });

    // 3. Tester les résultats avec grouping
    const resultsResponse = await request.get(`/api/availability-polls/${poll.slug}/results?grouping=true`);
    expect(resultsResponse.status()).toBe(200);

    const results = await resultsResponse.json();
    expect(results.dateGroups).toBeDefined();
    expect(results.dateGroups.weekends).toBeDefined();
    expect(results.dateGroups.weekdays).toBeDefined();

    // 4. Tester les exports
    const exportResponse = await request.get(
      `/api/availability-polls/${poll.slug}/export?format=csv`
    );
    
    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()["content-type"]).toBe("text/csv");
    
    const content = await exportResponse.text();
    expect(content).toContain(poll.title);
    expect(content).toContain("John Doe");
  });
});

test.describe("Availability Polls - UI Mirror", () => {
  test.skip(() => true, "UI tests need data-testid alignment - skipping until components are properly tagged");

  test("UI - Création et vote Availability Poll", async ({ page }) => {
    test.skip(page.context()?.browser()?.browserType()?.name() !== "chromium", "UI tests limités à Chromium");
    
    // 1. Naviguer vers le workspace
    await navigateToWorkspace(page, "chromium");
    await waitForChatInput(page);

    // 2. Créer un Availability Poll via l'IA
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill("Crée un sondage de disponibilité pour une réunion d'équipe la semaine prochaine");
    await chatInput.press("Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // 3. Vérifier que le sondage est créé
    await expect(page.locator('[data-testid="poll-preview"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="Disponibilités"')).toBeVisible({ timeout: 10000 });

    // 4. Vérifier le calendrier de dates
    await expect(page.locator('[data-testid="date-calendar"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="time-slots"]')).toBeVisible({ timeout: 10000 });

    // 5. Finaliser le sondage
    const finalizeButton = page.locator('[data-testid="finalize-poll"]');
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await finalizeButton.click();

    // 6. Vérifier l'écran de succès
    await expect(page.locator('text="Sondage publié !"')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible({ timeout: 10000 });

    // 7. Naviguer vers le vote
    const viewPollButton = page.locator('[data-testid="view-poll"]');
    await expect(viewPollButton).toBeVisible({ timeout: 10000 });
    await viewPollButton.click();

    // 8. Voter sur les disponibilités
    await expect(page.locator('[data-testid="availability-poll-vote"]')).toBeVisible({ timeout: 15000 });
    
    // Sélectionner des disponibilités
    const availableSlots = page.locator('[data-testid="available-slot"]');
    const count = await availableSlots.count();
    
    if (count > 0) {
      await availableSlots.first().click();
    }

    // Ajouter nom du participant
    const nameInput = page.locator('[data-testid="participant-name"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("Test User");

    // Soumettre le vote
    const submitButton = page.locator('[data-testid="submit-availability"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();

    // 9. Vérifier la confirmation
    await expect(page.locator('text="Merci pour votre réponse"')).toBeVisible({ timeout: 15000 });
  });

  test("UI - Grouping weekends et visualisation", async ({ page }) => {
    test.skip(page.context()?.browser()?.browserType()?.name() !== "chromium", "UI tests limités à Chromium");
    
    // 1. Naviguer vers le workspace
    await navigateToWorkspace(page, "chromium");
    await waitForChatInput(page);

    // 2. Créer un sondage avec dates sur plusieurs semaines
    const complexPrompt = `
    Crée un sondage de disponibilité pour un atelier de 2 jours :
    - Dates proposées : semaine du 15 au 19 janvier 2025
    - Créneaux : 9h-11h et 14h-16h
    - Afficher le grouping par weekends
    `;

    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(complexPrompt);
    await chatInput.press("Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // 3. Vérifier le calendrier avec grouping
    await expect(page.locator('[data-testid="poll-preview"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="date-groups"]')).toBeVisible({ timeout: 10000 });

    // 4. Vérifier les groupes de dates
    await expect(page.locator('text="Weekend"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="Semaine"')).toBeVisible({ timeout: 5000 });

    // 5. Finaliser et tester la visualisation
    const finalizeButton = page.locator('[data-testid="finalize-poll"]');
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await finalizeButton.click();

    await page.waitForSelector('text="Sondage publié !"', { timeout: 10000 });
    const viewPollButton = page.locator('[data-testid="view-poll"]');
    await viewPollButton.click();

    // 6. Tester la visualisation des résultats
    await expect(page.locator('[data-testid="availability-results"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="availability-grid"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="participants-list"]')).toBeVisible({ timeout: 10000 });

    // 7. Vérifier les statistiques de disponibilité
    await expect(page.locator('text="Disponibilités totales"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="best-slots"]')).toBeVisible({ timeout: 5000 });
  });

  test("UI - Exports et partage Availability Poll", async ({ page }) => {
    test.skip(page.context()?.browser()?.browserType()?.name() !== "chromium", "UI tests limités à Chromium");
    
    // 1. Naviguer vers le dashboard
    await page.goto("//DooDates/dashboard");
    await page.waitForLoadState("networkidle");

    // 2. Trouver un sondage de disponibilité existant
    const availabilityPoll = page.locator('[data-testid="availability-poll-card"]').first();
    
    if (await availabilityPoll.isVisible()) {
      await availabilityPoll.click();
    } else {
      // Créer un nouveau sondage si aucun n'existe
      await navigateToWorkspace(page, "chromium");
      await waitForChatInput(page, 10000);
      await waitForChatInput(page);
      
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill("Crée un sondage de disponibilité rapide pour cette semaine");
      await chatInput.press("Enter");
      
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });
      
      const finalizeButton = page.locator('[data-testid="finalize-poll"]');
      await finalizeButton.click();
      
      await page.waitForSelector('text="Sondage publié !"', { timeout: 10000 });
      const dashboardButton = page.locator('[data-testid="go-to-dashboard"]');
      await dashboardButton.click();
    }

    // 3. Accéder aux résultats et exports
    await page.waitForSelector('[data-testid="poll-results"]', { timeout: 10000 });
    const resultsButton = page.locator('[data-testid="view-results"]');
    if (await resultsButton.isVisible()) {
      await resultsButton.click();
    }

    // 4. Vérifier les options d'export
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible({ timeout: 15000 });
    
    const exportButtons = page.locator('[data-testid^="export-"]');
    const exportCount = await exportButtons.count();
    
    if (exportCount > 0) {
      // Tester l'export CSV
      const csvExport = page.locator('[data-testid="export-csv"]');
      if (await csvExport.isVisible()) {
        await csvExport.click();
        await page.waitForTimeout(2000); // Attendre le téléchargement
      }
    }

    // 5. Vérifier le lien de partage
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible({ timeout: 10000 });
    
    const copyButton = page.locator('[data-testid="copy-link"]');
    if (await copyButton.isVisible()) {
      await copyButton.click();
      await expect(page.locator('text="Lien copié"')).toBeVisible({ timeout: 5000 });
    }
  });
});
