import type { Page } from '@playwright/test';

// Type commun de navigateur pour les tests E2E
export type BrowserName = 'chromium' | 'firefox' | 'webkit';

// Timeouts communs, alignés sur les implémentations existantes dans les helpers de polls
export function getTimeouts(browserName: BrowserName) {
  const timeouts = {
    navigation: 30000,
    element: 15000,
    action: 10000,
    stability: 1000,
  } as const;

  switch (browserName) {
    case 'webkit':
      return { ...timeouts, navigation: 45000, element: 20000 };
    case 'firefox':
      return { ...timeouts, navigation: 35000 };
    default:
      return timeouts;
  }
}
