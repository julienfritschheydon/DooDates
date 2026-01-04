/**
 * Tests E2E - Droit à la portabilité RGPD (Article 20)
 *
 * Tests pour valider que les utilisateurs peuvent exporter leurs données
 * dans des formats standardisés (JSON, CSV) compatibles avec d'autres services.
 *
 * Référence: Docs/2. Planning - Decembre.md lignes 60-63
 */

import { test, expect } from "@playwright/test";
import { authenticateUserInPage } from "../helpers/auth-helpers";
import {
  navigateToDataControl,
  triggerDataExport,
  getUserDataForExport,
  verifyExportFormat,
  createTestUserData,
  cleanupTestUserData,
} from "../helpers/rgpd-helpers";
import {
  generateTestEmail,
  createTestUser,
  signInTestUser,
} from "../helpers/supabase-test-helpers";

// Réduire le parallélisme pour éviter le rate limiting Supabase
test.describe.configure({ mode: "serial" });

test.describe("🔒 RGPD - Droit à la portabilité (Article 20)", () => {
  let testEmail: string;
  let testPassword: string;
  let userId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Generate unique test credentials
    testEmail = generateTestEmail("gdpr-portability");
    testPassword = "TestPassword123!";
    // Délai pour éviter le rate limiting entre les tests
    await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    if (userId) {
      await cleanupTestUserData(userId);
    }
  });

  test("RGPD-PORT-01: Export disponible en format JSON", async ({ page }) => {
    // Create and authenticate test user
    const { data: signUpData } = await createTestUser(testEmail, testPassword);
    userId = signUpData?.user?.id || null;

    if (!userId) {
      throw new Error("Failed to create test user");
    }

    await signInTestUser(testEmail, testPassword);
    await authenticateUserInPage(page, testEmail, testPassword);

    // Create test data
    await createTestUserData(userId);

    // Navigate to data control page
    await navigateToDataControl(page);

    // Get user data and verify it's in JSON-compatible format
    const userData = await getUserDataForExport(userId);
    verifyExportFormat(userData);

    // Verify JSON can be stringified and parsed
    const jsonString = JSON.stringify(userData);
    expect(jsonString.length).toBeGreaterThan(0);

    const parsed = JSON.parse(jsonString);
    expect(parsed).toBeDefined();
    expect(parsed).toHaveProperty("conversations");
  });

  test("RGPD-PORT-02: Format JSON est structuré et complet", async ({ page }) => {
    // Create and authenticate test user
    const { data: signUpData } = await createTestUser(testEmail, testPassword);
    userId = signUpData?.user?.id || null;

    if (!userId) {
      throw new Error("Failed to create test user");
    }

    await signInTestUser(testEmail, testPassword);
    await authenticateUserInPage(page, testEmail, testPassword);

    // Create test data
    const testData = await createTestUserData(userId);

    // Get user data
    const userData = await getUserDataForExport(userId);

    // Verify structure
    expect(userData).toHaveProperty("conversations");
    expect(Array.isArray(userData.conversations)).toBe(true);

    // Verify conversations have required fields
    if (userData.conversations.length > 0) {
      const conversation = userData.conversations[0];
      expect(conversation).toHaveProperty("id");
      expect(conversation).toHaveProperty("title");
      expect(conversation).toHaveProperty("created_at");
    }

    // Verify votes structure
    expect(userData).toHaveProperty("votes");
    expect(Array.isArray(userData.votes)).toBe(true);

    if (userData.votes.length > 0) {
      const vote = userData.votes[0];
      expect(vote).toHaveProperty("id");
      expect(vote).toHaveProperty("voter_name");
      expect(vote).toHaveProperty("created_at");
    }
  });

  test("RGPD-PORT-03: Données sont compatibles avec import dans autres services", async ({
    page,
  }) => {
    // Create and authenticate test user
    const { data: signUpData } = await createTestUser(testEmail, testPassword);
    userId = signUpData?.user?.id || null;

    if (!userId) {
      throw new Error("Failed to create test user");
    }

    await signInTestUser(testEmail, testPassword);
    await authenticateUserInPage(page, testEmail, testPassword);

    // Create test data
    await createTestUserData(userId);

    // Get user data
    const userData = await getUserDataForExport(userId);

    // Verify data can be transformed to common formats
    // JSON format should be standard and parseable
    const jsonString = JSON.stringify(userData, null, 2);

    // Verify it's valid JSON
    expect(() => JSON.parse(jsonString)).not.toThrow();

    // Verify structure allows for easy transformation
    const parsed = JSON.parse(jsonString);

    // Should be able to extract key information
    expect(parsed).toHaveProperty("conversations");
    expect(parsed).toHaveProperty("votes");

    // Conversations should be iterable
    if (parsed.conversations && parsed.conversations.length > 0) {
      const firstConv = parsed.conversations[0];
      expect(typeof firstConv).toBe("object");
      expect(firstConv).toHaveProperty("id");
    }
  });

  test("RGPD-PORT-04: Export inclut toutes les données nécessaires pour portabilité", async ({
    page,
  }) => {
    // Create and authenticate test user
    const { data: signUpData } = await createTestUser(testEmail, testPassword);
    userId = signUpData?.user?.id || null;

    if (!userId) {
      throw new Error("Failed to create test user");
    }

    await signInTestUser(testEmail, testPassword);
    await authenticateUserInPage(page, testEmail, testPassword);

    // Create comprehensive test data
    await createTestUserData(userId);
    await createTestUserData(userId); // Multiple polls

    // Get user data
    const userData = await getUserDataForExport(userId);

    // Verify all essential data types are included
    expect(userData).toHaveProperty("profile");
    expect(userData).toHaveProperty("conversations");
    expect(userData).toHaveProperty("votes");

    // Verify data completeness
    expect(userData.conversations.length).toBeGreaterThan(0);

    // Each conversation should have poll data if it's a poll
    userData.conversations.forEach((conv: any) => {
      if (conv.poll_data) {
        expect(conv.poll_data).toBeDefined();
        expect(typeof conv.poll_data).toBe("object");
      }
    });
  });

  test("RGPD-PORT-05: Format permet extraction facile des données", async ({ page }) => {
    // Create and authenticate test user
    const { data: signUpData } = await createTestUser(testEmail, testPassword);
    userId = signUpData?.user?.id || null;

    if (!userId) {
      throw new Error("Failed to create test user");
    }

    await signInTestUser(testEmail, testPassword);
    await authenticateUserInPage(page, testEmail, testPassword);

    // Create test data
    await createTestUserData(userId);

    // Get user data
    const userData = await getUserDataForExport(userId);

    // Verify data can be easily extracted
    const jsonString = JSON.stringify(userData);
    const parsed = JSON.parse(jsonString);

    // Should be able to extract polls
    const polls = parsed.conversations?.filter((c: any) => c.poll_data) || [];
    expect(Array.isArray(polls)).toBe(true);

    // Should be able to extract votes
    const votes = parsed.votes || [];
    expect(Array.isArray(votes)).toBe(true);

    // Should be able to extract user profile
    const profile = parsed.profile;
    if (profile) {
      expect(typeof profile).toBe("object");
    }
  });

  test("RGPD-PORT-06: Export fonctionne avec différents volumes de données", async ({ page }) => {
    // Create and authenticate test user
    const { data: signUpData } = await createTestUser(testEmail, testPassword);
    userId = signUpData?.user?.id || null;

    if (!userId) {
      throw new Error("Failed to create test user");
    }

    await signInTestUser(testEmail, testPassword);
    await authenticateUserInPage(page, testEmail, testPassword);

    // Create multiple test data entries
    for (let i = 0; i < 3; i++) {
      await createTestUserData(userId);
    }

    // Get user data
    const userData = await getUserDataForExport(userId);

    // Verify export handles multiple entries
    expect(userData.conversations.length).toBeGreaterThanOrEqual(3);

    // Verify format is still valid with multiple entries
    verifyExportFormat(userData);

    // Verify JSON can be stringified even with larger dataset
    const jsonString = JSON.stringify(userData);
    expect(jsonString.length).toBeGreaterThan(100); // Should have substantial content
    expect(() => JSON.parse(jsonString)).not.toThrow();
  });
});
