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
  
  test('Workflow complet : Création DatePoll → Dashboard', async ({ page }) => {
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
      await robustClick(page.getByRole('link', { name: /Sondage Dates.*Commencer/i }));
      await expect(page).toHaveURL(/\/create\/date/);
      console.log('✅ Carte "Sondage Dates" cliquée → /create/date');

      // Vérifier calendrier visible
      await expect(page.locator('[data-testid="calendar"]')).toBeVisible();
      console.log('✅ Calendrier visible');

      // Sélectionner 3 dates
      const calendar = page.getByTestId('calendar');
      await expect(calendar).toBeVisible();
      await calendar.scrollIntoViewIfNeeded();
      const visibleEnabledDays = calendar.locator('button:not([disabled]):visible');
      await expect.poll(async () => await visibleEnabledDays.count(), { timeout: 10000 }).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < 3; i++) {
        await robustClick(visibleEnabledDays.nth(i));
      }
      console.log('✅ 3 dates sélectionnées');

      // Ouvrir section horaires
      const horaireButton = page.getByTestId('add-time-slots-button');
      await expect(horaireButton).toBeVisible();
      await robustClick(horaireButton);
      
      const visibleSection = page.locator('[data-testid="time-slots-section"]:visible');
      await expect(visibleSection).toBeVisible({ timeout: 15000 });
      console.log('✅ Section horaires visible');

      // Sélectionner des créneaux horaires (adaptatif)
      const timesCandidates = ['09-00', '10-00', '11-00', '14-00', '15-00'];
      const maxColumns = 3;
      let slotsSelected = 0;
      
      for (let col = 0; col < maxColumns; col++) {
        for (const t of timesCandidates) {
          const btn = visibleSection.getByTestId(`time-slot-${t}-col-${col}`);
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

      // Enregistrer le sondage
      const saveBtn = page.getByRole('button', { name: 'Enregistrer' });
      await expect(saveBtn).toBeVisible({ timeout: 10000 });
      await robustClick(saveBtn);
      console.log('✅ Bouton "Enregistrer" cliqué');

      // Aller au dashboard
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      console.log('✅ Navigation vers /dashboard');

      // Vérifier sondage dans dashboard
      await expect(page.locator('[data-testid="poll-item"]').first()).toContainText('Test E2E Ultra Simple');
      console.log('✅ Sondage visible dans dashboard');

      // Copier lien (optionnel)
      const copyBtn = page.locator('[data-testid="copy-link-button"]').first();
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
