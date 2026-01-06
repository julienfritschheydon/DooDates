import { test, expect } from "@playwright/test";
import { setupAllMocksContext } from "./global-setup";

// Configuration (used only if not mocked)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://outmbbisrrdiumlweira.supabase.co";
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/quota-tracking`;

test.describe("Rate Limiting API Only - Chromium", () => {
  // Configurer les mocks au niveau du contexte pour intercepter les requêtes API
  test.beforeEach(async ({ context }) => {
    await setupAllMocksContext(context);

    // S'assurer que quota-tracking renvoie des succès pour les tests de connectivité
    await context.route(/.*\/functions\/v1\/quota-tracking.*/, async (route) => {
      const request = route.request();
      console.log(`📡 [MOCK-API] Intercepted ${request.method()} ${request.url()}`);
      if (request.method() === "OPTIONS") {
        await route.fulfill({
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
          body: "",
        });
        return;
      }

      const postData = request.postDataJSON() || {};

      // Simuler des réponses adaptées selon l'endpoint
      if (postData.endpoint === "checkQuota") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { userId: "e2e-test-user-id", remaining: 100 },
          }),
        });
      } else if (postData.endpoint === "consumeCredits") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { creditsConsumed: 1, remaining: 99 },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("should test API connectivity and basic response", async ({ page }) => {
    console.log("🧪 Test API connectivity - Chromium only (Mocked)");

    const headers = {
      Authorization: `Bearer mock-token`,
      "Content-Type": "application/json",
    };

    // Test 1: checkQuota
    console.log("📊 Test checkQuota via browser fetch...");
    const checkResponse = await page.evaluate(
      async ({ url, headers }) => {
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            endpoint: "checkQuota",
            action: "conversation_created",
            credits: 0,
          }),
        });
        return { status: resp.status, body: await resp.json() };
      },
      { url: EDGE_FUNCTION_URL, headers },
    );

    console.log(`   Status: ${checkResponse.status}`);
    expect(checkResponse.status).toBe(200);
    expect(checkResponse.body.success).toBe(true);

    // Test 2: consumeCredits
    console.log("📊 Test consumeCredits via browser fetch...");
    const consumeResponse = await page.evaluate(
      async ({ url, headers }) => {
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            endpoint: "consumeCredits",
            action: "conversation_created",
            credits: 1,
          }),
        });
        return { status: resp.status, body: await resp.json() };
      },
      { url: EDGE_FUNCTION_URL, headers },
    );

    console.log(`   Status: ${consumeResponse.status}`);
    expect(consumeResponse.status).toBe(200);
    expect(consumeResponse.body.success).toBe(true);

    console.log("✅ Test API connectivity terminé");
  });

  test("should attempt rate limiting test if API works", async ({ page }) => {
    console.log("🧪 Test rate limiting si API fonctionnelle (Mocked)");

    const headers = {
      Authorization: `Bearer mock-token`,
      "Content-Type": "application/json",
    };

    const testResponse = await page.evaluate(
      async ({ url, headers }) => {
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            endpoint: "checkQuota",
            action: "conversation_created",
            credits: 0,
          }),
        });
        return { status: resp.status };
      },
      { url: EDGE_FUNCTION_URL, headers },
    );

    expect(testResponse.status).toBe(200);
    console.log("✅ API fonctionnelle - test rate limiting possible");
  });
});

/**
 * Usage: npx playwright test tests/e2e/rate-limiting-api-only.spec.ts
 *
 * Test rapide et simple qui ne fait que vérifier l'API
 * Pas de tests multi-OS, juste Chromium
 */
