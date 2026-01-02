#!/usr/bin/env node

/**
 * Script de debug local pour les problèmes de page fermée dans E2E
 * Utilisation: node scripts/debug-e2e-page-closure.cjs
 */

const { chromium } = require('playwright');
const { navigateToWorkspace } = require('../tests/e2e/helpers/chat-helpers.ts');

async function debugPageClosure() {
  console.log('🔍 DEBUG E2E: Test de fermeture de page...');
  
  let browser;
  let context;
  let page;
  
  try {
    // 1. Démarrer le serveur local si nécessaire
    console.log('🌐 Vérification serveur local...');
    try {
      const response = await fetch('http://localhost:8080/DooDates/');
      if (response.ok) {
        console.log('✅ Serveur local accessible');
      }
    } catch (error) {
      console.log('❌ Serveur local non accessible - démarrage requis');
      console.log('💡 Lancez: npm run dev:e2e');
      process.exit(1);
    }

    // 2. Initialiser Playwright
    console.log('🚀 Initialisation Playwright...');
    browser = await chromium.launch({ 
      headless: false, // Visible pour debug
      slowMo: 100 // Ralenti pour voir ce qui se passe
    });
    
    context = await browser.newContext();
    page = await context.newPage();

    // 3. Activer le logging détaillé
    page.on('console', msg => {
      console.log(`📢 [PAGE] ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`❌ [PAGE ERROR] ${error.message}`);
    });

    page.on('requestfailed', request => {
      console.log(`🚫 [REQUEST FAILED] ${request.url()}: ${request.failure().errorText}`);
    });

    // 4. Test de navigation avec retry
    console.log('🧪 Test 1: Navigation simple...');
    await testNavigationWithRetry(page, context, 'default');

    console.log('🧪 Test 2: Navigation avec rechargement...');
    await testNavigationWithReload(page, context);

    console.log('🧪 Test 3: Navigation forcée...');
    await testForcedNavigation(page, context);

    console.log('✅ Tous les tests passés !');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('📍 Stack:', error.stack);
    
    // Diagnostic de l'état de la page
    if (page) {
      try {
        const isClosed = page.isClosed();
        console.log(`📊 État page: ${isClosed ? 'FERMÉE' : 'OUVERTE'}`);
        
        if (!isClosed) {
          const url = page.url();
          console.log(`📍 URL actuelle: ${url}`);
          
          const title = await page.title();
          console.log(`📄 Titre: ${title}`);
        }
      } catch (stateError) {
        console.log(`❌ Impossible de vérifier l'état: ${stateError.message}`);
      }
    }
    
  } finally {
    // Nettoyage
    try {
      if (page && !page.isClosed()) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
      console.log('🧹 Nettoyage terminé');
    } catch (cleanupError) {
      console.log(`⚠️ Erreur nettoyage: ${cleanupError.message}`);
    }
  }
}

async function testNavigationWithRetry(page, context, workspaceType = 'default') {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`🔄 Tentative ${attempts + 1}/${maxAttempts}...`);
      
      // Vérifier état avant navigation
      if (page.isClosed()) {
        console.log('❌ Page fermée, recréation...');
        page = await context.newPage();
      }
      
      // Navigation avec timeout augmenté
      await page.goto('http://localhost:8080/DooDates/', { 
        timeout: 30000,
        waitUntil: 'domcontentloaded'
      });
      
      console.log('✅ Navigation réussie');
      await page.waitForTimeout(2000); // Attendre stabilisation
      return;
      
    } catch (error) {
      attempts++;
      console.log(`❌ Tentative ${attempts} échouée: ${error.message}`);
      
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Attendre avant retry
      await page.waitForTimeout(1000);
    }
  }
}

async function testNavigationWithReload(page, context) {
  try {
    console.log('🔄 Test avec rechargement...');
    
    if (page.isClosed()) {
      page = await context.newPage();
    }
    
    await page.goto('http://localhost:8080/DooDates/', { timeout: 30000 });
    await page.reload({ timeout: 30000 });
    
    console.log('✅ Reload réussi');
    
  } catch (error) {
    console.log(`❌ Test reload échoué: ${error.message}`);
    throw error;
  }
}

async function testForcedNavigation(page, context) {
  try {
    console.log('🔥 Test navigation forcée...');
    
    if (page.isClosed()) {
      page = await context.newPage();
    }
    
    // Navigation forcée avec plusieurs vérifications
    await page.goto('http://localhost:8080/DooDates/', { 
      timeout: 30000,
      waitUntil: 'networkidle'
    });
    
    // Vérifier que le contenu est chargé
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Prendre screenshot pour debug
    await page.screenshot({ path: 'debug-navigation-forced.png', fullPage: true });
    console.log('📸 Screenshot sauvegardé: debug-navigation-forced.png');
    
    console.log('✅ Navigation forcée réussie');
    
  } catch (error) {
    console.log(`❌ Test navigation forcée échoué: ${error.message}`);
    throw error;
  }
}

// Lancer le debug
if (require.main === module) {
  debugPageClosure().catch(console.error);
}

module.exports = { debugPageClosure };
