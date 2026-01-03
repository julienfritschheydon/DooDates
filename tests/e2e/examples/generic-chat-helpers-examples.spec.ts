/**
 * Exemple d'utilisation des helpers de chat améliorés
 * Montre comment utiliser les nouvelles fonctions génériques pour les tests E2E
 */

import { test, expect } from "@playwright/test";
import {
  navigateToWorkspaceAuto,
  findChatZone,
  validateChatState,
  sendChatMessage,
  waitForAIResponse,
  verifyChatFunctionality,
  detectPollType,
  type WorkspaceType,
} from "../helpers/chat-helpers";

test.describe("Exemples d'utilisation des helpers génériques", () => {
  test("Exemple 1: Navigation automatique et détection de type", async ({ page, browserName }) => {
    // Navigation avec détection automatique du type de poll
    const detectedType = await navigateToWorkspaceAuto(page, browserName, {
      addE2EFlag: true,
      waitForChat: true,
    });

    console.log(`Type détecté automatiquement: ${detectedType}`);

    // Vérifier que le chat est fonctionnel
    const verification = await verifyChatFunctionality(page, {
      testMessage: "Test automatique",
      timeout: 10000,
    });

    expect(verification.isFunctional).toBe(true);
    console.log(`Chat fonctionnel pour le type: ${verification.pollType}`);
  });

  test("Exemple 2: Utilisation générique pour tous les types de polls", async ({
    page,
    browserName,
  }) => {
    // Cette fonction marche pour date, form, quizz, availability sans changement
    await navigateToWorkspaceAuto(page, browserName);

    // Trouver la zone chat automatiquement
    const chatZone = await findChatZone(page);
    console.log("Zone chat trouvée avec détection automatique");

    // Valider l'état du chat
    await validateChatState(page, "ready");

    // Envoyer un message avec détection automatique
    await sendChatMessage(page, "Crée un sondage de test", {
      useAutoDetection: true,
      waitForResponse: true,
    });

    // Attendre la réponse IA avec patterns spécifiques au type détecté
    await waitForAIResponse(page);
  });

  test("Exemple 3: Test multi-types avec la même logique", async ({ page, browserName }) => {
    const testCases: Array<{ type: WorkspaceType; message: string }> = [
      { type: "date", message: "Organise une réunion demain" },
      { type: "form", message: "Crée un formulaire de feedback" },
      { type: "quizz", message: "Crée un quiz sur les technologies" },
      { type: "availability", message: "Quand es-tu disponible cette semaine ?" },
    ];

    for (const testCase of testCases) {
      console.log(`\n--- Test pour ${testCase.type} ---`);

      // Naviguer vers le workspace spécifique
      await navigateToWorkspaceAuto(page, browserName, {
        forceType: testCase.type,
        waitForChat: true,
      });

      // Vérifier le type détecté
      const detectedType = await detectPollType(page);
      expect(detectedType).toBe(testCase.type);

      // Tester la conversation complète
      const verification = await verifyChatFunctionality(page, {
        testMessage: testCase.message,
        pollType: testCase.type,
      });

      expect(verification.isFunctional).toBe(true);

      // Envoyer le message et attendre la réponse
      await sendChatMessage(page, testCase.message, {
        useAutoDetection: true,
        waitForResponse: false, // On gère l'attente manuellement
      });

      await waitForAIResponse(page, {
        pollType: testCase.type,
        timeout: 20000,
      });

      console.log(`✅ ${testCase.type} fonctionnel`);
    }
  });

  test("Exemple 4: Gestion des erreurs et fallbacks", async ({ page, browserName }) => {
    await navigateToWorkspaceAuto(page, browserName);

    // Tester la validation d'état avec différents états
    try {
      await validateChatState(page, "ready", { timeout: 5000 });
      console.log("✅ Chat est prêt");
    } catch (error) {
      console.log("⚠️ Chat pas prêt, test des autres états...");

      // Tester si le chat est en cours de chargement
      try {
        await validateChatState(page, "loading", { timeout: 3000 });
        console.log("🔄 Chat est en cours de chargement");
      } catch {
        console.log("❌ Chat ni prêt ni chargement");
      }
    }

    // Tester findChatZone avec fallbacks
    try {
      const chatZone = await findChatZone(page);
      console.log("✅ Zone chat trouvée avec stratégie de détection");
    } catch (error) {
      console.log("❌ Impossible de trouver la zone chat:", error);
      throw error;
    }
  });

  test("Exemple 5: Workflow complet générique", async ({ page, browserName }) => {
    // 1. Navigation et détection
    const pollType = await navigateToWorkspaceAuto(page, browserName);
    console.log(`Type de poll: ${pollType}`);

    // 2. Vérification complète
    const verification = await verifyChatFunctionality(page, {
      timeout: 15000,
    });

    if (!verification.isFunctional) {
      throw new Error(`Chat non fonctionnel: ${verification.error}`);
    }

    // 3. Interaction selon le type
    let message: string;
    switch (pollType) {
      case "form":
        message = "Crée un formulaire d'inscription avec nom et email";
        break;
      case "quizz":
        message = "Crée un quiz de 3 questions sur React";
        break;
      case "availability":
        message = "Organise un appel cette semaine";
        break;
      case "date":
      case "default":
      default:
        message = "Organise une réunion la semaine prochaine";
        break;
    }

    // 4. Envoi et attente de réponse
    await sendChatMessage(page, message, {
      useAutoDetection: true,
      waitForResponse: false,
    });

    await waitForAIResponse(page, {
      pollType,
      timeout: 25000,
    });

    console.log(`✅ Workflow complet réussi pour ${pollType}`);
  });
});
