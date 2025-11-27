/**
 * Script interactif pour relancer uniquement les tests échoués
 * 
 * Usage:
 *   node scripts/run-failed-tests-interactive.js
 * 
 * Ce script:
 * 1. Analyse les logs ou le rapport pour identifier les échecs
 * 2. Propose de relancer uniquement ces tests
 * 3. Utilise Vitest avec un filtre pour exécuter uniquement les tests sélectionnés
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Lire le fichier de test pour extraire les IDs
function extractTestCases() {
  const testFile = path.join(process.cwd(), 'src', 'test', 'gemini-comprehensive.test.ts');
  const content = fs.readFileSync(testFile, 'utf8');
  
  const testCases = [];
  const testCaseRegex = /id:\s*["']([^"']+)["']/g;
  let match;
  
  while ((match = testCaseRegex.exec(content)) !== null) {
    testCases.push(match[1]);
  }
  
  return testCases;
}

// Analyser les logs pour trouver les échecs
function findFailedTests(logFile) {
  if (!fs.existsSync(logFile)) {
    return [];
  }
  
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  
  const failedTests = [];
  let currentTest = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter le début d'un test
    const testMatch = line.match(/\[([^\]]+)\]\s+([^\.]+)/);
    if (testMatch) {
      currentTest = {
        category: testMatch[1],
        input: testMatch[2].trim(),
        line: i
      };
    }
    
    // Détecter les erreurs
    if (line.includes('All dates were in the past') || 
        line.includes('Failed to parse Gemini response') ||
        line.includes('DooDates Error')) {
      if (currentTest) {
        failedTests.push({
          ...currentTest,
          error: line.substring(0, 100)
        });
        currentTest = null;
      }
    }
  }
  
  return failedTests;
}

// Trouver l'ID du test correspondant
function findTestId(testCase, allTestCases) {
  // Chercher par catégorie et input
  const testFile = path.join(process.cwd(), 'src', 'test', 'gemini-comprehensive.test.ts');
  const content = fs.readFileSync(testFile, 'utf8');
  
  // Extraire les test cases avec leurs IDs
  const testCaseBlocks = content.match(/{\s*id:\s*["']([^"']+)["'][^}]*category:\s*["']([^"']+)["'][^}]*input:\s*["']([^"']+)["']/g);
  
  if (!testCaseBlocks) {
    return null;
  }
  
  for (const block of testCaseBlocks) {
    const idMatch = block.match(/id:\s*["']([^"']+)["']/);
    const categoryMatch = block.match(/category:\s*["']([^"']+)["']/);
    const inputMatch = block.match(/input:\s*["']([^"']+)["']/);
    
    if (idMatch && categoryMatch && inputMatch) {
      const id = idMatch[1];
      const category = categoryMatch[1];
      const input = inputMatch[1];
      
      // Vérifier si ça correspond
      if (category.includes(testCase.category) || testCase.category.includes(category)) {
        if (input.includes(testCase.input.substring(0, 30)) || testCase.input.includes(input.substring(0, 30))) {
          return id;
        }
      }
    }
  }
  
  return null;
}

// Fonction principale
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise(resolve => rl.question(query, resolve));
  
  console.log('🔍 Analyse des tests échoués...\n');
  
  // Chercher les logs
  const logFile = 'gemini_errors.txt';
  const failedTests = findFailedTests(logFile);
  
  if (failedTests.length === 0) {
    console.log('❌ Aucun test échoué trouvé dans les logs');
    console.log('\n💡 Lancez d\'abord les tests:');
    console.log('   npm run test:gemini *> gemini_errors.txt');
    rl.close();
    return;
  }
  
  console.log(`📊 ${failedTests.length} test(s) échoué(s) trouvé(s):\n`);
  
  // Extraire les IDs
  const allTestCases = extractTestCases();
  const failedTestIds = [];
  
  for (const failedTest of failedTests) {
    const testId = findTestId(failedTest, allTestCases);
    if (testId) {
      failedTestIds.push(testId);
      console.log(`   ❌ ${testId}: ${failedTest.category}`);
      console.log(`      "${failedTest.input.substring(0, 60)}..."`);
      if (failedTest.error) {
        console.log(`      Erreur: ${failedTest.error}`);
      }
      console.log('');
    } else {
      console.log(`   ⚠️  Test non identifié: ${failedTest.category}`);
      console.log(`      "${failedTest.input.substring(0, 60)}..."`);
      console.log('');
    }
  }
  
  if (failedTestIds.length === 0) {
    console.log('❌ Impossible d\'identifier les IDs des tests échoués');
    rl.close();
    return;
  }
  
  console.log(`\n✅ ${failedTestIds.length} test(s) identifié(s) avec succès\n`);
  
  const answer = await question('🚀 Voulez-vous relancer uniquement ces tests ? (o/n): ');
  
  if (answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'oui') {
    console.log('❌ Annulé');
    rl.close();
    return;
  }
  
  rl.close();
  
  // Créer un fichier de filtre temporaire
  const filterFile = path.join(process.cwd(), '.vitest-failed-tests.json');
  fs.writeFileSync(filterFile, JSON.stringify(failedTestIds, null, 2));
  
  console.log('\n🚀 Relance des tests échoués...\n');
  
  // Modifier temporairement le fichier de test pour filtrer
  // Ou utiliser Vitest avec un filtre personnalisé
  // Pour l'instant, on va simplement suggérer de modifier manuellement
  
  console.log('💡 Pour relancer uniquement ces tests, deux options:');
  console.log('\n   Option 1: Modifier temporairement le fichier de test');
  console.log('   (Filtrez testCases pour ne garder que les IDs échoués)');
  console.log('\n   Option 2: Utiliser Vitest avec un filtre (à implémenter)');
  console.log(`\n   Les IDs sont sauvegardés dans: ${filterFile}`);
}

main().catch(console.error);

