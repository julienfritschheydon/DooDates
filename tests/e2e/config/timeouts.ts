/**
 * Configuration centralisée des timeouts pour les tests E2E
 * Permet d'ajuster globalement les timeouts selon le navigateur
 */

export interface TimeoutConfig {
  element: number;
  network: number;
  navigation: number;
  aiResponse: number;
  animation: number;
  stability: number;
}

const BASE_TIMEOUTS: TimeoutConfig = {
  element: 3000, // 3s - Éléments interactifs rapides
  network: 5000, // 5s - Réseau rapide
  navigation: 8000, // 8s - Navigation SPA robuste pour CI
  aiResponse: 8000, // 8s - IA locale rapide
  animation: 1500, // 1.5s - Animations légères
  stability: 1200, // 1.2s - React rapide
};

const FIREFOX_TIMEOUTS: TimeoutConfig = {
  element: 4000, // Firefox plus lent
  network: 6000, // networkidle peut prendre plus de temps
  navigation: 10000, // 10s pour Firefox CI
  aiResponse: 10000,
  animation: 2000,
  stability: 1500,
};

const WEBKIT_TIMEOUTS: TimeoutConfig = {
  element: 3500, // WebKit peut être plus lent
  network: 5000,
  navigation: 8000, // 8s pour WebKit CI
  aiResponse: 8000,
  animation: 2000,
  stability: 1200,
};

const MOBILE_TIMEOUTS: TimeoutConfig = {
  element: 5000, // Mobile est plus lent
  network: 8000,
  navigation: 10000, // 10s pour Mobile CI
  aiResponse: 10000,
  animation: 2000,
  stability: 1500,
};

/**
 * Récupère la configuration de timeouts selon le navigateur
 *
 * @param browserName - Le nom du navigateur ('chromium', 'firefox', 'webkit', etc.)
 * @param isMobile - Si le test s'exécute sur mobile
 * @returns Configuration de timeouts adaptée
 */
export function getTimeouts(browserName: string, isMobile: boolean = false): TimeoutConfig {
  if (isMobile) {
    return MOBILE_TIMEOUTS;
  }

  switch (browserName.toLowerCase()) {
    case "firefox":
      return FIREFOX_TIMEOUTS;
    case "webkit":
      return WEBKIT_TIMEOUTS;
    default:
      return BASE_TIMEOUTS;
  }
}

/**
 * Exporte les timeouts de base pour utilisation directe
 */
export const TIMEOUTS = BASE_TIMEOUTS;
