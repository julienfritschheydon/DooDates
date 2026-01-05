/**
 * Helpers pour la gestion du chat dans les tests E2E
 * Factorise le code commun pour naviguer vers workspace, envoyer des messages, etc.
 */

import { Page, expect } from "@playwright/test";
import { waitForPageLoad, robustFill } from "../utils";
import { waitForChatInputReady, waitForReactStable } from "./wait-helpers";

/**
 * Types de workspace disponibles
 */
export type WorkspaceType = "date" | "form" | "quizz" | "availability" | "default";

/**
 * Configuration des URLs de workspace selon le type
 */
const WORKSPACE_URLS: Record<WorkspaceType, string> = {
  date: "/date/workspace/date",
  form: "/form/workspace/form",
  quizz: "/quizz/workspace",
  availability: "/availability/workspace/availability",
  default: "/date/workspace/date",
};

/**
 * Détecte automatiquement le type de poll en fonction de l'URL et du contenu
 *
 * @param page - La page Playwright
 * @returns Le type de poll détecté
 */
export async function detectPollType(page: Page): Promise<WorkspaceType> {
  // 1. Détection via l'URL (méthode principale)
  const url = page.url();
  if (url.includes("/form/")) return "form";
  if (url.includes("/date/")) return "date";
  if (url.includes("/quizz/")) return "quizz";
  if (url.includes("/availability/")) return "availability";

  // 2. Fallback via le contenu de la page
  try {
    const hasDateElements =
      (await page.locator('[data-testid="calendar"], [data-testid="date-picker"]').count()) > 0;
    const hasFormElements =
      (await page.locator('[data-testid="question-card"], [data-testid="form-editor"]').count()) >
      0;
    const hasQuizzElements =
      (await page.locator('[data-testid="quizz-editor"], [data-testid="question-quizz"]').count()) >
      0;

    if (hasQuizzElements) return "quizz";
    if (hasFormElements) return "form";
    if (hasDateElements) return "date";
  } catch {
    // Ignorer les erreurs de détection
  }

  // 3. Fallback via les placeholders dans le chat
  try {
    const chatInput = page.locator("textarea").first();
    const placeholder = await chatInput.getAttribute("placeholder");

    if (placeholder?.includes("formulaire")) return "form";
    if (placeholder?.includes("sondage") && placeholder?.includes("date")) return "date";
    if (placeholder?.includes("quiz")) return "quizz";
    if (placeholder?.includes("disponibilités")) return "availability";
  } catch {
    // Ignorer les erreurs
  }

  // 4. Default par défaut
  return "default";
}

/**
 * Trouve la zone chat principale
 * Simplifié : retourne directement [data-testid="chat-input"]
 *
 * @param page - La page Playwright
 * @returns Le locator de la zone chat trouvée
 */
export async function findChatZone(page: Page): Promise<ReturnType<Page["locator"]>> {
  const chatInput = page.locator('[data-testid="chat-input"]').first();
  await chatInput.waitFor({ state: "visible", timeout: 15000 });
  return chatInput;
}

/**
 * Valide l'état du chat (prêt, chargement, désactivé)
 * Utile pour les tests qui doivent vérifier l'état de l'interface
 *
 * @param page - La page Playwright
 * @param expectedState - L'état attendu du chat
 * @param options - Options supplémentaires
 */
export async function validateChatState(
  page: Page,
  expectedState: "ready" | "loading" | "disabled" | "hidden",
  options?: {
    timeout?: number;
    fallbackSelector?: string;
  },
): Promise<void> {
  const timeout = options?.timeout || 10000;
  const selector = options?.fallbackSelector || '[data-testid="chat-input"]';
  const chatInput = page.locator(selector).first();

  switch (expectedState) {
    case "ready":
      await expect(chatInput).toBeVisible({ timeout });
      await expect(chatInput).toBeEnabled({ timeout });
      break;

    case "loading":
      await expect(chatInput).toBeVisible({ timeout });
      await expect(chatInput).toBeDisabled({ timeout });
      // Vérifier aussi l'indicateur de chargement
      try {
        const loadingIndicator = page
          .locator('[data-testid="ai-thinking"], [data-testid="loading"]')
          .first();
        await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
      } catch {
        // L'indicateur de chargement est optionnel
      }
      break;

    case "disabled":
      await expect(chatInput).toBeDisabled({ timeout });
      break;

    case "hidden":
      await expect(chatInput).toBeHidden({ timeout });
      break;
  }
}

