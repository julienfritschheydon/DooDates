/**
 * Design Tokens - Système d'espacement et de design cohérent
 * 
 * Ce fichier centralise tous les tokens de design pour garantir
 * une cohérence visuelle à travers toute l'application.
 */

/**
 * Espacement cohérent basé sur une échelle de 4px
 * Utiliser ces valeurs plutôt que des valeurs arbitraires
 */
export const spacing = {
  /** 4px - Espacement minimal entre éléments très proches */
  xs: "1",
  /** 8px - Espacement entre éléments liés */
  sm: "2",
  /** 12px - Espacement standard entre éléments */
  md: "3",
  /** 16px - Espacement entre sections */
  lg: "4",
  /** 24px - Espacement entre groupes majeurs */
  xl: "6",
  /** 32px - Espacement entre sections principales */
  "2xl": "8",
  /** 48px - Espacement très large */
  "3xl": "12",
} as const;

/**
 * Gaps pour flexbox et grid
 */
export const gaps = {
  /** gap-1 (4px) - Éléments très proches (badges, chips) */
  xs: "gap-1",
  /** gap-2 (8px) - Éléments liés (icône + texte) */
  sm: "gap-2",
  /** gap-3 (12px) - Éléments dans un groupe */
  md: "gap-3",
  /** gap-4 (16px) - Sections */
  lg: "gap-4",
  /** gap-6 (24px) - Groupes majeurs */
  xl: "gap-6",
} as const;

/**
 * Padding cohérent
 */
export const padding = {
  /** p-2 (8px) - Padding minimal */
  xs: "p-2",
  /** p-3 (12px) - Padding standard pour petits éléments */
  sm: "p-3",
  /** p-4 (16px) - Padding standard */
  md: "p-4",
  /** p-6 (24px) - Padding large */
  lg: "p-6",
  /** p-8 (32px) - Padding très large */
  xl: "p-8",
} as const;

/**
 * Marges cohérentes
 */
export const margin = {
  /** mb-2 (8px) - Marge minimale */
  xs: "mb-2",
  /** mb-3 (12px) - Marge standard */
  sm: "mb-3",
  /** mb-4 (16px) - Marge entre sections */
  md: "mb-4",
  /** mb-6 (24px) - Marge large */
  lg: "mb-6",
  /** mb-8 (32px) - Marge très large */
  xl: "mb-8",
} as const;

/**
 * Durées de transition cohérentes
 */
export const transitions = {
  /** 150ms - Transition rapide (hover, focus) */
  fast: "duration-150",
  /** 200ms - Transition standard */
  normal: "duration-200",
  /** 300ms - Transition lente (animations complexes) */
  slow: "duration-300",
  /** 500ms - Transition très lente (modals, slides) */
  slower: "duration-500",
} as const;

/**
 * Animations prédéfinies pour Framer Motion
 */
export const animations = {
  /** Fade in simple */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  /** Slide from bottom */
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  /** Slide from top */
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  /** Scale in */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  /** Slide from right */
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
} as const;

/**
 * Bordures arrondies cohérentes
 */
export const borderRadius = {
  /** rounded-md (6px) - Standard */
  sm: "rounded-md",
  /** rounded-lg (8px) - Cards */
  md: "rounded-lg",
  /** rounded-xl (12px) - Sections importantes */
  lg: "rounded-xl",
  /** rounded-2xl (16px) - Modals, grandes cards */
  xl: "rounded-2xl",
  /** rounded-full - Badges, avatars */
  full: "rounded-full",
} as const;

/**
 * Ombres cohérentes
 */
export const shadows = {
  /** shadow-sm - Ombre légère */
  sm: "shadow-sm",
  /** shadow-md - Ombre standard */
  md: "shadow-md",
  /** shadow-lg - Ombre importante */
  lg: "shadow-lg",
  /** shadow-xl - Ombre très importante */
  xl: "shadow-xl",
} as const;

/**
 * Helper pour combiner des classes Tailwind de manière cohérente
 */
export function getCardClasses(variant: "default" | "elevated" | "outlined" = "default"): string {
  const base = `${borderRadius.xl} ${padding.md}`;

  switch (variant) {
    case "elevated":
      return `${base} bg-white ${shadows.lg} border border-gray-100`;
    case "outlined":
      return `${base} bg-white border-2 border-gray-200`;
    default:
      return `${base} bg-white ${shadows.sm} border border-gray-100`;
  }
}

/**
 * Helper pour les espacements de conteneurs
 */
export function getContainerSpacing(): string {
  return `space-y-${spacing.lg}`;
}

/**
 * Helper pour les groupes d'éléments
 */
export function getGroupSpacing(): string {
  return `space-y-${spacing.md}`;
}
