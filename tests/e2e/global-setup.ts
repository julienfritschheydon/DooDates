/**
 * Global setup for E2E tests
 * Mocks external APIs to prevent costs and ensure test reliability
 */
import { Page, Route } from '@playwright/test';

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
 * Setup Gemini API mock to prevent API costs during E2E tests
 */
export async function setupGeminiMock(page: Page) {
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
    
    console.log('🤖 Gemini API mock - Prompt:', userPrompt.substring(0, 100) + '...');
    
    const mockResponse = generateMockPollResponse(userPrompt);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });
}
