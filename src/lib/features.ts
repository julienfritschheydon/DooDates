/**
 * Feature Flags
 *
 * Permet d'activer/désactiver des fonctionnalités via variables d'environnement
 *
 * Usage:
 * 1. Dev: Créer .env.local avec NEXT_PUBLIC_AI_FIRST_UX=true
 * 2. Prod: Contrôler via .env.production
 * 3. Rollback: Mettre à false pour désactiver instantanément
 */

export const FEATURES = {
  /**
   * UX IA-First avec chat landing et sidebar
   *
   * Quand activé:
   * - Route / devient chat landing
   * - Layout avec sidebar au lieu de TopNav
   * - Nouveau workspace /workspace
   *
   * Quand désactivé:
   * - Route / reste dashboard classique
   * - Layout avec TopNav existant
   * - Pas de changement UX
   */
  AI_FIRST_UX: import.meta.env.VITE_AI_FIRST_UX === "true",
} as const;

/**
 * Helper pour vérifier si une feature est active
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
