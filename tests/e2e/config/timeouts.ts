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
  element: 2000,        // 2s (réduit de 1s) - Éléments interactifs rapides
  network: 3000,        // 3s (réduit de 2s) - Réseau rapide
  navigation: 8000,    // 8s (augmenté de 3s) - Navigation SPA plus robuste pour CI
  aiResponse: 5000,     // 5s (réduit de 3s) - IA locale rapide
  animation: 1000,      // 1s (réduit de 1s) - Animations légères
  stability: 800,       // 0.8s (réduit de 0.7s) - React rapide
};

const FIREFOX_TIMEOUTS: TimeoutConfig = {
  element: 3000,       // Firefox plus lent mais 3s suffit
  network: 5000,       // networkidle peut prendre plus de temps
  navigation: 8000,    // Augmenté pour CI
  aiResponse: 8000,
  animation: 1500,
  stability: 1200,
};

const WEBKIT_TIMEOUTS: TimeoutConfig = {
  element: 2500,       // WebKit peut être plus lent
  network: 4000,
  navigation: 6000,    // Augmenté pour CI
  aiResponse: 6000,
  animation: 1500,
  stability: 1000,
};

const MOBILE_TIMEOUTS: TimeoutConfig = {
  element: 4000,       // Mobile est plus lent mais 4s suffit
  network: 6000,
  navigation: 8000,    // Augmenté pour CI
  aiResponse: 8000,
  animation: 1500,
  stability: 1200,
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
    case 'firefox':
      return FIREFOX_TIMEOUTS;
    case 'webkit':
      return WEBKIT_TIMEOUTS;
    default:
      return BASE_TIMEOUTS;
  }
}

/**
 * Exporte les timeouts de base pour utilisation directe
 */
export const TIMEOUTS = BASE_TIMEOUTS;

