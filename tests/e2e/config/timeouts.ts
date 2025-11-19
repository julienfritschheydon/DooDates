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
  element: 5000,       // 5s (réduit de 10s) - Attente d'un élément visible
  network: 15000,      // 15s (réduit de 30s) - Attente réseau inactif
  navigation: 7500,    // 7.5s (réduit de 15s) - Navigation entre pages
  aiResponse: 15000,   // 15s (réduit de 30s) - Réponse de l'IA
  animation: 2000,     // 2s - Animations CSS/transitions
  stability: 1000,     // 1s - Stabilité React (re-renders)
};

const FIREFOX_TIMEOUTS: TimeoutConfig = {
  element: 20000,      // Firefox est plus lent
  network: 40000,      // networkidle peut prendre plus de temps
  navigation: 20000,
  aiResponse: 35000,
  animation: 3000,
  stability: 1500,
};

const WEBKIT_TIMEOUTS: TimeoutConfig = {
  element: 15000,      // WebKit peut être plus lent
  network: 35000,
  navigation: 18000,
  aiResponse: 35000,
  animation: 2500,
  stability: 1200,
};

const MOBILE_TIMEOUTS: TimeoutConfig = {
  element: 20000,      // Mobile est généralement plus lent
  network: 40000,
  navigation: 25000,
  aiResponse: 40000,
  animation: 3000,
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

