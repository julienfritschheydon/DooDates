/**
 * Global setup for E2E tests
 * Mocks external APIs to prevent costs and ensure test reliability
 */
import { Page, Route, BrowserContext } from "@playwright/test";

/**
 * Generate intelligent mock response based on user prompt
 */
function generateMockPollResponse(prompt: string): any {
  const lowerPrompt = prompt.toLowerCase();

  console.log("🤖 generateMockPollResponse - Prompt:", lowerPrompt.substring(0, 100) + "...");

  // Detect if it's a form poll or date poll request
  const isFormPoll =
    lowerPrompt.includes("questionnaire") ||
    lowerPrompt.includes("formulaire") ||
    lowerPrompt.includes("form") ||
    lowerPrompt.includes("question");

  console.log("🤖 generateMockPollResponse - isFormPoll:", isFormPoll);

  if (isFormPoll) {
    // 🎯 Détection de mots-clés spéciaux pour les tests E2E
    let numQuestions = 3; // Par défaut
    let simpleTextOnly = false; // Pour générer uniquement des questions texte simples

    if (lowerPrompt.includes("e2e-test-1-question") || lowerPrompt.includes("1 seule question")) {
      numQuestions = 1;
      simpleTextOnly = true; // Test simple : 1 question texte uniquement
    } else if (lowerPrompt.includes("e2e-test-2-questions")) {
      numQuestions = 2;
    } else {
      // Sinon, extraire le nombre du prompt
      const questionMatch = lowerPrompt.match(/(\d+)\s*(question|q)/);
      numQuestions = questionMatch ? parseInt(questionMatch[1]) : 3;
    }

    // Generate questions
    const questions: any[] = [];
    for (let i = 1; i <= numQuestions; i++) {
      if (simpleTextOnly) {
        // Pour les tests E2E : questions texte simples uniquement
        questions.push({
          title: `Question ${i} générée par mock`,
          type: "text",
          required: true,
          placeholder: "Votre réponse...",
          maxLength: 500,
        });
      } else {
        // Mode normal : variété de types de questions
        questions.push({
          title: `Question ${i} générée par mock`,
          type: i === 1 ? "single" : i === 2 ? "multiple" : "text",
          required: true,
          ...(i === 1 && { options: ["Option A", "Option B", "Option C"] }),
          ...(i === 2 && { options: ["Choix 1", "Choix 2", "Choix 3"], maxChoices: 2 }),
          ...(i === 3 && { placeholder: "Votre réponse...", maxLength: 500 }),
        });
      }
    }

    const pollData = {
      type: "form",
      title: "Questionnaire Mock E2E",
      slug: "questionnaire-mock-e2e",
      description: "Questionnaire généré automatiquement pour les tests",
      questions,
    };

    console.log("🤖 generateMockPollResponse - pollData généré:", JSON.stringify(pollData));

    return {
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(pollData) }],
          },
          finishReason: "STOP",
        },
      ],
    };
  } else {
    // Date poll mock
    // Extraire le titre depuis le prompt si présent
    let title = "Sondage de dates Mock E2E";

    // Chercher d'abord un titre après "créer un sondage", "créer le sondage", "titre", etc.
    const titleAfterKeyword = prompt.match(
      /(?:créer un sondage|créer le sondage|titre|title)\s+[«"]([^»"]+)[»"]|(?:créer un sondage|créer le sondage|titre|title)\s+"([^"]+)"/i,
    );
    if (titleAfterKeyword) {
      title = titleAfterKeyword[1] || titleAfterKeyword[2];
    } else {
      // Fallback: chercher le premier texte entre guillemets
      const firstQuoted = prompt.match(/[«"]([^»"]{5,})[»"]|"([^"]{5,})"/);
      if (firstQuoted) {
        title = firstQuoted[1] || firstQuoted[2];
      }
    }

    // Extraire les dates depuis le prompt si présentes (format YYYY-MM-DD)
    let dates: string[] = [];
    const dateMatches = prompt.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g);
    const extractedDates = Array.from(dateMatches).map((m) => m[1]);

    if (extractedDates.length > 0) {
      dates = extractedDates;
    } else {
      // Générer des dates futures par défaut (J+1, J+2, J+3)
      const today = new Date();
      for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().split("T")[0]);
      }
    }

    // Générer des créneaux horaires par défaut pour chaque date
    const timeSlotsByDate: Record<
      string,
      Array<{ hour: number; minute: number; enabled: boolean }>
    > = {};
    dates.forEach((date) => {
      timeSlotsByDate[date] = [
        { hour: 9, minute: 0, enabled: true },
        { hour: 10, minute: 0, enabled: true },
        { hour: 14, minute: 0, enabled: true },
        { hour: 15, minute: 0, enabled: true },
      ];
    });

    const pollData = {
      type: "date",
      title: title,
      description: "Sondage généré automatiquement pour les tests",
      dates: dates,
      timeSlotsByDate: timeSlotsByDate,
    };

    return {
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(pollData) }],
          },
          finishReason: "STOP",
        },
      ],
    };
  }
}

