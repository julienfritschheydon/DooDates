import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateAdvancedSettings,
  transformAdvancedSettings,
  getRestrictionLevel,
  generateSettingsSummary,
  checkSettingsCompatibility,
  getDefaultSettings,
  isValidEmail,
  isValidExpirationDate,
  isValidMaxResponses,
  isValidTimeLimit,
  type SettingsValidationResult,
} from "../settingsLogic";
import type { DatePollSettings } from "@/lib/products/date-polls/date-polls-service";
import type { FormPollSettings } from "@/lib/products/form-polls/form-polls-service";
import type { QuizzSettings } from "@/lib/products/quizz/quizz-settings";

describe("SettingsLogic - Validation Functions", () => {
  describe("isValidEmail", () => {
    it("devrait valider des emails corrects", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.org")).toBe(true);
    });

    it("devrait rejeter des emails incorrects", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("test@.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidExpirationDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("devrait accepter les dates dans le futur", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isValidExpirationDate(futureDate.toISOString())).toBe(true);
    });

    it("devrait rejeter les dates dans le passé", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isValidExpirationDate(pastDate.toISOString())).toBe(false);
    });

    it("devrait accepter les dates vides (optionnelles)", () => {
      expect(isValidExpirationDate("")).toBe(true);
      expect(isValidExpirationDate("   ")).toBe(true); // Espaces multiples
    });

    it("devrait rejeter les dates invalides", () => {
      expect(isValidExpirationDate("invalid-date")).toBe(false);
      expect(isValidExpirationDate("2024-13-45")).toBe(false);
    });
  });

  describe("isValidMaxResponses", () => {
    it("devrait valider les nombres positifs", () => {
      expect(isValidMaxResponses(1)).toBe(true);
      expect(isValidMaxResponses(100)).toBe(true);
      expect(isValidMaxResponses(9999)).toBe(true);
    });

    it("devrait rejeter les nombres invalides", () => {
      expect(isValidMaxResponses(0)).toBe(false);
      expect(isValidMaxResponses(-1)).toBe(false);
      expect(isValidMaxResponses(1.5)).toBe(false);
      expect(isValidMaxResponses(NaN)).toBe(false);
      expect(isValidMaxResponses(Infinity)).toBe(false);
    });

    it("devrait accepter undefined (illimité)", () => {
      expect(isValidMaxResponses(undefined)).toBe(true);
    });
  });

  describe("isValidTimeLimit", () => {
    it("devrait valider les temps limites valides", () => {
      expect(isValidTimeLimit(1)).toBe(true);
      expect(isValidTimeLimit(60)).toBe(true);
      expect(isValidTimeLimit(1440)).toBe(true); // 24h exact
    });

    it("devrait rejeter les temps limites invalides", () => {
      expect(isValidTimeLimit(0)).toBe(false);
      expect(isValidTimeLimit(-1)).toBe(false);
      expect(isValidTimeLimit(1441)).toBe(false); // Plus de 24h
      expect(isValidTimeLimit(1.5)).toBe(false);
    });

    it("devrait accepter undefined (optionnel)", () => {
      expect(isValidTimeLimit(undefined)).toBe(true);
    });
  });
});

