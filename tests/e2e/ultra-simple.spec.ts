import { test, expect } from '@playwright/test';
import { attachConsoleGuard, robustClick, waitForCopySuccess, warmup, enableE2ELocalMode } from './utils';
import { setupGeminiMock } from './global-setup';

// Simple scoped logger  
function mkLogger(scope: string) {
  return (...parts: any[]) => console.log(`[${scope}]`, ...parts);
}

test.describe('DooDates - Test Ultra Simple', () => {
  test.describe.configure({ mode: 'serial' });
  
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });
  
  test('Workflow complet : Création DatePoll → Dashboard @smoke @critical', async ({ page }) => {
    // Capturer TOUS les logs console du navigateur
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log(`🌐 BROWSER: ${text}`);
    });
    
    // Capturer les erreurs JavaScript
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
      consoleLogs.push(`[ERROR] ${error.message}`);
    });
    
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /The above error occurred in one of your React components/i,
        /The above error occurred in the .* component/i,
        /Erreur préchargement/i,
        /calendrier JSON/i,
        /TimeSlot Functions/i,
        /Sondage avec slug .* non trouvé/i,
        /DooDatesError/i,
      ],
    });
    const log = mkLogger('UltraSimple');
    
    try {
      test.slow();
      await enableE2ELocalMode(page);
      await warmup(page);
      await expect(page).toHaveTitle(/DooDates/);
      console.log('✅ App charge');

      // Navigation vers /create
      await page.goto('/create', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/.*\/create/);
      console.log('✅ Page /create accessible');

      // Choisir "Sondage Dates"
      await robustClick(page.locator('[data-testid="poll-type-date"]'));
      await expect(page).toHaveURL(/\/create\/date/);
      console.log('✅ Carte "Sondage Dates" cliquée → /create/date');

      // Vérifier calendrier visible
      await expect(page.locator('[data-testid="calendar"]')).toBeVisible();
      console.log('✅ Calendrier visible');

      // Sélectionner 3 dates NON-CONSÉCUTIVES pour que le bouton Horaires apparaisse
      const calendar = page.getByTestId('calendar');
      await expect(calendar).toBeVisible();
      
      // Calculer 3 dates ESPACÉES à partir d'aujourd'hui (+1, +4, +7 jours)
      // Cela évite les groupes consécutifs qui masquent le bouton Horaires
      const today = new Date();
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const offsets = [1, 4, 7]; // Jours espacés
      const dates = offsets.map(offset => {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        return formatDate(d);
      });
      
      console.log(`✅ Dates à sélectionner (espacées): ${dates.join(', ')}`);
      
      // Cliquer sur chaque date
      // Note: Il y a 2 boutons par date (mobile + desktop), on filtre par visibilité
      for (const dateStr of dates) {
        const dayButton = page.locator(`button[data-date="${dateStr}"]:visible`).first();
        await expect(dayButton).toBeVisible({ timeout: 5000 });
        await robustClick(dayButton);
      }
      
      console.log('✅ 3 dates sélectionnées');

      // Ouvrir section horaires (le bouton n'apparaît que si dates non-groupées)
      const horaireButton = page.getByTestId('add-time-slots-button');
      await expect(horaireButton).toBeVisible({ timeout: 10000 });
      await robustClick(horaireButton);
      
      const visibleSection = page.getByTestId('time-slots-section');
      await expect(visibleSection).toBeVisible({ timeout: 15000 });
      console.log('✅ Section horaires visible');

      // Sélectionner des créneaux horaires (adaptatif)
      const timesCandidates = ['09-00', '10-00', '11-00', '14-00', '15-00'];
      const maxColumns = 3;
      let slotsSelected = 0;
      
      // Trouver la grille visible (mobile ou desktop)
      const visibleGrid = page.locator('[data-testid="time-slots-grid-mobile"]:visible, [data-testid="time-slots-grid-desktop"]:visible').first();
      
      for (let col = 0; col < maxColumns; col++) {
        for (const t of timesCandidates) {
          const btn = visibleGrid.getByTestId(`time-slot-${t}-col-${col}`);
          if (await btn.count()) {
            await robustClick(btn);
            log(`Créneau ${t} sélectionné pour colonne ${col + 1}`);
            slotsSelected++;
            break;
          }
        }
      }
      expect(slotsSelected, `Au moins 1 créneau requis`).toBeGreaterThanOrEqual(1);
      console.log(`✅ ${slotsSelected} créneau(x) sélectionné(s)`);

      // Screenshot AVANT de cliquer sur Partager
      await page.screenshot({ path: 'test-results/01-avant-partager.png', fullPage: true });
      console.log('📸 Screenshot 1: Avant clic Partager');
      
      // Ouvrir formulaire et saisir titre
      const shareButton = page.locator('[data-testid="share-poll-button"]').first();
      await expect(shareButton).toBeVisible({ timeout: 5000 });
      
      // Capturer la position du bouton
      const shareButtonBox = await shareButton.boundingBox();
      console.log(`📍 Position bouton Partager: ${JSON.stringify(shareButtonBox)}`);
      
      await robustClick(shareButton);
      console.log('✅ Bouton Partager cliqué');
      
      // Screenshot APRÈS le clic sur Partager
      await page.waitForTimeout(1000); // Laisser le temps au scroll smooth et à l'affichage
      const titleInput = page.locator('[data-testid="poll-title"]');
      await expect(titleInput).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'test-results/02-apres-partager.png', fullPage: true });
      console.log('📸 Screenshot 2: Après clic Partager');
      await titleInput.fill('Test E2E Ultra Simple');
      console.log('✅ Titre saisi');

      // Screenshot APRÈS avoir saisi le titre
      await page.screenshot({ path: 'test-results/03-apres-titre.png', fullPage: true });
      console.log('📸 Screenshot 3: Après saisie titre');

      // Attendre que le bouton Finaliser soit visible
      // (il est dans la même section que le champ titre)
      const finalizeBtn = page.getByRole('button', { name: 'Finaliser' });
      await expect(finalizeBtn).toBeVisible({ timeout: 10000 });
      
      // Capturer la position du bouton Finaliser
      const finalizeBtnBox = await finalizeBtn.boundingBox();
      console.log(`📍 Position bouton Finaliser: ${JSON.stringify(finalizeBtnBox)}`);
      
      // Debug: Vérifier si le bouton est enabled
      const isDisabled = await finalizeBtn.isDisabled();
      console.log(`DEBUG: Bouton Finaliser disabled = ${isDisabled}`);
      
      if (isDisabled) {
        // Capturer l'état pour comprendre pourquoi
        const debugState = await page.evaluate(() => {
          const titleInput = document.querySelector('[data-testid="poll-title"]') as HTMLInputElement;
          return {
            title: titleInput?.value || 'NOT FOUND',
            titleLength: titleInput?.value?.length || 0,
          };
        });
        console.log('DEBUG: État du formulaire:', JSON.stringify(debugState, null, 2));
      }
      
      // Screenshot AVANT de cliquer sur Finaliser
      await page.screenshot({ path: 'test-results/04-avant-finaliser.png', fullPage: true });
      console.log('📸 Screenshot 4: Avant clic Finaliser');
      
      await robustClick(finalizeBtn);
      console.log('✅ Bouton "Finaliser" cliqué');

      await expect(page.getByText(/Sondage publié !/i)).toBeVisible({ timeout: 15000 });
      console.log('✅ Écran de succès affiché');
      await page.screenshot({ path: 'test-results/05-apres-finaliser.png', fullPage: true });
      console.log('📸 Screenshot 5: Après clic Finaliser');
      
      // Debug: Vérifier l'état de la page après finalisation
      const debugAfterFinalize = await page.evaluate(() => {
        try {
          const polls = localStorage.getItem('dev-polls');
          const pollsData = polls ? JSON.parse(polls) : [];
          return {
            pollsCount: pollsData.length,
            lastPoll: pollsData.length > 0 ? {
              id: pollsData[pollsData.length - 1]?.id,
              title: pollsData[pollsData.length - 1]?.title,
              slug: pollsData[pollsData.length - 1]?.slug,
            } : null,
            currentUrl: window.location.href,
            bodyText: document.body.innerText.substring(0, 500),
          };
        } catch (e) {
          return { error: String(e) };
        }
      });
      console.log('DEBUG: État après finalisation:', JSON.stringify(debugAfterFinalize, null, 2));
      
      // Prendre une photo pour voir ce qui est affiché
      await page.screenshot({ path: 'test-results/debug-after-finalize.png', fullPage: true });
      console.log('📸 Photo debug prise: test-results/debug-after-finalize.png');

      // Vérifier que le slug du sondage est disponible dans le stockage local
      let pollSlug: string | null = (debugAfterFinalize?.lastPoll as any)?.slug ?? null;
      await expect
        .poll(async () => {
          pollSlug = await page.evaluate(() => {
            try {
              const devPollsRaw = localStorage.getItem('dev-polls');
              const prodPollsRaw = localStorage.getItem('doodates_polls');

              const parseArray = (raw: string | null) => {
                if (!raw) return [];
                try {
                  const parsed = JSON.parse(raw);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              };

              const devPolls = parseArray(devPollsRaw);
              const prodPolls = parseArray(prodPollsRaw);

              const lastDev = devPolls[devPolls.length - 1];
              const lastProd = prodPolls[prodPolls.length - 1];

              return lastDev?.slug ?? lastProd?.slug ?? null;
            } catch {
              return null;
            }
          });
          return pollSlug;
        }, { timeout: 7000, message: 'Slug du sondage indisponible dans dev-polls' })
        .toBeTruthy();

      const voirSondageBtn = page.getByRole('link', { name: /Voir le sondage/i });
      await expect(voirSondageBtn).toBeVisible({ timeout: 5000 });
      await robustClick(voirSondageBtn);
      console.log('✅ Navigation vers page votant');

      await expect(page).toHaveURL(/\/poll\//, { timeout: 10000 });
      await expect(page.locator('body')).toContainText('Test E2E Ultra Simple', { timeout: 10000 });
      console.log('✅ Page votant affiche le sondage');

      // Retour au dashboard via navigation directe (plus robuste que dépendre d'un CTA spécifique)
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      console.log('✅ Navigation vers /dashboard confirmée');

      // Attendre que le dashboard charge les données
      await page.waitForLoadState('networkidle');

      // Debug: Vérifier ce qui est dans le dashboard
      const pollItems = page.locator('[data-testid="poll-item"]');
      const pollCount = await pollItems.count();
      console.log(`DEBUG: Nombre de polls dans le dashboard: ${pollCount}`);
      
      if (pollCount === 0) {
        // Debug: Vérifier le localStorage
        const debugInfo = await page.evaluate(() => {
          try {
            const polls = localStorage.getItem('dev-polls');
            const convs = localStorage.getItem('dev-conversations');
            const deviceId = localStorage.getItem('dd-device-id');
            const pollsData = polls ? JSON.parse(polls) : [];
            const convsData = convs ? JSON.parse(convs) : [];
            
            return {
              deviceId,
              pollsCount: pollsData.length,
              allPolls: pollsData.map((p: any) => ({
                id: p.id,
                title: p.title,
                creator_id: p.creator_id,
              })),
              lastPoll: pollsData.length > 0 ? {
                id: pollsData[pollsData.length - 1]?.id,
                title: pollsData[pollsData.length - 1]?.title,
                creator_id: pollsData[pollsData.length - 1]?.creator_id,
                relatedConversationId: pollsData[pollsData.length - 1]?.relatedConversationId,
              } : null,
              convsCount: convsData.length,
              lastConv: convsData.length > 0 ? {
                id: convsData[convsData.length - 1]?.id,
                title: convsData[convsData.length - 1]?.title,
                userId: convsData[convsData.length - 1]?.userId,
                pollId: (convsData[convsData.length - 1] as any)?.pollId || (convsData[convsData.length - 1] as any)?.metadata?.pollId,
              } : null,
            };
          } catch (e) {
            return { error: String(e) };
          }
        });
        console.log(`DEBUG: localStorage info:`, JSON.stringify(debugInfo, null, 2));
        
        // Attendre la stabilisation réseau puis réessayer
        await page.waitForLoadState('networkidle');
        await page.reload({ waitUntil: 'networkidle' });
        
        const pollCountAfterReload = await pollItems.count();
        console.log(`DEBUG: Nombre de polls après reload: ${pollCountAfterReload}`);
      }
      
      // Vérifier sondage dans dashboard (l'attente est incluse dans toContainText)
      const pollItem = page.locator('[data-testid="poll-item"]').first();
      await expect(pollItem).toBeVisible({ timeout: 15000 });
      await expect(pollItem).toContainText('Test E2E Ultra Simple', { timeout: 5000 });
      console.log('✅ Sondage visible dans dashboard');

      // Copier lien (optionnel)
      const copyBtn = page.locator('[data-testid="poll-action-copy-link"]').first();
      if (await copyBtn.isVisible()) {
        await robustClick(copyBtn);
        console.log('✅ Lien copié');
        await waitForCopySuccess(page).catch(() => {});
      }

      console.log('🎉 WORKFLOW COMPLET RÉUSSI');
      log('Test completed successfully!');
      
    } catch (error) {
      // En cas d'erreur, afficher tous les logs console capturés
      console.log('\n📋 ===== LOGS CONSOLE DU NAVIGATEUR =====');
      consoleLogs.forEach(log => console.log(log));
      console.log('📋 ===== FIN DES LOGS =====\n');
      throw error;
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
