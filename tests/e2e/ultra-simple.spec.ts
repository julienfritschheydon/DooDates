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

      // Aller au dashboard
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/.*\/dashboard/);
      console.log('✅ Navigation vers /dashboard');

      // Vérifier sondage dans dashboard (l'attente est incluse dans toContainText)
      await expect(page.locator('[data-testid="poll-item"]').first()).toContainText('Test E2E Ultra Simple', { timeout: 10000 });
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
