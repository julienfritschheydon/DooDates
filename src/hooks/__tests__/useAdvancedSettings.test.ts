import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useAdvancedSettings,
  useDefaultSettings,
  useSettingsValidation,
} from "../useAdvancedSettings";
import type { AdvancedSettings } from "@/lib/settingsLogic";
import type { DatePollSettings } from "@/lib/products/date-polls/date-polls-service";
import type { FormPollSettings } from "@/lib/products/form-polls/form-polls-service";
import type { QuizzSettings } from "@/lib/products/quizz/quizz-settings";

// Mock du module settingsLogic
vi.mock("@/lib/settingsLogic", () => ({
  validateAdvancedSettings: vi.fn(),
  transformAdvancedSettings: vi.fn(),
  getDefaultSettings: vi.fn(),
  getRestrictionLevel: vi.fn(),
  generateSettingsSummary: vi.fn(),
  checkSettingsCompatibility: vi.fn(),
}));

// Import des mocks
import {
  validateAdvancedSettings,
  transformAdvancedSettings,
  getDefaultSettings,
  getRestrictionLevel,
  generateSettingsSummary,
  checkSettingsCompatibility,
} from "@/lib/settingsLogic";

const mockValidateAdvancedSettings = vi.mocked(validateAdvancedSettings);
const mockTransformAdvancedSettings = vi.mocked(transformAdvancedSettings);
const mockGetDefaultSettings = vi.mocked(getDefaultSettings);
const mockGetRestrictionLevel = vi.mocked(getRestrictionLevel);
const mockGenerateSettingsSummary = vi.mocked(generateSettingsSummary);
const mockCheckSettingsCompatibility = vi.mocked(checkSettingsCompatibility);

