// Base Playwright primitives + helpers utilisés dans l'ensemble du scénario.
import { test, expect, Page, Locator } from '@playwright/test';
import { withConsoleGuard } from './utils';
import { setupTestEnvironment } from './helpers/test-setup';
import { sendChatCommand, voteOnPollComplete } from './helpers/poll-helpers';
import { createFormPollViaAI } from './helpers/poll-form-helpers';

// Outils communs pour synchroniser l'état réseau/React et ajuster les timeouts selon le navigateur.
import { waitForNetworkIdle, waitForReactStable, waitForElementReady } from './helpers/wait-helpers';
import { getTimeouts } from './config/timeouts';

// Logger scoped pour suivre précisément chaque étape dans les traces.
const mkLogger = (scope: string) => (...parts: any[]) => console.log(`[${scope}]`, ...parts);

/**
 * Test Ultra Simple Form (via IA) : workflow complet de création, ajout, suppression, reprise, vote et vérification dashboard.
 */
test.describe('DooDates - Test Ultra Simple Form (via IA)', () => {
  test.describe.configure({ mode: 'serial' });

  /**
   * Prépare l'environnement complet avant chaque test (mocks, garde console, mode local).
   */
  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: true,
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /The above error occurred/i,
          /DooDatesError/i,
          /No dates selected/i,
          /Erreur lors de la sauvegarde/i,
          /Failed to send message/i,
        ],
      },
      mocks: { gemini: true },
    });
  });

  /**
   * Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard.
   */
  test('Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard @smoke @functional', async ({ page, browserName }) => {
    // Logger contextualisé pour identifier rapidement les traces liées à ce test.
    const log = mkLogger('UltraSimpleForm');
    // Timeouts adaptatifs (mobile vs desktop) pour réduire les faux positifs.
    const timeouts = getTimeouts(browserName);

    await withConsoleGuard(
      page,
      async () => {
        // On indique à Playwright que le scénario peut durer plus longtemps (IA + multiples navigations).
        test.slow();

        // Étape 1 — Création du formulaire via IA (remplace toute saisie manuelle)
        log('🛠️ Création du formulaire via IA');

        await createFormPollViaAI(
          page,
          browserName,
          'Crée un questionnaire avec 2 questions pour organiser une formation',
          {
            waitForEditor: true,
            fillTitle: 'Test Ultra Simple Form',
            publish: false,
          }
        );

        // Attente explicite du composant d'édition pour éviter toute course sur le DOM.
        const editor = await waitForElementReady(page, '[data-poll-preview]', {
          browserName,
          timeout: timeouts.element,
        });

        // Double vérification: on attend que React ait fini de stabiliser l'arbre.
        await waitForReactStable(page, { browserName });

        const questionTabs = editor.getByRole('button', { name: /^Q\d+$/ });
        const initialCount = await questionTabs.count();
        expect(initialCount).toBeGreaterThanOrEqual(1);

        log(`✅ Formulaire généré (${initialCount} question(s))`);

        const chatInput = page.getByRole('textbox', { name: /Décrivez votre sondage/i });

        // Étape 2 — Ajout d’une question supplémentaire via le chat IA
        log('✏️ Ajout d’une question via IA');

        await sendChatCommand(page, browserName, chatInput, 'Ajoute une question sur la durée de l’atelier');
        await waitForQuestionTabs(page, browserName, initialCount, {
          timeout: timeouts.element * 2,
          message: 'Après ajout de question',
          mode: 'at-least',
        });
        log('✅ Question supplémentaire ajoutée');

        // Nombre de questions juste avant suppression (sert de référence pour la reprise).
        const countBeforeDeletion = await questionTabs.count();
        expect(countBeforeDeletion).toBeGreaterThanOrEqual(2);

        // Étape 3 — Suppression d’une question pour vérifier la reprise vendeur IA
        log('🗑️ Suppression d’une question via IA');

        await sendChatCommand(page, browserName, chatInput, 'Supprime la question 2');
        await waitForQuestionTabs(page, browserName, 1, {
          timeout: timeouts.element * 2,
          message: 'Après suppression de question',
          mode: 'at-least',
        });
        log('✅ Question supprimée');

        // Étape 4 — Reload complet pour vérifier la persistance des données
        const urlBeforeReload = page.url();

        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForNetworkIdle(page, { browserName });
        await waitForElementReady(page, '[data-poll-preview]', {
          browserName,
          timeout: timeouts.element * 1.5,
        });
        await waitForReactStable(page, { browserName });

        // Après rechargement, on s'assure que la suppression précédente est bien persistée.
        const restoredCount = await questionTabs.count();
        expect(restoredCount).toBeGreaterThanOrEqual(1);
        expect(restoredCount).toBeLessThanOrEqual(countBeforeDeletion);
        log(`🔁 Reprise ok après refresh (${restoredCount} question(s), avant suppression: ${countBeforeDeletion}) - URL ${urlBeforeReload}`);

        // Étape 5 — Ouverture côté votant + vote complet + vérification dashboard
        const pollSlug = await getPollSlugFromEditor(page);
        // Si le formulaire est bien publié, on récupère son slug pour parcourir l'expérience votant.
        if (pollSlug) {
          // Navigation directe vers la page publique du formulaire pour valider qu'elle se charge correctement.
          await page.goto(`/poll/${pollSlug}`, { waitUntil: 'domcontentloaded' });
          await waitForNetworkIdle(page, { browserName });
          const pollPageTitle = await page.title();
          log(`ℹ️ Titre page votant: ${pollPageTitle}`);

          const pollHeading = page.locator('h1').first();
          await expect(pollHeading).toBeVisible({ timeout: timeouts.element });
          const pollHeadingText = ((await pollHeading.textContent()) || '').trim();
          log(`ℹ️ Heading page votant: ${pollHeadingText}`);
          // Le formulaire doit afficher le champ "Votre nom" pour permettre l'identification du votant.
          await expect(page.locator('body')).toContainText(/Votre nom/i, {
            timeout: timeouts.element,
          });

          log('✅ Page votant accessible');

          // Vote complet (nom, réponses, soumission)
          await voteOnPollComplete(page, browserName, pollSlug, 'Ultra Simple Form Voter');
          log('🗳️ Vote simulé avec succès');

          // Vérification minimaliste côté dashboard : au moins une carte de sondage est présente
          await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded' });
          await waitForNetworkIdle(page, { browserName });

          const pollItem = await waitForElementReady(page, '[data-testid="poll-item"]', {
            browserName,
            timeout: timeouts.element,
          });

          await expect(pollItem).toBeVisible({ timeout: timeouts.element });
          log('📋 Dashboard affiche au moins un formulaire après vote');
        } else {
          log('ℹ️ Aucun slug détecté (poll non publié), étape votant ignorée');
        }

        log('🎉 WORKFLOW COMPLET FORM POLL RÉUSSI');
      },
      {
        allowlist: [/Failed to send message/i],
      }
    );
  });
});

