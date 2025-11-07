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
export declare const spacing: {
    /** 4px - Espacement minimal entre éléments très proches */
    readonly xs: "1";
    /** 8px - Espacement entre éléments liés */
    readonly sm: "2";
    /** 12px - Espacement standard entre éléments */
    readonly md: "3";
    /** 16px - Espacement entre sections */
    readonly lg: "4";
    /** 24px - Espacement entre groupes majeurs */
    readonly xl: "6";
    /** 32px - Espacement entre sections principales */
    readonly "2xl": "8";
    /** 48px - Espacement très large */
    readonly "3xl": "12";
};
/**
 * Gaps pour flexbox et grid
 */
export declare const gaps: {
    /** gap-1 (4px) - Éléments très proches (badges, chips) */
    readonly xs: "gap-1";
    /** gap-2 (8px) - Éléments liés (icône + texte) */
    readonly sm: "gap-2";
    /** gap-3 (12px) - Éléments dans un groupe */
    readonly md: "gap-3";
    /** gap-4 (16px) - Sections */
    readonly lg: "gap-4";
    /** gap-6 (24px) - Groupes majeurs */
    readonly xl: "gap-6";
};
/**
 * Padding cohérent
 */
export declare const padding: {
    /** p-2 (8px) - Padding minimal */
    readonly xs: "p-2";
    /** p-3 (12px) - Padding standard pour petits éléments */
    readonly sm: "p-3";
    /** p-4 (16px) - Padding standard */
    readonly md: "p-4";
    /** p-6 (24px) - Padding large */
    readonly lg: "p-6";
    /** p-8 (32px) - Padding très large */
    readonly xl: "p-8";
};
/**
 * Marges cohérentes
 */
export declare const margin: {
    /** mb-2 (8px) - Marge minimale */
    readonly xs: "mb-2";
    /** mb-3 (12px) - Marge standard */
    readonly sm: "mb-3";
    /** mb-4 (16px) - Marge entre sections */
    readonly md: "mb-4";
    /** mb-6 (24px) - Marge large */
    readonly lg: "mb-6";
    /** mb-8 (32px) - Marge très large */
    readonly xl: "mb-8";
};
/**
 * Durées de transition cohérentes
 */
export declare const transitions: {
    /** 150ms - Transition rapide (hover, focus) */
    readonly fast: "duration-150";
    /** 200ms - Transition standard */
    readonly normal: "duration-200";
    /** 300ms - Transition lente (animations complexes) */
    readonly slow: "duration-300";
    /** 500ms - Transition très lente (modals, slides) */
    readonly slower: "duration-500";
};
/**
 * Animations prédéfinies pour Framer Motion
 */
export declare const animations: {
    /** Fade in simple */
    readonly fadeIn: {
        readonly initial: {
            readonly opacity: 0;
        };
        readonly animate: {
            readonly opacity: 1;
        };
        readonly exit: {
            readonly opacity: 0;
        };
    };
    /** Slide from bottom */
    readonly slideUp: {
        readonly initial: {
            readonly opacity: 0;
            readonly y: 20;
        };
        readonly animate: {
            readonly opacity: 1;
            readonly y: 0;
        };
        readonly exit: {
            readonly opacity: 0;
            readonly y: 20;
        };
    };
    /** Slide from top */
    readonly slideDown: {
        readonly initial: {
            readonly opacity: 0;
            readonly y: -20;
        };
        readonly animate: {
            readonly opacity: 1;
            readonly y: 0;
        };
        readonly exit: {
            readonly opacity: 0;
            readonly y: -20;
        };
    };
    /** Scale in */
    readonly scaleIn: {
        readonly initial: {
            readonly opacity: 0;
            readonly scale: 0.95;
        };
        readonly animate: {
            readonly opacity: 1;
            readonly scale: 1;
        };
        readonly exit: {
            readonly opacity: 0;
            readonly scale: 0.95;
        };
    };
    /** Slide from right */
    readonly slideRight: {
        readonly initial: {
            readonly opacity: 0;
            readonly x: 20;
        };
        readonly animate: {
            readonly opacity: 1;
            readonly x: 0;
        };
        readonly exit: {
            readonly opacity: 0;
            readonly x: 20;
        };
    };
};
/**
 * Bordures arrondies cohérentes
 */
export declare const borderRadius: {
    /** rounded-md (6px) - Standard */
    readonly sm: "rounded-md";
    /** rounded-lg (8px) - Cards */
    readonly md: "rounded-lg";
    /** rounded-xl (12px) - Sections importantes */
    readonly lg: "rounded-xl";
    /** rounded-2xl (16px) - Modals, grandes cards */
    readonly xl: "rounded-2xl";
    /** rounded-full - Badges, avatars */
    readonly full: "rounded-full";
};
/**
 * Ombres cohérentes
 */
export declare const shadows: {
    /** shadow-sm - Ombre légère */
    readonly sm: "shadow-sm";
    /** shadow-md - Ombre standard */
    readonly md: "shadow-md";
    /** shadow-lg - Ombre importante */
    readonly lg: "shadow-lg";
    /** shadow-xl - Ombre très importante */
    readonly xl: "shadow-xl";
};
/**
 * Helper pour combiner des classes Tailwind de manière cohérente
 */
export declare function getCardClasses(variant?: "default" | "elevated" | "outlined"): string;
/**
 * Helper pour les espacements de conteneurs
 */
export declare function getContainerSpacing(): string;
/**
 * Helper pour les groupes d'éléments
 */
export declare function getGroupSpacing(): string;