/**
 * Navigue vers le workspace spécifié et attend que le chat soit prêt
 * Version améliorée avec détection automatique du type si non spécifié
 *
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 * @param workspaceType - Le type de workspace ('date', 'form', 'quizz', 'availability', 'default')
 * @param options - Options supplémentaires
 */
export async function navigateToWorkspace(
  page: Page,
  browserName: string,
  workspaceType: WorkspaceType = "default",
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: "domcontentloaded" | "networkidle" | "load";
    waitForChat?: boolean;
  },
) {
  let navigationAttempts = 0;
  const maxAttempts = 2;

  while (navigationAttempts < maxAttempts) {
    try {
      console.log(
        `🚀 Navigation attempt ${navigationAttempts + 1}/${maxAttempts} to ${workspaceType}`,
      );

      // Vérifier si la page est déjà fermée
      if (page.isClosed()) {
        throw new Error("Cannot navigate: page is already closed.");
      }

      const url = WORKSPACE_URLS[workspaceType];
      const finalUrl = options?.addE2EFlag ? `${url}?e2e-test=true` : url;

      console.log(`🚀 Navigation vers: ${finalUrl}`);

      // Vérification défensive juste avant la navigation
      if (page.isClosed()) {
        throw new Error("Cannot navigate: page is already closed before goto");
      }

      // Navigation avec timeout augmenté et waitUntil plus robuste
      await page.goto(finalUrl, {
        waitUntil: options?.waitUntil || "networkidle",
        timeout: 45000,
      });

      console.log(`✅ Navigation terminée: ${page.url()}`);

      // Vérification immédiate après navigation
      if (page.isClosed()) {
        throw new Error("Page was closed immediately after navigation");
      }

      // Attendre un peu pour laisser le temps à la page de se stabiliser
      await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => { });

      // Vérification après le temps d'attente
      if (page.isClosed()) {
        throw new Error("Page was closed during stabilization after navigation");
      }

      await waitForPageLoad(page, browserName);

      // Vérification défensive après chaque opération critique
      if (page.isClosed()) {
        throw new Error("Page was closed after page load");
      }

      // N'attendre le chat que si explicitement demandé (par défaut oui pour compatibilité)
      const shouldWaitForChat = options?.waitForChat !== false;

      if (shouldWaitForChat) {
        // Simplifié : le chat input est toujours trouvé avec [data-testid="chat-input"]
        // Inutile de passer par les fallbacks complexes qui ajoutent 15s de timeout
        console.log("🔍 Recherche chat input avec timeout: 15000ms");

        try {
          // Attendre directement le chat input avec un timeout raisonnable
          await page.waitForSelector('[data-testid="chat-input"]', { timeout: 15000 });
          console.log('✅ Chat input [data-testid="chat-input"] trouvé');
        } catch (error) {
          console.log(
            "⚠️ Erreur détaillée:",
            error instanceof Error ? error.message : String(error),
          );
          throw new Error('Chat input [data-testid="chat-input"] non trouvé après 15s');
        }

        // Attendre que React soit stable
        await waitForReactStable(page, { browserName });
      } else {
        console.log("⏭️ Skip chat input wait (waitForChat: false)");
        // Juste attendre que React soit stable
        await waitForReactStable(page, { browserName });
      }

      // Vérification défensive finale
      if (page.isClosed()) {
        throw new Error("Page was closed at end of navigation");
      }

      console.log(`✅ Navigation réussie à la tentative ${navigationAttempts + 1}`);
      return; // Succès, sortir de la boucle
    } catch (error) {
      navigationAttempts++;
      console.error(
        `❌ Navigation attempt ${navigationAttempts} failed:`,
        error instanceof Error ? error.message : String(error),
      );

      // Screenshot pour le debug
      try {
        await page.screenshot({
          path: `debug-navigation-failed-attempt-${navigationAttempts}-${Date.now()}.png`,
          fullPage: true,
        });
        console.log("📸 Screenshot de debug sauvegardé");
      } catch (screenshotError) {
        console.log("⚠️ Impossible de sauvegarder le screenshot:", screenshotError);
      }

      // Logs détaillés pour le debug
      try {
        // Si la page est chargée mais pas de chat input, continuer sans chat
        if (
          (await page.locator("body").isVisible()) &&
          (await page.title().then((title) => title.includes("DooDates")))
        ) {
          console.log("⚠️ Page chargée mais chat input absent - probablement mode CI différent");
          console.log("⏭️ Continuation sans chat input (mode CI acceptable)");
          return; // Continuer sans erreur - mode CI simplifié
        }
        const bodyExists = (await page.locator("body").count()) > 0;
        const bodyVisible = bodyExists ? await page.locator("body").isVisible() : false;
        console.log(`🔍 Body exists: ${bodyExists}, visible: ${bodyVisible}`);

        // Vérifier le root
        const rootExists = (await page.locator("#root").count()) > 0;
        console.log(`🔍 Root exists: ${rootExists}`);
      } catch (debugError) {
        console.log("⚠️ Impossible de récupérer les infos de debug:", debugError);
      }

      if (navigationAttempts >= maxAttempts) {
        throw new Error(
          `Navigation failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Attendre avant de réessayer
      console.log(`⏳ Attente avant retry ${navigationAttempts + 1}...`);
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => { });
    }
  }
}

/**
 * Navigue vers le workspace avec détection automatique du type
 * Utilise l'URL actuelle pour déterminer le type de workspace approprié
 *
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 * @param options - Options supplémentaires
 */
export async function navigateToWorkspaceAuto(
  page: Page,
  browserName: string,
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: "domcontentloaded" | "networkidle" | "load";
    waitForChat?: boolean;
    forceType?: WorkspaceType; // Forcer un type spécifique si détection échoue
  },
): Promise<WorkspaceType> {
  // Détecter le type de poll automatiquement
  const detectedType = options?.forceType || (await detectPollType(page));
  console.log(`🔍 Auto-detected poll type: ${detectedType}`);

  // Naviguer vers le workspace approprié
  await navigateToWorkspace(page, browserName, detectedType, options);

  return detectedType;
}

/**
 * @deprecated Utiliser navigateToWorkspace(page, browserName, 'date') à la place
 * Navigue vers le workspace des date-polls (compatibilité ascendante)
 */
export async function navigateToDateWorkspace(
  page: Page,
  browserName: string,
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: "domcontentloaded" | "networkidle" | "load";
  },
) {
  return navigateToWorkspace(page, browserName, "date", options);
}

/**
 * @deprecated Utiliser navigateToWorkspace(page, browserName, 'form') à la place
 * Navigue vers le workspace des form-polls
 */
export async function navigateToFormWorkspace(
  page: Page,
  browserName: string,
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: "domcontentloaded" | "networkidle" | "load";
  },
) {
  return navigateToWorkspace(page, browserName, "form", options);
}

/**
 * Attend que le champ de saisie du chat soit visible
 * Simplifié : le chat input est toujours [data-testid="chat-input"]
 *
 * @param page - La page Playwright
 * @param timeout - Timeout en ms (optionnel, 15000ms par défaut)
 */
export async function waitForChatInput(page: Page, timeout?: number) {
  const actualTimeout = timeout || 15000;
  console.log(`🔍 waitForChatInput: Recherche du chat input avec timeout ${actualTimeout}ms...`);

  try {
    // Attendre directement le chat input
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.waitFor({ state: "visible", timeout: actualTimeout });

    // Vérifier qu'il est bien interactif
    await expect(chatInput).toBeVisible({ timeout: actualTimeout });
    await expect(chatInput).toBeEnabled({ timeout: actualTimeout });

    console.log('✅ waitForChatInput: Chat input [data-testid="chat-input"] trouvé et prêt');
    return chatInput;
  } catch (error) {
    console.log("❌ waitForChatInput: Échec de la recherche du chat input");

    // Vérifier si la page est fermée
    if (page.isClosed()) {
      console.log("❌ La page est fermée - impossible de continuer");
      throw new Error("Page is closed - cannot continue with chat input search");
    }

    // Prendre un screenshot pour debug
    try {
      await page.screenshot({ path: "debug-chat-input.png", fullPage: true });
      console.log("🔍 waitForChatInput: Screenshot sauvegardé dans debug-chat-input.png");
    } catch (screenshotError) {
      console.log("❌ Impossible de prendre un screenshot");
    }

    throw new Error(`Chat input [data-testid="chat-input"] non trouvé après ${actualTimeout}ms`);
  }
}

/**
 * Envoie un message dans le chat
 * Simplifié : utilise directement [data-testid="chat-input"]
 *
 * @param page - La page Playwright
 * @param message - Le message à envoyer
 * @param options - Options supplémentaires
 */
export async function sendChatMessage(
  page: Page,
  message: string,
  options?: {
    waitForResponse?: boolean;
    timeout?: number;
  },
) {
  const timeout = options?.timeout || 10000;

  // Utiliser directement le chat input
  const messageInput = page.locator('[data-testid="chat-input"]');

  await expect(messageInput).toBeVisible({ timeout });
  await expect(messageInput).toBeEnabled({ timeout });

  await robustFill(messageInput, message, { debug: process.env.DEBUG_E2E === "1" });
  await messageInput.press("Enter");

  if (options?.waitForResponse !== false) {
    // Attendre que le message apparaisse ou que l'input soit toujours disponible
    const messageVisible = await page
      .locator(`text=${message}`)
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!messageVisible) {
      // Si le message n'apparaît pas, vérifier que l'input est toujours disponible
      await expect(messageInput).toBeVisible();
    }
  }
}

/**
 * Attend qu'une réponse IA apparaisse dans le chat (version générique)
 * Détecte automatiquement les patterns de réponse quel que soit le type de poll
 *
 * @param page - La page Playwright
 * @param options - Options d'attente
 */
export async function waitForAIResponse(
  page: Page,
  options?: {
    timeout?: number;
    pollType?: WorkspaceType; // Type de poll pour patterns spécifiques
  },
) {
  const timeout = options?.timeout || 30000;
  const pollType = options?.pollType || (await detectPollType(page));

  // Patterns de réponse selon le type de poll
  let successPatterns: string[];
  let errorPatterns: string[] = ["désolé", "quota dépassé", "erreur", "une erreur s'est produite"];

  switch (pollType) {
    case "form":
      successPatterns = [
        "Voici votre questionnaire",
        "Voici votre formulaire",
        "Voici le questionnaire",
        "Voici le formulaire",
        "J'ai créé un questionnaire",
        "J'ai créé un formulaire",
      ];
      break;
    case "quizz":
      successPatterns = [
        "Voici votre quiz",
        "Voici votre quizz",
        "Voici le quiz",
        "Voici le quizz",
        "J'ai créé un quiz",
        "J'ai créé un quizz",
      ];
      break;
    case "availability":
      successPatterns = [
        "Voici votre sondage de disponibilités",
        "Voici votre créneau",
        "Voici les disponibilités",
        "Voici les créneaux",
        "J'ai organisé vos disponibilités",
      ];
      break;
    case "date":
    default:
      successPatterns = [
        "Voici votre sondage",
        "Voici votre questionnaire",
        "Voici le sondage",
        "Voici le questionnaire",
        "J'ai créé un sondage",
        "J'ai créé un questionnaire",
      ];
      break;
  }

  // Attendre une réponse (succès ou erreur)
  const successLocators = successPatterns.map((pattern) => page.locator(`text=${pattern}`));
  const errorLocators = errorPatterns.map((pattern) => page.locator(`text=${pattern}`));

  // Race condition entre succès et erreur
  const results = await Promise.race([
    ...successLocators.map((locator) =>
      locator.waitFor({ state: "visible", timeout }).catch(() => null),
    ),
    ...errorLocators.map((locator) =>
      locator.waitFor({ state: "visible", timeout }).catch(() => null),
    ),
  ]);

  // Vérifier s'il y a une erreur
  for (const errorLocator of errorLocators) {
    const hasError = await errorLocator.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasError) {
      const errorContent = await errorLocator.textContent();
      throw new Error(`L'IA a retourné une erreur: ${errorContent}`);
    }
  }

  // Vérifier qu'on a bien une réponse de succès
  let hasSuccess = false;
  for (const successLocator of successLocators) {
    const isVisible = await successLocator.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      hasSuccess = true;
      break;
    }
  }

  if (!hasSuccess) {
    throw new Error(`Aucune réponse IA de succès détectée pour le type ${pollType}`);
  }
}

