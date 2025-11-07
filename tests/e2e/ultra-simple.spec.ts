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

      // Ouvrir formulaire et saisir titre
      await robustClick(page.locator('[data-testid="share-poll-button"]').first());
      console.log('✅ Bouton Partager cliqué');
      
      await page.locator('[data-testid="poll-title"]').waitFor();
      await page.locator('[data-testid="poll-title"]').fill('Test E2E Ultra Simple');
      console.log('✅ Titre saisi');

      // Finaliser le sondage (crée le poll + conversation)
      const finalizeBtn = page.getByRole('button', { name: 'Finaliser' });
      await expect(finalizeBtn).toBeVisible({ timeout: 10000 });
      await robustClick(finalizeBtn);
      console.log('✅ Bouton "Finaliser" cliqué');

      // Attendre l'écran de succès qui apparaît après la finalisation
      await expect(page.getByText(/Sondage publié !/i)).toBeVisible({ timeout: 15000 });
      console.log('✅ Écran de succès affiché');
      
      // Prendre une photo après la finalisation
      await page.screenshot({ path: 'test-results/after-finalization.png', fullPage: true });
      console.log('📸 Photo prise après finalisation: test-results/after-finalization.png');

      // Cliquer sur le bouton "Aller au Tableau de bord" depuis l'écran de succès
      const dashboardLink = page.getByRole('link', { name: /Aller au Tableau de bord/i });
      await expect(dashboardLink).toBeVisible({ timeout: 5000 });
      await robustClick(dashboardLink);
      console.log('✅ Bouton "Aller au Tableau de bord" cliqué');

      // Vérifier qu'on est bien sur le dashboard
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
      console.log('✅ Navigation vers /dashboard confirmée');

      // Attendre que le dashboard charge les données
      await page.waitForLoadState('networkidle');
      
      // Attendre un peu pour que le dashboard charge les données
      await page.waitForTimeout(1000);
      
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
        
        // Attendre un peu plus et réessayer
        await page.waitForTimeout(2000);
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
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
      
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
