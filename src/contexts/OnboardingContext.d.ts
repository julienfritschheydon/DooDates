import React from "react";
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
export declare function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useOnboarding(): OnboardingContextType;
export {};
