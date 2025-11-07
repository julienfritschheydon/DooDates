interface ThemeSelectorProps {
    selectedThemeId: string;
    onThemeChange: (themeId: string) => void;
}
/**
 * Composant ThemeSelector
 * Sélecteur visuel de thèmes pour les formulaires
 */
export declare function ThemeSelector({ selectedThemeId, onThemeChange }: ThemeSelectorProps): import("react/jsx-runtime").JSX.Element;
export {};
