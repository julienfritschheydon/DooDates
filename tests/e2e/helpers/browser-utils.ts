/**
 * Utilitaires pour gérer les différences entre navigateurs dans les tests.
 */

export type BrowserName = "chromium" | "firefox" | "webkit";

/**
 * Retourne les timeouts adaptés au navigateur
 * Permet d'avoir des timeouts plus longs pour les navigateurs plus lents
 */
export function getTimeouts(browserName: BrowserName) {
  // Valeurs par défaut
  const timeouts = {
    // Navigation et chargement de page
    navigation: 30000, // 30 secondes
    // Éléments interactifs
    element: 15000, // 15 secondes
    // Actions utilisateur
    action: 10000, // 10 secondes
    // Stabilité après un re-render
    stability: 1000, // 1 seconde
  };

  // Ajustements spécifiques au navigateur
  switch (browserName) {
    case "webkit": // Safari
      return {
        ...timeouts,
        navigation: 45000, // 45 secondes pour WebKit
        element: 20000, // 20 secondes
      };
    case "firefox":
      return {
        ...timeouts,
        navigation: 35000, // 35 secondes pour Firefox
      };
    default: // chromium
      return timeouts;
  }
}

/**
 * Attend qu'un élément soit stable (plus de changements pendant un certain temps)
 * Utile pour les interfaces réactives
 */
export async function waitForStableElement(
  locator: any,
  timeout = 1000,
  stabilityDelay = 500,
): Promise<void> {
  const startTime = Date.now();
  let lastChange = Date.now();
  let lastRect = await locator.boundingBox();

  // Vérifier les changements pendant le timeout
  while (Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const currentRect = await locator.boundingBox();
    const hasChanged = !rectsEqual(lastRect, currentRect);

    if (hasChanged) {
      lastChange = Date.now();
      lastRect = currentRect;
    } else if (Date.now() - lastChange >= stabilityDelay) {
      // Aucun changement pendant le délai de stabilité
      return;
    }
  }

  // Si on arrive ici, le timeout a été atteint
  console.warn("waitForStableElement: timeout atteint sans stabilité détectée");
}

/**
 * Compare deux rectangles pour détecter les changements
 */
function rectsEqual(a: any, b: any): boolean {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * Attend qu'une condition soit vraie avec un timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout = 10000,
  interval = 200,
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
}
