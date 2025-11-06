/**
 * Global setup for E2E tests
 * Mocks external APIs to prevent costs and ensure test reliability
 */
import { Page, Route, BrowserContext } from '@playwright/test';

/**
 * Generate intelligent mock response based on user prompt
 */
function generateMockPollResponse(prompt: string): any {
  const lowerPrompt = prompt.toLowerCase();
  
  // Detect if it's a form poll or date poll request
  const isFormPoll = lowerPrompt.includes('questionnaire') || 
                     lowerPrompt.includes('formulaire') || 
                     lowerPrompt.includes('form') ||
                     lowerPrompt.includes('question');
  
  if (isFormPoll) {
    // 🎯 Détection de mots-clés spéciaux pour les tests E2E
    let numQuestions = 3; // Par défaut
    let simpleTextOnly = false; // Pour générer uniquement des questions texte simples
    
    if (lowerPrompt.includes('e2e-test-1-question') || lowerPrompt.includes('1 seule question')) {
      numQuestions = 1;
      simpleTextOnly = true; // Test simple : 1 question texte uniquement
    } else if (lowerPrompt.includes('e2e-test-2-questions')) {
      numQuestions = 2;
    } else {
      // Sinon, extraire le nombre du prompt
      const questionMatch = lowerPrompt.match(/(\d+)\s*(question|q)/);
      numQuestions = questionMatch ? parseInt(questionMatch[1]) : 3;
    }
    
    // Generate questions
    const questions = [];
    for (let i = 1; i <= numQuestions; i++) {
      if (simpleTextOnly) {
        // Pour les tests E2E : questions texte simples uniquement
        questions.push({
          title: `Question ${i} générée par mock`,
          type: 'text',
          required: true,
          placeholder: 'Votre réponse...',
          maxLength: 500
        });
      } else {
        // Mode normal : variété de types de questions
        questions.push({
          title: `Question ${i} générée par mock`,
          type: i === 1 ? 'single' : i === 2 ? 'multiple' : 'text',
          required: true,
          ...(i === 1 && { options: ['Option A', 'Option B', 'Option C'] }),
          ...(i === 2 && { options: ['Choix 1', 'Choix 2', 'Choix 3'], maxChoices: 2 }),
          ...(i === 3 && { placeholder: 'Votre réponse...', maxLength: 500 })
        });
      }
    }
    
    const pollData = {
      type: 'form',
      title: 'Questionnaire Mock E2E',
      description: 'Questionnaire généré automatiquement pour les tests',
      questions
    };
    
    return {
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify(pollData) }]
        },
        finishReason: 'STOP'
      }]
    };
  } else {
    // Date poll mock
    const pollData = {
      type: 'date',
      title: 'Sondage de dates Mock E2E',
      description: 'Sondage généré automatiquement pour les tests',
      dates: ['2025-11-01', '2025-11-02', '2025-11-03']
    };
    
    return {
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify(pollData) }]
        },
        finishReason: 'STOP'
      }]
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
  const userPrompt = userInput || (prompt ? prompt.split('\n').pop() : '');
  
  console.log('🔧 Edge Function mock - Generating response for:', userPrompt.substring(0, 100));
  
  // Generate the poll response using the same logic as Gemini mock
  const mockPollResponse = generateMockPollResponse(userPrompt);
  
  // Extract the poll data from the mock response
  // This is the JSON string that Gemini would return
  const pollDataText = mockPollResponse.candidates[0].content.parts[0].text;
  
  console.log('🔧 Edge Function mock - Generated poll data:', pollDataText.substring(0, 200));
  console.log('🔧 Edge Function mock - Full poll data:', pollDataText);
  
  // Validate that pollDataText is valid JSON
  try {
    const parsed = JSON.parse(pollDataText);
    console.log('🔧 Edge Function mock - JSON is valid, type:', parsed.type, 'questions:', parsed.questions?.length);
  } catch (e) {
    console.error('❌ Edge Function mock - Invalid JSON generated!', e);
    throw e;
  }
  
  // Return the Edge Function response format (matches real Edge Function exactly)
  // The real Edge Function returns: { success: true, data: responseText }
  // where responseText is the raw text from Gemini (a JSON string)
  return {
    success: true,
    data: pollDataText // The Edge Function returns the raw text from Gemini (JSON string)
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
    
    console.log('🔧 Edge Function mock - Intercepted request:', method, url);
    
    // Handle OPTIONS preflight requests for CORS
    if (method === 'OPTIONS') {
      console.log('🔧 Edge Function mock - Handling OPTIONS preflight');
      await route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: ''
      });
      return;
    }
    
    // Handle POST requests
    if (method !== 'POST') {
      console.log('🔧 Edge Function mock - Non-POST request, continuing');
      await route.continue();
      return;
    }
    
    try {
      const postData = request.postDataJSON();
      const userInput = postData?.userInput || '';
      const prompt = postData?.prompt;
      
      console.log('🔧 Edge Function mock - User input:', userInput.substring(0, 100) + '...');
      
      const mockResponse = generateEdgeFunctionResponse(userInput, prompt);
      
      console.log('🔧 Edge Function mock - Returning response:', JSON.stringify(mockResponse).substring(0, 200));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify(mockResponse)
      });
    } catch (error) {
      console.error('❌ Edge Function mock error:', error);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'MOCK_ERROR',
          message: 'Erreur dans le mock de l\'Edge Function'
        })
      });
    }
  });
  
  // Also intercept with glob pattern as fallback
  await page.route('**/functions/v1/hyper-task', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    
    console.log('🔧 Edge Function mock (alt pattern) - Intercepted request:', method, url);
    
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: ''
      });
      return;
    }
    
    if (method !== 'POST') {
      await route.continue();
      return;
    }
    
    try {
      const postData = request.postDataJSON();
      const userInput = postData?.userInput || '';
      const prompt = postData?.prompt;
      
      console.log('🔧 Edge Function mock (alt pattern) - User input:', userInput.substring(0, 100) + '...');
      
      const mockResponse = generateEdgeFunctionResponse(userInput, prompt);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify(mockResponse)
      });
    } catch (error) {
      console.error('❌ Edge Function mock (alt pattern) error:', error);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'MOCK_ERROR',
          message: 'Erreur dans le mock de l\'Edge Function'
        })
      });
    }
  });
}

