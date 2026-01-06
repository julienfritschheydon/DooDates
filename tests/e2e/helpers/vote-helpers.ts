import { Page, expect } from "@playwright/test";
import { type BrowserName, getTimeouts } from "./poll-core-helpers";
import { waitForNetworkIdle, waitForReactStable } from "./wait-helpers";
import { safeIsVisible } from "./safe-helpers";

/**
 * Specialized helpers for voting on polls.
 */

/**
 * Soumet un vote et vérifie la confirmation (Legacy helper used in specialized scenarios)
 */
export async function submitVoteAndVerifyConfirmation(
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
  await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});

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
      await page.waitForLoadState("domcontentloaded", { timeout: 2000 }).catch(() => {});
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
  await page.goto(`/poll/${pollSlug}`, { waitUntil: "domcontentloaded" });
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
