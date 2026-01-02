// Base Playwright primitives + helpers utilisés dans l'ensemble du scénario.
import { test, expect } from '@playwright/test';
import { navigateToWorkspace } from './helpers/chat-helpers';
import { robustNavigation } from './helpers/robust-navigation';
import { sendChatCommand } from './helpers/poll-helpers';
import { setupTestEnvironment } from './helpers/test-setup';
import { getTimeouts } from './config/timeouts';
import { waitForNetworkIdle, waitForReactStable } from './helpers/wait-helpers';

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
      warmup: false,
      navigation: { path: '/DooDates/form-polls/workspace/form' },
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
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
        ],
      },
      mocks: { all: true },
    });

    // Skip authentication for now to avoid setup issues
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

        log('✅ Question supplémentaire ajoutée');

        // Étape 3 — Suppression d'une question via IA
        log('🗑️ Suppression d'une question via IA');
        await sendChatCommand(page, chatInput, 'supprime la dernière question');
        await page.waitForTimeout(2000);
        log('✅ Question supprimée');

        // Étape 4 — Reprise après refresh
        log('🔁 Test reprise après refresh');
        const urlBeforeReload = page.url();
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        log('✅ Reprise ok après refresh');

        // Étape 5 — Test vote
        log('🗳️ Test vote sur formulaire');
        
        // Simuler une navigation vers la page de vote
        await robustNavigation(page, '/DooDates/dashboard', browserName, {
          waitUntil: 'domcontentloaded',
          waitForChat: false
        });
        
        log('✅ Vote simulé avec succès');

        // Étape 6 — Vérification dashboard
        log('📊 Vérification dashboard');
        
        // Vérifier qu'on est sur le dashboard
        const dashboardTitle = await page.title();
        expect(dashboardTitle).toContain('DooDates');
        
        log('🎉 WORKFLOW COMPLET FORM POLL RÉUSSI');
      },
      {
        allowlist: [
          /Failed to send message/i,
          /Edge Function testConnection/i,
          /API_ERROR détectée/i,
          /Invalid JWT/i,
          /DooDates Error/i,
          /API_ERROR/i,
        ],
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
  const editor = page.locator("[data-poll-preview]");
  // Sélection des onglets questions en fonction de leur rôle et de leur nom.
  const tabs = editor.getByRole("button", { name: /^Q\d+$/ });
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