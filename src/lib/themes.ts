/**
 * Thèmes visuels pour les formulaires
 * Quick Win #3 : 3 thèmes basiques gratuits
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  cssVariables: {
    // Couleurs principales
    "--theme-primary": string;
    "--theme-primary-hover": string;
    "--theme-primary-light": string;
    "--theme-secondary": string;
    "--theme-secondary-hover": string;

    // Arrière-plans
    "--theme-bg-main": string;
    "--theme-bg-card": string;
    "--theme-bg-input": string;

    // Textes
    "--theme-text-primary": string;
    "--theme-text-secondary": string;
    "--theme-text-muted": string;

    // Bordures
    "--theme-border": string;
    "--theme-border-hover": string;

    // États
    "--theme-success": string;
    "--theme-error": string;
    "--theme-warning": string;
  };
}

/**
 * Thème Bleu Océan (par défaut)
 * Professionnel et rassurant
 */
export const THEME_BLUE: Theme = {
  id: "blue",
  name: "Bleu Océan",
  description: "Professionnel et rassurant",
  preview: {
    primary: "#3B82F6",
    secondary: "#60A5FA",
    background: "#F8FAFC",
    text: "#1E293B",
  },
  cssVariables: {
    "--theme-primary": "#3B82F6",
    "--theme-primary-hover": "#2563EB",
    "--theme-primary-light": "#DBEAFE",
    "--theme-secondary": "#60A5FA",
    "--theme-secondary-hover": "#3B82F6",

    "--theme-bg-main": "#F8FAFC",
    "--theme-bg-card": "#FFFFFF",
    "--theme-bg-input": "#F1F5F9",

    "--theme-text-primary": "#1E293B",
    "--theme-text-secondary": "#475569",
    "--theme-text-muted": "#94A3B8",

    "--theme-border": "#E2E8F0",
    "--theme-border-hover": "#CBD5E1",

    "--theme-success": "#10B981",
    "--theme-error": "#EF4444",
    "--theme-warning": "#F59E0B",
  },
};

/**
 * Thème Vert Nature
 * Écologique et apaisant
 */
export const THEME_GREEN: Theme = {
  id: "green",
  name: "Vert Nature",
  description: "Écologique et apaisant",
  preview: {
    primary: "#10B981",
    secondary: "#34D399",
    background: "#F0FDF4",
    text: "#064E3B",
  },
  cssVariables: {
    "--theme-primary": "#10B981",
    "--theme-primary-hover": "#059669",
    "--theme-primary-light": "#D1FAE5",
    "--theme-secondary": "#34D399",
    "--theme-secondary-hover": "#10B981",

    "--theme-bg-main": "#F0FDF4",
    "--theme-bg-card": "#FFFFFF",
    "--theme-bg-input": "#ECFDF5",

    "--theme-text-primary": "#064E3B",
    "--theme-text-secondary": "#047857",
    "--theme-text-muted": "#6EE7B7",

    "--theme-border": "#D1FAE5",
    "--theme-border-hover": "#A7F3D0",

    "--theme-success": "#10B981",
    "--theme-error": "#EF4444",
    "--theme-warning": "#F59E0B",
  },
};

/**
 * Thème Violet Créatif
 * Moderne et innovant
 */
export const THEME_PURPLE: Theme = {
  id: "purple",
  name: "Violet Créatif",
  description: "Moderne et innovant",
  preview: {
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    background: "#FAF5FF",
    text: "#4C1D95",
  },
  cssVariables: {
    "--theme-primary": "#8B5CF6",
    "--theme-primary-hover": "#7C3AED",
    "--theme-primary-light": "#EDE9FE",
    "--theme-secondary": "#A78BFA",
    "--theme-secondary-hover": "#8B5CF6",

    "--theme-bg-main": "#FAF5FF",
    "--theme-bg-card": "#FFFFFF",
    "--theme-bg-input": "#F5F3FF",

    "--theme-text-primary": "#4C1D95",
    "--theme-text-secondary": "#6D28D9",
    "--theme-text-muted": "#C4B5FD",

    "--theme-border": "#EDE9FE",
    "--theme-border-hover": "#DDD6FE",

    "--theme-success": "#10B981",
    "--theme-error": "#EF4444",
    "--theme-warning": "#F59E0B",
  },
};

/**
 * Liste de tous les thèmes disponibles
 */
export const THEMES: Theme[] = [THEME_BLUE, THEME_GREEN, THEME_PURPLE];

/**
 * Thème par défaut
 */
export const DEFAULT_THEME = THEME_BLUE;

/**
 * Récupère un thème par son ID
 */
export function getThemeById(id: string): Theme {
  return THEMES.find((theme) => theme.id === id) || DEFAULT_THEME;
}

/**
 * Applique un thème au document
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Réinitialise le thème (applique le thème par défaut)
 */
export function resetTheme(): void {
  applyTheme(DEFAULT_THEME);
}
