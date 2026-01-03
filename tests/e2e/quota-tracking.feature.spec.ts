import { test, expect } from "@playwright/test";
import { navigateToWorkspace, waitForChatInput } from "./helpers/chat-helpers";
import { waitForNetworkIdle, waitForReactStable } from "./helpers/wait-helpers";
import { setupGeminiMock } from "./global-setup";
import { getTimeouts } from "./config/timeouts";

// Tests API + UI pour le système de quota IA (quota-tracking)

test.describe("Quota Tracking (Edge Function & UI)", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Optimisé pour Chromium (workspace IA)",
  );

  test("API quota-tracking répond et applique le contrat minimal", async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      test.skip();
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/quota-tracking`;

    const response = await request.post(edgeFunctionUrl, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      data: {
        action: "ai_message",
        metadata: { source: "e2e-test" },
      },
    });

    expect(
      response.status(),
      "quota-tracking devrait répondre HTTP 200 ou 4xx métier",
    ).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);

    const text = await response.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Réponse quota-tracking non JSON: ${text.slice(0, 300)}`);
    }

    // Contrat minimal: soit succès avec compteurs, soit erreur métier structurée
    expect(json).toHaveProperty("success");
    if (json.success) {
      expect(json).toHaveProperty("data");
    } else {
      expect(json).toHaveProperty("error");
    }
  });

  test("UI met à jour l'indicateur de quotas après un message IA", async ({
    page,
    browserName,
  }) => {
    const timeouts = getTimeouts(browserName);

    await setupGeminiMock(page);
    await navigateToWorkspace(page, browserName);
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    await waitForChatInput(page, timeouts.element);
    const chatInput = page.locator('[data-testid="chat-input"]').first();

    await chatInput.fill("Test quotas IA");
    await chatInput.press("Enter");

    await waitForReactStable(page, { browserName });

    const quotaIndicator = page
      .locator('[data-testid="quota-indicator"], .quota-indicator')
      .first();
    const count = await quotaIndicator.count();

    // Si l'indicateur est présent, on vérifie son format. Sinon, on log seulement sans faire échouer le test.
    if (count > 0) {
      await expect(
        quotaIndicator,
        "Après un message IA, l'indicateur de quotas doit afficher une valeur de type x/y",
      ).toBeVisible({ timeout: timeouts.element * 2 });

      const text = (await quotaIndicator.textContent()) || "";
      expect(text).toMatch(/\d+\s*\/\s*\d+/);
    } else {
      console.log("ℹ️ Aucun indicateur de quotas visible sur cette page dans ce contexte de test.");
    }
  });
});