/**
 * Generate mock response for Supabase Edge Function
 * Simulates the response from hyper-task Edge Function
 *
 * The real Edge Function returns: { success: true, data: responseText }
 * where responseText is the raw JSON string from Gemini
 */
function generateEdgeFunctionResponse(userInput: string, prompt?: string): any {
  // Use userInput directly (it's already the user's message)
  // The prompt is the full system prompt, we don't need to extract from it
  const userPrompt = userInput || (prompt ? prompt.split("\n").pop() : "") || "";

  // console.log('🔧 Edge Function mock - Generating response for:', userPrompt.substring(0, 100));

  // Generate the poll response using the same logic as Gemini mock
  const mockPollResponse = generateMockPollResponse(userPrompt);

  // Extract the poll data from the mock response
  // This is the JSON string that Gemini would return
  const pollDataText = mockPollResponse.candidates[0].content.parts[0].text;

  // console.log('🔧 Edge Function mock - Generated poll data:', pollDataText.substring(0, 200));
  // console.log('🔧 Edge Function mock - Full poll data:', pollDataText);

  // Validate that pollDataText is valid JSON
  try {
    const parsed = JSON.parse(pollDataText);
    // console.log('🔧 Edge Function mock - JSON is valid, type:', parsed.type, 'questions:', parsed.questions?.length);
  } catch (e) {
    console.error("❌ Edge Function mock - Invalid JSON generated!", e);
    throw e;
  }

  // Return the Edge Function response format (matches real Edge Function exactly)
  // The real Edge Function returns: { success: true, data: responseText }
  // where responseText is the raw text from Gemini (a JSON string)
  return {
    success: true,
    data: pollDataText, // The Edge Function returns the raw text from Gemini (JSON string)
    // Note: creditsRemaining is only returned on errors, not on success
  };
}

/**
 * Setup Supabase Edge Function mock to prevent CORS errors and API costs during E2E tests
 */
export async function setupSupabaseEdgeFunctionMock(page: Page) {
  // Intercepter les requêtes à l'Edge Function Supabase
  // Pattern pour capturer toutes les variantes d'URL (absolues et relatives)
  // Utiliser une regex pour capturer toutes les variantes
  await page.route(/.*\/functions\/v1\/hyper-task.*/, async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();

    // console.log('🔧 Edge Function mock - Intercepted request:', method, url);

    // Handle OPTIONS preflight requests for CORS
    if (method === "OPTIONS") {
      // console.log('🔧 Edge Function mock - Handling OPTIONS preflight');
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: "",
      });
      return;
    }

    // Handle POST requests
    if (method !== "POST") {
      // console.log('🔧 Edge Function mock - Non-POST request, continuing');
      await route.continue();
      return;
    }

    try {
      const postData = request.postDataJSON();
      const userInput = postData?.userInput || "";
      const prompt = postData?.prompt;

      // console.log('🔧 Edge Function mock - User input:', userInput.substring(0, 100) + '...');

      const mockResponse = generateEdgeFunctionResponse(userInput, prompt);

      // console.log('🔧 Edge Function mock - Returning response:', JSON.stringify(mockResponse).substring(0, 200));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify(mockResponse),
      });
    } catch (error) {
      console.error("❌ Edge Function mock error:", error);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "MOCK_ERROR",
          message: "Erreur dans le mock de l'Edge Function",
        }),
      });
    }
  });

  // Also intercept with glob pattern as fallback
  await page.route("**/functions/v1/hyper-task", async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();

    // console.log('🔧 Edge Function mock (alt pattern) - Intercepted request:', method, url);

    if (method === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: "",
      });
      return;
    }

    if (method !== "POST") {
      await route.continue();
      return;
    }

    try {
      const postData = request.postDataJSON();
      const userInput = postData?.userInput || "";
      const prompt = postData?.prompt;

      // console.log('🔧 Edge Function mock (alt pattern) - User input:', userInput.substring(0, 100) + '...');

      const mockResponse = generateEdgeFunctionResponse(userInput, prompt);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify(mockResponse),
      });
    } catch (error) {
      console.error("❌ Edge Function mock (alt pattern) error:", error);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "MOCK_ERROR",
          message: "Erreur dans le mock de l'Edge Function",
        }),
      });
    }
  });
}

