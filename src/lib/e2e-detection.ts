/**
 * Détection environnement E2E pour DooDates
 *
 * Utilisé pour désactiver certaines fonctionnalités pendant les tests automatisés :
 * - Modals d'authentification
 * - Quotas stricts
 * - Onboarding automatique
 */

/**
 * Détecte si l'application tourne en mode test E2E
 *
 * Critères de détection :
 * - URL contient ?e2e-test=true
 * - User-agent contient "Playwright"
 * - window.navigator.webdriver === true
 */
export function isE2ETestingEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.location.search.includes("e2e-test") ||
    window.navigator.userAgent.includes("Playwright") ||
    window.navigator.webdriver === true
  );
}
