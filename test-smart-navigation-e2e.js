/**
 * 🎭 Tests E2E Playwright - Navigation Intelligente
 *
 * Usage: npx playwright test test-smart-navigation-e2e.js
 */

const { test, expect } = require("@playwright/test");
const BASE_URL = "http://localhost:8080/DooDates";

test.describe("Navigation Intelligente - E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Activer les logs de navigation
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("debug_smart_navigation", "true");
    });
  });

  test("Nouvelle création depuis dashboard - Full reset", async ({ page }) => {
    // 1. Aller au dashboard
    await page.goto(`${BASE_URL}/dashboard`);

    // 2. Créer une conversation avec du contenu
    await page.goto(`${BASE_URL}/workspace/form`);
    await page.fill(
      '[data-testid="chat-input"]',
      "Crée-moi un sondage sur les préférences alimentaires",
    );
    await page.press('[data-testid="chat-input"]', "Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 3. Retourner au dashboard
    await page.goto(`${BASE_URL}/dashboard`);

    // 4. Cliquer sur "Créer un sondage de dates"
    await page.click('[data-testid="create-date-poll"]');

    // 5. Vérifier que le chat est vide (full reset)
    await expect(page.locator('[data-testid="chat-messages"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

    // 6. Vérifier les logs console
    const logs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    // 7. Vérifier la stratégie dans les logs
    const strategyLog = logs.find((log) => log.includes("full"));
    expect(strategyLog).toBeTruthy();
    expect(strategyLog).toContain("Nouvelle création de sondage");
  });

  test("Changement de type - Context reset", async ({ page }) => {
    // 1. Commencer avec un sondage de dates
    await page.goto(`${BASE_URL}/workspace/date`);
    await page.fill('[data-testid="chat-input"]', "Organise une réunion pour la semaine prochaine");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Changer vers formulaire
    await page.goto(`${BASE_URL}/workspace/form`);

    // 3. Vérifier que la conversation est préservée mais l'éditeur est vide
    await expect(page.locator('[data-testid="chat-messages"]')).not.toHaveCount(0);
    await expect(page.locator('[data-testid="poll-editor"]')).toBeEmpty();

    // 4. Vérifier les logs
    const logs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    const strategyLog = logs.find((log) => log.includes("context-only"));
    expect(strategyLog).toBeTruthy();
    expect(strategyLog).toContain("Changement de type sondage");
  });

  test("Navigation temporaire - No reset", async ({ page }) => {
    // 1. Créer du contenu dans workspace
    await page.goto(`${BASE_URL}/workspace/form`);
    await page.fill('[data-testid="chat-input"]', "Test de contenu à préserver");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Naviguer vers docs (temporaire)
    await page.goto(`${BASE_URL}/docs`);

    // 3. Retourner au workspace
    await page.goto(`${BASE_URL}/workspace/form`);

    // 4. Vérifier que tout est préservé
    await expect(page.locator('[data-testid="chat-messages"]')).not.toHaveCount(0);

    // 5. Vérifier les logs
    const logs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    const strategyLog = logs.find((log) => log.includes("none"));
    expect(strategyLog).toBeTruthy();
    expect(strategyLog).toContain("Navigation temporaire");
  });

  test("Mode édition - Preserve", async ({ page }) => {
    // 1. Créer un sondage
    await page.goto(`${BASE_URL}/workspace/form`);
    await page.fill('[data-testid="chat-input"]', "Crée un sondage sur la satisfaction client");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Simuler un poll ID (en pratique, viendrait de la création)
    const pollId = "test-poll-" + Date.now();

    // 3. Naviguer en mode édition
    await page.goto(`${BASE_URL}/workspace/form?edit=${pollId}`);

    // 4. Vérifier que le contexte est préservé
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

    // 5. Vérifier les logs
    const logs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    const strategyLog = logs.find((log) => log.includes("preserve"));
    expect(strategyLog).toBeTruthy();
    expect(strategyLog).toContain("Mode édition détecté");
  });

  test("Performance - Reset rapide", async ({ page }) => {
    // 1. Démarrer le timer
    const startTime = Date.now();

    // 2. Effectuer une navigation avec reset
    await page.goto(`${BASE_URL}/dashboard`);
    await page.click('[data-testid="create-form-poll"]');

    // 3. Attendre que le reset soit appliqué
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 5000 });

    // 4. Vérifier le temps
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 5. Le reset doit prendre moins de 500ms
    expect(duration).toBeLessThan(500);

    console.log(`⏱️ Performance: ${duration}ms (< 500ms requis)`);
  });

  test("Logs console - Aucune erreur", async ({ page }) => {
    const errors = [];
    const warnings = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
      if (msg.type() === "warning") {
        warnings.push(msg.text());
      }
    });

    // Effectuer plusieurs navigations
    await page.goto(`${BASE_URL}/workspace/date`);
    await page.goto(`${BASE_URL}/workspace/form`);
    await page.goto(`${BASE_URL}/docs`);
    await page.goto(`${BASE_URL}/dashboard`);

    // Attendre un peu pour les logs
    await page.waitForTimeout(1000);

    // Vérifier qu'il n'y a pas d'erreurs liées à la navigation
    const navigationErrors = errors.filter(
      (error) => error.includes("navigation") || error.includes("reset") || error.includes("chat"),
    );

    expect(navigationErrors).toHaveLength(0);
    console.log(
      `✅ Aucune erreur de navigation (${errors.length} erreurs totales, ${warnings.length} warnings)`,
    );
  });
});

test.describe("Navigation Intelligente - Cas limites", () => {
  test("Navigation rapide successive", async ({ page }) => {
    // 1. Navigation rapide
    await page.goto(`${BASE_URL}/workspace/date`);
    await page.goto(`${BASE_URL}/workspace/form`);
    await page.goto(`${BASE_URL}/workspace/date`);

    // 2. Vérifier qu'il n'y a pas de crash
    await expect(page.locator("body")).toBeVisible();

    // 3. Vérifier les logs
    const logs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    // 4. Doit avoir plusieurs logs de stratégie
    expect(logs.length).toBeGreaterThan(0);
  });

  test("URL invalide - Comportement par défaut", async ({ page }) => {
    // 1. Navigation vers URL invalide
    await page.goto(`${BASE_URL}/workspace/invalid`);

    // 2. Ne doit pas crasher
    await expect(page.locator("body")).toBeVisible();

    // 3. Vérifier les logs (doit utiliser preserve par défaut)
    const logs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    await page.reload();

    const strategyLog = logs.find((log) => log.includes("preserve"));
    expect(strategyLog).toBeTruthy();
  });

  test("Refresh page - Pas de reset", async ({ page }) => {
    // 1. Créer du contenu
    await page.goto(`${BASE_URL}/workspace/form`);
    await page.fill('[data-testid="chat-input"]', "Contenu à préserver au refresh");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Refresh (F5)
    await page.reload();

    // 3. Vérifier que le contenu est préservé
    await expect(page.locator('[data-testid="chat-messages"]')).not.toHaveCount(0);

    // 4. Ne doit pas y avoir de logs de reset (refresh ne déclenche pas de navigation)
    const logs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    // Attendre un peu
    await page.waitForTimeout(1000);

    // Le refresh ne doit pas déclencher de logs de navigation
    const navigationLogs = logs.filter((log) => log.includes("reset"));
    expect(navigationLogs).toHaveLength(0);
  });
});
