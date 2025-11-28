/**
 * Script pour identifier et relancer uniquement les tests échoués
 * 
 * Usage:
 *   1. D'abord, lancer tous les tests et générer le rapport:
 *      npm run test:gemini 2>&1 | node scripts/generate-gemini-test-report.js
 *   
 *   2. Ensuite, relancer uniquement les échecs:
 *      node scripts/run-failed-tests.js
 * 
 * Ou directement depuis les logs:
 *   node scripts/run-failed-tests.js gemini_errors.txt
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lire les arguments
const args = process.argv.slice(2);
const logFile = args[0] || 'gemini_errors.txt';

// Méthode 1: Lire depuis le rapport JSON (si disponible)
function getFailedTestsFromReport() {
  const reportDir = path.join(process.cwd(), 'tests', 'reports');
  if (!fs.existsSync(reportDir)) {
    return null;
  }
  
  // Chercher le rapport JSON le plus récent
  const files = fs.readdirSync(reportDir)
    .filter(f => f.startsWith('gemini-test-report-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    return null;
  }
  
  const latestReport = JSON.parse(
    fs.readFileSync(path.join(reportDir, files[0]), 'utf8')
  );
  
  // Extraire les IDs des tests échoués depuis le rapport
  // Note: Le rapport JSON contient les erreurs, mais pas directement les IDs
  // On va plutôt analyser les logs
  return null;
}

// Méthode 2: Analyser les logs pour identifier les tests échoués
function getFailedTestsFromLogs(logFile) {
  if (!fs.existsSync(logFile)) {
    console.error(`❌ Fichier ${logFile} introuvable`);
    console.log('\n💡 Astuce: Lancez d\'abord les tests:');
    console.log('   npm run test:gemini *> gemini_errors.txt');
    process.exit(1);
  }
  
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  
  const failedTests = new Set();
  const errorPatterns = [
    /All dates were in the past/,
    /Failed to parse Gemini response/,
    /ÉCHEC|FAILED|❌/
  ];
  
  // Chercher les erreurs et remonter pour trouver le test
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Si on trouve une erreur, remonter pour trouver le nom du test
    if (errorPatterns.some(pattern => pattern.test(line))) {
      // Remonter de 5-10 lignes pour trouver le nom du test
      for (let j = Math.max(0, i - 15); j < i; j++) {
        const testMatch = lines[j].match(/\[([^\]]+)\]\s+([^\.]+)/);
        if (testMatch) {
          const category = testMatch[1];
          const input = testMatch[2].trim();
          // Créer un identifiant unique basé sur la catégorie et l'input
          failedTests.add(`${category}::${input.substring(0, 50)}`);
          break;
        }
      }
    }
  }
  
  return Array.from(failedTests);
}

// Méthode 3: Lire depuis le rapport markdown
function getFailedTestsFromMarkdown() {
  const reportPath = path.join(process.cwd(), 'tests', 'reports', 'gemini-comprehensive-report.md');
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  
  const content = fs.readFileSync(reportPath, 'utf8');
  const failedSection = content.match(/## 🔍 Analyse des Échecs\n\n(.*?)(?=\n## |$)/s);
  
  if (!failedSection) {
    return null;
  }
  
  const failedTests = [];
  const testMatches = failedSection[1].matchAll(/### Test ([^:]+):/g);
  
  for (const match of testMatches) {
    failedTests.push(match[1].trim());
  }
  
  return failedTests;
}

// Fonction principale
function main() {
  console.log('🔍 Identification des tests échoués...\n');
  
  // Essayer différentes méthodes
  let failedTestIds = getFailedTestsFromMarkdown();
  
  if (!failedTestIds || failedTestIds.length === 0) {
    console.log('📋 Analyse des logs pour identifier les échecs...');
    const failedTests = getFailedTestsFromLogs(logFile);
    
    if (failedTests.length === 0) {
      console.log('✅ Aucun test échoué identifié dans les logs');
      console.log('\n💡 Pour identifier les échecs, lancez:');
      console.log('   npm run test:gemini 2>&1 | node scripts/generate-gemini-test-report.js');
      process.exit(0);
    }
    
    failedTestIds = failedTests;
  }
  
  console.log(`\n📊 ${failedTestIds.length} test(s) échoué(s) identifié(s):\n`);
  failedTestIds.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
  });
  
  // Créer un fichier avec les IDs pour Vitest
  const filterFile = path.join(process.cwd(), '.vitest-failed-tests.json');
  fs.writeFileSync(filterFile, JSON.stringify(failedTestIds, null, 2));
  
  console.log(`\n✅ IDs sauvegardés dans: ${filterFile}`);
  console.log('\n🚀 Pour relancer uniquement ces tests:');
  console.log('   npm run test:gemini -- --grep "pattern"');
  console.log('\n💡 Ou utilisez le script interactif:');
  console.log('   node scripts/run-failed-tests-interactive.js');
}

main();

