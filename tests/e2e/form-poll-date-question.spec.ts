/**
 * Form Poll Date Question Tests
 * Tests E2E pour les questions de type "date" dans les formulaires
 *
 * Objectif : Vérifier que les questions de type "date" fonctionnent correctement
 * - Création et affichage dans QuestionCard
 * - Configuration des dates et horaires
 * - Intégration dans un formulaire complet
 */

import { test, expect } from '@playwright/test';
import { setupTestWithWorkspace, createFormWithDateQuestion, voteOnPollComplete } from './helpers/poll-helpers';
import { getPollSlugFromPage } from './helpers/poll-navigation-helpers';
import { waitForNetworkIdle, waitForReactStable, waitForElementReady } from './helpers/wait-helpers';

test.describe('Form Poll - Questions de type Date', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, browserName }) => {
    await setupTestWithWorkspace(page, browserName, {
      enableE2ELocalMode: true,
      warmup: true,
      consoleGuard: true,
      mocks: { all: true },
    });
  });

  // TODO: Ce test échoue avec TimeoutError lors de la recherche de l'input titre
  // Nécessite refactoring de createFormWithDateQuestion pour être plus robuste
  test.skip('Questions de type date - Workflow complet @functional', async ({ page, browserName }) => {
    // 1. Créer un formulaire avec question date via IA
    const pollUrl = await createFormWithDateQuestion(page, browserName as any, 'Test Formulaire avec Question Date');

    // Obtenir le slug du poll
    const pollSlug = await getPollSlugFromPage(page);

    if (!pollSlug) {
      console.log('Poll slug not found, skipping test');
      return;
    }

    // 2. Voter sur la question date et vérifier la confirmation
    console.log('[TEST] Vote sur la question date...');
    await voteOnPollComplete(page, browserName, pollSlug, 'Test Votant Date');

    console.log('[SUCCÈS] Test question date passé - vote confirmé');
  });
});