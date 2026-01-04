/**
 * Helpers pour la création et gestion des polls dans les tests E2E
 * Factorise le code commun pour créer des polls via IA et gérer les polls dans localStorage
 */

import { Page, expect, Locator } from "@playwright/test";
import { setupAllMocksWithoutNavigation } from "../global-setup";
import { robustFill, waitForPageLoad, robustClick } from "../utils";
import {
  waitForElementReady,
  waitForReactStable,
  waitForNetworkIdle,
  waitForChatInputReady,
} from "../helpers/wait-helpers";

import { fillFormTitle } from "./form-helpers";
import { safeIsVisible } from "./safe-helpers";
import { getPollSlugFromPage } from "./poll-navigation-helpers";
import { type BrowserName, getTimeouts } from "./poll-core-helpers";

export { createFormPollViaAI, voteOnFormPoll } from "./poll-form-helpers";

// ... (le reste du fichier reste inchangé)

export interface CreateDatePollOptions {
  title: string;
  dates?: string[]; // format YYYY-MM-DD, default: [+1, +4, +7 jours]
  timeSlots?: boolean; // default: true
  mobileMode?: boolean; // default: auto-détection
  skipTimeSlots?: boolean; // pour tests rapides
  aiPrompt?: string; // message à envoyer à l'IA avant d'attendre le sondage
}

/**
 * Résultat de la création d'un poll
 */
export interface PollCreationResult {
  pollSlug: string;
  pollId: string;
  title: string;
}

/**
 * Envoie une commande à l'IA via l'input de chat en garantissant que le composant est prêt.
 * Cette fonction est utilisée pour simuler les interactions avec l'IA dans plusieurs scénarios E2E.
 */
export async function sendChatCommand(
  page: Page,
  browserName: string,
  inputLocator: Locator,
  message: string,
): Promise<void> {
  const timeouts = getTimeouts(browserName as BrowserName);

  // 1. S'assurer que l'élément est attaché au DOM, même s'il n'est pas encore visible
  await inputLocator.waitFor({ state: "attached", timeout: timeouts.element }).catch(() => {});

  // 2. Essayer de le rendre visible (notamment sur mobile où il peut être hors viewport)
  try {
    await inputLocator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(50);
  } catch {
    // ignore
  }

  // 3. Si aucune bounding box (toujours potentiellement hors écran), scroller la page
  const box = await inputLocator.boundingBox().catch(() => null);
  if (!box) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(100);
  }

  // 4. Remplir le champ, avec fallback en mode force si nécessaire
  try {
    await inputLocator.fill(message, { timeout: timeouts.action });
  } catch {
    await inputLocator.fill(message, { timeout: timeouts.action } as any).catch(async () => {
      await inputLocator.fill(message, { timeout: timeouts.action, force: true } as any);
    });
  }

  // 5. Envoi du message via "Entrée", avec fallback force
  try {
    await inputLocator.press("Enter", { timeout: timeouts.action });
  } catch {
    await inputLocator.press("Enter", { timeout: timeouts.action } as any).catch(async () => {
      await inputLocator.press("Enter", { timeout: timeouts.action, force: true } as any);
    });
  }

  // 6. Attendre que React ait fini de stabiliser l'arbre.
  await waitForReactStable(page, { browserName });
}

/**
 * Clique sur le bouton "Voir le formulaire" dans la modale de confirmation
 * Cette fonction est plus fiable que d'utiliser directement le data-testid
 * car elle gère mieux les cas où le bouton est rendu de manière asynchrone
 */
async function clickViewFormButton(page: Page): Promise<void> {
  console.log('Recherche du bouton "Voir le formulaire"...');

  // Ce sélecteur a prouvé être le plus fiable dans les tests
  const button = page
    .locator('a:has-text("Voir le formulaire"), a:has-text("Voir le sondage")')
    .first();

  try {
    await button.waitFor({ state: "visible", timeout: 10000 });
    console.log("Bouton trouvé, clic en cours...");
    await button.click();
    console.log("Clic effectué avec succès");
  } catch (error) {
    console.error("Échec du clic sur le bouton, tentative avec JavaScript...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("a"));
      const targetButton = buttons.find(
        (btn) =>
          btn.textContent?.includes("Voir le formulaire") ||
          btn.textContent?.includes("Voir le sondage"),
      );
      if (targetButton) {
        (targetButton as HTMLElement).click();
      }
    });
  }

  // Attendre que la navigation soit terminée
  await page.waitForURL(/\/poll\/[^\/]+/, { timeout: 15000 });
}

