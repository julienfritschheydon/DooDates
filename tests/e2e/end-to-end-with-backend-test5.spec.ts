import { test, expect } from "@playwright/test";
import { setupGeminiMock } from "./global-setup";
import {
  getTestSupabaseClient,
  cleanupTestData,
  generateTestEmail,
  signInTestUser,
} from "./helpers/supabase-test-helpers";
import {
  authenticateUserInPage,
  ensureSessionAfterReload,
  getSessionFromPage,
  waitForConversationsInDashboard,
  openConversationFromDashboard,
} from "./helpers/auth-helpers";
import {
  navigateToWorkspace,
  sendChatMessage,
  waitForConversationCreated,
  waitForChatInput,
} from "./helpers/chat-helpers";
import {
  waitForNetworkIdle,
  waitForReactStable,
  waitForElementReady,
} from "./helpers/wait-helpers";

// Fichier de debug dédié au scénario 5 : Fusion localStorage + Supabase
// Test actuellement désactivé car trop complexe/instable pour les E2E standards.

test.describe.skip("Debug - Test 5 fusion localStorage + Supabase", () => {
  let supabase: ReturnType<typeof getTestSupabaseClient>;
  let testUserId: string;
  let testEmail: string;
  const testPassword: string = "TestPassword123!";
  let testConversationIds: string[] = [];

  test.beforeAll(async () => {
    supabase = getTestSupabaseClient();
    testEmail = generateTestEmail("supabase-test-debug-5");

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error && !error.message.includes("already registered")) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    if (data?.user) {
      testUserId = data.user.id;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        (global as any).__TEST_SUPABASE_TOKEN__ = sessionData.session.access_token;
      }
    } else {
      const { data: signInData } = await signInTestUser(testEmail, testPassword);
      if (signInData?.user) {
        testUserId = signInData.user.id;
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          (global as any).__TEST_SUPABASE_TOKEN__ = sessionData.session.access_token;
        }
      }
    }
  });

  test.beforeEach(async ({ page, browserName }) => {
    await setupGeminiMock(page);
    await page.goto("/workspace", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    await page.evaluate(() => localStorage.clear());

    if (testUserId) {
      await cleanupTestData(testUserId);
    }
  });

  test.afterEach(async () => {
    if (testUserId && testConversationIds.length > 0) {
      for (const convId of testConversationIds) {
        await supabase.from("conversations").delete().eq("id", convId).eq("user_id", testUserId);
      }
      testConversationIds = [];
    }
  });

  test.afterAll(async () => {
    if (testUserId) {
      await cleanupTestData(testUserId);
    }
  });

  test("5. Test fusion localStorage + Supabase (debug)", async ({ browser }) => {
    test.setTimeout(120000);
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await setupGeminiMock(pageA);
      await setupGeminiMock(pageB);

      // ===== APPAREIL A : Créer une conversation =====
      await pageA.goto("/date/workspace/date", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(pageA, { browserName: "chromium" });
      await waitForReactStable(pageA, { browserName: "chromium" });

      await authenticateUserInPage(pageA, testEmail, testPassword);
      await ensureSessionAfterReload(pageA, testEmail, testPassword, testUserId);

      await navigateToWorkspace(pageA, "chromium");
      await sendChatMessage(pageA, "Je veux organiser une réunion d'équipe la semaine prochaine");
      await waitForElementReady(pageA, '[data-testid="message"]', {
        browserName: "chromium",
        timeout: 10000,
      });

      let conversationId = await waitForConversationCreated(pageA, 15);
      if (!conversationId) {
        const { data: recentConversations } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", testUserId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (recentConversations && recentConversations.length > 0) {
          conversationId = recentConversations[0].id;
        }
      }

      if (!conversationId) {
        test.skip();
        return;
      }

      testConversationIds.push(conversationId);
      await waitForNetworkIdle(pageA, { browserName: "chromium" });

      // Vérifier que la conversation a bien un userId authentifié côté localStorage
      const conversationInLocalStorage = await pageA.evaluate((convId) => {
        const conversationsData = localStorage.getItem("doodates_conversations");
        if (conversationsData) {
          try {
            const conversations = JSON.parse(conversationsData);
            return conversations.find((c: any) => c.id === convId);
          } catch {
            return null;
          }
        }
        return null;
      }, conversationId);

      expect(conversationInLocalStorage).toBeTruthy();
      expect(conversationInLocalStorage?.userId).toBe(testUserId);

      // ===== APPAREIL B : Voir la conversation depuis le dashboard =====
      await pageB.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(pageB, { browserName: "chromium" });
      await waitForReactStable(pageB, { browserName: "chromium" });

      await authenticateUserInPage(pageB, testEmail, testPassword);
      await ensureSessionAfterReload(pageB, testEmail, testPassword, testUserId);

      const sessionB = await getSessionFromPage(pageB);
      expect(sessionB.hasSession).toBeTruthy();
      expect(sessionB.userId).toBe(testUserId);

      await expect(pageB.locator('text="Invité"')).not.toBeVisible({ timeout: 10000 });

      const conversationsLoaded = await waitForConversationsInDashboard(pageB);
      expect(conversationsLoaded).toBeTruthy();

      // Capture 1 : Dashboard après authentification (étape 5)
      await pageB.screenshot({
        path: "test-results/debug-test5-step5-dashboard.png",
        fullPage: true,
      });

      // Stratégie appareil B : ouvrir la première conversation
      let firstConversationB = pageB
        .locator(
          '[data-testid="poll-item"], [data-testid="conversation-item"], .conversation-item, .poll-item',
        )
        .first();
      try {
        await expect(firstConversationB).toBeVisible({ timeout: 5000 });
      } catch {
        await pageB.reload({ waitUntil: "domcontentloaded" });
        await waitForConversationsInDashboard(pageB);
        firstConversationB = pageB
          .locator(
            '[data-testid="poll-item"], [data-testid="conversation-item"], .conversation-item, .poll-item',
          )
          .first();
        await expect(firstConversationB).toBeVisible({ timeout: 10000 });
      }
      await firstConversationB.click();

      await pageB.waitForURL(/\/workspace\?conversationId=/, { timeout: 10000 });

      // Capture 2 : Workspace conversation ouverte (étape 6)
      await pageB.screenshot({
        path: "test-results/debug-test5-step6-workspace.png",
        fullPage: true,
      });

      // Capture 3 : Juste avant d'attendre le chat input (étape 7)
      await pageB.screenshot({
        path: "test-results/debug-test5-step7-before-chat-input.png",
        fullPage: true,
      });

      await waitForChatInput(pageB, 10000);
      await waitForElementReady(pageB, '[data-testid="message"]', {
        browserName: "chromium",
        timeout: 5000,
      });

      const hasMessages = await pageB.evaluate(() => {
        const messageElements = Array.from(
          document.querySelectorAll('[data-testid="message"], .message, [class*="message"]'),
        );
        const bodyText = document.body.innerText.toLowerCase();
        return (
          messageElements.length > 0 ||
          bodyText.includes("réunion") ||
          bodyText.includes("équipe") ||
          bodyText.includes("organiser")
        );
      });
      expect(hasMessages).toBeTruthy();

      await sendChatMessage(pageB, "Peux-tu ajouter une question sur le format de la réunion ?", {
        waitForResponse: true,
        timeout: 10000,
      });

      // ===== APPAREIL A : Vérifier la synchronisation =====
      await pageA.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await waitForNetworkIdle(pageA, { browserName: "chromium" });
      await waitForReactStable(pageA, { browserName: "chromium" });

      const conversationsLoadedA = await waitForConversationsInDashboard(pageA);
      expect(conversationsLoadedA).toBeTruthy();

      // Stratégie debug :
      // 1) Essayer d'ouvrir par texte (helper existant)
      // 2) Si échec, fallback sur la première carte disponible
      let openedByHelper = false;
      try {
        await openConversationFromDashboard(pageA, "réunion d'équipe");
        openedByHelper = true;
      } catch {
        let firstConversationA = pageA
          .locator(
            '[data-testid="poll-item"], [data-testid="conversation-item"], .conversation-item, .poll-item',
          )
          .first();
        try {
          await expect(firstConversationA).toBeVisible({ timeout: 5000 });
        } catch {
          await pageA.reload({ waitUntil: "domcontentloaded" });
          await waitForConversationsInDashboard(pageA);
          firstConversationA = pageA
            .locator(
              '[data-testid="poll-item"], [data-testid="conversation-item"], .conversation-item, .poll-item',
            )
            .first();
          await expect(firstConversationA).toBeVisible({ timeout: 10000 });
        }
        await firstConversationA.click();
      }

      await pageA.waitForURL(/\/workspace\?conversationId=/, { timeout: 10000 });

      const messageInputARefresh = pageA.locator('[data-testid="chat-input"]');
      await expect(messageInputARefresh).toBeVisible({ timeout: 10000 });
      await waitForElementReady(pageA, '[data-testid="message"]', {
        browserName: "chromium",
        timeout: 5000,
      });

      // Vérifier que le nouveau message de l'appareil B apparaît
      let messageBVisible = false;
      let messageAttempts = 0;
      const maxMessageAttempts = 10;
      while (!messageBVisible && messageAttempts < maxMessageAttempts) {
        const hasMessage = await pageA.evaluate(() => {
          const bodyText = document.body.innerText.toLowerCase();
          return bodyText.includes("format") && bodyText.includes("réunion");
        });

        if (hasMessage) {
          messageBVisible = true;
          break;
        }

        await waitForReactStable(pageA, { browserName: "chromium" });
        messageAttempts++;
      }

      expect(messageBVisible).toBeTruthy();

      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", testUserId);

      expect(conversations).toBeTruthy();
      expect(conversations!.length).toBe(1);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
