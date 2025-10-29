/**
 * Feature Flags
 *
 * Permet d'activer/désactiver des fonctionnalités via variables d'environnement
 *
 * Note: Le feature flag AI_FIRST_UX a été supprimé car l'UX IA-First
 * est maintenant l'UX par défaut (mergé le 29/10/2025)
 */

export const FEATURES = {
  // Placeholder pour futurs feature flags
} as const;

/**
 * Helper pour vérifier si une feature est active
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
