/**
 * Lazy Icons - Helper pour lazy load les icônes lucide-react
 *
 * Permet de lazy load les icônes non critiques pour réduire le bundle initial
 * Les icônes critiques (comme Loader2) restent chargées normalement
 */

import React, { lazy, Suspense, ComponentType } from "react";

// Cache du module pour éviter les rechargements
let lucideModule: typeof import("lucide-react") | null = null;
let lucideLoadingPromise: Promise<typeof import("lucide-react")> | null = null;

const loadLucide = async (): Promise<typeof import("lucide-react")> => {
  if (lucideModule) {
    return lucideModule;
  }

  if (lucideLoadingPromise) {
    return lucideLoadingPromise;
  }

  lucideLoadingPromise = import("lucide-react").then((module) => {
    lucideModule = module;
    return module;
  });

  return lucideLoadingPromise;
};

/**
 * Crée un composant lazy pour une icône spécifique
 */
export function createLazyIcon<T extends ComponentType<any>>(
  iconName: string,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    loadLucide().then((module) => {
      const Icon = (module as any)[iconName];
      if (!Icon) {
        console.warn(`Icon ${iconName} not found in lucide-react`);
        // Fallback: retourner un composant vide
        return { default: () => null } as any;
      }
      return { default: Icon } as any;
    }),
  );
}

/**
 * Wrapper avec Suspense pour une icône lazy
 */
export function LazyIcon({
  name,
  fallback = null,
  ...props
}: {
  name: string;
  fallback?: React.ReactNode;
  [key: string]: any;
}) {
  const LazyIconComponent = createLazyIcon(name);

  return (
    <Suspense fallback={fallback || <span className="w-5 h-5" />}>
      <LazyIconComponent {...props} />
    </Suspense>
  );
}

/**
 * Précharger lucide-react (pour les icônes critiques)
 */
export function preloadLucideReact(): Promise<typeof import("lucide-react")> {
  return loadLucide();
}
