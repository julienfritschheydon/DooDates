/**
 * Global setup for E2E tests
 * Mocks external APIs to prevent costs and ensure test reliability
 */
import { Page } from '@playwright/test';

/**
 * Setup Gemini API mock to prevent API costs during E2E tests
 */
export async function setupGeminiMock(page: Page) {
  await page.route('**/generativelanguage.googleapis.com/**', route => {
    console.log('🚫 Gemini API call blocked (mock)');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{
          content: {
            parts: [{ text: 'Mock response for E2E tests' }]
          },
          finishReason: 'STOP'
        }]
      })
    });
  });
}
