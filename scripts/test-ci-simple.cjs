#!/usr/bin/env node

/**
 * Test rapide en boucle pour simuler les conditions CI
 * Version simple qui utilise la config existante
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du test rapide en boucle pour conditions CI...');
console.log('⚡ Ce test simule exactement les mêmes paramètres que le workflow CI');
console.log('🔧 Utilise la configuration Playwright existante');

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
  
  // Tenter de lancer le test avec la config existante
  const child = spawn('npx', [
    'playwright', 'test', 
    'tests/e2e/ci-debug-chat-input.spec.ts', 
    '--project=chromium', 
    '--reporter=list',
    '--timeout=30000'  // Timeout plus court pour le test
  ], {
    env: envVars,
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd()
  });
  
  let output = '';
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  child.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  child.on('close', (code) => {
    const duration = Date.now() - startTime;
    console.log(`\n📊 Résultat tentative ${attempt}:`);
    console.log(`   ⏱️  Durée: ${duration}ms`);
    console.log(`   🎯 Exit code: ${code}`);
    
    // Afficher les logs pertinents
    if (output.includes('✅ Chat input [data-testid="chat-input"] trouvé')) {
      console.log('✅ SUCCÈS ! Le test passe avec NODE_ENV=development');
      console.log('🎉 Les conditions CI sont maintenant correctes');
      process.exit(0);
    } else if (output.includes('❌ Chat input non trouvé')) {
      console.log('❌ ÉCHEC - Chat input non trouvé même avec NODE_ENV=development');
      console.log('🔍 Le problème est plus profond que NODE_ENV');
    } else if (output.includes('already used')) {
      console.log('⚠️ Problème de port - serveur déjà utilisé');
    } else {
      console.log('❌ ÉCHEC - Erreur inattendue');
      console.log('📝 Output:', output.substring(0, 500));
    }
    
    if (attempt < maxAttempts) {
      attempt++;
      console.log(`⏳ Attente 2s avant la tentative ${attempt}...`);
      setTimeout(runTest, 2000);
    } else {
      console.log('\n🚨 ÉCHEC APRÈS TOUTES LES TENTATIVES');
      console.log('📝 Le problème persiste même avec NODE_ENV=development');
      console.log('🔍 Il faut analyser les erreurs JavaScript dans le test');
      console.log('💡 Solution: Attendre les résultats du prochain run CI avec console error detection');
      process.exit(1);
    }
  });
  
  child.on('error', (error) => {
    console.error('❌ Erreur lors du lancement du test:', error.message);
    if (attempt < maxAttempts) {
      attempt++;
      setTimeout(runTest, 2000);
    } else {
      process.exit(1);
    }
  });
}

// Démarrer le test
runTest();