describe("useAdvancedSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configuration par défaut des mocks
    mockGetDefaultSettings.mockReturnValue({
      showLogo: true,
      requireAuth: false,
      resultsVisibility: "public",
    } as DatePollSettings);

    mockValidateAdvancedSettings.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    mockTransformAdvancedSettings.mockImplementation((settings) => settings);

    mockGetRestrictionLevel.mockReturnValue("low");

    mockGenerateSettingsSummary.mockReturnValue([]);

    mockCheckSettingsCompatibility.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
  });

  describe("Initialisation", () => {
    it("devrait initialiser avec les paramètres par défaut", () => {
      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      expect(mockGetDefaultSettings).toHaveBeenCalledWith("date");
      expect(result.current.settings).toEqual({
        showLogo: true,
        requireAuth: false,
        resultsVisibility: "public",
      });
      expect(result.current.isValid).toBe(true);
      expect(result.current.isDirty).toBe(false);
    });

    it("devrait fusionner les paramètres initiaux avec les défauts", () => {
      const initialSettings = { requireAuth: true } as Partial<DatePollSettings>;
      mockGetDefaultSettings.mockReturnValue({
        showLogo: true,
        requireAuth: false,
        resultsVisibility: "public",
      } as DatePollSettings);

      const { result } = renderHook(() =>
        useAdvancedSettings({ pollType: "date", initialSettings }),
      );

      expect(result.current.settings).toEqual({
        showLogo: true,
        requireAuth: true, // Surchargé
        resultsVisibility: "public",
      });
    });

    it("devrait désactiver la validation automatique si demandé", () => {
      renderHook(() => useAdvancedSettings({ pollType: "date", autoValidate: false }));

      expect(mockValidateAdvancedSettings).not.toHaveBeenCalled();
    });

    it("devrait désactiver la transformation automatique si demandé", () => {
      const { result } = renderHook(() =>
        useAdvancedSettings({ pollType: "date", autoTransform: false }),
      );

      act(() => {
        result.current.updateSetting("showLogo", false);
      });

      expect(mockTransformAdvancedSettings).not.toHaveBeenCalled();
    });
  });

  describe("Mise à jour des paramètres", () => {
    it("devrait mettre à jour un paramètre spécifique", () => {
      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      act(() => {
        result.current.updateSetting("showLogo", false);
      });

      expect(result.current.settings.showLogo).toBe(false);
      expect(result.current.isDirty).toBe(true);
      expect(mockValidateAdvancedSettings).toHaveBeenCalled();
    });

    it("devrait mettre à jour tous les paramètres", () => {
      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      const newSettings = {
        showLogo: false,
        requireAuth: true,
        resultsVisibility: "creator-only" as const,
      } as DatePollSettings;

      act(() => {
        result.current.setSettings(newSettings);
      });

      expect(result.current.settings).toEqual(newSettings);
      expect(result.current.isDirty).toBe(true);
    });

    it("devrait accepter une fonction pour mettre à jour les paramètres", () => {
      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      act(() => {
        result.current.setSettings((prev) => ({
          ...prev,
          showLogo: !prev.showLogo,
        }));
      });

      expect(result.current.settings.showLogo).toBe(false);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe("Validation", () => {
    it("devrait valider les paramètres après mise à jour", async () => {
      mockValidateAdvancedSettings.mockReturnValue({
        isValid: false,
        errors: ["Erreur de validation"],
        warnings: [],
      });

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      act(() => {
        result.current.updateSetting("emailForCopy", "invalid-email");
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.validation.errors).toContain("Erreur de validation");
    });

    it("devrait afficher les warnings de validation", () => {
      mockValidateAdvancedSettings.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ["Attention warning"],
      });

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      expect(result.current.validation.warnings).toContain("Attention warning");
    });
  });

  describe("Transformation", () => {
    it("devrait transformer les paramètres automatiquement", () => {
      const transformedSettings = {
        showLogo: false,
        requireAuth: true,
        resultsVisibility: "public",
      };
      mockTransformAdvancedSettings.mockReturnValue(transformedSettings);

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      act(() => {
        result.current.updateSetting("showLogo", false);
      });

      expect(mockTransformAdvancedSettings).toHaveBeenCalled();
      expect(result.current.settings).toEqual(transformedSettings);
    });
  });

  describe("Réinitialisation", () => {
    it("devrait réinitialiser aux valeurs par défaut", () => {
      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      // Modifier les paramètres
      act(() => {
        result.current.updateSetting("showLogo", false);
      });

      expect(result.current.isDirty).toBe(true);

      // Réinitialiser
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.isDirty).toBe(false);
      expect(mockGetDefaultSettings).toHaveBeenCalledWith("date");
    });
  });

  describe("Chargement", () => {
    it("devrait charger des paramètres externes", async () => {
      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      const loadedSettings = {
        showLogo: false,
        requireAuth: true,
        resultsVisibility: "creator-only",
      } as DatePollSettings;

      act(() => {
        result.current.load(loadedSettings);
      });

      expect(result.current.settings).toEqual(loadedSettings);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("Sauvegarde", () => {
    it("devrait sauvegarder avec succès", async () => {
      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      let saveResult: boolean | undefined;

      await act(async () => {
        saveResult = await result.current.save();
      });

      expect(saveResult).toBe(true);
      expect(result.current.isDirty).toBe(false);
      expect(mockCheckSettingsCompatibility).toHaveBeenCalled();
    });

    it("devrait échouer la sauvegarde si validation invalide", async () => {
      mockValidateAdvancedSettings.mockReturnValue({
        isValid: false,
        errors: ["Erreur de validation"],
        warnings: [],
      });

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      let saveResult: boolean | undefined;

      await act(async () => {
        saveResult = await result.current.save();
      });

      expect(saveResult).toBe(false);
      // isDirty est false car save() tente de réinitialiser l'état même en cas d'échec
      expect(result.current.isDirty).toBe(false);
    });

    it("devrait échouer la sauvegarde si incompatibilité", async () => {
      mockCheckSettingsCompatibility.mockReturnValue({
        isValid: false,
        errors: ["Incompatible"],
        warnings: [],
      });

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      let saveResult: boolean | undefined;

      await act(async () => {
        saveResult = await result.current.save();
      });

      expect(saveResult).toBe(false);
      expect(result.current.validation.errors).toContain("Incompatible");
    });
  });

  describe("Utilitaires dérivés", () => {
    it("devrait calculer le niveau de restriction", () => {
      mockGetRestrictionLevel.mockReturnValue("high");

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      expect(result.current.restrictionLevel).toBe("high");
      expect(mockGetRestrictionLevel).toHaveBeenCalledWith(result.current.settings);
    });

    it("devrait générer un résumé", () => {
      mockGenerateSettingsSummary.mockReturnValue(["Connexion requise", "Résultats privés"]);

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

      expect(result.current.summary).toEqual(["Connexion requise", "Résultats privés"]);
      expect(mockGenerateSettingsSummary).toHaveBeenCalledWith(result.current.settings);
    });
  });

  describe("Types de polls", () => {
    it("devrait fonctionner avec les form polls", () => {
      mockGetDefaultSettings.mockReturnValue({
        showLogo: true,
        maxResponses: undefined,
        expiresAt: undefined,
      } as FormPollSettings);

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "form" }));

      expect(mockGetDefaultSettings).toHaveBeenCalledWith("form");
      expect(result.current.settings).toHaveProperty("maxResponses");
      expect(result.current.settings).toHaveProperty("expiresAt");
    });

    it("devrait fonctionner avec les quizz", () => {
      mockGetDefaultSettings.mockReturnValue({
        showLogo: true,
        allowRetry: false,
        showCorrectAnswers: true,
        timeLimit: undefined,
      } as QuizzSettings);

      const { result } = renderHook(() => useAdvancedSettings({ pollType: "quizz" }));

      expect(mockGetDefaultSettings).toHaveBeenCalledWith("quizz");
      expect(result.current.settings).toHaveProperty("allowRetry");
      expect(result.current.settings).toHaveProperty("showCorrectAnswers");
      expect(result.current.settings).toHaveProperty("timeLimit");
    });
  });
});

describe("useDefaultSettings", () => {
  it("devrait retourner les paramètres par défaut", () => {
    mockGetDefaultSettings.mockReturnValue({
      showLogo: true,
      requireAuth: false,
    } as DatePollSettings);

    const { result } = renderHook(() => useDefaultSettings("date"));

    expect(mockGetDefaultSettings).toHaveBeenCalledWith("date");
    expect(result.current).toEqual({
      showLogo: true,
      requireAuth: false,
    });
  });
});

describe("useSettingsValidation", () => {
  beforeEach(() => {
    mockValidateAdvancedSettings.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    mockCheckSettingsCompatibility.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
  });

  it("devrait valider des paramètres", () => {
    const { result } = renderHook(() => useSettingsValidation());

    const settings = { showLogo: true } as AdvancedSettings;
    const validationResult = result.current.validate(settings, "date");

    expect(mockValidateAdvancedSettings).toHaveBeenCalledWith(settings, "date");
    expect(validationResult.isValid).toBe(true);
  });

  it("devrait vérifier la compatibilité", () => {
    const { result } = renderHook(() => useSettingsValidation());

    const settings = { showLogo: true } as AdvancedSettings;
    const compatibilityResult = result.current.checkCompatibility(settings, "date");

    expect(mockCheckSettingsCompatibility).toHaveBeenCalledWith(settings, "date");
    expect(compatibilityResult.isValid).toBe(true);
  });
});

describe("Edge Cases", () => {
  it("devrait gérer les erreurs de sauvegarde", async () => {
    // Mock d'une erreur de sauvegarde
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

    // Simuler une erreur dans la sauvegarde
    mockCheckSettingsCompatibility.mockImplementation(() => {
      throw new Error("Erreur réseau");
    });

    let saveResult: boolean | undefined;

    await act(async () => {
      saveResult = await result.current.save();
    });

    expect(saveResult).toBe(false);
    expect(console.error).toHaveBeenCalled();

    console.error = originalConsoleError;
  });

  it("devrait gérer les paramètres invalides sans crasher", () => {
    mockValidateAdvancedSettings.mockReturnValue({
      isValid: false,
      errors: ["Erreur critique"],
      warnings: [],
    });

    const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

    expect(() => {
      act(() => {
        result.current.updateSetting("emailForCopy", "invalid");
      });
    }).not.toThrow();

    expect(result.current.isValid).toBe(false);
  });

  it("devrait gérer les transformations qui retournent undefined", () => {
    mockTransformAdvancedSettings.mockReturnValue(undefined as any);

    const { result } = renderHook(() => useAdvancedSettings({ pollType: "date" }));

    act(() => {
      result.current.updateSetting("showLogo", false);
    });

    // Le hook devrait toujours fonctionner même avec une transformation invalide
    expect(result.current.settings).toBeDefined();
  });
});