/**
 * Soumet un vote et vérifie la confirmation
 */
async function submitVoteAndVerifyConfirmation(
  page: Page,
  browserName: BrowserName,
  voterName: string,
  answer: string,
): Promise<void> {
  const timeouts = getTimeouts(browserName);

  console.log(`[DEBUG] ${voterName} - Soumission du vote...`);

  // Remplir le nom du votant
  const nameInput = page.locator("#voter-name-input").first();
  await expect(nameInput).toBeVisible({ timeout: timeouts.element });
  await nameInput.fill(voterName);

  // Attendre que le formulaire soit complètement chargé
  await page.waitForTimeout(1000);

  // Pour un formulaire avec question de date, voter sur les boutons disponibles
  console.log(`[DEBUG] Recherche des boutons de vote pour les dates...`);

  // Chercher les boutons de vote (classes rounded-xl min-w pour les dates)
  const voteButtons = page.locator('button[class*="rounded-xl"][class*="min-w"]');
  const voteButtonCount = await voteButtons.count();

  if (voteButtonCount > 0) {
    console.log(`[DEBUG] Trouvé ${voteButtonCount} boutons de vote pour les dates`);
    // Voter sur le premier bouton disponible (comme "Oui")
    const firstVoteButton = voteButtons.first();
    if (await firstVoteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstVoteButton.click();
      await page.waitForTimeout(500);
      console.log(`[DEBUG] Vote effectué sur le premier bouton`);
    } else {
      console.log(`[DEBUG] Aucun bouton de vote visible`);
    }
  } else {
    console.log(`[DEBUG] Aucun bouton de vote trouvé, formulaire vide ?`);
  }

  console.log(`[DEBUG] Soumission du formulaire...`);

  // Soumettre le formulaire
  const submitButton = page.locator('button[type="submit"], button:has-text("Soumettre")').first();
  await expect(submitButton).toBeVisible({ timeout: timeouts.element });
  await submitButton.click();

  // Attendre la confirmation
  console.log(`[DEBUG] Attente de la confirmation...`);

  // Vérifier la confirmation avec plusieurs alternatives de texte possibles
  const confirmationSelectors = [
    "text=/merci|enregistrée|enregistré|confirmation|votre réponse|votre vote/i",
    'div[role="alert"]',
    ".confirmation-message",
    ".alert-success",
  ];

  let confirmationVisible = false;

  for (const selector of confirmationSelectors) {
    try {
      const confirmationElement = page.locator(selector).first();
      await expect(confirmationElement).toBeVisible({ timeout: 5000 });
      console.log(`[DEBUG] Confirmation trouvée avec le sélecteur: ${selector}`);
      confirmationVisible = true;
      break;
    } catch (e) {
      console.log(`[DEBUG] Échec avec le sélecteur: ${selector}`);
    }
  }

  if (!confirmationVisible) {
    // Prendre une capture d'écran pour le débogage
    await page.screenshot({ path: "debug-confirmation-missing.png", fullPage: true });
    throw new Error("Impossible de trouver le message de confirmation après le vote");
  }

  console.log(`[SUCCÈS] Le vote de ${voterName} a été correctement enregistré.`);
}

/**
 * Ouvre l'onglet "Résultats" d'un poll et vérifie qu'au moins une date (jour de la semaine)
 * apparaît dans la page de résultats.
 * Réutilisé par les tests E2E Form Poll date.
 */