/**
 * Setup Gemini API mock to prevent API costs during E2E tests
 */
export async function setupGeminiMock(page: Page) {
  // Intercepter toutes les requêtes Gemini (incluant les tests de connexion)
  await page.route("**/generativelanguage.googleapis.com/**", async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Extract user prompt from request
    let userPrompt = "";
    if (postData?.contents) {
      const lastContent = postData.contents[postData.contents.length - 1];
      if (lastContent?.parts?.[0]?.text) {
        userPrompt = lastContent.parts[0].text;
      }
    }

    console.log("🤖 Gemini API mock - Prompt reçu:", userPrompt.substring(0, 100) + "...");

    // Si c'est un test de connexion (prompt court comme "Test de connexion"), retourner une réponse simple
    if (
      userPrompt.toLowerCase().includes("test de connexion") ||
      userPrompt.toLowerCase().includes("ok")
    ) {
      console.log("🤖 Gemini API mock - Test de connexion détecté");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "OK" }],
              },
              finishReason: "STOP",
            },
          ],
        }),
      });
      return;
    }

    // console.log('🤖 Gemini API mock - Prompt reçu:', userPrompt.substring(0, 100) + '...');

    // Détecter les demandes de parsing de disponibilités
    const lowerPrompt = userPrompt.toLowerCase();
    const isAvailabilityParsing =
      (lowerPrompt.includes("disponibilités") ||
        lowerPrompt.includes("disponible") ||
        lowerPrompt.includes("mardi") ||
        lowerPrompt.includes("jeudi") ||
        lowerPrompt.includes("lundi") ||
        lowerPrompt.includes("mercredi") ||
        lowerPrompt.includes("vendredi") ||
        lowerPrompt.includes("samedi") ||
        lowerPrompt.includes("dimanche") ||
        lowerPrompt.includes("après-midi") ||
        lowerPrompt.includes("matin") ||
        lowerPrompt.includes("semaine prochaine")) &&
      (lowerPrompt.includes("analyse") ||
        lowerPrompt.includes("extrait") ||
        lowerPrompt.includes("parse") ||
        lowerPrompt.includes("assistant spécialisé"));

    if (isAvailabilityParsing) {
      console.log("🤖 Gemini API mock - Parsing disponibilités détecté");
      // Détecter les jours mentionnés dans le prompt pour générer une réponse adaptée
      const hasTuesday = lowerPrompt.includes("mardi") || lowerPrompt.includes("tuesday");
      const hasThursday = lowerPrompt.includes("jeudi") || lowerPrompt.includes("thursday");
      const hasMonday = lowerPrompt.includes("lundi") || lowerPrompt.includes("monday");
      const hasWednesday = lowerPrompt.includes("mercredi") || lowerPrompt.includes("wednesday");
      const isAfternoon = lowerPrompt.includes("après-midi") || lowerPrompt.includes("afternoon");
      const isMorning = lowerPrompt.includes("matin") || lowerPrompt.includes("morning");

      const availabilities: any[] = [];

      if (hasTuesday) {
        availabilities.push({
          day: "tuesday",
          timeRange: {
            start: isMorning ? "09:00" : isAfternoon ? "14:00" : "09:00",
            end: isMorning ? "12:00" : isAfternoon ? "18:00" : "17:00",
          },
          confidence: 0.9,
          originalText: "mardi " + (isAfternoon ? "après-midi" : isMorning ? "matin" : ""),
        });
      }
      if (hasThursday) {
        availabilities.push({
          day: "thursday",
          timeRange: {
            start: isMorning ? "09:00" : isAfternoon ? "14:00" : "09:00",
            end: isMorning ? "12:00" : isAfternoon ? "18:00" : "17:00",
          },
          confidence: 0.9,
          originalText: "jeudi " + (isAfternoon ? "après-midi" : isMorning ? "matin" : ""),
        });
      }
      if (hasMonday && availabilities.length === 0) {
        availabilities.push({
          day: "monday",
          timeRange: {
            start: isMorning ? "09:00" : isAfternoon ? "14:00" : "09:00",
            end: isMorning ? "12:00" : isAfternoon ? "18:00" : "17:00",
          },
          confidence: 0.9,
          originalText: "lundi " + (isAfternoon ? "après-midi" : isMorning ? "matin" : ""),
        });
      }
      if (hasWednesday && availabilities.length === 0) {
        availabilities.push({
          day: "wednesday",
          timeRange: {
            start: isMorning ? "09:00" : isAfternoon ? "14:00" : "09:00",
            end: isMorning ? "12:00" : isAfternoon ? "18:00" : "17:00",
          },
          confidence: 0.9,
          originalText: "mercredi " + (isAfternoon ? "après-midi" : isMorning ? "matin" : ""),
        });
      }

      // Si aucun jour spécifique détecté, retourner une réponse par défaut
      if (availabilities.length === 0) {
        availabilities.push({
          day: "tuesday",
          timeRange: { start: "14:00", end: "18:00" },
          confidence: 0.9,
          originalText: "mardi après-midi",
        });
      }

      const mockAvailabilityResponse = {
        availabilities,
        confidence: 0.9,
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockAvailabilityResponse) }],
              },
              finishReason: "STOP",
            },
          ],
        }),
      });
      return;
    }

    // Détecter les demandes de modification de poll (ajout/suppression de questions)
    const isModificationRequest =
      lowerPrompt.includes("ajoute") ||
      lowerPrompt.includes("ajouter") ||
      lowerPrompt.includes("supprime") ||
      lowerPrompt.includes("supprimer") ||
      lowerPrompt.includes("modifie") ||
      lowerPrompt.includes("modifier") ||
      lowerPrompt.includes("change") ||
      lowerPrompt.includes("changer") ||
      lowerPrompt.includes("renomme") ||
      lowerPrompt.includes("renommer");

    // Si c'est une demande de modification (détection d'intention)
    if (
      isModificationRequest &&
      (lowerPrompt.includes("intention") ||
        lowerPrompt.includes("détecte") ||
        lowerPrompt.includes("assistant qui détecte"))
    ) {
      // console.log('🤖 Gemini API mock - Détection intention (modification)');
      let action: string | null = null;
      let payload: any = {};

      if (lowerPrompt.includes("ajoute") || lowerPrompt.includes("ajouter")) {
        action = "ADD_QUESTION";
        // Extraire le sujet de la question
        const ageMatch = lowerPrompt.match(/âge|age/i);
        const subjectMatch = lowerPrompt.match(/sur\s+(.+?)(?:$|\.|,|\s+question)/i);
        const subject = subjectMatch ? subjectMatch[1] : ageMatch ? "l'âge" : "le sujet";
        payload = {
          title: `Quel est votre ${subject} ?`,
          type: "text",
        };
      } else if (lowerPrompt.includes("supprime") || lowerPrompt.includes("supprimer")) {
        action = "REMOVE_QUESTION";
        const numMatch = lowerPrompt.match(/question\s+(\d+)/i);
        payload = {
          questionIndex: numMatch ? parseInt(numMatch[1]) : 2,
        };
      }

      const intentResponse = {
        isModification: true,
        action: action,
        payload: payload,
        confidence: 0.9,
        explanation: `Action détectée: ${action}`,
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(intentResponse) }],
              },
              finishReason: "STOP",
            },
          ],
        }),
      });
      return;
    }

    // console.log('🤖 Gemini API mock - Prompt:', userPrompt.substring(0, 100) + '...');

    console.log(
      "🤖 Gemini API mock - Génération réponse pour prompt:",
      userPrompt.substring(0, 100) + "...",
    );
    const mockResponse = generateMockPollResponse(userPrompt);
    console.log(
      "🤖 Gemini API mock - Réponse générée:",
      JSON.stringify(mockResponse).substring(0, 200) + "...",
    );

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockResponse),
    });
  });
}