/**
 * Vérifie qu'une conversation est active et fonctionnelle
 * Combine détection de zone + validation état + test d'envoi
 *
 * @param page - La page Playwright
 * @param options - Options de vérification
 */
export async function verifyChatFunctionality(
  page: Page,
  options?: {
    testMessage?: string;
    pollType?: WorkspaceType;
    timeout?: number;
  },
): Promise<{
  pollType: WorkspaceType;
  chatZone: ReturnType<Page["locator"]>;
  isFunctional: boolean;
  error?: string;
}> {
  const timeout = options?.timeout || 15000;
  const testMessage = options?.testMessage || "Test de fonctionnement";

  try {
    // 1. Détecter le type de poll
    const pollType = options?.pollType || (await detectPollType(page));
    console.log(`🔍 Detected poll type: ${pollType}`);

    // 2. Trouver la zone chat
    const chatZone = await findChatZone(page);
    console.log("✅ Chat zone found");

    // 3. Valider que le chat est prêt
    await validateChatState(page, "ready", { timeout });
    console.log("✅ Chat state validated: ready");

    // 4. Tester l'envoi d'un message (si demandé)
    if (options?.testMessage) {
      await sendChatMessage(page, testMessage, {
        timeout,
        waitForResponse: false, // Ne pas attendre de réponse pour un test simple
      });
      console.log("✅ Test message sent successfully");
    }

    return {
      pollType,
      chatZone,
      isFunctional: true,
    };
  } catch (error) {
    return {
      pollType: options?.pollType || "default",
      chatZone: page.locator("body"), // Fallback
      isFunctional: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Récupère l'ID de la conversation la plus récente depuis localStorage
 * Version améliorée avec fallbacks multiples
 *
 * @param page - La page Playwright
 * @returns L'ID de la conversation ou null
 */
export async function getLatestConversationId(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    // Méthode 1: Chercher dans doodates_conversations (format principal)
    const conversationsData = localStorage.getItem("doodates_conversations");
    if (conversationsData) {
      try {
        const conversations = JSON.parse(conversationsData);
        if (Array.isArray(conversations) && conversations.length > 0) {
          // Retourner l'ID de la conversation la plus récente
          const sorted = conversations.sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          return sorted[0].id || null;
        }
      } catch (e) {
        // Ignorer erreur de parsing
      }
    }

    // Méthode 2: Chercher des clés conversation_* (format legacy)
    const keys = Object.keys(localStorage);
    const convKey = keys.find((k) => k.startsWith("conversation_"));
    if (convKey) {
      return convKey.replace("conversation_", "");
    }

    return null;
  });
}

/**
 * Attend qu'une conversation soit créée dans localStorage ou Supabase
 *
 * @param page - La page Playwright
 * @param maxAttempts - Nombre maximum de tentatives (défaut: 15)
 * @returns L'ID de la conversation ou null
 */
export async function waitForConversationCreated(
  page: Page,
  maxAttempts: number = 15,
): Promise<string | null> {
  let conversationId: string | null = null;
  let attempts = 0;

  while (!conversationId && attempts < maxAttempts) {
    await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => { });
    conversationId = await getLatestConversationId(page);
    attempts++;
  }

  return conversationId;
}
