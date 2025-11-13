#!/usr/bin/env node
/**
 * Script Node.js optimisé pour vérifier que le serveur local fonctionne ET qu'il n'y a pas d'erreurs JS
 * Utilisé dans le hook pre-commit
 * 
 * Version optimisée : timeout réduit, pas d'attente inutile
 */

import { chromium } from 'playwright';
import http from 'http';

const PORT = 8080;
const URL = `http://localhost:${PORT}`;
const SERVER_TIMEOUT = 2000; // Réduit de 5000 à 2000ms
const PAGE_TIMEOUT = 10000; // Réduit de 30000 à 10000ms
const CONSOLE_WAIT = 500; // Réduit de 2000ms à 500ms

async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(SERVER_TIMEOUT, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function checkConsoleErrors() {
  console.log('🌐 Vérification du serveur local avec Playwright...');
  
  // Vérifier d'abord que le serveur répond rapidement
  if (!(await checkServer())) {
    console.log(`⚠️ Serveur non démarré sur ${URL}`);
    console.log('💡 Démarrez le serveur avec: npm run dev');
    return false;
  }

  console.log(`✅ Serveur répond sur ${URL}`);
  console.log('🔍 Vérification des erreurs JavaScript...');

  let browser;
  try {
    // Lancer le navigateur avec des options optimisées
    browser = await chromium.launch({ 
      headless: true,
      // Options pour accélérer le lancement
      args: ['--disable-dev-shm-usage', '--disable-gpu']
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    const consoleWarnings = [];
    
    // Capturer les erreurs de la console
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Capturer les erreurs de page
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Charger la page avec timeout réduit et attente minimale
    await page.goto(URL, { 
      waitUntil: 'domcontentloaded', 
      timeout: PAGE_TIMEOUT 
    });
    
    // Attendre seulement 500ms au lieu de 2000ms pour que les scripts critiques s'exécutent
    await page.waitForTimeout(CONSOLE_WAIT);

    // Vérifier les erreurs
    if (consoleErrors.length > 0) {
      console.log('❌ Erreurs JavaScript détectées:');
      consoleErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      console.log('\n💡 Le site ne fonctionne pas correctement. Corrigez les erreurs avant de commiter.');
      return false;
    }

    if (consoleWarnings.length > 0) {
      console.log('⚠️ Avertissements JavaScript (non bloquants):');
      consoleWarnings.slice(0, 3).forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
      if (consoleWarnings.length > 3) {
        console.log(`   ... et ${consoleWarnings.length - 3} autres avertissements`);
      }
    }

    console.log('✅ Aucune erreur JavaScript détectée');
    return true;
  } catch (error) {
    console.log(`❌ Erreur lors de la vérification: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécuter la vérification
checkConsoleErrors()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });

