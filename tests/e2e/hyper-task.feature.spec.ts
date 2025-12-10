import { test, expect } from "@playwright/test";
import { setupGeminiMock } from "./global-setup";
import { waitForNetworkIdle, waitForReactStable } from "./helpers/wait-helpers";
import { navigateToWorkspace, waitForChatInput } from "./helpers/chat-helpers";
import { getTimeouts } from "./config/timeouts";

// Tests combinés API + UI pour l'Edge Function hyper-task (Gemini)
// Étape 1: Test API pur pour vérifier que l'endpoint répond correctement
// Étape 2: Test UI miroir pour vérifier que l'interface consomme correctement cette API

test.describe("Hyper-task (Edge Function Gemini)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Optimisé pour Chromium (workspace IA)");

  test("API hyper-task répond correctement pour un prompt simple", async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      test.skip();
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/hyper-task`;

    const response = await request.post(edgeFunctionUrl, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      data: {
        userInput: "Organise une réunion lundi matin",
      },
    });

    expect(response.status(), "hyper-task devrait répondre HTTP 200 pour un prompt simple").toBe(200);

    const bodyText = await response.text();

    let json: any;
    try {
      json = JSON.parse(bodyText);
    } catch {
      throw new Error(`Réponse hyper-task non JSON: ${bodyText.slice(0, 300)}`);
    }

    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(typeof json.data).toBe("string");
    expect(json.data.length).toBeGreaterThan(0);
  });

  test("UI consomme hyper-task correctement pour un prompt simple", async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);

    // Pour ce test, on laisse l'Edge Function réelle répondre (pas de route() spécifique ici)
    // mais on mock les autres appels Gemini externes pour rester stable et éviter le coût API Google.
    await setupGeminiMock(page);

    // Naviguer vers le workspace IA via le helper partagé (même flux que les autres tests Gemini)
    await navigateToWorkspace(page, browserName);
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // Récupérer l'input du chat IA via le data-testid standard
    await waitForChatInput(page, timeouts.element * 2);
    const chatInput = page.locator('[data-testid="chat-input"]').first();

    await chatInput.fill("Organise une réunion lundi matin");
    await chatInput.press("Enter");

    // Attendre que la réponse IA soit rendue
    await waitForReactStable(page, { browserName });

    const messagesContainer = page.getByTestId("chat-messages");
    await expect(
      messagesContainer,
      "L'UI devrait afficher au moins un message IA après l'appel hyper-task (si le test API du même fichier passe)",
    ).toContainText(/réunion|agenda|date|poll|sondage/i, { timeout: timeouts.element * 3 });
  });
});
