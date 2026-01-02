#!/usr/bin/env node

/**
 * Script de test E2E smoke local rapide
 * Détecte les problèmes de fermeture de page avant CI
 * Utilisation: node scripts/test-e2e-local-smoke.cjs
 */

const { chromium } = require('playwright');

async function runLocalSmokeTests() {
  console.log('🔥 E2E Smoke Tests Local');
  console.log('================================');
  
  let browser;
  let context;
  let page;
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Vérifier serveur
    console.log('🌐 Vérification serveur...');
    try {
      const response = await fetch('http://localhost:8080/DooDates/');
      if (!response.ok) {
        throw new Error(`Serveur répond: ${response.status}`);
      }
      console.log('✅ Serveur accessible');
    } catch (error) {
      console.log('❌ Serveur non accessible');
      console.log('💡 Lancez: npm run dev:e2e');
      process.exit(1);
    }

    // Initialiser Playwright
    console.log('🚀 Initialisation Playwright...');
    browser = await chromium.launch({ 
      headless: true, // Mode headless pour rapidité
      timeout: 30000
    });
    
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    page = await context.newPage();

    // Activer logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ [CONSOLE] ${msg.text()}`);
        results.errors.push(`Console error: ${msg.text()}`);
      }
    });

    // Tests rapides
    await runTest('Chargement page d\'accueil', async () => {
      await page.goto('http://localhost:8080/DooDates/', { timeout: 30000 });
      await page.waitForSelector('body', { timeout: 10000 });
      
      const title = await page.title();
      if (!title.includes('DooDates')) {
        throw new Error(`Titre inattendu: ${title}`);
      }
    });

    await runTest('Navigation workspace', async () => {
      if (page.isClosed()) {
        page = await context.newPage();
      }
      
      await page.goto('http://localhost:8080/DooDates/', { timeout: 30000 });
      
      // Attendre que le chat input soit disponible
      try {
        await page.waitForSelector('[data-testid="chat-input"]', { timeout: 15000 });
        console.log('✅ Chat input trouvé');
      } catch (error) {
        console.log('⚠️ Chat input non trouvé, essais fallbacks...');
        
        // Essayer d'autres sélecteurs
        const selectors = [
          'textarea[placeholder*="message"]',
          'textarea',
          'input[type="text"]',
          '[contenteditable="true"]'
        ];
        
        let found = false;
        for (const selector of selectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            console.log(`✅ Fallback trouvé: ${selector}`);
            found = true;
            break;
          } catch (e) {
            continue;
          }
        }
        
        if (!found) {
          throw new Error('Aucun input de chat trouvé');
        }
      }
    });

    await runTest('Stabilité après rechargement', async () => {
      if (page.isClosed()) {
        page = await context.newPage();
      }
      
      await page.goto('http://localhost:8080/DooDates/', { timeout: 30000 });
      await page.reload({ timeout: 30000 });
      
      // Vérifier que la page est toujours fonctionnelle
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Prendre screenshot pour debug
      await page.screenshot({ path: 'test-smoke-local.png', fullPage: true });
      console.log('📸 Screenshot: test-smoke-local.png');
    });

    await runTest('Navigation dashboard date-polls', async () => {
      if (page.isClosed()) {
        page = await context.newPage();
      }
      
      await page.goto('http://localhost:8080/DooDates/date-polls/dashboard', { timeout: 30000 });
      
      // Vérifier pas d'erreur 404
      const content = await page.content();
      if (content.includes('404') || content.includes('not found')) {
        throw new Error('Page 404 détectée');
      }
      
      console.log('✅ Dashboard accessible');
    });

    // Résultats
    console.log('\n📊 RÉSULTATS');
    console.log('=============');
    console.log(`✅ Tests passés: ${results.passed}`);
    console.log(`❌ Tests échoués: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 Erreurs détectées:');
      results.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    if (results.failed > 0) {
      console.log('\n❌ Certains tests ont échoué - Corrigez avant de pusher');
      process.exit(1);
    } else {
      console.log('\n✅ Tous les tests passent - Safe to push !');
    }

  } catch (error) {
    console.error('💥 ERREUR CRITIQUE:', error.message);
    results.failed++;
    results.errors.push(`Critical: ${error.message}`);
    process.exit(1);
    
  } finally {
    // Nettoyage
    try {
      if (page && !page.isClosed()) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (cleanupError) {
      console.log(`⚠️ Erreur nettoyage: ${cleanupError.message}`);
    }
  }

  async function runTest(name, testFn) {
    console.log(`\n🧪 ${name}...`);
    
    try {
      await testFn();
      results.passed++;
      console.log(`✅ ${name} - PASS`);
    } catch (error) {
      results.failed++;
      results.errors.push(`${name}: ${error.message}`);
      console.log(`❌ ${name} - FAIL: ${error.message}`);
    }
  }
}

// Lancer les tests
if (require.main === module) {
  runLocalSmokeTests().catch(console.error);
}

module.exports = { runLocalSmokeTests };