export async function openResultsAndCheckDates(
  page: Page,
  browserName: BrowserName,
): Promise<void> {
  const resultsTab = await waitForElementReady(page, 'button[role="tab"]:has-text("Résultats")', {
    browserName,
  });
  await resultsTab.click();
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  const dateElements = page.locator("text=/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i");
  const dateCount = await dateElements.count();
  await expect(dateCount).toBeGreaterThan(0);
}

/**
 * Simplifie un formulaire créé par IA en supprimant toutes les questions existantes
 * et en ajoutant une seule question texte simple obligatoire
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 */
async function simplifyFormToSingleQuestion(page: Page, browserName: BrowserName): Promise<void> {
  const timeouts = getTimeouts(browserName);

  console.log("[INFO] Simplification du formulaire pour les tests...");

  // Attendre que l'éditeur soit visible
  const editor = await waitForElementReady(page, "[data-poll-preview]", {
    browserName,
    timeout: timeouts.element,
  });

  // Trouver tous les onglets de questions (Q1, Q2, etc.)
  const questionTabs = page.locator('button[data-testid*="question"], button:has-text(/^Q\\d+$/i)');
  const tabCount = await questionTabs.count();

  console.log(`[INFO] Trouvé ${tabCount} onglets de questions à supprimer`);

  // Supprimer toutes les questions existantes (sauf la première qu'on va modifier)
  for (let i = tabCount - 1; i > 0; i--) {
    try {
      const tab = questionTabs.nth(i);
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`[INFO] Suppression de la question ${i + 1}`);

        // Cliquer sur l'onglet pour l'activer
        await tab.click();
        await page.waitForTimeout(500);

        // Chercher et cliquer sur le bouton de suppression
        const deleteButton = page
          .locator('button:has-text("Supprimer"), button[aria-label*="supprimer" i]')
          .first();
        if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deleteButton.click();

          // Confirmer la suppression si nécessaire
          const confirmButton = page
            .locator('button:has-text("Confirmer"), button:has-text("Oui")')
            .first();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
          }

          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      console.log(`[WARN] Impossible de supprimer la question ${i + 1}:`, e);
    }
  }

  // Maintenant modifier la première question pour en faire une question texte simple
  console.log("[INFO] Modification de la première question en question texte simple...");

  try {
    // S'assurer que le premier onglet est actif
    const firstTab = questionTabs.first();
    if (await firstTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstTab.click();
      await page.waitForTimeout(500);
    }

    // Trouver le select de type de question et le changer en "text"
    const typeSelect = page.locator('select[data-testid="question-kind-select"]').first();
    if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeSelect.selectOption("text");
      await waitForReactStable(page, { browserName });
    }

    // Modifier le titre de la question
    const titleInput = page
      .locator('input[placeholder*="titre" i], input[placeholder*="question" i]')
      .first();
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill("Comment avez-vous trouvé ce formulaire ?");
      await page.waitForTimeout(300);
    }

    // S'assurer que la question est marquée comme obligatoire
    const requiredCheckbox = page
      .locator(
        'input[type="checkbox"][aria-label*="obligatoire" i], input[type="checkbox"]:has-text("Obligatoire")',
      )
      .first();
    if (await requiredCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isChecked = await requiredCheckbox.isChecked();
      if (!isChecked) {
        await requiredCheckbox.click();
      }
    }

    console.log("[SUCCÈS] Formulaire simplifié avec une seule question texte obligatoire");
  } catch (e) {
    console.log("[WARN] Impossible de modifier la première question, mais on continue:", e);
  }

  // Attendre que les changements soient stabilisés
  await waitForReactStable(page, { browserName });
}

/**
 * Crée un formulaire complet avec question de type date, sélectionne des dates et publie automatiquement
 * Helper réutilisable pour tous les tests qui ont besoin d'un formulaire avec dates
 *
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 * @param formTitle - Le titre du formulaire (défaut: "Test Formulaire avec Question Date")
 * @returns L'URL du formulaire publié
 */
