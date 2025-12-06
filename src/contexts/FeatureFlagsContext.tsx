/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, ReactNode } from "react";
import { ErrorFactory } from "@/lib/error-handling";

interface FeatureFlags {
  // Product features
  enableDatePolls: boolean;
  enableFormPolls: boolean;
  enableQuizz: boolean;

  // UI features
  enableDarkMode: boolean;
  enableAdvancedFilters: boolean;
  enableExportFeatures: boolean;

  // Beta features
  enableBetaFeatures: boolean;
  enableNewDashboard: boolean;

  // Analytics
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
}

const defaultFlags: FeatureFlags = {
  enableDatePolls: true,
  enableFormPolls: true,
  enableQuizz: false, // Coming soon
  enableDarkMode: true,
  enableAdvancedFilters: true,
  enableExportFeatures: true,
  enableBetaFeatures: false,
  enableNewDashboard: false,
  enableAnalytics: true,
  enableErrorTracking: true,
};

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isEnabled: (feature: keyof FeatureFlags) => boolean;
  updateFlag: (feature: keyof FeatureFlags, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlags>;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  initialFlags = {},
}) => {
  const [flags, setFlags] = React.useState<FeatureFlags>({
    ...defaultFlags,
    ...initialFlags,
  });

  const isEnabled = (feature: keyof FeatureFlags): boolean => {
    return flags[feature] || false;
  };

  const updateFlag = (feature: keyof FeatureFlags, value: boolean) => {
    setFlags((prev) => ({ ...prev, [feature]: value }));
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isEnabled, updateFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw ErrorFactory.validation(
      "useFeatureFlags must be used within a FeatureFlagsProvider",
      "Erreur de configuration du contexte",
    );
  }
  return context;
};
