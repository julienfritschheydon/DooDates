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
    "--theme-primary": string;
    "--theme-primary-hover": string;
    "--theme-primary-light": string;
    "--theme-secondary": string;
    "--theme-secondary-hover": string;
    "--theme-bg-main": string;
    "--theme-bg-card": string;
    "--theme-bg-input": string;
    "--theme-text-primary": string;
    "--theme-text-secondary": string;
    "--theme-text-muted": string;
    "--theme-border": string;
    "--theme-border-hover": string;
    "--theme-success": string;
    "--theme-error": string;
    "--theme-warning": string;
  };
}
/**
 * Thème Bleu Océan (par défaut)
 * Professionnel et rassurant
 */
export declare const THEME_BLUE: Theme;
/**
 * Thème Vert Nature
 * Écologique et apaisant
 */
export declare const THEME_GREEN: Theme;
/**
 * Thème Violet Créatif
 * Moderne et innovant
 */
export declare const THEME_PURPLE: Theme;
/**
 * Liste de tous les thèmes disponibles
 */
export declare const THEMES: Theme[];
/**
 * Thème par défaut
 */
export declare const DEFAULT_THEME: Theme;
/**
 * Récupère un thème par son ID
 */
export declare function getThemeById(id: string): Theme;
/**
 * Applique un thème au document
 */
export declare function applyTheme(theme: Theme): void;
/**
 * Réinitialise le thème (applique le thème par défaut)
 */
export declare function resetTheme(): void;
