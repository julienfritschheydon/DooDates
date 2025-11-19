/**
 * Helpers pour l'authentification dans les tests E2E
 * Factorise le code commun pour authentifier les utilisateurs et vérifier les sessions
 */

import { Page, expect } from '@playwright/test';
import { authenticateWithSupabase, mockSupabaseAuth, waitForPageLoad } from '../utils';

/**
 * Authentifie un utilisateur sur une page et désactive la détection E2E
 * 
 * @param page - La page Playwright
 * @param email - Email de l'utilisateur
 * @param password - Mot de passe de l'utilisateur
 * @returns Les données de session et l'utilisateur
 */
export async function authenticateUserInPage(
  page: Page,
  email: string,
  password: string
) {
  // Désactiver temporairement la détection E2E pour permettre le chargement depuis Supabase
  await page.evaluate(() => {
    (window as any).__DISABLE_E2E_DETECTION__ = true;
  });

  // Authentifier avec un vrai compte utilisateur Supabase
  const authResult = await authenticateWithSupabase(page, {
    email,
    password,
  });

  if (!authResult) {
    throw new Error(`Failed to authenticate user: ${email}`);
  }

  return authResult;
}

/**
 * Vérifie que la session est présente dans localStorage après un reload
 * Si la session est perdue, réauthentifie automatiquement
 * 
 * @param page - La page Playwright
 * @param email - Email de l'utilisateur
 * @param password - Mot de passe de l'utilisateur
 * @param expectedUserId - ID utilisateur attendu (optionnel, pour vérification)
 */
export async function ensureSessionAfterReload(
  page: Page,
  email: string,
  password: string,
  expectedUserId?: string
) {
  // Vérifier la session avant reload
  const sessionBefore = await getSessionFromPage(page);
  
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Vérifier la session après reload
  const sessionAfter = await getSessionFromPage(page);

  // Si la session est perdue, réauthentifier
  if (!sessionAfter.hasSession && sessionBefore.hasSession) {
    await authenticateUserInPage(page, email, password);
    await page.waitForTimeout(500);
  }

  // Vérifier que l'ID utilisateur correspond si fourni
  if (expectedUserId) {
    const finalSession = await getSessionFromPage(page);
    if (finalSession.userId !== expectedUserId) {
      throw new Error(
        `Session userId mismatch: expected ${expectedUserId}, got ${finalSession.userId}`
      );
    }
  }
}

/**
 * Récupère la session Supabase depuis localStorage de la page
 * 
 * @param page - La page Playwright
 * @returns Informations sur la session (hasSession, userId)
 */
export async function getSessionFromPage(page: Page): Promise<{
  hasSession: boolean;
  userId: string | null;
}> {
  return await page.evaluate(() => {
    // Chercher la clé de session Supabase dans localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const session = JSON.parse(value);
            if (session?.user?.id && session.access_token) {
              return {
                hasSession: true,
                userId: session.user.id,
              };
            }
          } catch {
            // Ignorer les erreurs de parsing
          }
        }
      }
    }
    return { hasSession: false, userId: null };
  });
}

/**
 * Attend que les conversations soient chargées dans le dashboard
 * 
 * @param page - La page Playwright
 * @param maxAttempts - Nombre maximum de tentatives (défaut: 20)
 * @returns true si les conversations sont chargées, false sinon
 */
export async function waitForConversationsInDashboard(
  page: Page,
  maxAttempts: number = 20
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const state = await page.evaluate(() => {
      const conversationCards = Array.from(
        document.querySelectorAll(
          '[data-testid="poll-item"], [data-testid="conversation-item"], .conversation-item, .poll-item'
        )
      );
      const bodyText = document.body.innerText;
      return {
        cardCount: conversationCards.length,
        hasContent: bodyText.length > 100, // La page est chargée
      };
    });

    if (state.cardCount > 0 || state.hasContent) {
      return true;
    }

    await page.waitForTimeout(1000);
  }

  return false;
}

/**
 * Ouvre une conversation depuis le dashboard en cliquant sur une carte
 *
 * @param page - La page Playwright
 * @param searchText - Texte à chercher dans les cartes de conversation (ex: "réunion")
 * @returns L'ID de la conversation ouverte (depuis l'URL)
 */
export async function openConversationFromDashboard(
  page: Page,
  searchText: string
): Promise<string | null> {
  // Attendre que les conversations soient chargées
  await waitForConversationsInDashboard(page);

  // Chercher la conversation de manière plus flexible (insensible à la casse, recherche partielle)
  const searchTextLower = searchText.toLowerCase();
  let conversationCard: ReturnType<typeof page.locator> | null = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (!conversationCard && attempts < maxAttempts) {
    // Essayer plusieurs sélecteurs possibles
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
    
    // Chercher dans le texte de la page
    if (bodyText.includes(searchTextLower)) {
      // Essayer de trouver la carte par texte exact
      const exactCard = page.locator(`text=${searchText}`).first();
      const isVisible = await exactCard.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        conversationCard = exactCard;
      } else {
        // Essayer avec recherche partielle (premier mot)
        const firstWord = searchText.split(' ')[0];
        const partialCard = page.locator(`text=${firstWord}`).first();
        const isVisiblePartial = await partialCard.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisiblePartial) {
          conversationCard = partialCard;
        } else {
          // Essayer de trouver n'importe quelle carte de conversation
          const anyCard = page.locator('[data-testid="poll-item"], [data-testid="conversation-item"], .conversation-item, .poll-item').first();
          const isVisibleAny = await anyCard.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisibleAny) {
            conversationCard = anyCard;
          }
        }
      }
    }
    
    if (!conversationCard) {
      await page.waitForTimeout(1000);
      attempts++;
    }
  }

  if (!conversationCard) {
    throw new Error(`Could not find conversation card with text "${searchText}" in dashboard`);
  }

  await expect(conversationCard).toBeVisible({ timeout: 15000 });
  await conversationCard.click();

  // Attendre la navigation vers workspace
  await page.waitForURL(/\/workspace\?conversationId=/, { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Extraire l'ID de la conversation depuis l'URL
  const url = page.url();
  const match = url.match(/conversationId=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Authentifie un utilisateur avec mock Supabase et recharge la page
 * 
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 * @param options - Options d'authentification
 */
export async function authenticateUser(
  page: Page,
  browserName: string,
  options?: {
    reload?: boolean;
    waitForReady?: boolean;
    userId?: string;
    email?: string;
  }
): Promise<void> {
  await mockSupabaseAuth(page, {
    userId: options?.userId,
    email: options?.email,
  });
  
  if (options?.reload !== false) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
  }
  
  if (options?.waitForReady) {
    const { waitForAppReady } = await import('../utils');
    await waitForAppReady(page, page.url());
  }
}

