import { test, expect } from "@playwright/test";
import { navigateToWorkspace } from "./helpers/chat-helpers";
import { setupGeminiMock } from "./global-setup";
import {
  waitForChatInputReady,
  waitForNetworkIdle,
  waitForReactStable,
} from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";

// E2E UI test: vérifier que lorsque l'Edge hyper-task renvoie une erreur de type RATE_LIMIT,
// l'interface affiche bien le message utilisateur approprié via SecureGeminiService.

test.describe("🔒 E2E - Rate limiting UI (hyper-task)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Optimisé pour Chromium");

  test("RATE-E2E-01: Message RATE_LIMIT de l'Edge affiche le message UI attendu", async ({
    page,
    browserName,
  }) => {
    const timeouts = getTimeouts(browserName);

    // Intercepter l'Edge Function hyper-task pour simuler une réponse RATE_LIMIT
    await page.route("**/functions/v1/hyper-task", async (route) => {
      const request = route.request();
      const body = request.postDataJSON?.() ?? {};

      // On laisse passer un premier appel "OK" si besoin, puis on renvoie une erreur de rate limit
      // Pour simplifier, on renvoie directement RATE_LIMIT pour tout appel de génération de contenu.
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "RATE_LIMIT",
          message: "RATE_LIMIT: Too many requests",
        }),
      });
    });

    // Setup standard Gemini mock pour les autres endpoints Google (comme dans les autres tests)
    await setupGeminiMock(page);

    // Aller sur le workspace avec le flag e2e-test (route racine pour éviter la 404)
    // Aller sur le workspace avec le flag e2e-test (route racine pour éviter la 404)
    await navigateToWorkspace(page, browserName, "default", {
      // Pass e2e flag if supported, otherwise normal navigation
      // navigateToWorkspace internally might set some flags or we can append query params if needed
      // But standard navigateToWorkspace should be safer.
      // Retaining explicit query logic might be tricky if navigateToWorkspace doesn't support params.
      // Let's assume generic workspace is fine, or check if we can pass options.
      // navigateToWorkspace signature: (page, browserName, type, options)
      // options keys: addE2EFlag, waitUntil, waitForChat
    });
    // Re-navigating with query param if needed, but navigateToWorkspace likely handles basic readiness.
    // If e2e-test=true is critical for rate limit mocking (it shouldn't be, mocks are setup via route),
    // then we might need to be careful. usage of e2e-test param is usually for frontend flags.
    // Let's trust navigateToWorkspace defaults for now.
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // Récupérer l"input du chat IA
    const chatInput = await waitForChatInputReady(page, browserName, {
      timeout: timeouts.element * 2,
    });

    await chatInput.fill("Teste le rate limiting IA");
    await chatInput.press("Enter");

    // Attendre la stabilisation après la réponse (erreur)
    await waitForReactStable(page, { browserName });

    // Vérifier qu'un message d'erreur utilisateur correspondant au rate limit est affiché
    // On cherche le texte exact utilisé par SecureGeminiService
    const errorLocator = page.getByText(
      "Trop de requêtes. Veuillez patienter avant de réessayer.",
      { exact: false },
    );

    await expect(errorLocator).toBeVisible({ timeout: timeouts.element * 3 });
  });
});
