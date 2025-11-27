/**
 * Script simple pour relancer uniquement les tests échoués
 * 
 * Usage:
 *   node scripts/run-failed-tests-simple.js
 * 
 * Ce script:
 * 1. Analyse gemini_errors.txt pour trouver les échecs
 * 2. Extrait les IDs des tests échoués
 * 3. Relance uniquement ces tests avec Vitest
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analyser les logs pour trouver les tests échoués
function findFailedTestIds(logFile) {
  const logPath = path.resolve(process.cwd(), logFile);
  
  if (!fs.existsSync(logPath)) {
    console.error(`❌ Fichier ${logFile} introuvable`);
    console.log('\n💡 Lancez d\'abord les tests:');
    console.log('   npm run test:gemini *> gemini_errors.txt');
    process.exit(1);
  }
  
  const content = fs.readFileSync(logPath, 'utf8');
  
  // Lire le fichier de test pour mapper les catégories/inputs aux IDs
  const testFile = path.resolve(process.cwd(), 'src', 'test', 'gemini-comprehensive.test.ts');
  const testContent = fs.readFileSync(testFile, 'utf8');
  
  // Extraire tous les test cases avec leurs IDs
  const testCaseMap = new Map();
  const testCaseRegex = /{\s*id:\s*["']([^"']+)["'][^}]*category:\s*["']([^"']+)["'][^}]*input:\s*["']([^"']+)["']/g;
  let match;
  
  while ((match = testCaseRegex.exec(testContent)) !== null) {
    const id = match[1];
    const category = match[2];
    const input = match[3];
    
    // Créer des clés de recherche
    const key1 = `${category}::${input.substring(0, 40)}`;
    const key2 = category;
    const key3 = input.substring(0, 30);
    
    testCaseMap.set(key1, id);
    testCaseMap.set(key2, id); // Peut être ambigu, mais utile
    testCaseMap.set(key3, id);
  }
  
  // Chercher les erreurs dans les logs
  const failedTestIds = new Set();
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter les erreurs
    if (line.includes('All dates were in the past') || 
        line.includes('Failed to parse Gemini response') ||
        (line.includes('DooDates Error') && line.includes('validation'))) {
      
      // Remonter pour trouver le test
      for (let j = Math.max(0, i - 20); j < i; j++) {
        const testLine = lines[j];
        
        // Chercher le pattern de test
        const testMatch = testLine.match(/\[([^\]]+)\]\s+([^\.]+)/);
        if (testMatch) {
          const category = testMatch[1];
          const input = testMatch[2].trim();
          
          // Essayer de trouver l'ID
          const key1 = `${category}::${input.substring(0, 40)}`;
          const key2 = category;
          const key3 = input.substring(0, 30);
          
          if (testCaseMap.has(key1)) {
            failedTestIds.add(testCaseMap.get(key1));
            break;
          } else if (testCaseMap.has(key2)) {
            failedTestIds.add(testCaseMap.get(key2));
            break;
          } else if (testCaseMap.has(key3)) {
            failedTestIds.add(testCaseMap.get(key3));
            break;
          }
        }
      }
    }
  }
  
  return Array.from(failedTestIds);
}

// Fonction principale
function main() {
  console.log('🔍 Analyse des tests échoués...\n');
  
  const failedTestIds = findFailedTestIds('gemini_errors.txt');
  
  if (failedTestIds.length === 0) {
    console.log('✅ Aucun test échoué identifié');
    console.log('\n💡 Pour identifier les échecs, lancez:');
    console.log('   npm run test:gemini *> gemini_errors.txt');
    process.exit(0);
  }
  
  console.log(`📊 ${failedTestIds.length} test(s) échoué(s) identifié(s):\n`);
  failedTestIds.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
  });
  
  console.log('\n🚀 Relance des tests échoués...\n');
  
  // Relancer avec les IDs
  const testIds = failedTestIds.join(',');
  
  // Utiliser la méthode appropriée selon l'OS
  const isWindows = process.platform === 'win32';
  let command;
  
  if (isWindows) {
    // PowerShell
    command = `$env:FAILED_TEST_IDS="${testIds}"; npm run test:gemini`;
  } else {
    // Unix/Linux/Mac
    command = `FAILED_TEST_IDS="${testIds}" npm run test:gemini`;
  }
  
  console.log(`📝 Commande: ${command}\n`);
  
  try {
    execSync(command, { stdio: 'inherit', shell: isWindows ? 'powershell.exe' : true });
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des tests');
    console.error('💡 Vous pouvez aussi lancer manuellement:');
    if (isWindows) {
      console.error(`   $env:FAILED_TEST_IDS="${testIds}"; npm run test:gemini`);
    } else {
      console.error(`   FAILED_TEST_IDS="${testIds}" npm run test:gemini`);
    }
    process.exit(1);
  }
}

main();

