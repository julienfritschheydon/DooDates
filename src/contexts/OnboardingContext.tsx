import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { logError, ErrorFactory } from "../lib/error-handling";

const ONBOARDING_STORAGE_KEY = "doodates_onboarding_completed";

interface OnboardingContextType {
  isCompleted: boolean;
  isOpen: boolean;
  currentStep: number;
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return stored === "true";
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to read onboarding state from localStorage",
          "Impossible de charger l'état de l'onboarding",
        ),
        { component: "OnboardingProvider", operation: "initialize", metadata: { error } },
      );
      return false;
    }
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Ouvrir automatiquement l'onboarding au premier lancement
  useEffect(() => {
    // Ne pas ouvrir l'onboarding pendant les tests E2E
    const isE2ETesting =
      window.location.search.includes("e2e-test") ||
      window.navigator.userAgent.includes("Playwright") ||
      window.navigator.webdriver === true;

    if (!isCompleted && !isE2ETesting) {
      // Petit délai pour laisser l'interface se charger
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipOnboarding = useCallback(() => {
    setIsOpen(false);
    setIsCompleted(true);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to save onboarding state to localStorage",
          "Impossible de sauvegarder l'état de l'onboarding",
        ),
        { component: "OnboardingProvider", operation: "skipOnboarding", metadata: { error } },
      );
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOpen(false);
    setIsCompleted(true);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to save onboarding state to localStorage",
          "Impossible de sauvegarder l'état de l'onboarding",
        ),
        { component: "OnboardingProvider", operation: "completeOnboarding", metadata: { error } },
      );
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    setIsCompleted(false);
    setCurrentStep(0);
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to remove onboarding state from localStorage",
          "Impossible de réinitialiser l'état de l'onboarding",
        ),
        { component: "OnboardingProvider", operation: "resetOnboarding", metadata: { error } },
      );
    }
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isCompleted,
        isOpen,
        currentStep,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw ErrorFactory.critical(
      "useOnboarding must be used within an OnboardingProvider",
      "Le hook useOnboarding doit être utilisé dans un OnboardingProvider",
    );
  }
  return context;
}
