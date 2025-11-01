import { useEffect, useState } from "react";

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
export function useThemeColor(cssVariable: string, fallback: string): string {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    const updateColor = () => {
      // Lire la valeur de la CSS variable depuis le root element
      const root = document.documentElement;
      const computedColor = getComputedStyle(root)
        .getPropertyValue(cssVariable)
        .trim();
      
      if (computedColor) {
        setColor(computedColor);
      } else {
        setColor(fallback);
      }
    };

    // Lire immédiatement
    updateColor();

    // Re-lire après un court délai pour s'assurer que le thème est appliqué
    const timeoutId = setTimeout(updateColor, 100);

    // Observer les changements de style sur le root element
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [cssVariable, fallback]);

  return color;
}
