// Script de diagnostic pour comprendre le dashboard
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8080/DooDates/date-polls/dashboard');
    await page.waitForTimeout(3000);
    
    // Diagnostic 1: Vérifier localStorage
    const conversations = await page.evaluate(() => {
      const stored = localStorage.getItem('doodates_conversations');
      return stored ? JSON.parse(stored) : [];
    });
    
    console.log('Conversations dans localStorage:', conversations.length);
    conversations.forEach((conv, i) => {
      console.log(`  ${i+1}. ID: ${conv.id}, Title: ${conv.title}, UserId: ${conv.userId}`);
    });
    
    // Diagnostic 2: Vérifier les éléments visibles
    const pollItems = await page.locator('[data-testid="poll-item"]').count();
    const convCards = await page.locator('[data-testid="conversation-card"]').count();
    const anyCards = await page.locator('div').filter({ hasText: /Conversation|Test/ }).count();
    
    console.log('Éléments visibles:');
    console.log(`  [data-testid="poll-item"]: ${pollItems}`);
    console.log(`  [data-testid="conversation-card"]: ${convCards}`);
    console.log(`  Cartes avec "Conversation|Test": ${anyCards}`);
    
    // Diagnostic 3: Prendre un screenshot
    await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
    console.log('Screenshot sauvegardé dans dashboard-debug.png');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await browser.close();
  }
})();