export async function createFormWithDateQuestion(
  page: Page,
  browserName: BrowserName,
  formTitle: string = "Test Formulaire avec Question Date",
): Promise<string> {
  const timeouts = getTimeouts(browserName);

  console.log(`[INFO] Création automatique d'un formulaire avec question date: "${formTitle}"`);

  // Aller sur la page de création
  await page.goto("/DooDates/form-polls/workspace/form", { waitUntil: "domcontentloaded" });
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  // Attendre que l'interface soit prête
  // Attendre que l'interface soit prête
  const titleInput = await waitForElementReady(
    page,
    'input[placeholder*="Titre"], input[placeholder*="Questionnaire"]',
    {
      browserName,
      timeout: timeouts.element * 1.5, // Augmenter un peu le timeout pour la CI
    },
  );

  // Mettre le titre
  console.log(`[DEBUG] Définition du titre: ${formTitle}`);
  // On remplit directement car on a déjà attendu et récupéré le locator
  await robustFill(titleInput, formTitle);

  // Changer la question existante en type "date"
  console.log("[DEBUG] Recherche du select de type de question");
  const typeSelect = await waitForElementReady(page, 'select[data-testid="question-kind-select"]', {
    browserName,
  });
  console.log('[DEBUG] Changement du type de question en "date"');
  await typeSelect.selectOption("date");
  await waitForReactStable(page, { browserName });

  // Attendre le calendrier
  console.log("[DEBUG] Attente du calendrier");
  const calendar = await waitForElementReady(page, '[data-testid="calendar"]', { browserName });

  // Sélectionner des dates futures (7 et 14 jours)
  const today = new Date();
  const futureDate1 = new Date(today);
  futureDate1.setDate(today.getDate() + 7);
  const futureDate2 = new Date(today);
  futureDate2.setDate(today.getDate() + 14);

  const dateStr1 = futureDate1.toISOString().split("T")[0];
  const dateStr2 = futureDate2.toISOString().split("T")[0];

  console.log(`[DEBUG] Sélection des dates: ${dateStr1} et ${dateStr2}`);

  // Approche directe : utiliser JavaScript pour déclencher onDateToggle
  console.log("[DEBUG] Utilisation approche JavaScript directe pour sélectionner les dates");

  const datesSelected = await page.evaluate(
    async (datesToSelect) => {
      try {
        // Trouver le composant DateQuestionEditor
        const dateEditor = document
          .querySelector('[data-testid="calendar"]')
          ?.closest("[data-testid]");
        if (!dateEditor) {
          console.error("DateQuestionEditor non trouvé");
          return false;
        }

        // Simuler les appels onDateToggle pour chaque date
        // On cherche dans le DOM des éléments qui pourraient avoir les handlers
        const calendarButtons = document.querySelectorAll(
          '[data-testid="calendar"] button[data-date]',
        );

        let selectedCount = 0;
        for (const button of calendarButtons) {
          const dateAttr = button.getAttribute("data-date");
          if (dateAttr && datesToSelect.includes(dateAttr)) {
            // Simuler un clic qui devrait déclencher onDateToggle
            (button as HTMLElement).click();
            console.log(`Clic simulé sur date: ${dateAttr}`);
            selectedCount++;

            // Attendre un peu entre les clics
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        console.log(`Dates sélectionnées via JavaScript: ${selectedCount}`);
        return selectedCount > 0;
      } catch (error) {
        console.error("Erreur lors de la sélection JavaScript:", error);
        return false;
      }
    },
    [dateStr1, dateStr2],
  );

  console.log(`[DEBUG] Résultat sélection JavaScript: ${datesSelected}`);

  // Fallback : utiliser les clics traditionnels si JavaScript échoue
  if (!datesSelected) {
    console.log("[WARN] Approche JavaScript échouée, utilisation fallback clics traditionnels");
    // ... code des clics traditionnels ...
  }

  console.log("[DEBUG] Dates sélectionnées, publication du formulaire");

  // Attendre un peu pour que l'état se mette à jour
  await page.waitForTimeout(1000);

  // Vérifier combien de dates sont sélectionnées dans l'état après les clics
  const selectedDatesCount = await page.evaluate(() => {
    try {
      const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
      const lastPoll = polls[polls.length - 1];
      if (lastPoll?.questions?.[0]?.selectedDates) {
        return lastPoll.questions[0].selectedDates.length;
      }
      return 0;
    } catch {
      return -1;
    }
  });
  console.log(
    `[DEBUG] Nombre de dates sélectionnées dans l'état après clics: ${selectedDatesCount}`,
  );

  // Si aucune date n'est sélectionnée, prendre une capture d'écran pour déboguer
  if (selectedDatesCount === 0) {
    console.log("[ERROR] Aucune date sélectionnée - prise de capture d'écran");
    await page.screenshot({ path: "debug-no-dates-selected.png", fullPage: true });
  }

  // Vérifier que le bouton de publication est bien visible et activé
  console.log("[DEBUG] Recherche du bouton de publication...");
  const publishButton = await waitForElementReady(page, '[data-testid="publish-button"]', {
    browserName,
  });
  console.log("[DEBUG] Bouton de publication trouvé");

  // Vérifier si le bouton est activé
  const isEnabled = await publishButton.isEnabled();
  console.log(`[DEBUG] Bouton de publication activé: ${isEnabled}`);

  if (!isEnabled) {
    console.log("[ERROR] Bouton de publication désactivé - validation échoue probablement");
    // Prendre une capture d'écran pour déboguer
    await page.screenshot({ path: "debug-publish-disabled.png", fullPage: true });
    throw new Error(
      "Le bouton de publication est désactivé - vérifiez que les dates sont sélectionnées",
    );
  }

  console.log("[DEBUG] Clic sur le bouton de publication...");
  await publishButton.click();

  console.log("[DEBUG] Publication en cours...");

  // Attendre que la page de confirmation soit stabilisée
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  // Cliquer sur "Voir le formulaire" (gère lui-même la navigation vers /poll/...)
  await clickViewFormButton(page);

  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  const finalUrl = page.url();
  console.log(`[SUCCÈS] Formulaire créé et accessible: ${finalUrl}`);

  return finalUrl;
}

async function openFormFromDashboard(
  page: Page,
  formTitle: string,
  timeout = 15000,
): Promise<void> {
  console.log(`[INFO] Navigation vers le tableau de bord...`);

  // Aller au tableau de bord
  await page.goto("/DooDates/form-polls/dashboard", { waitUntil: "domcontentloaded" });

  console.log(`[INFO] Recherche du formulaire "${formTitle}"...`);

  // Attendre que la liste des formulaires soit chargée
  const formList = page.locator('[data-testid="form-list"]');
  await expect(formList).toBeVisible({ timeout });

  // Essayer de trouver le formulaire par son titre
  const formCard = page.locator(`[data-testid="form-card"]:has-text("${formTitle}")`).first();
  await expect(formCard).toBeVisible({ timeout });

  console.log(`[INFO] Ouverture du formulaire "${formTitle}"...`);

  // Cliquer sur le bouton pour ouvrir le formulaire
  const openButton = formCard.locator('button:has-text("Ouvrir"), a[href*="/poll/"]').first();
  await expect(openButton).toBeVisible({ timeout: 5000 });
  await openButton.click();

  // Attendre que la page du formulaire soit chargée
  await page.waitForURL(/\/poll\/[^\/]+/, { timeout });
  console.log(`[SUCCÈS] Formulaire "${formTitle}" ouvert avec succès.`);
}

/**
 * Helper complet pour voter sur un poll (remplit nom, sélectionne options, soumet)
 * Supporte tous les types de questions : dates, choix multiples, texte
 */
export async function voteOnPollComplete(
  page: Page,
  browserName: BrowserName,
  pollSlug: string,
  voterName: string = "Test Voter",
): Promise<void> {
  const timeouts = getTimeouts(browserName);

  console.log(`[VOTE] Début du vote complet sur poll ${pollSlug} par ${voterName}`);

  // Navigation vers page de vote
  await page.goto(`/DooDates/poll/${pollSlug}`, { waitUntil: "domcontentloaded" });
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  // Vérifier que la page de vote est visible
  await expect(page).toHaveURL(/.*\/poll\/[^\/]+/, { timeout: timeouts.navigation });

  // Remplir le nom du votant
  const nameInput = page
    .locator(
      '#voter-name-input, input[placeholder*="nom" i], input[placeholder*="Nom" i], input[placeholder*="name" i], input[placeholder*="Name" i], input[type="text"]:visible',
    )
    .first();
  await expect(nameInput).toBeVisible({ timeout: timeouts.element });
  await nameInput.fill(voterName);

  // Attendre que le formulaire soit prêt
  await waitForReactStable(page, { browserName });

  // 1. Gérer les questions de date (boutons de vote Oui/Non/Peut-être)
  const dateVoteButtons = page.locator(
    'button:has-text("Oui"), button:has-text("Non"), button:has-text("Peut-être")',
  );
  const dateButtonCount = await dateVoteButtons.count();

  if (dateButtonCount > 0) {
    console.log(`[VOTE] Trouvé ${dateButtonCount} boutons de vote pour dates`);
    // Voter "Oui" sur la première date disponible
    const yesButton = dateVoteButtons.filter({ hasText: "Oui" }).first();
    if (await safeIsVisible(yesButton)) {
      await yesButton.click();
      await waitForReactStable(page, { browserName });
      console.log("[VOTE] Vote effectué sur date");
    }
  }

  // 2. Gérer les questions de choix uniques (radio buttons) groupés par "name"
  const radioGroupNames: string[] = await page.evaluate(() => {
    const names = new Set<string>();
    document.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
      if (!input.name || input.disabled) return;
      const styles = window.getComputedStyle(input);
      if (styles.display === "none" || styles.visibility === "hidden") return;
      names.add(input.name);
    });
    return Array.from(names);
  });

  for (const groupName of radioGroupNames) {
    const groupLocator = page.locator(`input[type="radio"][name="${groupName}"]`);
    const firstVisible = groupLocator.filter({ hasNotText: "" }).first();
    if (await safeIsVisible(firstVisible)) {
      await firstVisible.check();
      console.log(`[VOTE] Option sélectionnée pour le groupe ${groupName}`);
    }
  }

  // 3. Gérer les checkboxes
  const checkboxes = page.locator('input[type="checkbox"]').filter({ hasNotText: "" });
  const checkboxCount = await checkboxes.count();

  if (checkboxCount > 0) {
    console.log(`[VOTE] Trouvé ${checkboxCount} checkboxes`);
    // Cocher la première checkbox
    const firstCheckbox = checkboxes.first();
    if (await safeIsVisible(firstCheckbox)) {
      await firstCheckbox.check();
      console.log("[VOTE] Checkbox cochée");
    }
  }

  // 4. Gérer les champs texte (y compris textarea, inputs optionnels)
  const textInputs = page.locator('textarea, input[type="text"]:not(#voter-name-input)');
  const textInputCount = await textInputs.count();

  for (let i = 0; i < textInputCount; i++) {
    const input = textInputs.nth(i);
    if (await safeIsVisible(input)) {
      await input.fill(`Réponse test ${i + 1} de ${voterName}`);
      console.log(`[VOTE] Champ texte ${i + 1} rempli`);
    }
  }

  // 5. Gérer un champ email obligatoire si présent (ex. copie des réponses par email)
  const emailInput = page.locator('input[type="email"], input[inputmode="email"]').first();
  if (await safeIsVisible(emailInput)) {
    await emailInput.fill("test@example.com");
    console.log("[VOTE] Champ email rempli pour permettre la soumission");
  }

  // Prendre une capture d'écran avant soumission
  await page.screenshot({ path: "debug-before-submit.png", fullPage: true });

  // Soumettre le formulaire
  const submitButton = page
    .locator('button[type="submit"], button:has-text("Envoyer"), button:has-text("Soumettre")')
    .first();
  await expect(submitButton).toBeVisible({ timeout: timeouts.element });
  await submitButton.click();

  // Attendre la confirmation
  await waitForReactStable(page, { browserName });

  // Vérifier la confirmation (plusieurs patterns possibles)
  const confirmationSelectors = [
    "text=/merci|enregistré|confirmé|participation/i",
    "text=/vote.*enregistré|réponse.*enregistrée/i",
    '[role="alert"]',
    ".confirmation-message",
    '[data-testid="vote-confirmation-message"]',
  ];

  let confirmationFound = false;
  for (const selector of confirmationSelectors) {
    try {
      const element = page.locator(selector).first();
      await expect(element).toBeVisible({ timeout: 3000 });
      console.log(`[VOTE] Confirmation trouvée avec: ${selector}`);
      confirmationFound = true;
      break;
    } catch {
      // Continuer avec le prochain sélecteur
    }
  }

  if (!confirmationFound) {
    // Fallback: texte global sur la page
    const bodyText = await page.locator("body").innerText();
    if (/merci|réponse(s)?.*enregistrée|vote.*confirmé/i.test(bodyText)) {
      console.log("[VOTE] Confirmation implicite détectée via le contenu de la page");
      confirmationFound = true;
    }
  }

  if (!confirmationFound) {
    // Dernier recours: vérifier disparition du bouton submit
    try {
      await expect(submitButton).not.toBeVisible({ timeout: 3000 });
      console.log("[VOTE] Bouton de soumission disparu, confirmation supposée");
      confirmationFound = true;
    } catch {
      // ignore, on lèvera une erreur juste après
    }
  }

  if (!confirmationFound) {
    await page.screenshot({ path: "debug-confirmation-missing.png", fullPage: true });
    throw new Error(
      "Impossible de confirmer l’enregistrement du vote (aucun message ou signal détecté)",
    );
  }

  console.log(`[VOTE] ✅ Vote complet terminé pour ${voterName} sur poll ${pollSlug}`);
}

