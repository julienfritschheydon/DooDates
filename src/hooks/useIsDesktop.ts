import { useState, useEffect } from "react";

/**
 * Hook pour détecter si l'utilisateur est sur desktop
 * @returns true si desktop, false si mobile/tablette
 */
export function useIsDesktop(): boolean {
  // Initialiser avec la valeur réelle pour éviter le flash
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });

  useEffect(() => {
    const checkIsDesktop = () => {
      // Considérer comme desktop si largeur >= 768px (tablette en mode paysage et desktop)
      setIsDesktop(window.innerWidth >= 768);
    };

    // Vérifier au montage
    checkIsDesktop();

    // Écouter les changements de taille
    window.addEventListener("resize", checkIsDesktop);

    return () => {
      window.removeEventListener("resize", checkIsDesktop);
    };
  }, []);

  return isDesktop;
}
