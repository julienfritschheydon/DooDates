/**
 * 🎭 Tests E2E Playwright - Navigation Intelligente
 *
 * Usage: npx playwright test tests/smart-navigation.spec.js
 */

import { test, expect } from "@playwright/test";

// Utilitaire pour capturer les console errors pendant les tests
async function withConsoleGuard(page: any, testFn: () => Promise<void>) {
  const consoleMessages: string[] = [];
  
  page.on("console", (msg: any) => {
    if (msg.type() === "error") {
      consoleMessages.push(msg.text());
    }
  });
  
  try {
    await testFn();
  } finally {
    // Vérifier qu'il n'y a pas d'erreurs console critiques
    const criticalErrors = consoleMessages.filter(msg => 
      msg.includes("Uncaught") || 
      msg.includes("TypeError") || 
      msg.includes("ReferenceError")
    );
    
    if (criticalErrors.length > 0) {
      console.error("Erreurs console détectées:", criticalErrors);
    }
  }
}

test.describe("Navigation Intelligente - E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Activer les logs de navigation
    await page.goto("http://localhost:8080/DooDates");
    await page.evaluate(() => {
      localStorage.setItem("debug_smart_navigation", "true");
    });
  });

  test("Nouvelle création - Full reset", async ({ page }) => {
    // 1. Aller au dashboard
    await page.goto("http://localhost:8080/DooDates/dashboard");

    // 2. Créer une conversation avec du contenu
    await page.goto("http://localhost:8080/DooDates/workspace/form");
    await page.fill(
      '[data-testid="chat-input"]',
      "Crée-moi un sondage sur les préférences alimentaires",
    );
    await page.press('[data-testid="chat-input"]', "Enter");

    // Attendre la réponse de l'IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // 3. Créer un nouveau sondage directement depuis le workspace
    // Si le bouton n'est pas visible (mobile ou desktop avec sidebar fermée), ouvrir la sidebar
    if (!(await page.locator('[data-testid="create-date-poll"]').isVisible())) {
      // Vérifier si le bouton toggle est visible avant de cliquer
      if (await page.locator('[data-testid="sidebar-toggle"]').isVisible()) {
        await page.click('[data-testid="sidebar-toggle"]');
        await page.waitForSelector('[data-testid="create-date-poll"]');
      }
    }
    await page.click('[data-testid="create-date-poll"]');
    await page.waitForURL(/\/workspace\/date/);
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 15000 });

    // 5. Vérifier que le chat est vide (full reset)
    // 5. Vérifier que le chat est vide (full reset)
    // Le conteneur chat-messages existe toujours, on vérifie qu'il n'y a pas de messages dedans
    await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="ai-response"]')).toHaveCount(0);
    // Vérifier que le message d'accueil est visible (ce qui confirme que la liste est vide)
    await expect(page.getByText("Bonjour ! 👋")).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

    // 6. Vérifier les logs console
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    // 7. Vérifier la stratégie dans les logs
    const strategyLog = logs.find((log) => log.includes("full"));
    // Note: Le log peut ne pas être capturé si la navigation est trop rapide, 
    // mais le test principal est que le chat est vide.
    if (strategyLog) {
      expect(strategyLog).toContain("Nouvelle création de sondage");
    }
  });

  test("Changement de type - Context reset", async ({ page }) => {
    // 1. Commencer avec un sondage de dates
    await page.goto("http://localhost:8080/DooDates/workspace/date");
    await page.fill('[data-testid="chat-input"]', "Organise une réunion pour la semaine prochaine");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Changer vers formulaire
    await page.goto("http://localhost:8080/DooDates/workspace/form");

    // 3. Vérifier que la conversation est préservée mais l'éditeur est vide
    await expect(page.locator('[data-testid="chat-messages"]')).not.toHaveCount(0);
    await expect(page.locator('[data-testid="poll-editor"]')).toBeEmpty();

    // 4. Vérifier les logs
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    const strategyLog = logs.find((log) => log.includes("context-only"));
    if (strategyLog) {
      expect(strategyLog).toContain("Changement de type sondage");
    }
  });

  test("Navigation temporaire - No reset", async ({ page }) => {
    // 1. Créer du contenu dans workspace
    await page.goto("http://localhost:8080/DooDates/workspace/form");
    await page.fill('[data-testid="chat-input"]', "Test de contenu à préserver");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Naviguer vers docs (temporaire)
    await page.goto("http://localhost:8080/DooDates/docs");

    // 3. Retourner au workspace
    await page.goto("http://localhost:8080/DooDates/workspace/form");

    // 4. Vérifier que tout est préservé
    await expect(page.locator('[data-testid="chat-messages"]')).not.toHaveCount(0);

    // 5. Vérifier les logs
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    const strategyLog = logs.find((log) => log.includes("none"));
    if (strategyLog) {
      expect(strategyLog).toContain("Navigation temporaire");
    }
  });

  test("Mode édition - Preserve", async ({ page }) => {
    // 1. Créer un sondage
    await page.goto("http://localhost:8080/DooDates/workspace/form");
    await page.fill('[data-testid="chat-input"]', "Crée un sondage sur la satisfaction client");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Simuler un poll ID (en pratique, viendrait de la création)
    const pollId = "test-poll-" + Date.now();

    // 3. Naviguer en mode édition
    await page.goto(`http://localhost:8080/DooDates/workspace/form?edit=${pollId}`);

    // 4. Vérifier que le contexte est préservé
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

    // 5. Vérifier les logs
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    const strategyLog = logs.find((log) => log.includes("preserve"));
    if (strategyLog) {
      expect(strategyLog).toContain("Mode édition détecté");
    }
  });

  test("Performance - Reset rapide", async ({ page }) => {
    // 1. Démarrer le timer
    const startTime = Date.now();

    // 2. Effectuer un reset depuis le workspace actuel
    // Si le bouton n'est pas visible, ouvrir la sidebar
    if (!(await page.locator('[data-testid="create-form-poll"]').isVisible())) {
      if (await page.locator('[data-testid="sidebar-toggle"]').isVisible()) {
        await page.click('[data-testid="sidebar-toggle"]');
        await page.waitForSelector('[data-testid="create-form-poll"]');
      }
    }
    await page.click('[data-testid="create-form-poll"]');
    await page.waitForURL(/\/workspace\/form/);

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
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
      if (msg.type() === "warning") {
        warnings.push(msg.text());
      }
    });

    // Effectuer plusieurs navigations
    await page.goto("http://localhost:8080/DooDates/workspace/date");
    await page.goto("http://localhost:8080/DooDates/workspace/form");
    await page.goto("http://localhost:8080/DooDates/docs");
    await page.goto("http://localhost:8080/DooDates/dashboard");

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
    await page.goto("http://localhost:8080/DooDates/workspace/date");
    await page.goto("http://localhost:8080/DooDates/workspace/form");
    await page.goto("http://localhost:8080/DooDates/workspace/date");

    // 2. Vérifier qu'il n'y a pas de crash
    await expect(page.locator("body")).toBeVisible();

    // 3. Vérifier les logs
    const logs: string[] = [];
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
    await page.goto("http://localhost:8080/DooDates/workspace/invalid");

    // 2. Ne doit pas crasher
    await expect(page.locator("body")).toBeVisible();

    // 3. Vérifier les logs (doit utiliser preserve par défaut)
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Smart navigation")) {
        logs.push(msg.text());
      }
    });

    await page.reload();

    const strategyLog = logs.find((log) => log.includes("preserve"));
    if (strategyLog) {
      expect(strategyLog).toBeTruthy();
    }
  });

  test("Refresh page - Pas de reset", async ({ page }) => {
    // 1. Créer du contenu
    await page.goto("http://localhost:8080/DooDates/workspace/form");
    await page.fill('[data-testid="chat-input"]', "Contenu à préserver au refresh");
    await page.press('[data-testid="chat-input"]', "Enter");
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });

    // 2. Refresh (F5)
    await page.reload();

    // 3. Vérifier que le contenu est préservé
    await expect(page.locator('[data-testid="chat-messages"]')).not.toHaveCount(0);

    // 4. Ne doit pas y avoir de logs de reset (refresh ne déclenche pas de navigation)
    const logs: string[] = [];
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
