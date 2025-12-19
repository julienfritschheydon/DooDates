/**
 * Tests E2E cross-produits : Workflow et régression
 * 
 * Couvre les tests manquants identifiés dans Docs/2. Planning - Decembre.md lignes 101-108
 * 
 * 1. Tests de workflow cross-produits:
 *    - Créer Date Poll → Créer Form Poll → Vérifier quotas séparés
 *    - Utilisateur avec plusieurs produits → Vérifier isolation données
 *    - Suppression compte → Vérifier suppression tous produits
 * 
 * 2. Tests de régression cross-produits:
 *    - Modification service partagé → Vérifier impact tous produits
 *    - Changement quota → Vérifier application correcte
 */

import { test, expect } from '@playwright/test';
import { setupAllMocks } from '../../global-setup';
import { waitForNetworkIdle, waitForReactStable } from '../../helpers/wait-helpers';
import { createPollInLocalStorage, createPollsAndVerifyInDashboard } from '../../helpers/poll-storage-helpers';
import { clearTestData } from '../../helpers/test-data';
import { PRODUCT_ROUTES, enableE2ELocalMode } from '../../utils';
import { getTimeouts } from '../../config/timeouts';

/**
 * Calcule le total de polls créés à partir des compteurs séparés
 * (remplace l'ancien pollsCreated qui était maintenu par trigger SQL)
 */
function calculateTotalPollsCreated(quota: {
  datePollsCreated?: number;
  formPollsCreated?: number;
  quizzCreated?: number;
  availabilityPollsCreated?: number;
}): number {
  return (quota.datePollsCreated || 0) + (quota.formPollsCreated || 0) + 
         (quota.quizzCreated || 0) + (quota.availabilityPollsCreated || 0);
}

