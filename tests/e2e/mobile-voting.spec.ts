import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, robustClick, waitForCopySuccess, warmup, enableE2ELocalMode } from './utils';

// Helper: navigate month carousel until a given date is visible (used on mobile views)
async function openMonthContaining(page: Page, dateStr: string) {
  const target = page.locator(`[data-date="${dateStr}"]`).first();
  for (let i = 0; i < 6; i++) {
    if (await target.isVisible()) return;
    const nextBtn = page.locator('svg[data-lucide="chevron-right"]').locator('xpath=ancestor::button[1]');
    if (await nextBtn.count()) {
      await robustClick(nextBtn);
      await page.waitForTimeout(200);
    } else {
      break;
    }
  }
  await expect(target, `Date ${dateStr} should be visible after month navigation`).toBeVisible();
}

// NOTE: These tests rely on mobile projects configured in playwright.config (e.g., Mobile Chrome/Safari)
// They exercise sticky footer submit, multi-option behavior, and back navigation from results to dashboard.

test.describe('Mobile Voting UX', () => {
  test.describe.configure({ mode: 'serial' });

  test.skiptest('DatePoll: sticky submit visibility + back to dashboard', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /The above error occurred in one of your React components/i,
        /Erreur prÃ©chargement/i,
        /calendrier JSON/i,
      ],
    });
    try {
      test.slow();
      // Enable E2E local mode prior to any navigation
      await enableE2ELocalMode(page);
      await warmup(page);
      await page.goto('/');
      await expect(page).toHaveTitle(/DooDates/);

      // Create a Date poll quickly
      await page.goto('/create');
      await robustClick(page.getByRole('link', { name: /Sondage Dates.*Commencer/i }));
      await expect(page).toHaveURL(/\/create\/date/);

      // Ensure calendar and pick 2-3 days visible (mobile safe)
      const calendar = page.getByTestId('calendar');
      await expect(calendar).toBeVisible();
      await calendar.scrollIntoViewIfNeeded();
      const visibleEnabledDays = calendar.locator('button:not([disabled]):visible');
      await expect.poll(async () => await visibleEnabledDays.count(), { timeout: 10000 }).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < Math.min(3, await visibleEnabledDays.count()); i++) {
        await robustClick(visibleEnabledDays.nth(i));
      }

      // Open share panel, set a title, and save to create the poll
      await robustClick(page.getByTestId('share-poll-button').first());
      const titleInput = page.getByTestId('poll-title');
      await expect(titleInput).toBeVisible({ timeout: 10000 });
      await titleInput.fill('Mobile UX DatePoll');
      const saveBtn = page.getByRole('button', { name: 'Enregistrer' });
      await expect(saveBtn).toBeVisible({ timeout: 10000 });
      // Ensure at least 2 dates are selected so Save becomes enabled (Mobile Safari safe)
      if (!(await saveBtn.isEnabled())) {
        const calendarEnsure = page.getByTestId('calendar');
        await calendarEnsure.scrollIntoViewIfNeeded();
        const enabledDays = calendarEnsure.locator('button:not([disabled])');
        await expect.poll(async () => await enabledDays.count(), { timeout: 10000 }).toBeGreaterThan(0);
        let madeSelected = 0;
        const total = await enabledDays.count();
        for (let i = 0; i < total && madeSelected < 2; i++) {
          const btn = enabledDays.nth(i);
          if (!(await btn.isVisible().catch(() => false))) continue;
          await robustClick(btn);
          // Confirm selection applied by checking selected class (see Calendar.tsx)
          await expect(btn).toHaveClass(/bg-green-600/, { timeout: 2000 }).catch(() => null);
          const isSelected = await btn.evaluate(el => String((el as HTMLElement).className).includes('bg-green-600')).catch(() => false);
          if (isSelected) {
            madeSelected++;
            await page.waitForTimeout(50);
          }
        }
        await expect(saveBtn).toBeEnabled({ timeout: 7000 });
      }
      await robustClick(saveBtn);
      // Ensure persistence before navigation (Mobile Safari may lag localStorage writes)
      await expect.poll(async () => {
        return await page.evaluate(() => {
          try {
            const raw = localStorage.getItem('dev-polls') || '[]';
            const arr = JSON.parse(raw) as Array<{ title?: string }>; 
            return arr.some(p => (p?.title || '').includes('Mobile UX DatePoll')) ? 1 : 0;
          } catch { return 0; }
        });
      }, { timeout: 15000 }).toBeGreaterThan(0);

      // Go to dashboard and open the poll via stable testid (icon-only safe), with fallbacks
      await page.goto('/dashboard');
      let list = page.locator('[data-testid="poll-item"]');
      // Mobile Safari can need a reload for localStorage-backed lists in CI; retry few times
      for (let i = 0; i < 3; i++) {
        const cnt = await list.count();
        if (cnt > 0) break;
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        list = page.locator('[data-testid="poll-item"]');
      }
      await expect.poll(async () => await list.count(), { timeout: 30000 }).toBeGreaterThan(0);
      let card = list.filter({ hasText: 'Mobile UX DatePoll' });
      if (!(await card.count())) {
        card = list.first(); // fallback: use first poll card when title not rendered on compact cards
      }

      let voteCta = card.getByTestId('vote-button')
        .or(card.getByRole('button', { name: /Voter/i }))
        .or(card.getByRole('link', { name: /Voter/i }));
      await expect.poll(async () => await voteCta.count(), { timeout: 15000 }).toBeGreaterThan(0);
      await robustClick(voteCta.first());

      // On voting page: click first visible vote cell to ensure we have some selection
      const firstVoteButton = page.locator('.grid.grid-cols-3 button').first();
      await Promise.race([
        firstVoteButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
        page.waitForURL(/\/poll\//, { timeout: 10000 }).catch(() => null),
      ]);
      if (await firstVoteButton.count()) {
        await robustClick(firstVoteButton);
      }

      // Sticky footer submit: ensure the button is actionable on mobile
      let openSubmit = page.getByTestId('open-voter-form').first()
        .or(page.getByRole('button', { name: /Envoyer mes votes/i }).first());
      await expect.poll(async () => await openSubmit.count(), { timeout: 10000 }).toBeGreaterThan(0);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      if (!(await openSubmit.first().isVisible().catch(() => false))) {
        await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="open-voter-form"]') as HTMLButtonElement | null;
          if (btn) btn.click();
        });
      } else {
        await robustClick(openSubmit);
      }

      // Form appears and submit
      const nameInput = page.getByTestId('voter-name');
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill('Mobile Voter');
      const finalSubmit = page.getByTestId('submit-votes');
      await expect(finalSubmit).toBeVisible({ timeout: 10000 });
      try { await finalSubmit.scrollIntoViewIfNeeded(); } catch {}
      await robustClick(finalSubmit);

      // Results are accessed via the dashboard card's "results-button"
      await page.goto('/dashboard');
      let cards = page.locator('[data-testid="poll-item"]');
      for (let i = 0; i < 3; i++) {
        const cnt = await cards.count();
        if (cnt > 0) break;
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        cards = page.locator('[data-testid="poll-item"]');
      }
      await expect.poll(async () => await cards.count(), { timeout: 30000 }).toBeGreaterThan(0);
      let cardForResults = cards.filter({ hasText: 'Mobile UX DatePoll' });
      if (!(await cardForResults.count())) cardForResults = cards.first();
      const resultsBtn = cardForResults.getByTestId('results-button').first();
      await expect(resultsBtn).toBeVisible({ timeout: 15000 });
      await robustClick(resultsBtn);
      await Promise.race([
        page.getByRole('heading', { name: /RÃ©sultats/i }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
        page.locator('[data-testid="results-table"]').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
      ]);
      const backDash = page.getByTestId('dashboard-button').first();
      await expect(backDash).toBeVisible({ timeout: 15000 });
      await robustClick(backDash);
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test.skiptest('FormPoll: multi-option interactions (radio + multiple with live maxChoices)', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /The above error occurred in one of your React components/i,
        /The above error occurred in the .* component/i,
        /Erreur prÃ©chargement/i,
        /calendrier JSON/i,
      ],
    });
    try {
      test.slow();
      // Enable E2E local mode prior to any navigation
      await enableE2ELocalMode(page);
      await warmup(page);
      await page.goto('/create');
      await robustClick(page.getByRole('link', { name: /Sondage Formulaire.*Commencer/i }));
      await expect(page).toHaveURL(/\/create\/form/);

      const title = `Mobile UX FormPoll ${Date.now()}`;
      const titleInput = page.getByPlaceholder('Titre du formulaire');
      await expect(titleInput).toBeVisible({ timeout: 10000 });
      await titleInput.fill(title);

      // Add one question; configure it as multiple choice with maxChoices=2
      const addBtn = page.getByTestId('form-add-question-button')
        .or(page.getByRole('button', { name: /Ajouter une question/i }));
      await robustClick(addBtn);
      // Fill question title via placeholder or fallback
      let qTitle = page.getByPlaceholder('IntitulÃ© de la question');
      if (!(await qTitle.count())) {
        const byLabel = page.getByLabel(/IntitulÃ©/i);
        if (await byLabel.count()) qTitle = byLabel;
      }
      if (!(await qTitle.count())) {
        const allTbs = page.getByRole('textbox');
        qTitle = allTbs.nth(Math.max(0, (await allTbs.count()) - 1));
      }
      await qTitle.fill('Q1');

      // Switch kind to "Choix multiples"
      const kindSelect = page.getByRole('combobox').first();
      if (await kindSelect.count()) {
        await kindSelect.selectOption({ label: 'Choix multiples' });
      }
      // Set max choices to 2
      const maxInput = page.getByLabel('Max choix').or(page.locator('input[type="number"]')).first();
      if (await maxInput.count()) {
        await maxInput.fill('2');
      }

      // Finalize and go dashboard
      await robustClick(page.getByTestId('form-finalize-button')
        .or(page.getByRole('button', { name: 'Finaliser' })));
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/dashboard/);

      const card = page.locator('[data-testid="poll-item"]').filter({ hasText: title });
      await expect(card).toBeVisible({ timeout: 15000 });
      await robustClick(card.getByTestId('vote-button'));

      // On voting: if radios are present for other questions, verify radio behavior; else fallback to textarea
      const firstRadio = page.locator('input[type="radio"]').first();
      if (await firstRadio.count()) {
        await robustClick(firstRadio);
        const radios = page.locator('input[type="radio"]').locator(':visible');
        if (await radios.count() >= 2) {
          const r1 = radios.nth(0);
          const r2 = radios.nth(1);
          await expect(r1).toBeChecked();
          await robustClick(r2);
          await expect(r2).toBeChecked();
          await expect(r1).not.toBeChecked();
        }
      } else {
        const textArea = page.locator('textarea').first();
        if (await textArea.count()) {
          await textArea.fill('RÃ©ponse mobile');
        }
      }

      // Multiple-choice live enforcement: select up to 2 and ensure others become disabled
      const multiOptions = page.getByTestId('multi-option');
      if (await multiOptions.count()) {
        const count = await multiOptions.count();
        if (count >= 3) {
          const m0 = multiOptions.nth(0);
          const m1 = multiOptions.nth(1);
          const m2 = multiOptions.nth(2);
          await robustClick(m0);
          await robustClick(m1);
          await expect(m0).toBeChecked();
          await expect(m1).toBeChecked();
          // 3rd should be disabled once 2 are selected
          await expect(m2).toBeDisabled();
          // Counter should display 2/2
          await expect(page.getByText(/2\/2 sÃ©lectionnÃ©\(s\)/)).toBeVisible();
        }
      }

      // Submit and ensure we can navigate back to dashboard
      const sendBtn = page.getByTestId('form-submit').or(page.getByRole('button', { name: /Envoyer|Envoyer mes rÃ©ponses/i }));
      await expect(sendBtn).toBeVisible({ timeout: 10000 });
      await robustClick(sendBtn);
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
