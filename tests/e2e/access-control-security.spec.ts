import { test, expect } from "@playwright/test";

test.describe("Access Control - Security Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer localStorage avant chaque test
    await page.goto("http://localhost:8080/DooDates");
    await page.evaluate(() => localStorage.clear());
  });

  test("should protect admin endpoints from unauthorized access", async ({ page }) => {
    // Tenter d'accéder à une page admin sans être authentifié
    await page.goto("http://localhost:8080/DooDates/admin");

    // Vérifier qu'on est redirigé vers login ou page d'erreur
    await expect(page.url()).toMatch(/(login|signin|auth)/);

    // Vérifier qu'il n'y a pas accès à l'interface admin
    const adminElements = await page.locator('[data-testid*="admin"]').count();
    expect(adminElements).toBe(0);
  });

  test("should protect poll creation from guests when required", async ({ page }) => {
    // Simuler un utilisateur non authentifié
    await page.goto("http://localhost:8080/DooDates");

    // Tenter de naviguer vers création de sondage
    await page.fill('[data-testid="chat-input"]', "Crée un sondage date pour demain");
    await page.click('[data-testid="send-message-button"]');

    // Attendre la réponse et vérifier si authentification requise
    await page.waitForTimeout(2000);

    // Vérifier que le système demande l'authentification
    const authRequired = await page.locator('[data-testid="auth-required"]').count();
    const signInButton = await page.locator('[data-testid="sign-in"]').count();

    // Au moins l'un des deux doit être présent
    expect(authRequired + signInButton).toBeGreaterThan(0);
  });

  test("should protect poll deletion from non-owners", async ({ page }) => {
    // Créer un sondage en tant que "créateur"
    await page.goto("http://localhost:8080/DooDates");

    // Simuler création d'un sondage
    await page.fill('[data-testid="chat-input"]', "Crée un sondage date pour test de sécurité");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(3000);

    // Simuler un autre utilisateur (vider localStorage)
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Tenter d'accéder à la page de suppression
    const currentUrl = page.url();
    const pollId = currentUrl.match(/\/([^\/]+)$/)?.[1];

    if (pollId) {
      await page.goto(`http://localhost:8080/DooDates/poll/${pollId}/delete`);

      // Vérifier que l'accès est refusé
      const accessDenied = await page.locator('[data-testid="access-denied"]').count();
      const deleteButton = await page.locator('[data-testid="delete-poll"]').count();

      expect(accessDenied).toBeGreaterThan(0);
      expect(deleteButton).toBe(0);
    }
  });

  test("should protect API endpoints from direct access", async ({ page }) => {
    // Tenter d'accéder directement à un endpoint API
    const response = await page.goto("http://localhost:8080/DooDates/api/polls");

    // Vérifier que l'endpoint est protégé
    if (response) {
      const status = response.status();
      expect(status).toBe(401); // Unauthorized
    }
  });

  test("should handle session expiration gracefully", async ({ page }) => {
    // Simuler une session expirée
    await page.goto("http://localhost:8080/DooDates");

    // Simuler une session expirée en vidant localStorage
    await page.evaluate(() => {
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("user_session");
    });

    // Tenter une action qui nécessite l'authentification
    await page.fill('[data-testid="chat-input"]', "Montre mes sondages");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(2000);

    // Vérifier que le système gère la session expirée
    const sessionExpired = await page.locator('[data-testid="session-expired"]').count();
    const signInPrompt = await page.locator('[data-testid="sign-in"]').count();

    expect(sessionExpired + signInPrompt).toBeGreaterThan(0);
  });

  test("should prevent XSS in user inputs", async ({ page }) => {
    await page.goto("http://localhost:8080/DooDates");

    // Tenter d'injecter du code XSS
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('[data-testid="chat-input"]', xssPayload);
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(2000);

    // Vérifier que le script ne s'exécute pas
    // En vérifiant que le contenu est échappé/sanitisé
    const chatMessages = await page.locator('[data-testid="chat-messages"]').textContent();
    expect(chatMessages).not.toContain("<script>");
    expect(chatMessages).not.toContain('alert("XSS")');
  });

  test("should validate user permissions for poll access", async ({ page }) => {
    // Test des permissions basées sur le rôle utilisateur
    await page.goto("http://localhost:8080/DooDates");

    // Simuler un utilisateur guest
    await page.evaluate(() => {
      localStorage.setItem("user_role", "guest");
    });

    // Tenter d'accéder à une fonctionnalité restreinte
    await page.fill('[data-testid="chat-input"]', "Montre les paramètres admin");
    await page.click('[data-testid="send-message-button"]');
    await page.waitForTimeout(2000);

    // Vérifier que l'accès est refusé
    const restrictedAccess = await page.locator('[data-testid="restricted-access"]').count();
    expect(restrictedAccess).toBeGreaterThan(0);
  });
});