/**
 * Setup Supabase Beta Key RPC mocks to prevent database calls during E2E tests
 */
export async function setupBetaKeyMocks(page: Page) {
  // Mock generate_beta_key RPC (admin only)
  await page.route(/.*\/rest\/v1\/rpc\/generate_beta_key.*/, async (route: Route) => {
    const request = route.request();
    const method = request.method();

    if (method === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: "",
      });
      return;
    }

    if (method !== "POST") {
      await route.continue();
      return;
    }

    try {
      const postData = request.postDataJSON();
      const count = postData?.p_count || 1;
      const durationMonths = postData?.p_duration_months || 3;

      // Generate mock beta keys
      const keys: Array<{ code: string; expires_at: string }> = [];
      for (let i = 0; i < count; i++) {
        // Generate 12 alphanumeric characters (4 groups of 4)
        const generateSegment = () => {
          return Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, "0");
        };
        const segment1 = generateSegment();
        const segment2 = generateSegment();
        const segment3 = generateSegment();

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

        keys.push({
          code: `BETA-${segment1}-${segment2}-${segment3}`,
          expires_at: expiresAt.toISOString(),
        });
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: JSON.stringify(keys),
      });
    } catch (error) {
      console.error("❌ Beta Key generate mock error:", error);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "MOCK_ERROR",
          message: "Erreur dans le mock de generate_beta_key",
        }),
      });
    }
  });

  // Mock redeem_beta_key RPC (user redemption)
  await page.route(/.*\/rest\/v1\/rpc\/redeem_beta_key.*/, async (route: Route) => {
    const request = route.request();
    const method = request.method();

    if (method === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: "",
      });
      return;
    }

    if (method !== "POST") {
      await route.continue();
      return;
    }

    try {
      const postData = request.postDataJSON();
      const code = (postData?.p_code || "").trim().toUpperCase();
      const userId = postData?.p_user_id;

      // Check for invalid/used key patterns (for testing error scenarios)
      if (code.includes("INVALID") || code.includes("ERROR")) {
        await route.fulfill({
          status: 400,
          contentType: "text/plain",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: "Clé bêta invalide ou déjà utilisée",
        });
        return;
      }

      if (code.includes("USED") || code.includes("CONFLICT")) {
        await route.fulfill({
          status: 409,
          contentType: "text/plain",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: "Clé déjà utilisée",
        });
        return;
      }

      // Check authorization header for 401 scenarios
      const authHeader = request.headers()["authorization"];
      if (!authHeader || authHeader.includes("expired") || authHeader === "Bearer expired-token") {
        await route.fulfill({
          status: 401,
          contentType: "text/plain",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: "Unauthorized",
        });
        return;
      }

      // Success response
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: JSON.stringify({
          success: true,
          tier: "beta",
          credits: 1000,
          expires_at: expiresAt.toISOString(),
        }),
      });
    } catch (error) {
      console.error("❌ Beta Key redeem mock error:", error);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "MOCK_ERROR",
          message: "Erreur dans le mock de redeem_beta_key",
        }),
      });
    }
  });

  // Mock polls table insert (save poll)
  await page.route(/.*\/rest\/v1\/polls.*/, async (route: Route) => {
    const request = route.request();
    const method = request.method();

    if (method === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: "",
      });
      return;
    }

    if (method === "POST") {
      try {
        const postData = request.postDataJSON();
        // Return the created poll
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(postData),
        });
      } catch (error) {
        console.error("❌ Poll save mock error:", error);
        await route.fulfill({ status: 500 });
      }
      return;
    }

    await route.continue();
  });
}