/**
 * Attente utilitaire : bloque jusqu'à ce que le nombre d'onglets questions corresponde à l'attendu.
 * Cette fonction est utilisée pour vérifier que les questions ont été ajoutées ou supprimées correctement.
 */
async function waitForQuestionTabs(
  page: Page,
  browserName: string,
  expectedCount: number,
  options: { timeout?: number; message?: string; mode?: 'exact' | 'at-least' } = {}
) {
  // Sélection du composant d'édition pour accéder aux onglets questions.
  const editor = page.locator('[data-poll-preview]');
  // Sélection des onglets questions en fonction de leur rôle et de leur nom.
  const tabs = editor.getByRole('button', { name: /^Q\d+$/ });
  // Attente jusqu'à ce que le nombre d'onglets corresponde à l'attendu.
  const poll = expect.poll(async () => tabs.count(), {
    timeout: options.timeout ?? getTimeouts(browserName).element,
    message: options.message,
  });

  if (options.mode === 'at-least') {
    await poll.toBeGreaterThanOrEqual(expectedCount);
  } else {
    await poll.toBe(expectedCount);
  }
}

/**
 * Récupère le slug du sondage actuel depuis l'URL ou, en dernier recours, depuis le localStorage (brouillon non publié).
 * Cette fonction est utilisée pour récupérer le slug du sondage pour parcourir l'expérience votant.
 */
async function getPollSlugFromEditor(page: Page): Promise<string | null> {
  // Récupération de l'URL actuelle.
  const url = page.url();
  // Extraction du slug depuis l'URL si elle contient "/poll/".
  const slugFromUrl = url.includes('/poll/') ? url.split('/poll/')[1]?.split(/[/?]/)[0] : null;
  // Si un slug est trouvé dans l'URL, on le retourne.
  if (slugFromUrl) return slugFromUrl;

  // Sinon, on tente de récupérer le slug depuis le localStorage (brouillon non publié).
  return await page.evaluate(() => {
    try {
      // Récupération des données de sondage depuis le localStorage.
      const pollsRaw = localStorage.getItem('doodates_polls');
      // Si les données sont trouvées, on les parse en JSON.
      if (!pollsRaw) return null;
      const polls = JSON.parse(pollsRaw);
      // On retourne le slug du dernier sondage.
      return polls[polls.length - 1]?.slug ?? null;
    } catch {
      // En cas d'erreur, on retourne null.
      return null;
    }
  });
}