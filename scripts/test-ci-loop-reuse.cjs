#!/usr/bin/env node

/**
 * Test rapide en boucle pour simuler les conditions CI
 * Crée une config temporaire Playwright avec reuseExistingServer
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Démarrage du test rapide en boucle pour conditions CI...');
console.log('⚡ Ce test simule exactement les mêmes paramètres que le workflow CI');

// Créer une config temporaire Playwright
const tempConfig = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'echo "Using existing server"',
    reuseExistingServer: !process.env.CI,
    port: 8080,
    timeout: 120 * 1000,
  },
  use: {
    baseURL: 'http://localhost:8080/DooDates',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('playwright/test').devices['Desktop Chrome'] },
    },
  ],
});
`;

const tempConfigPath = path.join(process.cwd(), 'playwright.temp.config.ts');
fs.writeFileSync(tempConfigPath, tempConfig);

const envVars = {
  ...process.env,
  CI: 'true',
  NODE_ENV: 'development',
  BASE_URL: 'http://localhost:8080/DooDates',
  VITE_GEMINI_API_KEY: 'TEST_MODE'
};

let attempt = 1;
const maxAttempts = 3;

function runTest() {
  console.log(`\n🔄 Tentative ${attempt}/${maxAttempts}`);
  console.log(`🔧 Environnement: CI=${envVars.CI}, NODE_ENV=${envVars.NODE_ENV}`);
  console.log(`⏱️  Heure: ${new Date().toLocaleTimeString()}`);
  
  const startTime = Date.now();
  
  const child = spawn('npx', [
    'playwright', 'test', 
    'tests/e2e/ci-debug-chat-input.spec.ts', 
    '--project=chromium', 
    '--reporter=list',
    '--config=playwright.temp.config.ts'
  ], {
    env: envVars,
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });
  
  child.on('close', (code) => {
    const duration = Date.now() - startTime;
    console.log(`\n📊 Résultat tentative ${attempt}:`);
    console.log(`   ⏱️  Durée: ${duration}ms`);
    console.log(`   🎯 Exit code: ${code}`);
    
    if (code === 0) {
      console.log('✅ SUCCÈS ! Le test passe avec NODE_ENV=development');
      console.log('🎉 Les conditions CI sont maintenant correctes');
      cleanup();
      process.exit(0);
    } else {
      console.log('❌ ÉCHEC - Le test échoue encore');
      
      if (attempt < maxAttempts) {
        attempt++;
        console.log(`⏳ Attente 2s avant la tentative ${attempt}...`);
        setTimeout(runTest, 2000);
      } else {
        console.log('\n🚨 ÉCHEC APRÈS TOUTES LES TENTATIVES');
        console.log('📝 Le problème persiste même avec NODE_ENV=development');
        console.log('🔍 Il faut analyser les erreurs JavaScript dans le test');
        console.log('💡 Solution: Attendre les résultats du prochain run CI avec console error detection');
        cleanup();
        process.exit(1);
      }
    }
  });
  
  child.on('error', (error) => {
    console.error('❌ Erreur lors du lancement du test:', error.message);
    if (attempt < maxAttempts) {
      attempt++;
      setTimeout(runTest, 2000);
    } else {
      cleanup();
      process.exit(1);
    }
  });
}

function cleanup() {
  try {
    fs.unlinkSync(tempConfigPath);
    console.log('🧹 Config temporaire supprimée');
  } catch (error) {
    // Ignorer les erreurs de cleanup
  }
}

// Nettoyer en cas d'interruption
process.on('SIGINT', () => {
  console.log('\n🛑 Interruption détectée');
  cleanup();
  process.exit(0);
});

// Démarrer le test
runTest();
