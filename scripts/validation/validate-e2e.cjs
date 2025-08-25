#!/usr/bin/env node

/**
 * Script de validation immédiate des tests E2E DooDates
 * Vérifie que tout fonctionne réellement
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🔍 VALIDATION TESTS E2E DOODATES');
console.log('=================================\n');

let devServerProcess = null;

// Fonction pour nettoyer les processus
function cleanup() {
  if (devServerProcess) {
    console.log('🛑 Arrêt du serveur de développement...');
    devServerProcess.kill('SIGTERM');
  }
}

// Gérer les signaux d'arrêt
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function validateE2E() {
  try {
    // 1. Vérifier les prérequis
    console.log('📋 Étape 1: Vérification des prérequis');
    
    // Vérifier Playwright
    try {
      const playwrightVersion = execSync('npx playwright --version', { encoding: 'utf8' });
      console.log('✅ Playwright:', playwrightVersion.trim());
    } catch (error) {
      console.log('❌ Playwright non installé. Installation...');
      execSync('npx playwright install chromium', { stdio: 'inherit' });
    }

    // Vérifier les fichiers de test
    const testFiles = [
      'tests/e2e/quick-test.spec.ts',
      'playwright.config.ts'
    ];

    testFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        console.log(`❌ Fichier manquant: ${file}`);
        process.exit(1);
      }
    });
    console.log('✅ Fichiers de test présents');

    // 2. Démarrer le serveur de dev
    console.log('\n🚀 Étape 2: Démarrage serveur de développement');
    
    devServerProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    // Attendre que le serveur démarre
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: serveur ne démarre pas'));
      }, 30000);

      devServerProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('📡 Serveur:', output.trim());
        
        if (output.includes('localhost:8080') || output.includes('Local:')) {
          clearTimeout(timeout);
          console.log('✅ Serveur démarré sur http://localhost:8080');
          resolve();
        }
      });

      devServerProcess.stderr.on('data', (data) => {
        console.log('⚠️ Serveur stderr:', data.toString().trim());
      });

      devServerProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Attendre un peu plus pour stabilité
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Lancer le test rapide
    console.log('\n🧪 Étape 3: Lancement test rapide');
    
    const testResult = execSync(
      'npx playwright test tests/e2e/quick-test.spec.ts --project=chromium --reporter=line',
      { 
        encoding: 'utf8',
        timeout: 60000
      }
    );
    
    console.log('📊 Résultat test:');
    console.log(testResult);

    // 4. Test avec interface visible (optionnel)
    console.log('\n👁️ Étape 4: Test avec navigateur visible (5 secondes)');
    
    const headedTest = execSync(
      'npx playwright test tests/e2e/quick-test.spec.ts --project=chromium --headed --reporter=line',
      { 
        encoding: 'utf8',
        timeout: 30000
      }
    );

    console.log('📊 Test navigateur visible:');
    console.log(headedTest);

    console.log('\n🎉 VALIDATION RÉUSSIE !');
    console.log('✅ Les tests E2E DooDates fonctionnent parfaitement');
    console.log('✅ Le serveur démarre correctement');
    console.log('✅ Les data-testid sont détectés');
    console.log('✅ La création de sondage fonctionne');
    console.log('✅ La navigation fonctionne');

    return true;

  } catch (error) {
    console.log('\n❌ VALIDATION ÉCHOUÉE');
    console.log('🔍 Erreur:', error.message);
    
    if (error.stdout) {
      console.log('📤 Stdout:', error.stdout);
    }
    if (error.stderr) {
      console.log('📥 Stderr:', error.stderr);
    }

    return false;
  } finally {
    cleanup();
  }
}

// Lancer la validation
validateE2E().then(success => {
  process.exit(success ? 0 : 1);
});
