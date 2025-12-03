/**
 * Tests Consent Logger Service
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { consentLogger, ConsentLogEntry } from "../consent-logger";

describe("ConsentLoggerService", () => {
  beforeEach(() => {
    consentLogger.reset();
  });

  afterEach(() => {
    consentLogger.reset();
  });

  describe("logConsent", () => {
    it("should log consent entry", () => {
      const entry = {
        action: "consent_given" as const,
        userId: "user123",
        consentType: "analytics" as const,
        consentValue: true,
      };

      consentLogger.logConsent(entry);

      const logs = consentLogger.getUserLogs("user123");
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("consent_given");
      expect(logs[0].userId).toBe("user123");
      expect(logs[0].consentType).toBe("analytics");
      expect(logs[0].consentValue).toBe(true);
      expect(logs[0].timestamp).toBeDefined();
      expect(logs[0].id).toBeDefined();
    });

    it("should validate required fields", () => {
      // Le service log l'erreur mais ne la lance pas (catch interne)
      // On vérifie que le log n'est pas ajouté
      const initialLogs = consentLogger.getUserLogs("user123");
      consentLogger.logConsent({} as any);
      const afterLogs = consentLogger.getUserLogs("user123");
      expect(afterLogs.length).toBe(initialLogs.length); // Pas de nouveau log
    });

    it("should validate action values", () => {
      // Le service log l'erreur mais ne la lance pas (catch interne)
      // On vérifie que le log n'est pas ajouté
      const initialLogs = consentLogger.getUserLogs("user123");
      consentLogger.logConsent({
        action: "invalid_action" as any,
        userId: "user123",
      });
      const afterLogs = consentLogger.getUserLogs("user123");
      expect(afterLogs.length).toBe(initialLogs.length); // Pas de nouveau log
    });
  });

  describe("logCookieConsent", () => {
    it("should log cookie consent for all types", () => {
      const consents = {
        essential: true,
        analytics: false,
        marketing: true,
        functional: true,
      };

      consentLogger.logCookieConsent("user123", "192.168.1.1", "Mozilla/5.0", consents);

      const logs = consentLogger.getUserLogs("user123");
      expect(logs).toHaveLength(4); // 4 types de consent

      const cookieLogs = logs.filter((log) => log.action === "cookie_consent");
      expect(cookieLogs).toHaveLength(4);

      expect(
        cookieLogs.some((log) => log.consentType === "essential" && log.consentValue === true),
      ).toBe(true);
      expect(
        cookieLogs.some((log) => log.consentType === "analytics" && log.consentValue === false),
      ).toBe(true);
    });
  });

  describe("logDataAccessRequest", () => {
    it("should log data access request", () => {
      consentLogger.logDataAccessRequest("user123", "192.168.1.1", "Mozilla/5.0");

      const logs = consentLogger.getUserLogs("user123");
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("data_access");
      expect(logs[0].ipHash).toBeDefined();
      expect(logs[0].metadata?.requestType).toBe("gdpr_access_request");
    });
  });

  describe("logDataDeletionRequest", () => {
    it("should log data deletion request", () => {
      consentLogger.logDataDeletionRequest("user123", "192.168.1.1", "Mozilla/5.0");

      const logs = consentLogger.getUserLogs("user123");
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("data_deletion");
      expect(logs[0].metadata?.requestType).toBe("gdpr_deletion_request");
    });
  });

  describe("logConsentWithdrawal", () => {
    it("should log consent withdrawal", () => {
      consentLogger.logConsentWithdrawal("user123", "analytics", "192.168.1.1", "Mozilla/5.0");

      const logs = consentLogger.getUserLogs("user123");
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("consent_withdrawn");
      expect(logs[0].consentType).toBe("analytics");
      expect(logs[0].consentValue).toBe(false);
    });
  });

  describe("getUserLogs", () => {
    it("should return only user logs", () => {
      consentLogger.logConsent({ action: "consent_given", userId: "user1" });
      consentLogger.logConsent({ action: "consent_given", userId: "user2" });
      consentLogger.logConsent({ action: "consent_given", userId: "user1" });

      const user1Logs = consentLogger.getUserLogs("user1");
      const user2Logs = consentLogger.getUserLogs("user2");

      expect(user1Logs).toHaveLength(2);
      expect(user2Logs).toHaveLength(1);
      expect(user1Logs.every((log) => log.userId === "user1")).toBe(true);
    });

    it("should respect limit", () => {
      for (let i = 0; i < 10; i++) {
        consentLogger.logConsent({ action: "consent_given", userId: "user1" });
      }

      const logs = consentLogger.getUserLogs("user1", 5);
      expect(logs).toHaveLength(5);
    });
  });

  describe("getLogsByAction", () => {
    it("should filter by action", () => {
      consentLogger.logConsent({ action: "consent_given", userId: "user1" });
      consentLogger.logConsent({ action: "consent_withdrawn", userId: "user1" });
      consentLogger.logConsent({ action: "consent_given", userId: "user2" });

      const consentGivenLogs = consentLogger.getLogsByAction("consent_given");
      const consentWithdrawnLogs = consentLogger.getLogsByAction("consent_withdrawn");

      expect(consentGivenLogs).toHaveLength(2);
      expect(consentWithdrawnLogs).toHaveLength(1);
      expect(consentGivenLogs.every((log) => log.action === "consent_given")).toBe(true);
    });
  });

  describe("exportUserData", () => {
    it("should export user data with summary", () => {
      consentLogger.logConsent({
        action: "consent_given",
        userId: "user1",
        consentType: "analytics",
        consentValue: true,
      });
      consentLogger.logConsent({
        action: "consent_withdrawn",
        userId: "user1",
        consentType: "marketing",
        consentValue: false,
      });
      consentLogger.logDataAccessRequest("user1", "192.168.1.1", "Mozilla/5.0");

      const exportData = consentLogger.exportUserData("user1");

      expect(exportData.userId).toBe("user1");
      expect(exportData.exportDate).toBeDefined();
      expect(exportData.consentLogs).toHaveLength(3);
      expect(exportData.summary.totalLogs).toBe(3);
      expect(exportData.summary.consentGiven).toBe(1);
      expect(exportData.summary.consentWithdrawn).toBe(1);
      expect(exportData.summary.dataAccessRequests).toBe(1);
    });
  });

  describe("deleteUserData", () => {
    it("should delete all user data", () => {
      consentLogger.logConsent({ action: "consent_given", userId: "user1" });
      consentLogger.logConsent({ action: "consent_given", userId: "user2" });
      consentLogger.logConsent({ action: "consent_given", userId: "user1" });

      const result = consentLogger.deleteUserData("user1");

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);

      const user1Logs = consentLogger.getUserLogs("user1");
      const user2Logs = consentLogger.getUserLogs("user2");

      expect(user1Logs).toHaveLength(0);
      expect(user2Logs).toHaveLength(1);
    });
  });

  describe("getConsentStats", () => {
    it("should return comprehensive stats", () => {
      consentLogger.logConsent({
        action: "consent_given",
        userId: "user1",
        consentType: "analytics",
      });
      consentLogger.logConsent({
        action: "consent_given",
        userId: "user2",
        consentType: "essential",
      });
      consentLogger.logConsent({
        action: "consent_withdrawn",
        userId: "user1",
        consentType: "marketing",
      });

      const stats = consentLogger.getConsentStats();

      expect(stats.totalLogs).toBe(3);
      expect(stats.actionStats.consent_given).toBe(2);
      expect(stats.actionStats.consent_withdrawn).toBe(1);
      expect(stats.consentTypeStats.analytics).toBe(1);
      expect(stats.consentTypeStats.essential).toBe(1);
      expect(stats.consentTypeStats.marketing).toBe(1);
      expect(stats.storageSize).toBe(3);
      expect(stats.maxSize).toBe(10000);
      expect(stats.utilizationRate).toBe("0.03%");
    });
  });

  describe("storage management", () => {
    it("should handle storage size limit", () => {
      // Simuler un storage plein
      for (let i = 0; i < 100; i++) {
        consentLogger.logConsent({ action: "consent_given", userId: `user${i}` });
      }

      const stats = consentLogger.getConsentStats();
      expect(stats.storageSize).toBe(100);
      expect(stats.storageSize).toBeLessThanOrEqual(stats.maxSize);
    });
  });
});

describe("Consent Logger Integration", () => {
  it("should handle GDPR workflow", () => {
    const userId = "gdpr_user";
    const ip = "192.168.1.100";
    const userAgent = "Mozilla/5.0";

    // 1. Donner consentement
    consentLogger.logCookieConsent(userId, ip, userAgent, {
      essential: true,
      analytics: true,
      marketing: false,
      functional: true,
    });

    // 2. Demande d'accès aux données
    consentLogger.logDataAccessRequest(userId, ip, userAgent);

    // 3. Retirer consentement marketing
    consentLogger.logConsentWithdrawal(userId, "marketing", ip, userAgent);

    // 4. Demande de suppression
    consentLogger.logDataDeletionRequest(userId, ip, userAgent);

    // Vérifier l'export
    const exportData = consentLogger.exportUserData(userId);
    expect(exportData.consentLogs).toHaveLength(7); // 4 cookies + 1 access + 1 withdrawal + 1 deletion
    expect(exportData.summary.consentGiven).toBe(0); // cookie_consent n'est pas consent_given
    expect(exportData.summary.consentWithdrawn).toBe(1);
    expect(exportData.summary.dataAccessRequests).toBe(1);
    expect(exportData.summary.dataDeletionRequests).toBe(1);

    // Supprimer les données
    const deleteResult = consentLogger.deleteUserData(userId);
    expect(deleteResult.deletedCount).toBe(7);
    expect(deleteResult.success).toBe(true);
  });
});
