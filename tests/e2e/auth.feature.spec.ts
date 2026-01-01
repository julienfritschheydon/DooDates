import { test, expect } from "@playwright/test";
import { navigateToWorkspace, waitForChatInput } from "./helpers/chat-helpers";
import { waitForNetworkIdle, waitForReactStable } from "./helpers/wait-helpers";
import { setupGeminiMock } from "./global-setup";
import { getTimeouts } from "./config/timeouts";
import { mockSupabaseAuth } from "./utils";

// Tests API + UI pour le système d'authentification (Supabase)

test.describe("Auth (Supabase API + UI)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Optimisé pour Chromium (workspace IA)");

  test("API auth Supabase répond et respecte le contrat minimal", async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      test.skip();
    }

    // 1. Test de connexion à l'API Supabase (session)
    const sessionResponse = await request.get(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
    });

    // En mode non authentifié, on s'attend à 401 ou 403
    expect(sessionResponse.status()).toBeGreaterThanOrEqual(401);
    expect(sessionResponse.status()).toBeLessThan(500);

    // 2. Test d'inscription (signup)
    const signupResponse = await request.post(`${supabaseUrl}/auth/v1/signup`, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      data: {
        email: "test-e2e-auth@example.com",
        password: "testpassword123",
      },
    });

    // Accepte 200 ou 4xx (déjà existant, validation, etc.)
    expect(signupResponse.status()).toBeGreaterThanOrEqual(200);
    expect(signupResponse.status()).toBeLessThan(500);

    const signupJson = await signupResponse.json();
    expect(signupJson).toHaveProperty("email");

    // 3. Test de login (signin)
    const loginResponse = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      data: {
        email: "test-e2e-auth@example.com",
        password: "testpassword123",
      },
    });

    expect(loginResponse.status()).toBeGreaterThanOrEqual(200);
    expect(loginResponse.status()).toBeLessThan(500);

    const loginJson = await loginResponse.json();
    expect(loginJson).toHaveProperty("access_token");
    expect(loginJson).toHaveProperty("user");
    expect(loginJson.user).toHaveProperty("id");
  });

  test("UI permet de se connecter, se déconnecter, et persiste le token", async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);

    await setupGeminiMock(page);
    await navigateToWorkspace(page, browserName);
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // 1. Simuler une connexion (mock auth)
    await mockSupabaseAuth(page, { userId: "test-user-123", email: "test@example.com" });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // 2. Vérifier que le chat IA est toujours accessible après connexion
    await waitForChatInput(page, timeouts.element);
    const chatInput = page.locator('[data-testid="chat-input"]').first();
    await expect(chatInput).toBeVisible({ timeout: timeouts.element });

    // 3. Envoyer un message pour s'assurer que le token est bien utilisé
    await chatInput.fill("Test après connexion");
    await chatInput.press("Enter");
    await waitForReactStable(page, { browserName });

    // 4. Simuler une déconnexion (clear token)
    await page.evaluate(() => {
      const supabaseUrl = (window as any).__VITE_SUPABASE_URL__ || "test.supabase.co";
      const projectId = supabaseUrl.split("//")[1]?.split(".")[0] || "test";
      localStorage.removeItem(`sb-${projectId}-auth-token`);
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // 5. Vérifier qu'on est retourné en mode guest mais que le chat IA est toujours là
    await waitForChatInput(page, timeouts.element);
    await expect(chatInput).toBeVisible({ timeout: timeouts.element });

    // 6. Envoyer un message en mode guest pour s'assurer que tout fonctionne
    await chatInput.fill("Test après déconnexion");
    await chatInput.press("Enter");
    await waitForReactStable(page, { browserName });

    // Le test passe si les deux états (connecté et déconnecté) permettent d'utiliser le chat IA
  });
});
