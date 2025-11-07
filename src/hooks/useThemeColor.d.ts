/**
 * Hook pour lire une CSS variable et la convertir en valeur utilisable
 *
 * Utile pour `accentColor` qui ne supporte pas `var(--theme-primary)` dans Chrome/Edge.
 * Ce hook lit la valeur résolue de la CSS variable depuis le DOM et se met à jour
 * automatiquement quand le thème change.
 *
 * @param cssVariable - Nom de la CSS variable (ex: '--theme-primary')
 * @param fallback - Valeur par défaut si la variable n'existe pas
 * @returns La valeur hexadécimale de la couleur
 *
 * @example
 * const primaryColor = useThemeColor('--theme-primary', '#3B82F6');
 * <input type="checkbox" style={{ accentColor: primaryColor }} />
 */
export declare function useThemeColor(cssVariable: string, fallback: string): string;