import { E2E_CONFIG } from "./e2e-utils";

/**
 * Setup all mocks (Gemini API + Supabase Edge Function + Beta Key RPC) and E2E configuration
 * Use this in beforeEach to mock all external API calls and configure E2E mode
 */
export async function setupAllMocks(page: Page) {
  // Enable E2E mode first
  await E2E_CONFIG.enableE2EMode(page.context());

  // Setup API mocks
  await setupGeminiMock(page);
  await setupSupabaseEdgeFunctionMock(page);
  await setupBetaKeyMocks(page);

  // Attendre que la page soit chargée avant d'accéder au localStorage
  await page.waitForLoadState("domcontentloaded");

  // Désactiver les vérifications de quota via l'URL si on est déjà sur une page
  if (page.url() && !page.url().startsWith("about:blank")) {
    await page.goto(page.url() + (page.url().includes("?") ? "&" : "?") + "e2e-test=true");
  }
}

/**
 * Setup all mocks WITHOUT navigation (for use in helper functions that do their own navigation)
 * This ensures routes persist after page.goto() calls
 */
export async function setupAllMocksWithoutNavigation(page: Page) {
  // Enable E2E mode first
  await E2E_CONFIG.enableE2EMode(page.context());

  // Setup API mocks
  await setupGeminiMock(page);
  await setupSupabaseEdgeFunctionMock(page);
  await setupBetaKeyMocks(page);

  // Note: No page.goto() here - caller is responsible for navigation
}