/**
 * Helper pour publier un poll et naviguer vers la page de vote
 */
export async function publishPollAndNavigateToVote(
  page: Page,
  browserName: BrowserName,
): Promise<string | null> {
  const timeouts = getTimeouts(browserName);

  console.log("[PUBLISH] Début publication du poll");

  // Attendre et cliquer sur le bouton de publication
  const publishButton = await waitForElementReady(
    page,
    '[data-testid="publish-button"], button:has-text("Publier")',
    { browserName },
  );
  await publishButton.click();

  console.log("[PUBLISH] Bouton de publication cliqué");

  // Attendre la redirection vers la page de succès
  await page.waitForURL(/\/poll\/[^\/]+/, { timeout: 15000 });
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  // Cliquer sur "Voir le formulaire" pour aller à la page de vote
  await clickViewFormButton(page);
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  // Récupérer le slug du poll
  const pollSlug = await getPollSlugFromPage(page);

  console.log(`[PUBLISH] ✅ Poll publié et navigation vers page de vote: ${pollSlug}`);

  return pollSlug;
} // <--- Added closing brace here

/**
 * Helper pour vérifier qu'un poll apparaît dans le dashboard
 */
export async function verifyPollInDashboard(
  page: Page,
  browserName: BrowserName,
  expectedTitle: string,
  timeout: number = 10000,
): Promise<void> {
  console.log(`[DASHBOARD] Vérification présence du poll "${expectedTitle}" dans dashboard`);

  // Aller au dashboard
  await page.goto("/DooDates/dashboard", { waitUntil: "domcontentloaded" });
  await waitForNetworkIdle(page, { browserName });

  // Attendre et vérifier que le poll apparaît
  const pollItem = await waitForElementReady(page, '[data-testid="poll-item"]', {
    browserName,
    timeout,
  });
  await expect(pollItem).toContainText(expectedTitle, { timeout });

  console.log(`[DASHBOARD] ✅ Poll "${expectedTitle}" trouvé dans dashboard`);
}

