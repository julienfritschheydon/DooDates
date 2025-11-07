/**
 * Lazy Icons - Helper pour lazy load les icônes lucide-react
 *
 * Permet de lazy load les icônes non critiques pour réduire le bundle initial
 * Les icônes critiques (comme Loader2) restent chargées normalement
 */
import React, { ComponentType } from "react";
/**
 * Crée un composant lazy pour une icône spécifique
 */
export declare function createLazyIcon<T extends ComponentType<any>>(iconName: string): React.LazyExoticComponent<T>;
/**
 * Wrapper avec Suspense pour une icône lazy
 */
export declare function LazyIcon({ name, fallback, ...props }: {
    name: string;
    fallback?: React.ReactNode;
    [key: string]: any;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Précharger lucide-react (pour les icônes critiques)
 */
export declare function preloadLucideReact(): Promise<typeof import("lucide-react")>;
