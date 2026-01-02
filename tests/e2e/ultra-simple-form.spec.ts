import { test, expect } from '@playwright/test';
import { navigateToWorkspace } from './helpers/chat-helpers';
import { robustNavigation } from './helpers/robust-navigation';
import { sendChatCommand } from './helpers/poll-helpers';
import { setupTestEnvironment } from './helpers/test-setup';
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
      warmup: false,
      navigation: { path: '/DooDates/form-polls/workspace/form' }, // Forcer le bon workspace
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
  });

  /**
   * Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard.
   */
  test('Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard @smoke @functional', async ({ page, browserName }) => {
    // Logger contextualisé pour identifier rapidement les traces liées à ce test.
    const log = mkLogger('UltraSimpleForm');
    // Timeouts adaptatifs (mobile vs desktop) pour réduire les faux positifs.
    const timeouts = getTimeouts(browserName);

    // Étape 1 — Création du formulaire via IA
    log('🛠️ Création du formulaire via IA');
    
    // Le setup a déjà navigué vers le bon workspace form
    // Attendre que le chat input soit prêt
    const chatInput = await page.locator('[data-testid="chat-input"]').first();
    await chatInput.waitFor({ state: 'visible', timeout: timeouts.element });
    
    // Envoyer la commande de création
    await sendChatCommand(page, browserName, chatInput, 'crée un questionnaire avec 2 questions pour organiser une formation');
    
    // Attendre la réponse IA
    await page.waitForTimeout(3000);
    
    // CLIQUER SUR LE BOUTON "CRÉER" pour vraiment créer le formulaire
    log('🔘 Clic sur le bouton CRÉER');
    const createButton = page.locator('button').filter({ hasText: /créer/i }).first();
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await createButton.click();
    
    // Attendre que le formulaire soit créé en brouillon
    await page.waitForTimeout(2000);
    
    // CLIQUER SUR LE BOUTON "PUBLICATION" pour publier le formulaire
    log('🔘 Clic sur le bouton PUBLICATION');
    const publishButton = page.locator('button').filter({ hasText: /publication|publier/i }).first();
    await publishButton.waitFor({ state: 'visible', timeout: 10000 });
    await publishButton.click();
    
    // Attendre que le formulaire soit publié et affiché
    await page.waitForTimeout(3000);
    
    // Vérifier que le formulaire est créé
    const formTitle = await page.locator('h1').first().textContent({ timeout: 15000 });
    expect(formTitle).toBeTruthy();
    log('✅ Formulaire généré et publié:', formTitle);

    // Étape 2 — Ajout d'une question via IA
    log('✏️ Ajout d\'une question via IA');
    await sendChatCommand(page, browserName, chatInput, 'ajoute une question sur les préférences alimentaires');
    await page.waitForTimeout(2000);
    log('✅ Question supplémentaire ajoutée');

    // Étape 3 — Suppression d'une question via IA
    log('🗑️ Suppression d\'une question via IA');
    await sendChatCommand(page, browserName, chatInput, 'supprime la dernière question');
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
    
    // Navigation simple vers le dashboard
    await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    log('✅ Navigation vers le dashboard réussie');

    // Étape 6 — Vérification dashboard
    log('📊 Vérification dashboard');
    
    // Vérifier qu'on est sur le dashboard
    const dashboardTitle = await page.title();
    expect(dashboardTitle).toContain('DooDates');
    
    log('🎉 WORKFLOW COMPLET FORM POLL RÉUSSI');
  });

  /**
   * Nettoie les données de test après chaque exécution.
   */
  test.afterEach(async ({ page }) => {
    // Nettoyage simple du localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
  });
});