/**
 * Setup Gemini API mock to prevent API costs during E2E tests
 */
export async function setupGeminiMock(page: Page) {
  // Intercepter toutes les requêtes Gemini (incluant les tests de connexion)
  await page.route('**/generativelanguage.googleapis.com/**', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    // Extract user prompt from request
    let userPrompt = '';
    if (postData?.contents) {
      const lastContent = postData.contents[postData.contents.length - 1];
      if (lastContent?.parts?.[0]?.text) {
        userPrompt = lastContent.parts[0].text;
      }
    }
    
    // Si c'est un test de connexion (prompt court comme "Test de connexion"), retourner une réponse simple
    if (userPrompt.toLowerCase().includes('test de connexion') || userPrompt.toLowerCase().includes('ok')) {
      console.log('🤖 Gemini API mock - Test de connexion');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: 'OK' }]
            },
            finishReason: 'STOP'
          }]
        })
      });
      return;
    }
    
    // Détecter les demandes de modification de poll (ajout/suppression de questions)
    const lowerPrompt = userPrompt.toLowerCase();
    const isModificationRequest = 
      lowerPrompt.includes('ajoute') || lowerPrompt.includes('ajouter') ||
      lowerPrompt.includes('supprime') || lowerPrompt.includes('supprimer') ||
      lowerPrompt.includes('modifie') || lowerPrompt.includes('modifier') ||
      lowerPrompt.includes('change') || lowerPrompt.includes('changer') ||
      lowerPrompt.includes('renomme') || lowerPrompt.includes('renommer');
    
    // Si c'est une demande de modification (détection d'intention)
    if (isModificationRequest && (lowerPrompt.includes('intention') || lowerPrompt.includes('détecte') || lowerPrompt.includes('assistant qui détecte'))) {
      console.log('🤖 Gemini API mock - Détection intention (modification)');
      let action = null;
      let payload: any = {};
      
      if (lowerPrompt.includes('ajoute') || lowerPrompt.includes('ajouter')) {
        action = 'ADD_QUESTION';
        // Extraire le sujet de la question
        const ageMatch = lowerPrompt.match(/âge|age/i);
        const subjectMatch = lowerPrompt.match(/sur\s+(.+?)(?:$|\.|,|\s+question)/i);
        const subject = subjectMatch ? subjectMatch[1] : (ageMatch ? 'l\'âge' : 'le sujet');
        payload = {
          title: `Quel est votre ${subject} ?`,
          type: 'text'
        };
      } else if (lowerPrompt.includes('supprime') || lowerPrompt.includes('supprimer')) {
        action = 'REMOVE_QUESTION';
        const numMatch = lowerPrompt.match(/question\s+(\d+)/i);
        payload = {
          questionIndex: numMatch ? parseInt(numMatch[1]) : 2
        };
      }
      
      const intentResponse = {
        isModification: true,
        action: action,
        payload: payload,
        confidence: 0.9,
        explanation: `Action détectée: ${action}`
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(intentResponse) }]
            },
            finishReason: 'STOP'
          }]
        })
      });
      return;
    }
    
    console.log('🤖 Gemini API mock - Prompt:', userPrompt.substring(0, 100) + '...');
    
    const mockResponse = generateMockPollResponse(userPrompt);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });
}

/**
 * Setup all mocks (Gemini API + Supabase Edge Function)
 * Use this in beforeEach to mock all external API calls
 */
export async function setupAllMocks(page: Page) {
  await setupGeminiMock(page);
  await setupSupabaseEdgeFunctionMock(page);
}

/**
 * Setup mocks at context level (more performant for multiple pages)
 */
export async function setupAllMocksContext(context: BrowserContext) {
  // Mock Gemini API
  await context.route('**/generativelanguage.googleapis.com/**', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    let userPrompt = '';
    if (postData?.contents) {
      const lastContent = postData.contents[postData.contents.length - 1];
      if (lastContent?.parts?.[0]?.text) {
        userPrompt = lastContent.parts[0].text;
      }
    }
    
    const mockResponse = generateMockPollResponse(userPrompt);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });
  
  // Mock Supabase Edge Function
  await context.route('**/functions/v1/hyper-task**', async (route: Route) => {
    const request = route.request();
    
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: ''
      });
      return;
    }
    
    if (request.method() !== 'POST') {
      await route.continue();
      return;
    }
    
    try {
      const postData = request.postDataJSON();
      const userInput = postData?.userInput || '';
      const prompt = postData?.prompt;
      
      const mockResponse = generateEdgeFunctionResponse(userInput, prompt);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify(mockResponse)
      });
    } catch (error) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'MOCK_ERROR',
          message: 'Erreur dans le mock de l\'Edge Function'
        })
      });
    }
  });
}
