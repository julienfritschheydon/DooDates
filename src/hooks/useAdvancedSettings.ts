import { useState, useCallback, useEffect } from "react";
import { logError } from "@/lib/error-handling";
import type { AdvancedSettings } from "@/lib/settingsLogic";
import {
  validateAdvancedSettings,
  transformAdvancedSettings,
  getDefaultSettings,
  getRestrictionLevel,
  generateSettingsSummary,
  checkSettingsCompatibility,
  type SettingsValidationResult,
} from "@/lib/settingsLogic";

export interface UseAdvancedSettingsOptions {
  pollType: "date" | "form" | "quizz";
  initialSettings?: Partial<AdvancedSettings>;
  autoValidate?: boolean;
  autoTransform?: boolean;
}

export interface UseAdvancedSettingsReturn {
  settings: AdvancedSettings;
  setSettings: (
    settings: AdvancedSettings | ((prev: AdvancedSettings) => AdvancedSettings),
  ) => void;
  updateSetting: <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => void;
  resetSettings: () => void;
  validation: SettingsValidationResult;
  isValid: boolean;
  restrictionLevel: "low" | "medium" | "high";
  summary: string[];
  isDirty: boolean;
  save: () => Promise<boolean>;
  load: (settings: AdvancedSettings) => void;
}

/**
 * Hook pour gérer les paramètres avancés des polls
 * avec validation, transformation et utilitaires intégrés
 */
export function useAdvancedSettings(
  options: UseAdvancedSettingsOptions,
): UseAdvancedSettingsReturn {
  const { pollType, initialSettings, autoValidate = true, autoTransform = true } = options;

  // État des paramètres
  const [settings, setSettingsState] = useState<AdvancedSettings>(() => {
    const defaults = getDefaultSettings(pollType);
    return { ...defaults, ...initialSettings };
  });

  // État de validation
  const [validation, setValidation] = useState<SettingsValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  // État de propreté (modifié ou non)
  const [isDirty, setIsDirty] = useState(false);

  // État de chargement
  const [isLoading, setIsLoading] = useState(false);

  // Validation automatique
  const validateSettings = useCallback(
    (settingsToValidate: AdvancedSettings) => {
      if (!autoValidate) return;

      const result = validateAdvancedSettings(settingsToValidate, pollType);
      setValidation(result);
      return result;
    },
    [pollType, autoValidate],
  );

  // Transformation automatique
  const transformSettings = useCallback(
    (settingsToTransform: AdvancedSettings) => {
      if (!autoTransform) return settingsToTransform;

      return transformAdvancedSettings(settingsToTransform, {
        removeEmpty: true,
        sanitizeEmail: true,
        validateDates: true,
      });
    },
    [autoTransform],
  );

  // Mettre à jour les paramètres
  const setSettings = useCallback(
    (newSettings: AdvancedSettings | ((prev: AdvancedSettings) => AdvancedSettings)) => {
      setSettingsState((prev) => {
        const updated = typeof newSettings === "function" ? newSettings(prev) : newSettings;
        const transformed = transformSettings(updated);

        // Si la transformation retourne undefined, utiliser les paramètres mis à jour
        const finalSettings = transformed || updated;

        validateSettings(finalSettings);
        setIsDirty(true);
        return finalSettings;
      });
    },
    [transformSettings, validateSettings],
  );

  // Mettre à jour un paramètre spécifique
  const updateSetting = useCallback(
    <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setSettings],
  );

  // Réinitialiser aux valeurs par défaut
  const resetSettings = useCallback(() => {
    const defaults = getDefaultSettings(pollType);
    setSettings(defaults);
    setIsDirty(false);
  }, [pollType, setSettings]);

  // Charger des paramètres
  const load = useCallback(
    (loadedSettings: AdvancedSettings) => {
      setIsLoading(true);
      try {
        const transformed = transformSettings(loadedSettings);
        setSettingsState(transformed);
        validateSettings(transformed);
        setIsDirty(false);
      } finally {
        setIsLoading(false);
      }
    },
    [transformSettings, validateSettings],
  );

  // Sauvegarder (simulation - à adapter selon les besoins)
  const save = useCallback(async (): Promise<boolean> => {
    if (!validation.isValid) {
      return false;
    }

    // Vérifier la compatibilité
    try {
      const compatibility = checkSettingsCompatibility(settings, pollType);
      if (!compatibility.isValid) {
        setValidation(compatibility);
        return false;
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        component: "useAdvancedSettings",
        operation: "save",
      });
      return false;
    }

    // Simulation de sauvegarde
    try {
      // Ici vous pourriez appeler une API ou localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsDirty(false);
      return true;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        component: "useAdvancedSettings",
        operation: "save",
      });
      return false;
    }
  }, [settings, validation, pollType]);

  // Calculs dérivés
  const restrictionLevel = getRestrictionLevel(settings);
  const summary = generateSettingsSummary(settings);

  // Validation initiale
  useEffect(() => {
    validateSettings(settings);
  }, [settings, validateSettings]);

  return {
    settings,
    setSettings,
    updateSetting,
    resetSettings,
    validation,
    isValid: validation.isValid,
    restrictionLevel,
    summary,
    isDirty,
    save,
    load,
  };
}

/**
 * Hook utilitaire pour les paramètres par défaut
 */
export function useDefaultSettings(pollType: "date" | "form" | "quizz") {
  const [defaultSettings] = useState(() => getDefaultSettings(pollType));
  return defaultSettings;
}

/**
 * Hook pour la validation indépendante des paramètres
 */
export function useSettingsValidation() {
  const validate = useCallback(
    (settings: AdvancedSettings, pollType: "date" | "form" | "quizz"): SettingsValidationResult => {
      return validateAdvancedSettings(settings, pollType);
    },
    [],
  );

  const checkCompatibility = useCallback(
    (settings: AdvancedSettings, pollType: "date" | "form" | "quizz"): SettingsValidationResult => {
      return checkSettingsCompatibility(settings, pollType);
    },
    [],
  );

  return {
    validate,
    checkCompatibility,
  };
}