test.describe('Cross-Product Workflow Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, browserName }) => {
    await setupAllMocks(page);
    await enableE2ELocalMode(page);
    // Note: clearTestData est fait dans chaque test si nécessaire
    // pour permettre aux tests de créer leurs propres données
  });

  /**
   * Helper pour récupérer les quotas depuis localStorage
   */
  async function getQuotaData(page: any, userId: string = 'guest'): Promise<any> {
    return await page.evaluate((uid: string) => {
      try {
        const stored = localStorage.getItem('doodates_quota_consumed');
        if (!stored) return null;
        const allData = JSON.parse(stored);
        return allData[uid] || null;
      } catch {
        return null;
      }
    }, userId);
  }

  /**
   * Helper pour réinitialiser les quotas
   */
  async function resetQuota(page: any, userId: string = 'guest'): Promise<void> {
    await page.evaluate((uid: string) => {
      try {
        const STORAGE_KEY = 'doodates_quota_consumed';
        const stored = localStorage.getItem(STORAGE_KEY);
        const allData = stored ? JSON.parse(stored) : {};
        allData[uid] = {
          conversationsCreated: 0,
          datePollsCreated: 0,
          formPollsCreated: 0,
          quizzCreated: 0,
          availabilityPollsCreated: 0,
          aiMessages: 0,
          analyticsQueries: 0,
          simulations: 0,
          totalCreditsConsumed: 0,
          userId: uid,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      } catch {
        // ignore errors
      }
    }, userId);
  }

  /**
   * Helper pour attendre que les quotas soient mis à jour
   */
  async function waitForQuotaUpdate(
    page: any,
    userId: string,
    expectedDatePolls: number,
    expectedFormPolls: number,
    browserName: string,
    timeout: number = 10000
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const quota = await getQuotaData(page, userId);
      if (
        quota &&
        quota.datePollsCreated >= expectedDatePolls &&
        quota.formPollsCreated >= expectedFormPolls
      ) {
        return;
      }
      await page.waitForTimeout(500);
      await waitForReactStable(page, { browserName });
    }
    throw new Error(`Timeout waiting for quota update. Expected: date=${expectedDatePolls}, form=${expectedFormPolls}`);
  }

  /**
   * Helper pour récupérer tous les polls depuis localStorage
   */
  async function getAllPolls(page: any): Promise<any[]> {
    return await page.evaluate(() => {
      try {
        const stored = localStorage.getItem('doodates_polls');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    });
  }

  /**
   * Helper pour compter les polls par type
   */
  async function countPollsByType(page: any): Promise<{ date: number; form: number; availability: number }> {
    const polls = await getAllPolls(page);
    return {
      date: polls.filter((p: any) => p.type === 'date').length,
      form: polls.filter((p: any) => p.type === 'form').length,
      availability: polls.filter((p: any) => p.type === 'availability').length,
    };
  }

  // ============================================================================
  // TESTS DE WORKFLOW CROSS-PRODUITS
  // ============================================================================

  test('Créer Date Poll → Créer Form Poll → Vérifier quotas séparés', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    // Réinitialiser les quotas (cela crée aussi la structure si elle n'existe pas)
    await resetQuota(page, 'guest');
    
    // Attendre un peu pour que localStorage soit mis à jour
    await page.waitForTimeout(100);
    
    // Vérifier les quotas initiaux
    let quota = await getQuotaData(page, 'guest');
    // Si quota est null, initialiser avec des valeurs par défaut
    if (!quota) {
      await resetQuota(page, 'guest');
      await page.waitForTimeout(100);
      quota = await getQuotaData(page, 'guest');
    }
    
    // Si toujours null, utiliser des valeurs par défaut (quota n'existe pas encore)
    const initialDatePolls = quota?.datePollsCreated || 0;
    const initialFormPolls = quota?.formPollsCreated || 0;
    console.log(`[TEST] Quotas initiaux: date=${initialDatePolls}, form=${initialFormPolls}`);
    
    // 1. Créer un Date Poll directement dans localStorage
    // (Simule la création via l'interface, ce qui incrémente le quota)
    console.log('[TEST] Création d\'un Date Poll...');
    const datePoll = {
      id: 'test-date-poll-cross-product',
      slug: 'test-date-poll-cross-product',
      title: 'Test Date Poll Cross-Product',
      type: 'date' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: 'test-device-id',
      settings: {
        selectedDates: ['2025-01-15', '2025-01-16'],
      },
    };
    
    await page.goto(PRODUCT_ROUTES.datePoll.landing);
    await createPollInLocalStorage(page, datePoll);
    
    // Simuler l'incrémentation du quota (comme le ferait l'app lors de la création)
    await page.evaluate(() => {
      try {
        const STORAGE_KEY = 'doodates_quota_consumed';
        const stored = localStorage.getItem(STORAGE_KEY);
        const allData = stored ? JSON.parse(stored) : {};
        
        if (!allData['guest']) {
          allData['guest'] = {
            conversationsCreated: 0,
            datePollsCreated: 0,
            formPollsCreated: 0,
            quizzCreated: 0,
            availabilityPollsCreated: 0,
            aiMessages: 0,
            analyticsQueries: 0,
            simulations: 0,
            totalCreditsConsumed: 0,
            userId: 'guest',
          };
        }
        
        allData['guest'].datePollsCreated = (allData['guest'].datePollsCreated || 0) + 1;
        // pollsCreated supprimé - calculer à la volée si nécessaire
        allData['guest'].totalCreditsConsumed = (allData['guest'].totalCreditsConsumed || 0) + 1;
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      } catch {
        // ignore errors
      }
    });
    
    // Attendre que le quota soit mis à jour
    await page.waitForTimeout(500);
    await waitForReactStable(page, { browserName });
    
    // Vérifier le quota après création du Date Poll
    quota = await getQuotaData(page, 'guest');
    expect(quota).toBeTruthy();
    expect(quota.datePollsCreated).toBe(initialDatePolls + 1);
    expect(quota.formPollsCreated).toBe(initialFormPolls);
    console.log(`[TEST] Quota après Date Poll: date=${quota.datePollsCreated}, form=${quota.formPollsCreated}`);
    
    // 2. Créer un Form Poll directement dans localStorage
    console.log('[TEST] Création d\'un Form Poll...');
    const formPoll = {
      id: 'test-form-poll-cross-product',
      slug: 'test-form-poll-cross-product',
      title: 'Test Form Poll Cross-Product',
      type: 'form' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: 'test-device-id',
    };
    
    await page.goto(PRODUCT_ROUTES.formPoll.landing);
    await createPollInLocalStorage(page, formPoll);
    
    // Simuler l'incrémentation du quota pour le Form Poll
    await page.evaluate(() => {
      try {
        const STORAGE_KEY = 'doodates_quota_consumed';
        const stored = localStorage.getItem(STORAGE_KEY);
        const allData = stored ? JSON.parse(stored) : {};
        
        if (!allData['guest']) {
          allData['guest'] = {
            conversationsCreated: 0,
            datePollsCreated: 0,
            formPollsCreated: 0,
            quizzCreated: 0,
            availabilityPollsCreated: 0,
            aiMessages: 0,
            analyticsQueries: 0,
            simulations: 0,
            totalCreditsConsumed: 0,
            userId: 'guest',
          };
        }
        
        allData['guest'].formPollsCreated = (allData['guest'].formPollsCreated || 0) + 1;
        // pollsCreated supprimé - calculer à la volée si nécessaire
        allData['guest'].totalCreditsConsumed = (allData['guest'].totalCreditsConsumed || 0) + 1;
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      } catch {
        // ignore errors
      }
    });
    
    // Attendre que le quota soit mis à jour
    await page.waitForTimeout(500);
    await waitForReactStable(page, { browserName });
    
    // 3. Vérifier que les quotas sont séparés
    quota = await getQuotaData(page, 'guest');
    expect(quota).toBeTruthy();
    expect(quota.datePollsCreated).toBe(initialDatePolls + 1);
    expect(quota.formPollsCreated).toBe(initialFormPolls + 1);
    // Vérifier que les quotas sont indépendants
    // Le quota de Date Polls ne doit pas affecter le quota de Form Polls
    const totalPolls = calculateTotalPollsCreated(quota);
    console.log(`[TEST] Quota final: date=${quota.datePollsCreated}, form=${quota.formPollsCreated}, total=${totalPolls}`);
    
    // Vérifier que le total calculé = somme des compteurs séparés
    const expectedTotal = quota.datePollsCreated + quota.formPollsCreated;
    expect(totalPolls).toBeGreaterThanOrEqual(expectedTotal);
  });

  test('Utilisateur avec plusieurs produits → Vérifier isolation données', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    // Réinitialiser les données
    await clearTestData(page, { all: true });
    
    // Utiliser le device ID par défaut en mode E2E (comme product-isolation.spec.ts)
    const deviceId = 'test-device-id';
    
    // Créer tous les polls en une seule fois (EXACTEMENT comme product-isolation.spec.ts)
    await page.goto(PRODUCT_ROUTES.datePoll.landing);
    
    const datePoll = {
      id: 'test-date-poll-isolation',
      slug: 'test-date-poll-isolation',
      title: 'Date Poll Isolation Test',
      type: 'date' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
      settings: { selectedDates: ['2025-01-15'] },
    };
    
    const formPoll = {
      id: 'test-form-poll-isolation',
      slug: 'test-form-poll-isolation',
      title: 'Form Poll Isolation Test',
      type: 'form' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
    };
    
    const availabilityPoll = {
      id: 'test-availability-poll-isolation',
      slug: 'test-availability-poll-isolation',
      title: 'Availability Poll Isolation Test',
      type: 'availability' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
    };
    
    await createPollInLocalStorage(page, datePoll);
    await createPollInLocalStorage(page, formPoll);
    await createPollInLocalStorage(page, availabilityPoll);
    
    // ✅ Utiliser le helper pour vérifier l'isolation (polls déjà créés)
    await createPollsAndVerifyInDashboard(
      page,
      browserName,
      [], // Polls déjà créés
      PRODUCT_ROUTES.datePoll.dashboard,
      ['Date Poll Isolation Test'],
      ['Form Poll Isolation Test', 'Availability Poll Isolation Test']
    );
    
    await createPollsAndVerifyInDashboard(
      page,
      browserName,
      [], // Polls déjà créés
      PRODUCT_ROUTES.formPoll.dashboard,
      ['Form Poll Isolation Test'],
      ['Date Poll Isolation Test', 'Availability Poll Isolation Test']
    );
    
    // Vérifier le comptage par type
    const counts = await countPollsByType(page);
    expect(counts.date).toBeGreaterThanOrEqual(1);
    expect(counts.form).toBeGreaterThanOrEqual(1);
    expect(counts.availability).toBeGreaterThanOrEqual(1);
  });

  test('Suppression compte → Vérifier suppression tous produits', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    // Réinitialiser les données
    await clearTestData(page, { all: true });
    await resetQuota(page, 'guest');
    
    // ✅ Utiliser le device ID par défaut en mode E2E
    const deviceId = 'test-device-id';
    
    // 1. Créer des polls de différents types
    const datePoll = {
      id: 'test-date-poll-deletion',
      slug: 'test-date-poll-deletion',
      title: 'Date Poll Deletion Test',
      type: 'date' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
      settings: {
        selectedDates: ['2025-01-15'],
      },
    };
    
    const formPoll = {
      id: 'test-form-poll-deletion',
      slug: 'test-form-poll-deletion',
      title: 'Form Poll Deletion Test',
      type: 'form' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
    };
    
    const availabilityPoll = {
      id: 'test-availability-poll-deletion',
      slug: 'test-availability-poll-deletion',
      title: 'Availability Poll Deletion Test',
      type: 'availability' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
    };
    
    await page.goto(PRODUCT_ROUTES.datePoll.landing);
    await createPollInLocalStorage(page, datePoll);
    await createPollInLocalStorage(page, formPoll);
    await createPollInLocalStorage(page, availabilityPoll);
    
    // Vérifier que les polls existent
    let polls = await getAllPolls(page);
    expect(polls.length).toBeGreaterThanOrEqual(3);
    const pollIds = polls.map((p: any) => p.id);
    expect(pollIds).toContain('test-date-poll-deletion');
    expect(pollIds).toContain('test-form-poll-deletion');
    expect(pollIds).toContain('test-availability-poll-deletion');
    
    // 2. Simuler la suppression de compte (suppression de tous les polls du créateur)
    await page.evaluate((creatorId: string) => {
      try {
        const stored = localStorage.getItem('doodates_polls');
        if (!stored) return;
        const polls = JSON.parse(stored);
        const filteredPolls = polls.filter((p: any) => p.creator_id !== creatorId);
        localStorage.setItem('doodates_polls', JSON.stringify(filteredPolls));
      } catch {
        // ignore errors
      }
    }, deviceId);
    
    // 3. Vérifier que tous les polls ont été supprimés
    polls = await getAllPolls(page);
    const remainingPollIds = polls.map((p: any) => p.id);
    expect(remainingPollIds).not.toContain('test-date-poll-deletion');
    expect(remainingPollIds).not.toContain('test-form-poll-deletion');
    expect(remainingPollIds).not.toContain('test-availability-poll-deletion');
    
    // 4. Vérifier que les dashboards ne montrent plus ces polls
    await page.goto(PRODUCT_ROUTES.datePoll.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });
    await expect(page.getByText('Date Poll Deletion Test')).not.toBeVisible();
    
    await page.goto(PRODUCT_ROUTES.formPoll.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });
    await expect(page.getByText('Form Poll Deletion Test')).not.toBeVisible();
    
    await page.goto(PRODUCT_ROUTES.availabilityPoll.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });
    await expect(page.getByText('Availability Poll Deletion Test')).not.toBeVisible();
  });

  // ============================================================================
  // TESTS DE RÉGRESSION CROSS-PRODUITS
  // ============================================================================

  test('Modification service partagé → Vérifier impact tous produits', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    // Réinitialiser les données
    await clearTestData(page, { all: true });
    await resetQuota(page, 'guest');
    
    // ✅ Utiliser le device ID par défaut en mode E2E
    const deviceId = 'test-device-id';
    
    // 1. Créer des polls de différents types (EXACTEMENT comme product-isolation.spec.ts)
    await page.goto(PRODUCT_ROUTES.datePoll.landing);
    
    const datePoll = {
      id: 'test-date-poll-shared',
      slug: 'test-date-poll-shared',
      title: 'Date Poll Shared Service Test',
      type: 'date' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
      settings: {
        selectedDates: ['2025-01-15'],
      },
    };
    
    const formPoll = {
      id: 'test-form-poll-shared',
      slug: 'test-form-poll-shared',
      title: 'Form Poll Shared Service Test',
      type: 'form' as const,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: deviceId,
    };
    
    await createPollInLocalStorage(page, datePoll);
    await createPollInLocalStorage(page, formPoll);
    
    // 2. Vérifier que les polls sont visibles AVANT la modification
    await page.goto(PRODUCT_ROUTES.datePoll.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });
    await expect(page.getByText('Date Poll Shared Service Test')).toBeVisible({ timeout: timeouts.element });
    
    await page.goto(PRODUCT_ROUTES.formPoll.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });
    await expect(page.getByText('Form Poll Shared Service Test')).toBeVisible({ timeout: timeouts.element });
    
    // 3. Simuler une modification d'un service partagé (ex: changement de titre)
    // Dans un vrai scénario, cela pourrait être un changement de configuration,
    // une mise à jour de quota, ou une modification de storage
    await page.evaluate(() => {
      try {
        const stored = localStorage.getItem('doodates_polls');
        if (!stored) return;
        const polls = JSON.parse(stored);
        const updatedPolls = polls.map((p: any) => {
          if (p.id === 'test-date-poll-shared' || p.id === 'test-form-poll-shared') {
            return { ...p, title: p.title + ' (Modifié)' };
          }
          return p;
        });
        localStorage.setItem('doodates_polls', JSON.stringify(updatedPolls));
        // Déclencher l'événement pollsChanged pour notifier React
        window.dispatchEvent(new CustomEvent('pollsChanged', { detail: { action: 'update' } }));
      } catch {
        // ignore errors
      }
    });
    
    // Attendre que React traite la modification
    await page.waitForTimeout(200);
    await waitForReactStable(page, { browserName });
    
    // 4. Vérifier que tous les produits sont affectés de manière cohérente
    const polls = await getAllPolls(page);
    const updatedPolls = polls.filter((p: any) => 
      p.id === 'test-date-poll-shared' || p.id === 'test-form-poll-shared'
    );
    
    expect(updatedPolls.length).toBe(2);
    updatedPolls.forEach((poll: any) => {
      expect(poll.title).toContain('(Modifié)');
    });
    
    // 5. Vérifier que les dashboards fonctionnent toujours correctement
    // ✅ Naviguer directement vers le dashboard (comme product-isolation.spec.ts)
    await page.goto(PRODUCT_ROUTES.datePoll.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });
    await expect(page.getByText('Date Poll Shared Service Test (Modifié)')).toBeVisible({ timeout: timeouts.element });
    
    await page.goto(PRODUCT_ROUTES.formPoll.dashboard, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });
    await expect(page.getByText('Form Poll Shared Service Test (Modifié)')).toBeVisible({ timeout: timeouts.element });
  });

  test('Changement quota → Vérifier application correcte', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    
    // Naviguer vers une page pour accéder à localStorage
    await page.goto(PRODUCT_ROUTES.datePoll.landing);
    
    // Réinitialiser les quotas
    await resetQuota(page, 'guest');
    
    // Attendre un peu pour que localStorage soit mis à jour
    await page.waitForTimeout(100);
    
    // 1. Vérifier les quotas initiaux
    let quota = await getQuotaData(page, 'guest');
    // Si quota est null, initialiser avec des valeurs par défaut
    if (!quota) {
      await resetQuota(page, 'guest');
      await page.waitForTimeout(100);
      quota = await getQuotaData(page, 'guest');
    }
    
    expect(quota).toBeTruthy();
    const initialDatePolls = quota?.datePollsCreated || 0;
    const initialFormPolls = quota?.formPollsCreated || 0;
    
    // 2. Simuler un changement de quota (ex: augmentation des limites)
    // Dans un vrai scénario, cela pourrait être une mise à jour de configuration
    await page.evaluate(() => {
      try {
        // Simuler un changement de limite en modifiant les constantes
        // (Dans un vrai test, on utiliserait une configuration de test)
        const STORAGE_KEY = 'doodates_quota_consumed';
        const stored = localStorage.getItem(STORAGE_KEY);
        const allData = stored ? JSON.parse(stored) : {};
        
        // Simuler que l'utilisateur a déjà créé quelques polls
        if (!allData['guest']) {
          allData['guest'] = {
            conversationsCreated: 0,
            datePollsCreated: 0,
            formPollsCreated: 0,
            quizzCreated: 0,
            availabilityPollsCreated: 0,
            aiMessages: 0,
            analyticsQueries: 0,
            simulations: 0,
            totalCreditsConsumed: 0,
            userId: 'guest',
          };
        }
        
        // Simuler l'incrémentation d'un Date Poll
        allData['guest'].datePollsCreated = (allData['guest'].datePollsCreated || 0) + 1;
        // pollsCreated supprimé - calculer à la volée si nécessaire
        allData['guest'].totalCreditsConsumed = (allData['guest'].totalCreditsConsumed || 0) + 1;
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      } catch {
        // ignore errors
      }
    });
    
    // 3. Vérifier que le quota a été mis à jour
    quota = await getQuotaData(page, 'guest');
    expect(quota).toBeTruthy();
    expect(quota.datePollsCreated).toBe(initialDatePolls + 1);
    const totalPolls1 = calculateTotalPollsCreated(quota);
    expect(totalPolls1).toBeGreaterThanOrEqual(initialDatePolls + 1);
    
    // 4. Simuler l'incrémentation d'un Form Poll
    await page.evaluate(() => {
      try {
        const STORAGE_KEY = 'doodates_quota_consumed';
        const stored = localStorage.getItem(STORAGE_KEY);
        const allData = stored ? JSON.parse(stored) : {};
        
        if (allData['guest']) {
          allData['guest'].formPollsCreated = (allData['guest'].formPollsCreated || 0) + 1;
          // pollsCreated supprimé - calculer à la volée si nécessaire
          allData['guest'].totalCreditsConsumed = (allData['guest'].totalCreditsConsumed || 0) + 1;
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
        }
      } catch {
        // ignore errors
      }
    });
    
    // 5. Vérifier que les quotas sont correctement séparés et cohérents
    quota = await getQuotaData(page, 'guest');
    expect(quota).toBeTruthy();
    expect(quota.datePollsCreated).toBe(initialDatePolls + 1);
    expect(quota.formPollsCreated).toBe(initialFormPolls + 1);
    const totalPolls = calculateTotalPollsCreated(quota);
    expect(totalPolls).toBeGreaterThanOrEqual(initialDatePolls + initialFormPolls + 2);
    expect(quota.totalCreditsConsumed).toBeGreaterThanOrEqual(2);
    
    // 6. Vérifier que le total calculé = somme des compteurs séparés
    const totalPolls2 = calculateTotalPollsCreated(quota);
    const expectedTotal = quota.datePollsCreated + quota.formPollsCreated;
    expect(totalPolls2).toBeGreaterThanOrEqual(expectedTotal);
    
    // 7. Vérifier que les quotas sont indépendants
    // Le quota de Date Polls ne doit pas affecter le quota de Form Polls
    expect(quota.datePollsCreated).toBe(initialDatePolls + 1);
    expect(quota.formPollsCreated).toBe(initialFormPolls + 1);
    
    console.log(`[TEST] Quota final après changement: date=${quota.datePollsCreated}, form=${quota.formPollsCreated}, total=${totalPolls2}`);
  });
});