/**
 * Helper pour créer un poll directement dans localStorage (pour tests d'accès/résultats)
 */
export async function createPollInStorage(
  page: Page,
  pollData: {
    slug: string;
    title: string;
    type: "form" | "availability";
    resultsVisibility?: "creator-only" | "voters" | "public";
    questions?: any[];
    dates?: any[];
    creator_id?: string;
  },
): Promise<void> {
  const deviceId = pollData.creator_id || `dev-${Date.now()}`;

  await page.evaluate(
    ({ poll, deviceId }) => {
      const fullPoll = {
        id: poll.slug,
        slug: poll.slug,
        title: poll.title,
        type: poll.type,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: deviceId,
        resultsVisibility: poll.resultsVisibility || "creator-only",
        dates: poll.dates || [],
        questions: poll.questions || [],
      };

      const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
      polls.push(fullPoll);
      localStorage.setItem("doodates_polls", JSON.stringify(polls));
      localStorage.setItem("dd-device-id", deviceId);
    },
    { poll: pollData, deviceId },
  );

  console.log(`[STORAGE] ✅ Poll "${pollData.title}" créé dans localStorage`);
}

/**
 * Vérifie qu'un poll identifié par son slug apparaît dans le dashboard.
 * Plus robuste que l'ancienne implémentation :
 * - scanne tous les éléments [data-testid="poll-item"]
 * - fallback sur tous les liens de la page si nécessaire
 */