/**
 * Setup mocks at context level (more performant for multiple pages)
 */
export async function setupAllMocksContext(context: BrowserContext) {
  // Mock Gemini API
  await context.route("**/generativelanguage.googleapis.com/**", async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    let userPrompt = "";
    if (postData?.contents) {
      const lastContent = postData.contents[postData.contents.length - 1];
      if (lastContent?.parts?.[0]?.text) {
        userPrompt = lastContent.parts[0].text;
      }
    }

    const mockResponse = generateMockPollResponse(userPrompt);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockResponse),
    });
  });

  // Mock Beta Key RPC endpoints
  await context.route(/.*\/rest\/v1\/rpc\/generate_beta_key.*/, async (route: Route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: "",
      });
      return;
    }

    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    try {
      const postData = request.postDataJSON();
      const count = postData?.p_count || 1;
      const durationMonths = postData?.p_duration_months || 3;

      const keys: Array<{ code: string; expires_at: string }> = [];
      for (let i = 0; i < count; i++) {
        // Generate 12 alphanumeric characters (4 groups of 4)
        const generateSegment = () => {
          return Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, "0");
        };
        const segment1 = generateSegment();
        const segment2 = generateSegment();
        const segment3 = generateSegment();

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

        keys.push({
          code: `BETA-${segment1}-${segment2}-${segment3}`,
          expires_at: expiresAt.toISOString(),
        });
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: JSON.stringify(keys),
      });
    } catch (error) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "MOCK_ERROR",
          message: "Erreur dans le mock de generate_beta_key",
        }),
      });
    }
  });

  await context.route(/.*\/rest\/v1\/rpc\/redeem_beta_key.*/, async (route: Route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: "",
      });
      return;
    }

    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    try {
      const postData = request.postDataJSON();
      const code = (postData?.p_code || "").trim().toUpperCase();

      if (code.includes("INVALID") || code.includes("ERROR")) {
        await route.fulfill({
          status: 400,
          contentType: "text/plain",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: "Clé bêta invalide ou déjà utilisée",
        });
        return;
      }

      if (code.includes("USED") || code.includes("CONFLICT")) {
        await route.fulfill({
          status: 409,
          contentType: "text/plain",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: "Clé déjà utilisée",
        });
        return;
      }

      const authHeader = request.headers()["authorization"];
      if (!authHeader || authHeader.includes("expired")) {
        await route.fulfill({
          status: 401,
          contentType: "text/plain",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: "Unauthorized",
        });
        return;
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Prefer",
        },
        body: JSON.stringify({
          success: true,
          tier: "beta",
          credits: 1000,
          expires_at: expiresAt.toISOString(),
        }),
      });
    } catch (error) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "MOCK_ERROR",
          message: "Erreur dans le mock de redeem_beta_key",
        }),
      });
    }
  });

  // Mock Supabase Edge Function
  await context.route("**/functions/v1/hyper-task**", async (route: Route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: "",
      });
      return;
    }

    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    try {
      const postData = request.postDataJSON();
      const userInput = postData?.userInput || "";
      const prompt = postData?.prompt;

      const mockResponse = generateEdgeFunctionResponse(userInput, prompt);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify(mockResponse),
      });
    } catch (error) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "MOCK_ERROR",
          message: "Erreur dans le mock de l'Edge Function",
        }),
      });
    }
  });
}