describe("SettingsLogic - Advanced Validation", () => {
  describe("validateAdvancedSettings", () => {
    it("devrait valider des paramètres de date poll corrects", () => {
      const settings: DatePollSettings = {
        showLogo: true,
        requireAuth: false,
        resultsVisibility: "public",
      };

      const result = validateAdvancedSettings(settings, "date");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("devrait détecter une erreur d'email manquant", () => {
      const settings: FormPollSettings = {
        showLogo: true,
        sendEmailCopy: true,
        emailForCopy: "",
        resultsVisibility: "public",
      };

      const result = validateAdvancedSettings(settings, "form");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "L'adresse email est obligatoire si l'envoi par email est activé",
      );
    });

    it("devrait détecter une erreur d'email invalide", () => {
      const settings: FormPollSettings = {
        showLogo: true,
        sendEmailCopy: true,
        emailForCopy: "invalid-email",
        resultsVisibility: "public",
      };

      const result = validateAdvancedSettings(settings, "form");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("L'adresse email n'est pas valide");
    });

    it("devrait valider les paramètres de quizz avec temps limite", () => {
      const settings: QuizzSettings = {
        showLogo: true,
        timeLimit: 30,
        resultsVisibility: "public",
      };

      const result = validateAdvancedSettings(settings, "quizz");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("devrait détecter un temps limite invalide pour les quizz", () => {
      const settings: QuizzSettings = {
        showLogo: true,
        timeLimit: 2000, // Plus de 24h
        resultsVisibility: "public",
      };

      const result = validateAdvancedSettings(settings, "quizz");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Le temps limite doit être compris entre 1 et 1440 minutes");
    });

    it("devrait générer des warnings appropriés", () => {
      const settings: DatePollSettings = {
        showLogo: true,
        requireAuth: true,
        oneResponsePerPerson: false,
        allowEditAfterSubmit: true,
        resultsVisibility: "public",
      };

      const result = validateAdvancedSettings(settings, "date");
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "La connexion est requise mais les réponses multiples sont autorisées",
      );
      // Le deuxième warning ne s'applique que si oneResponsePerPerson est true
      expect(result.warnings.length).toBe(1);
    });
  });

  describe("checkSettingsCompatibility", () => {
    it("devrait détecter les incompatibilités des date polls", () => {
      const settings = {
        showLogo: true,
        maxResponses: 100,
        expiresAt: "2024-12-31",
      } as any;

      const result = checkSettingsCompatibility(settings, "date");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Les sondages de date ne supportent pas la limite de réponses",
      );
      expect(result.errors).toContain("Les sondages de date ne supportent pas de date limite");
    });

    it("devrait valider la compatibilité des form polls", () => {
      const settings: FormPollSettings = {
        showLogo: true,
        maxResponses: 100,
        expiresAt: "2024-12-31",
        resultsVisibility: "public",
      };

      const result = checkSettingsCompatibility(settings, "form");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("devrait générer des warnings de compatibilité", () => {
      const settings: FormPollSettings = {
        showLogo: true,
        allowEditAfterSubmit: true,
        oneResponsePerPerson: true,
        requireAuth: false,
        sendEmailCopy: true,
        resultsVisibility: "public",
      };

      const result = checkSettingsCompatibility(settings, "form");
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe("SettingsLogic - Transformation", () => {
  describe("transformAdvancedSettings", () => {
    it("devrait supprimer les valeurs vides avec removeEmpty", () => {
      const settings = {
        showLogo: true,
        emailForCopy: "",
        maxResponses: undefined,
        expiresAt: null,
      } as any;

      const result = transformAdvancedSettings(settings, { removeEmpty: true });
      expect(result.emailForCopy).toBeUndefined();
      expect(result.maxResponses).toBeUndefined();
      expect(result.expiresAt).toBeUndefined();
      expect(result.showLogo).toBe(true);
    });

    it("devrait nettoyer les emails avec sanitizeEmail", () => {
      const settings: FormPollSettings = {
        showLogo: true,
        sendEmailCopy: true,
        emailForCopy: "  TEST@EXAMPLE.COM  ",
        resultsVisibility: "public",
      };

      const result = transformAdvancedSettings(settings, { sanitizeEmail: true });
      expect(result.emailForCopy).toBe("test@example.com");
    });

    it("devrait valider les dates avec validateDates", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01"));

      const settings: FormPollSettings = {
        showLogo: true,
        expiresAt: "2023-12-31", // Dans le passé
        resultsVisibility: "public",
      };

      const result = transformAdvancedSettings(settings, { validateDates: true });
      expect(result.expiresAt).toBeUndefined();

      vi.useRealTimers();
    });

    it("devrait appliquer toutes les transformations", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01"));

      const settings = {
        showLogo: true,
        emailForCopy: "  TEST@EXAMPLE.COM  ",
        expiresAt: "2023-12-31",
        maxResponses: undefined,
      } as any;

      const result = transformAdvancedSettings(settings, {
        removeEmpty: true,
        sanitizeEmail: true,
        validateDates: true,
      });

      expect(result.emailForCopy).toBe("test@example.com");
      expect(result.expiresAt).toBeUndefined();
      expect(result.maxResponses).toBeUndefined();
      expect(result.showLogo).toBe(true);

      vi.useRealTimers();
    });
  });
});

describe("SettingsLogic - Utilitaires", () => {
  describe("getRestrictionLevel", () => {
    it("devrait calculer le niveau de restriction bas", () => {
      const settings: DatePollSettings = {
        showLogo: true,
        resultsVisibility: "public",
      };

      expect(getRestrictionLevel(settings)).toBe("low");
    });

    it("devrait calculer le niveau de restriction moyen", () => {
      const settings: FormPollSettings = {
        showLogo: true,
        oneResponsePerPerson: true,
        maxResponses: 100,
        resultsVisibility: "voters",
      };

      expect(getRestrictionLevel(settings)).toBe("medium");
    });

    it("devrait calculer le niveau de restriction élevé", () => {
      const settings: QuizzSettings = {
        showLogo: true,
        requireAuth: true,
        oneResponsePerPerson: true,
        sendEmailCopy: true,
        resultsVisibility: "creator-only",
      };

      expect(getRestrictionLevel(settings)).toBe("high");
    });
  });

  describe("generateSettingsSummary", () => {
    it("devrait générer un résumé pour les paramètres de base", () => {
      const settings: DatePollSettings = {
        showLogo: true,
        requireAuth: true,
        resultsVisibility: "creator-only",
      };

      const summary = generateSettingsSummary(settings);
      expect(summary).toContain("Connexion requise");
      expect(summary).toContain("Résultats privés");
    });

    it("devrait générer un résumé pour les form polls", () => {
      const settings: FormPollSettings = {
        showLogo: true,
        maxResponses: 50,
        expiresAt: "2024-12-31",
        sendEmailCopy: true,
        resultsVisibility: "voters",
      };

      const summary = generateSettingsSummary(settings);
      expect(summary).toContain("Limite: 50 réponses");
      expect(summary).toContain("Ferme le 31/12/2024");
      expect(summary).toContain("Email de confirmation activé");
      expect(summary).toContain("Résultats pour participants");
    });

    it("devrait générer un résumé pour les quizz", () => {
      const settings: QuizzSettings = {
        showLogo: true,
        allowRetry: true,
        showCorrectAnswers: true,
        timeLimit: 30,
        resultsVisibility: "public",
      };

      const summary = generateSettingsSummary(settings);
      expect(summary).toContain("Autoriser les tentatives multiples");
      expect(summary).toContain("Montrer les réponses correctes");
      expect(summary).toContain("Temps limite: 30 min");
      expect(summary).toContain("Résultats publics");
    });
  });

  describe("getDefaultSettings", () => {
    it("devrait retourner les paramètres par défaut pour les date polls", () => {
      const defaults = getDefaultSettings("date");

      expect(defaults.showLogo).toBe(true);
      expect(defaults.requireAuth).toBe(false);
      expect(defaults.resultsVisibility).toBe("public");
      expect((defaults as any).maxResponses).toBeUndefined();
      expect((defaults as any).expiresAt).toBeUndefined();
    });

    it("devrait retourner les paramètres par défaut pour les form polls", () => {
      const defaults = getDefaultSettings("form");

      expect(defaults.showLogo).toBe(true);
      expect(defaults.requireAuth).toBe(false);
      expect((defaults as FormPollSettings).maxResponses).toBeUndefined();
      expect((defaults as FormPollSettings).expiresAt).toBeUndefined();
    });

    it("devrait retourner les paramètres par défaut pour les quizz", () => {
      const defaults = getDefaultSettings("quizz");

      expect(defaults.showLogo).toBe(true);
      expect(defaults.requireAuth).toBe(false);
      expect((defaults as QuizzSettings).allowRetry).toBe(false);
      expect((defaults as QuizzSettings).showCorrectAnswers).toBe(true);
      expect((defaults as QuizzSettings).timeLimit).toBeUndefined();
    });
  });
});

describe("SettingsLogic - Edge Cases", () => {
  it("devrait gérer les paramètres vides", () => {
    const settings = {} as any;
    const result = validateAdvancedSettings(settings, "date");

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("devrait gérer les paramètres avec des valeurs null", () => {
    const settings = {
      showLogo: null,
      requireAuth: null,
      emailForCopy: null,
    } as any;

    const result = validateAdvancedSettings(settings, "form");
    expect(result.isValid).toBe(true);
  });

  it("devrait gérer les types incorrects", () => {
    const settings = {
      maxResponses: "not-a-number",
      timeLimit: "not-a-number",
      expiresAt: 12345,
    } as any;

    const result = validateAdvancedSettings(settings, "quizz");
    expect(result.isValid).toBe(false);
  });

  it("devrait gérer les valeurs extrêmes", () => {
    const settings: QuizzSettings = {
      showLogo: true,
      timeLimit: 1440, // Limite exacte
      maxResponses: Number.MAX_SAFE_INTEGER,
      resultsVisibility: "public",
    };

    const result = validateAdvancedSettings(settings, "quizz");
    expect(result.isValid).toBe(true);
  });
});
