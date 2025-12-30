/**
 * Design System Tokens - DooDates
 *
 * Tokens de design pour assurer la cohérence visuelle
 * entre tous les produits (Date Polls, Form Polls, Availability, Quizz)
 *
 * Basé sur le style Gemini inspiré de Google Gemini
 */

export const DESIGN_TOKENS = {
  // Spacing
  spacing: {
    xs: "gap-2", // 8px
    sm: "gap-3", // 12px
    md: "gap-4", // 16px
    lg: "gap-6", // 24px
    xl: "gap-8", // 32px
  },

  // Padding
  padding: {
    xs: "p-2", // 8px
    sm: "p-3", // 12px
    md: "p-4", // 16px
    lg: "p-6", // 24px
    xl: "p-8", // 32px
  },

  // Padding Top (pour les pages)
  paddingTop: {
    standard: "pt-8", // 32px - standard
    tall: "pt-12", // 48px - pour headers
    tallWithNav: "pt-20", // 80px - avec TopNav fixe
  },

  // Border Radius
  borderRadius: {
    sm: "rounded-md", // 6px
    md: "rounded-lg", // 8px - standard
    lg: "rounded-xl", // 12px - pour les cartes
    xl: "rounded-2xl", // 16px - pour les modales
    full: "rounded-full", // pour les inputs/boutons ronds
  },

  // Shadows
  shadows: {
    none: "shadow-none",
    sm: "shadow-sm", // léger, pour les cartes
    md: "shadow-md", // moyen
    lg: "shadow-lg", // pour les éléments qui flottent
    glow: "shadow-[0_0_15px_rgba(255,255,255,0.1)]", // glow blanc (style Gemini)
  },

  // Icon Sizes
  iconSizes: {
    xs: "w-3 h-3", // 12px
    sm: "w-4 h-4", // 16px - boutons, inline
    md: "w-5 h-5", // 20px - headers, navigation
    lg: "w-6 h-6", // 24px - titres, hero sections
    xl: "w-8 h-8", // 32px - grandes icônes
  },

  // Text Sizes
  textSizes: {
    xs: "text-xs", // 12px - captions
    sm: "text-sm", // 14px - labels, métadonnées
    base: "text-base", // 16px - body text
    lg: "text-lg", // 18px - sous-titres
    xl: "text-xl", // 20px - titres
    "2xl": "text-2xl", // 24px - grands titres
    "3xl": "text-3xl", // 30px - très grands titres
  },

  // Couleurs de fond (thème sombre Gemini)
  backgrounds: {
    primary: "#0a0a0a", // Zone de chat, fond principal
    secondary: "#1e1e1e", // Sidebar, cartes
    tertiary: "#2a2a2a", // Cartes alternatives
    accent: "#3c4043", // Messages utilisateur
  },

  // Couleurs thématiques par produit
  productColors: {
    date: {
      primary: "#3b82f6", // blue-500
      hover: "#2563eb", // blue-600
      light: "#dbeafe", // blue-100
      dark: "#1e40af", // blue-800
    },
    form: {
      primary: "#8b5cf6", // violet-500
      hover: "#7c3aed", // violet-600
      light: "#ede9fe", // violet-100
      dark: "#6d28d9", // violet-800
    },
    availability: {
      primary: "#10b981", // emerald-500
      hover: "#059669", // emerald-600
      light: "#d1fae5", // emerald-100
      dark: "#047857", // emerald-700
    },
    quizz: {
      primary: "#f59e0b", // amber-500
      hover: "#d97706", // amber-600
      light: "#fef3c7", // amber-100
      dark: "#b45309", // amber-700
    },
  },

  // Couleurs texte
  textColors: {
    primary: "#ffffff", // Blanc - texte principal
    secondary: "#d1d5db", // gray-300 - texte secondaire
    tertiary: "#9ca3af", // gray-400 - texte tertiaire
    muted: "#6b7280", // gray-500 - texte désactivé
  },

  // Couleurs de bordure
  borderColors: {
    primary: "#374151", // gray-700 - bordures standard
    secondary: "#4b5563", // gray-600 - bordures secondaires
    accent: "#6b7280", // gray-500 - bordures d'accent
  },

  // Boutons - Tailles standard
  buttonSizes: {
    sm: "px-3 py-1.5 text-sm", // Petit
    md: "px-4 py-2 text-sm", // Standard (défaut)
    lg: "px-6 py-3 text-base", // Grand
    xl: "px-8 py-4 text-lg", // Très grand
  },

  // Largeurs maximales pour les conteneurs
  maxWidths: {
    sm: "max-w-2xl", // 672px - formulaires simples
    md: "max-w-4xl", // 896px - contenu standard
    lg: "max-w-6xl", // 1152px - contenu large
    xl: "max-w-7xl", // 1280px - très large
    full: "max-w-full", // pleine largeur
  },

  // Transitions
  transitions: {
    fast: "transition-all duration-150",
    standard: "transition-all duration-200",
    slow: "transition-all duration-300",
  },

  // Z-index layers
  zIndex: {
    base: "z-0",
    dropdown: "z-10",
    sticky: "z-20",
    fixed: "z-30",
    overlay: "z-40",
    modal: "z-50",
    tooltip: "z-60",
  },
};

// Helper functions pour générer des classes CSS
export const getButtonClasses = (
  product: keyof typeof DESIGN_TOKENS.productColors,
  size: keyof typeof DESIGN_TOKENS.buttonSizes = "md",
  variant: "primary" | "secondary" | "ghost" = "primary",
) => {
  const colors = DESIGN_TOKENS.productColors[product];
  const sizeClasses = DESIGN_TOKENS.buttonSizes[size];
  const radius = DESIGN_TOKENS.borderRadius.md;
  const transition = DESIGN_TOKENS.transitions.standard;

  const baseClasses = `${sizeClasses} ${radius} ${transition} font-medium`;

  switch (variant) {
    case "primary":
      return `${baseClasses} bg-${product}-500 hover:bg-${product}-600 text-white shadow-lg`;
    case "secondary":
      return `${baseClasses} border border-${product}-500 text-${product}-500 hover:bg-${product}-500 hover:text-white`;
    case "ghost":
      return `${baseClasses} text-gray-400 hover:text-white hover:bg-gray-700`;
    default:
      return baseClasses;
  }
};

export const getCardClasses = (variant: "default" | "elevated" | "flat" = "default") => {
  const radius = DESIGN_TOKENS.borderRadius.lg;
  const transition = DESIGN_TOKENS.transitions.standard;

  const baseClasses = `${radius} ${transition}`;

  switch (variant) {
    case "default":
      return `${baseClasses} bg-gray-800/50 border border-gray-700 hover:border-gray-600`;
    case "elevated":
      return `${baseClasses} ${DESIGN_TOKENS.shadows.sm} bg-gray-800/50 border border-gray-700`;
    case "flat":
      return `${baseClasses} bg-transparent border-0`;
    default:
      return baseClasses;
  }
};

export default DESIGN_TOKENS;
