interface LoadingSpinnerProps {
    /** Taille du spinner */
    size?: "sm" | "md" | "lg" | "xl";
    /** Texte à afficher sous le spinner */
    text?: string;
    /** Classe CSS additionnelle */
    className?: string;
    /** Centrer verticalement et horizontalement */
    centered?: boolean;
}
/**
 * Composant de loading spinner cohérent
 * Utilise Lucide React pour l'icône
 */
export declare function LoadingSpinner({ size, text, className, centered, }: LoadingSpinnerProps): import("react/jsx-runtime").JSX.Element;
/**
 * Spinner inline pour les boutons
 */
export declare function ButtonSpinner({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Overlay de loading plein écran
 */
export declare function LoadingOverlay({ text }: {
    text?: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