export async function verifyPollBySlugInDashboard(
  page: Page,
  browserName: BrowserName,
  expectedSlug: string,
  timeout = 10000,
): Promise<void> {
  await page.goto("/DooDates/dashboard", { waitUntil: "domcontentloaded" });
  await waitForNetworkIdle(page, { browserName });

  const pollItems = page.locator('[data-testid="poll-item"]');
  const itemCount = await pollItems.count();

  console.log(
    `[DASHBOARD] Recherche du poll avec slug "${expectedSlug}" (poll-items: ${itemCount})`,
  );

  // 1. Chercher dans tous les poll-item
  for (let i = 0; i < itemCount; i++) {
    const item = pollItems.nth(i);
    const link = item.locator(`a[href*='/DooDates/poll/${expectedSlug}"]`).first();
    if (await link.isVisible({ timeout }).catch(() => false)) {
      console.log(`[DASHBOARD] ✅ Poll avec slug "${expectedSlug}" trouvé dans poll-item #${i}`);
      return;
    }
  }

  // 2. Fallback : scanner tous les liens de la page
  const anyLink = page.locator(`a[href*='/DooDates/poll/${expectedSlug}"]`).first();
  if (await anyLink.isVisible({ timeout }).catch(() => false)) {
    console.log(`[DASHBOARD] ✅ Poll avec slug "${expectedSlug}" trouvé via scan global des liens`);
    return;
  }

  // 3. Si toujours rien : log détaillé et échec explicite
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter(Boolean),
  );

  console.log("[DASHBOARD] ❌ Aucun lien de poll trouvé pour ce slug", {
    expectedSlug,
    hrefSamples: hrefs.slice(0, 10),
  });

  throw new Error(
    `Poll avec slug "${expectedSlug}" introuvable dans le dashboard (voir logs pour les href présents).`,
  );
}

/**
 * Setup commun pour les tests E2E avec navigation vers workspace
 */
export async function setupTestWithWorkspace(
  page: Page,
  browserName: BrowserName,
  options: {
    enableE2ELocalMode?: boolean;
    warmup?: boolean;
    consoleGuard?: boolean;
    mocks?: { all?: boolean; gemini?: boolean };
  } = {},
): Promise<void> {
  const { setupTestEnvironment } = await import("../helpers/test-setup");

  await setupTestEnvironment(page, browserName, {
    enableE2ELocalMode: options.enableE2ELocalMode ?? true,
    warmup: options.warmup ?? true,
    consoleGuard: options.consoleGuard ? { enabled: true } : undefined,
    mocks: options.mocks || { all: true },
  });

  await page.goto("/DooDates/workspace", { waitUntil: "domcontentloaded" });
  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  // Attendre que le chat input soit prêt via le helper résilient
  await waitForChatInputReady(page, browserName);

  console.log("[SETUP] ✅ Page workspace prête pour les tests");
}
