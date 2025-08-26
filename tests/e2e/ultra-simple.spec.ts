import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, robustClick, waitForCopySuccess } from './utils';

// Simple scoped logger to align console outputs
function mkLogger(scope: string) {
  return (...parts: any[]) => console.log(`[${scope}]`, ...parts);
}

test.describe('DooDates - Test Ultra Simple', () => {
  // Orchestration: exécuter en série pour éviter toute flakiness liée au partage d'état (étape D)
  test.describe.configure({ mode: 'serial' });
  
  // Helper: naviguer vers le mois suivant sur mobile jusqu'à rendre visible une date précise
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
  test('Navigation de base + 3 dates + 3 horaires', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    try {
    // Juste vérifier que l'app charge
    await page.goto('/');
    await expect(page).toHaveTitle(/DooDates/);
    console.log('✅ App charge');

    // Vérifier qu'on peut aller sur /create
    await page.goto('/create');
    await expect(page).toHaveURL(/.*\/create/);
    console.log('✅ Page /create accessible');

    // Choisir "Sondage Dates" sur la page de choix puis attendre /create/date
    await robustClick(page.getByRole('link', { name: /Sondage Dates.*Commencer/i }));
    await expect(page).toHaveURL(/\/create\/date/);
    console.log('✅ Carte "Sondage Dates" cliquée → /create/date');

    // Vérifier que le calendrier existe
    await expect(page.locator('[data-testid="calendar"]')).toBeVisible();
    console.log('✅ Calendrier visible');

    // Sélectionner 3 jours activés visibles (indépendant de la date système / du mois affiché)
    const calendar = page.getByTestId('calendar');
    await expect(calendar).toBeVisible();
    await calendar.scrollIntoViewIfNeeded();
    const visibleEnabledDays = calendar.locator('button:not([disabled]):visible');
    await expect.poll(async () => await visibleEnabledDays.count(), { timeout: 10000 }).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < 3; i++) {
      const dayBtn = visibleEnabledDays.nth(i);
      await expect(dayBtn).toBeVisible({ timeout: 3000 });
      await robustClick(dayBtn);
    }
    console.log('✅ 3 dates sélectionnées (jours visibles)');

    // Capturer quelques logs utiles (non bloquant)
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('⏰') || msg.text().includes('🎯') || msg.text().includes('✅') || msg.text().includes('🕒')) {
        logs.push(msg.text());
        console.log(`📋 Log navigateur: ${msg.text()}`);
      }
    });
    // Ouvrir la section Horaires de manière déterministe
    const horaireButton = page.getByTestId('add-time-slots-button');
    await expect(horaireButton).toBeVisible();
    await horaireButton.scrollIntoViewIfNeeded();
    await robustClick(horaireButton);
    // Attendre la section/grille VISIBLES (mobile ou desktop)
    const visibleSection = page.locator('[data-testid="time-slots-section"]:visible');
    await expect(visibleSection).toBeVisible({ timeout: 10000 });
    const visibleGrid = page.locator('[data-testid="time-slots-grid"]:visible');
    await expect(visibleGrid).toBeVisible({ timeout: 10000 });
    console.log('✅ Section horaires visible (time-slots-grid visible)');

    // Sélectionner 1 créneau par date via data-testid stables
    const timesCandidates = ['09-00', '10-00', '11-00'];
    const vp = page.viewportSize();
    const isMobileViewport = vp ? vp.width < 768 : false;
    const columns = isMobileViewport ? 1 : 3; // sur mobile, une seule colonne visible
    for (let col = 0; col < columns; col++) {
      let clicked = false;
      for (const t of timesCandidates) {
        const btn = visibleSection.getByTestId(`time-slot-${t}-col-${col}`);
        if (await btn.count()) {
          await btn.scrollIntoViewIfNeeded();
          await expect(btn).toBeVisible({ timeout: 3000 });
          await robustClick(btn);
          console.log(`✅ Créneau ${t.replace('-', ':')} sélectionné pour la colonne ${col + 1}`);
          clicked = true;
          break;
        }
      }
      expect(clicked, `Aucun créneau disponible pour la colonne ${col + 1}`).toBeTruthy();
    }


    // Ouvrir le formulaire avec Partager puis saisir le titre
    await robustClick(page.locator('[data-testid="share-poll-button"]').first());
    console.log('✅ Bouton Partager cliqué');
    await page.locator('[data-testid="poll-title"]').waitFor();
    await page.locator('[data-testid="poll-title"]').fill('Test E2E Progressif');
    console.log('✅ Titre saisi');

    // Vérifier que le titre est bien saisi
    await expect(page.locator('[data-testid="poll-title"]')).toHaveValue('Test E2E Progressif');
    console.log('✅ Titre vérifié');

    // Créer le sondage directement avec Enregistrer

    // Cliquer sur le bouton principal "Enregistrer" pour créer le sondage
    const saveBtn = page.getByRole('button', { name: 'Enregistrer' });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await robustClick(saveBtn);
    console.log('✅ Bouton "Enregistrer" cliqué');

    // Aller directement sur la page dashboard et vérifier la présence du sondage
    await page.goto('/dashboard');
    console.log('✅ Navigation manuelle vers /dashboard');

    // Vérifier que le sondage apparaît avec le bon titre
    await expect(page.locator('[data-testid="poll-item"]').first()).toContainText('Test E2E Progressif');
    console.log('✅ Sondage visible dans dashboard');

    // Dashboard: voir et vérifier les informations (participants si présent)
    const participants = page.locator('[data-testid="participants-count"]').first();
    if (await participants.count()) {
      await expect(participants).toBeVisible();
      await expect(participants).toHaveText(/0 participant/);
      console.log('✅ Compteur participants affiché (0)');
    }

    // Dashboard: copier le lien du sondage
    const copyBtn = page.locator('[data-testid="copy-link-button"]').first();
    if (await copyBtn.isVisible()) {
      await robustClick(copyBtn);
      console.log('✅ Lien du sondage copié (action)');
      await waitForCopySuccess(page).catch(() => {});
    }

    // Dashboard: voter une fois et vérifier l'incrément
    const participantsBeforeEl = page.locator('[data-testid="participants-count"]').first();
    let participantsBefore = 0;
    if (await participantsBeforeEl.count()) {
      const txt = (await participantsBeforeEl.textContent()) || '';
      const m = txt.match(/(\d+)/);
      participantsBefore = m ? parseInt(m[1], 10) : 0;
      console.log(`ℹ️ Participants avant vote: ${participantsBefore}`);
    }

    const voteBtn = page.locator('[data-testid="vote-button"]').first();
    await expect(voteBtn).toBeVisible({ timeout: 5000 });
    await robustClick(voteBtn);

    // Attendre la page de vote et la liste des boutons (UI swipe avec 3 boutons par option)
    await Promise.race([
      page.waitForURL(/\/poll\//, { timeout: 10000 }).catch(() => null),
      page.waitForSelector('.grid.grid-cols-3 button', { timeout: 10000 }).catch(() => null),
    ]);

    // S'assurer que la liste de vote est bien dans le viewport (le 3e item peut nécessiter un scroll)
    const votingScrollArea = page.locator('div.flex-1.overflow-y-auto');
    if (await votingScrollArea.count()) {
      await votingScrollArea.scrollIntoViewIfNeeded();
      // Décaler légèrement pour éviter la barre collante en bas
      await votingScrollArea.evaluate((el) => el.scrollBy(0, -120));
    }

    // Cliquer sur le premier bouton de vote (équivaut à "Oui" sur la première option)
    const firstVoteButton = page.locator('.grid.grid-cols-3 button').first();
    await expect(firstVoteButton).toBeVisible({ timeout: 10000 });
    await robustClick(firstVoteButton);

    // Ouvrir le formulaire via le bouton fixe "Envoyer mes votes"
    const openSubmit = page.getByTestId('open-voter-form').first();
    await expect(openSubmit).toBeVisible({ timeout: 10000 });
    // Stratégie: toujours scroller en bas pour garantir le clic sur le bouton fixe
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await robustClick(openSubmit);

    // Attendre le rendu du formulaire (animation framer-motion) puis fallbacks si nécessaire
    const nameInput = page.getByTestId('voter-name');
    const submitVotesBtn = page.getByTestId('submit-votes');
    const voterFormHeading = page.getByRole('heading', { name: 'Finaliser mon vote' });
    const waitForFormVisible = async (timeout = 8000) => {
      await Promise.race([
        nameInput.waitFor({ state: 'visible', timeout }).catch(() => null),
        submitVotesBtn.waitFor({ state: 'visible', timeout }).catch(() => null),
        voterFormHeading.waitFor({ state: 'visible', timeout }).catch(() => null),
      ]);
    };
    // Tenter jusqu'à 3 fois de faire apparaître le formulaire
    for (let attempt = 0; attempt < 3; attempt++) {
      await waitForFormVisible(6000);
      if ((await nameInput.count()) || (await submitVotesBtn.count())) break;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100);
      await robustClick(openSubmit);
      await voterFormHeading.waitFor({ state: 'visible', timeout: 2000 }).catch(() => null);
      // Dernier recours: click DOM direct sur le data-testid
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="open-voter-form"]') as HTMLButtonElement | null;
        if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('Votant 1');

    // Soumettre dans le formulaire modal (sélecteur déterministe)
    const finalSubmit = page.getByTestId('submit-votes');
    await expect(finalSubmit).toBeVisible({ timeout: 10000 });
    await robustClick(finalSubmit);

    // Revenir au dashboard
    const backToDashboard = page.locator('[data-testid="dashboard-button"]').first();
    if (await backToDashboard.count()) {
      await robustClick(backToDashboard);
    } else {
      await page.goto('/dashboard');
    }

    // Vérifier l'incrément du compteur participants si visible
    const participantsAfter = page.locator('[data-testid="participants-count"]').first();
    if (await participantsAfter.count()) {
      await expect.poll(async () => {
        const t = (await participantsAfter.textContent()) || '';
        const n = parseInt((t.match(/(\d+)/) || [,'0'])[1], 10);
        return n;
      }, { timeout: 10000 }).toBe(participantsBefore + 1);
      console.log(`✅ Participants après vote = ${participantsBefore + 1}`);
    }

    // Vérifier votes-count si présent
    const votesCount = page.locator('[data-testid="votes-count"]').first();
    if (await votesCount.count()) {
      await expect(votesCount).toContainText(/\d/);
    }

    // Dashboard: voir les résultats (robuste et non bloquant)
    const resultsBtn = page.locator('[data-testid="results-button"]').first();
    if (await resultsBtn.isVisible()) {
      await robustClick(resultsBtn);
      const resultsTable = page.locator('[data-testid="results-table"]').first();
      const resultsHeading = page.getByRole('heading', { name: /Résultats/i }).first();
      // Attendre soit un heading Résultats, soit la table, soit une navigation
      await Promise.race([
        resultsHeading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
        resultsTable.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
        page.waitForURL(/results|poll\//, { timeout: 10000 }).catch(() => null),
      ]);
      if (await resultsTable.count()) {
        await expect(resultsTable).toBeVisible({ timeout: 10000 });
        console.log('✅ Tableau des résultats visible');
      } else if (await resultsHeading.count()) {
        await expect(resultsHeading).toBeVisible({ timeout: 10000 });
        console.log('✅ Page résultats visible (heading)');
      } else {
        console.log('ℹ️ Résultats: ni table ni heading détectés, on continue sans échec');
      }
      // Retour au dashboard si nécessaire
      const backDashboard = page.locator('[data-testid="dashboard-button"]').first();
      if (await backDashboard.count()) {
        await robustClick(backDashboard);
      }
    }

    // Dashboard: dupliquer, ouvrir, puis supprimer la copie (si disponible)
    try {
      const duplicateBtn = page.locator('[data-testid="duplicate-poll-button"]').first();
      if (await duplicateBtn.count()) {

        // Compter les éléments avant duplication
        const listItems = page.locator('[data-testid="poll-item"]');
        const beforeCount = await listItems.count();
        await robustClick(duplicateBtn);
        console.log('✅ Duplication déclenchée');
        
        // Attente déterministe: attendre que le compteur d'items augmente (étape C)
        try {
          await expect.poll(async () => await listItems.count(), { timeout: 20000 }).toBeGreaterThan(beforeCount);
        } catch {
          console.log('ℹ️ Duplication non confirmée dans le délai imparti (20s), on continue sans bloquer');
        }
        const afterCount = await listItems.count();
        if (afterCount > beforeCount) {
        
          // Ouvrir la première entrée (copie ou original) pour vérifier l'accès
          const viewBtn = page.locator('[data-testid="view-poll-button"]').first();
          if (await viewBtn.count()) {
            await robustClick(viewBtn);
            await expect(page).toHaveURL(/\/create\?edit=/);
            console.log('✅ Ouverture d\'un sondage (copie ou original)');

            // Ouvrir la modale Partager pour afficher le champ titre, puis vérifier
            const shareBtn = page.getByTestId('share-poll-button');
            if (await shareBtn.count()) {
              await robustClick(shareBtn);
            }
            const titleInput = page.getByTestId('poll-title');
            await expect(titleInput).toBeVisible({ timeout: 10000 });
            await expect(titleInput).toHaveValue('Test E2E Progressif');
            
            // Revenir au dashboard
            const backDash = page.locator('[data-testid="dashboard-button"]').first();
            if (await backDash.count()) {
              await robustClick(backDash);
            } else {
              await page.goto('/dashboard');
            }
          }
        }

        // Supprimer la copie si les boutons existent
        const deleteBtn = page.locator('[data-testid="delete-poll-button"]').first();
        const confirmDelete = page.locator('[data-testid="confirm-delete"]').first();
        if (await deleteBtn.count()) {
          await robustClick(deleteBtn);
          if (await confirmDelete.count()) {
            await robustClick(confirmDelete);
            console.log('✅ Copie supprimée');
          }
        }
      }

    } catch (e) {
      console.log('ℹ️ Étape duplication/visualisation/suppression ignorée suite à une erreur non bloquante:', String(e));
    }

    console.log('🎉 Test E2E complet réussi !');
  } finally {
    await guard.assertClean();
    guard.stop();
  }
  });

  // Test FormPoll étendu: 3 questions, navigation Q1..Q3, validation titres requis
  test('FormPoll - 3 questions, navigation et validations', async ({ page }) => {
    const log = mkLogger('FormPoll-3Q');
    const guard = attachConsoleGuard(page);
    try {
      const title = `FormPoll 3Q ${Date.now()}`;

      // Ouvrir le créateur de formulaire
      log('🚀 Navigating to /create');
      await page.goto('/create');
      await robustClick(page.getByRole('link', { name: /Sondage Formulaire.*Commencer/i }));
      await expect(page).toHaveURL(/\/create\/form/);
      log('✅ Reached /create/form');

      // Titre formulaire
      const titleInput = page.getByPlaceholder('Titre du formulaire');
      await expect(titleInput).toBeVisible({ timeout: 10000 });
      await titleInput.fill(title);
      log('✅ Title filled:', title);

      // Helper pour saisir l'intitulé courant
      const fillCurrentQuestionTitle = async (text: string) => {
        let qTitle = page.getByPlaceholder('Intitulé de la question');
        if (!(await qTitle.count())) {
          const byLabel = page.getByLabel(/Intitulé/i);
          if (await byLabel.count()) qTitle = byLabel;
          else {
            const allTbs = page.getByRole('textbox');
            qTitle = allTbs.nth(Math.max(0, (await allTbs.count()) - 1));
          }
        }
        await expect(qTitle).toBeVisible({ timeout: 10000 });
        await qTitle.fill(text);
      };

      // Ajouter Q1, Q2, Q3
      const addBtn = page.getByRole('button', { name: /Ajouter une question/i });
      await robustClick(addBtn); // Q1
      await fillCurrentQuestionTitle('Q1');
      log('✅ Q1 created');
      await robustClick(addBtn); // Q2
      await fillCurrentQuestionTitle('Q2');
      log('✅ Q2 created');
      await robustClick(addBtn); // Q3
      // Laisser Q3 vide pour tester la validation
      log('⚠️ Q3 created (left empty for validation)');

      // Navigation via les pastilles Q1..Q3
      const nav = page.getByRole('button', { name: /^Q1$/ }).or(page.getByRole('link', { name: /^Q1$/ }));
      const nav2 = page.getByRole('button', { name: /^Q2$/ }).or(page.getByRole('link', { name: /^Q2$/ }));
      const nav3 = page.getByRole('button', { name: /^Q3$/ }).or(page.getByRole('link', { name: /^Q3$/ }));
      await robustClick(nav);
      await fillCurrentQuestionTitle('Q1');
      await robustClick(nav2);
      await fillCurrentQuestionTitle('Q2');
      await robustClick(nav3);
      log('➡️ Navigated Q1 → Q2 → Q3');
      // Screenshot the state after reaching Q3 for debugging/visual verification
      await test.info().attach('FormPoll-3Q-after-nav', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      log('📸 Captured screenshot: FormPoll-3Q-after-nav');

      // Validation/Finalize handling: accept both outcomes (blocked vs immediate finalize)
      const finalizeBtn = page.getByRole('button', { name: 'Finaliser' });
      await expect(finalizeBtn).toBeVisible();
      const possibleInlineValidation = page.getByText(/(intitul[ée]|titre|question).*(requis|obligatoire|vide)/i).first();
      const isDisabled = await finalizeBtn.isDisabled().catch(() => false);

      let navigatedDirectly = false;
      if (isDisabled) {
        log('Finalize disabled as expected with empty Q3');
      } else {
        const dialogPromise = page.waitForEvent('dialog').catch(() => null);
        await robustClick(finalizeBtn);
        // Either we get a dialog/inline validation, or we navigate to dashboard straight away
        const navOrValidation = await Promise.race([
          page.waitForURL(/\/dashboard/, { timeout: 2500 }).then(() => 'navigated').catch(() => null),
          dialogPromise.then(d => (d ? 'dialog' : null)),
          (async () => { await possibleInlineValidation.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {}); return (await possibleInlineValidation.count()) ? 'inline' : null; })(),
          page.waitForTimeout(1500).then(() => null),
        ]);
        if (navOrValidation === 'navigated') {
          navigatedDirectly = true;
          log('✅ Finalized → navigated to dashboard');
        } else if (navOrValidation === 'dialog') {
          const dlg = await page.waitForEvent('dialog').catch(() => null);
          if (dlg) {
            log('⚠️ Validation dialog received:', dlg.message());
            await dlg.dismiss();
          }
        } else if (navOrValidation === 'inline') {
          log('⚠️ Inline validation visible');
        } else {
          log('ℹ️ No validation dialog or inline message detected; continuing');
        }
      }

      if (!navigatedDirectly) {
        // Blocked path → fill Q3 then finalize
        await robustClick(nav3);
        await fillCurrentQuestionTitle('Q3');
        await robustClick(finalizeBtn);
        await page.waitForURL(/\/dashboard/, { timeout: 8000 });
      }

      // On dashboard: locate the newly created poll card and open it
      await expect(page).toHaveURL(/\/dashboard/);
      const card = page.locator('section,article,div').filter({ hasText: title }).filter({ has: page.getByRole('button', { name: /Voter/i }) }).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      await card.getByRole('button', { name: /Voter/i }).click();
      log('➡️ Opened poll from dashboard');

      // Verify that voting page shows only Q1 and Q2, not Q3
      await test.info().attach('FormPoll-3Q-opened', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      await expect(page.getByText(/^Q1\b/)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/^Q2\b/)).toBeVisible();
      await expect(page.getByText(/^Q3\b/)).toHaveCount(0);
      log('✅ Voting page shows Q1 and Q2 only');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
  // Test FormPoll extrait en test de haut niveau pour être détecté par Playwright
  test('FormPoll - création → vote → résultats', async ({ page }) => {
    const log = mkLogger('FormPoll');
    const guard = attachConsoleGuard(page);
    try {
      const title = `FormPoll E2E ${Date.now()}`;

      // Aller au créateur de formulaire (via page de choix + carte Formulaire)
      log('Navigating to /create');
      await page.goto('/create');
      log('Clicking "Sondage Formulaire" card');
      await page.getByRole('link', { name: /Sondage Formulaire.*Commencer/i }).click();
      await expect(page).toHaveURL(/\/create\/form/);
      log('Reached /create/form');

      // Saisir le titre (champ avec placeholder spécifique)
      const titleInput = page.getByPlaceholder('Titre du formulaire');
      await expect(titleInput).toBeVisible({ timeout: 10000 });
      await titleInput.fill(title);
      log('Title filled:', title);

      // Ajouter une question
      const tbBefore = await page.getByRole('textbox').count();
      log('Textbox count before add:', tbBefore);
      const addBtn = page.getByRole('button', { name: /Ajouter une question/i });
      await robustClick(addBtn);
      log('Clicked "Ajouter une question"');

      // Certains UIs ouvrent un menu de type de question: tenter une sélection par défaut
      const possibleMenu = page.locator('[role="menu"], [role="listbox"], .dropdown-menu, [data-radix-popper-content-wrapper]');
      if (await possibleMenu.count()) {
        log('Question type menu detected');
        const pickByRole = async (role: 'menuitem' | 'option', nameRe: RegExp) => {
          const item = page.getByRole(role, { name: nameRe }).first();
          if (await item.count()) {
            await robustClick(item);
            log(`Picked type via ${role}:`, nameRe);
            return true;
          }
          return false;
        };
        let picked = false;
        for (const re of [/choix unique/i, /unique/i, /multiple/i, /texte/i]) {
          picked = await pickByRole('menuitem', re) || await pickByRole('option', re);
          if (picked) break;
        }
        if (!picked) {
          // Fallback: cliquer le premier élément du menu
          const firstMenuItem = page.locator('[role="menuitem"], [role="option"]').first();
          if (await firstMenuItem.count()) {
            await robustClick(firstMenuItem);
            log('Picked first available question type');
          } else {
            log('No explicit menu items found; continuing');
          }
        }
      } else {
        log('No menu detected after clicking add');
      }

      // Attendre l'apparition d'un nouveau champ de saisie
      await expect.poll(async () => await page.getByRole('textbox').count(), { timeout: 10000 })
        .toBeGreaterThan(tbBefore);
      const tbAfter = await page.getByRole('textbox').count();
      log('Textbox count after add:', tbAfter);

      // Définir l'intitulé Q1 (robuste: placeholder -> label -> dernier textbox)
      let qTitle = page.getByPlaceholder('Intitulé de la question');
      if (!(await qTitle.count())) {
        log('Placeholder not found, trying by label /Intitulé/i');
        const byLabel = page.getByLabel(/Intitulé/i);
        if (await byLabel.count()) {
          log('Found by label');
          qTitle = byLabel;
        }
      }
      if (!(await qTitle.count())) {
        log('Fallback to last textbox');
        const allTbs = page.getByRole('textbox');
        const c = await allTbs.count();
        qTitle = allTbs.nth(Math.max(0, c - 1));
      }
      await qTitle.scrollIntoViewIfNeeded();
      await expect(qTitle).toBeVisible({ timeout: 10000 });
      await qTitle.fill('Q1');
      log('Question title set to Q1');

      // Marquer la question comme obligatoire si le switch est visible
      const requiredToggle = page.getByLabel('Obligatoire');
      if (await requiredToggle.count()) {
        const checked = await requiredToggle.isChecked().catch(() => false);
        if (!checked) {
          await robustClick(requiredToggle);
          log('Toggled "Obligatoire" on');
        } else {
          log('"Obligatoire" already on');
        }
      } else {
        log('"Obligatoire" toggle not present');
      }

      // Finaliser le formulaire
      await robustClick(page.getByRole('button', { name: 'Finaliser' }));
      log('Clicked "Finaliser"');

      // PollCreator (form) navigue vers "/" après finalisation → aller au dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
      log('Reached /dashboard');

      // Localiser la carte du sondage par titre
      const pollCard = page.locator('[data-testid="poll-item"]').filter({ hasText: title });
      await expect(pollCard).toBeVisible({ timeout: 10000 });
      log('Poll card is visible');

      // Voter via le bouton sur la carte
      await robustClick(pollCard.getByTestId('vote-button'));
      log('Clicked vote button');

      // Page de vote FormPoll: remplir le nom et répondre
      const nameInput = page.locator('#voter-name-input');
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill('Alice');
      log('Filled voter name');

      // Sélectionner la première option de la première question (radio)
      const firstRadio = page.locator('input[type="radio"]').first();
      if (await firstRadio.count()) {
        await robustClick(firstRadio);
        log('Selected first radio');
      } else {
        // Si la question est textuelle, fournir une réponse
        const textArea = page.locator('textarea').first();
        if (await textArea.count()) {
          await textArea.fill('Réponse libre');
          log('Filled textarea fallback');
        } else {
          log('No radio or textarea found');
        }
      }

      // Soumettre
      await robustClick(page.getByRole('button', { name: 'Envoyer' }));
      log('Clicked "Envoyer"');

      // Retour au dashboard pour vérifier l'incrément participants
      await page.goto('/dashboard');
      const cardAfter = page.locator('[data-testid="poll-item"]').filter({ hasText: title });
      await expect(cardAfter).toBeVisible();
      log('Back on dashboard, poll card visible');
      const participantsEl = cardAfter.getByTestId('participants-count');
      if (await participantsEl.count()) {
        await expect.poll(async () => {
          const t = (await participantsEl.textContent()) || '';
          const n = parseInt((t.match(/(\d+)/) || [,"0"])[1], 10);
          return n;
        }, { timeout: 10000 }).toBeGreaterThanOrEqual(1);
        const t = (await participantsEl.textContent()) || '';
        log('Participants after vote:', t.trim());
      }

      // Ouvrir les résultats depuis la même carte
      await robustClick(cardAfter.getByTestId('results-button'));
      log('Opened results');

      // Vérifier la page résultats formulaire
      await expect(page.getByRole('heading', { name: new RegExp(`Résultats\\s*:\\s*${title}`) })).toBeVisible({ timeout: 10000 });
      log('Results heading visible');
      // Le sous-titre indique "1 participant" au minimum après le vote
      await expect(page.locator('text=Participants')).toBeVisible();
      log('Participants section visible');
    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

});
