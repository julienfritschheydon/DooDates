/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Script de test A/B pour comparer les performances de Gemini 2.0
 * avec et sans post-processing
 * 
 * Usage:
 *   node --loader ts-node/esm scripts/test-gemini-ab.ts
 *   ou
 *   tsx scripts/test-gemini-ab.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  promptId: string;
  input: string;
  passed: boolean;
  score: number;
  details: {
    hasTimeSlots: boolean;
    timeSlotsCount: number;
    datesCount: number;
    timeSlots?: Array<{ start: string; end: string; dates: string[] }>;
    dates?: string[];
    violations: string[];
  };
  response?: any;
}

interface ComparisonResult {
  promptId: string;
  input: string;
  withPostProcessing: TestResult | null;
  withoutPostProcessing: TestResult | null;
  scoreDifference: number;
  improved: boolean;
  degraded: boolean;
  analysis: string;
}

/**
 * Exécute les tests Gemini avec ou sans post-processing
 */
async function runTests(disablePostProcessing: boolean): Promise<TestResult[]> {
  const env = {
    ...process.env,
    VITE_DISABLE_POST_PROCESSING: disablePostProcessing ? 'true' : 'false',
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Exécution des tests ${disablePostProcessing ? 'SANS' : 'AVEC'} post-processing`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const command = `npx vitest run --config vitest.config.gemini.ts src/test/temporal-prompts-validation.manual.ts --reporter=json --no-coverage`;
    
    const { stdout, stderr } = await execAsync(command, {
      env,
      cwd: path.resolve(__dirname, '..'),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Parser les résultats JSON de Vitest
    const results = parseVitestResults(stdout, stderr);
    
    console.log(`✅ Tests terminés: ${results.length} résultats`);
    return results;
  } catch (error: any) {
    console.error(`❌ Erreur lors de l'exécution des tests:`, error.message);
    
    // Essayer de parser les résultats partiels
    if (error.stdout) {
      return parseVitestResults(error.stdout, error.stderr || '');
    }
    
    return [];
  }
}

/**
 * Parse les résultats JSON de Vitest (fallback si les fichiers JSON ne sont pas disponibles)
 * Note: Cette fonction est un fallback, on préfère lire depuis les fichiers JSON
 */
function parseVitestResults(stdout: string, stderr: string): TestResult[] {
  const results: TestResult[] = [];
  
  // Essayer de parser les résultats depuis la sortie console si nécessaire
  // Mais normalement on utilisera les fichiers JSON générés
  console.log('⚠️  Utilisation du parsing console (fallback). Les fichiers JSON sont préférés.');
  
  return results;
}

/**
 * Lit les résultats depuis le fichier JSON généré par les tests
 */
async function readTestResultsFromJson(suffix: string): Promise<TestResult[]> {
  const jsonPath = path.resolve(__dirname, '..', `Docs/TESTS/datasets/temporal-prompts-test-results${suffix}.json`);
  
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    const jsonData = JSON.parse(content);
    
    return jsonData.results.map((r: any) => ({
      promptId: r.promptId,
      input: r.input,
      passed: r.passed,
      score: r.score,
      details: {
        hasTimeSlots: r.details.hasTimeSlots,
        timeSlotsCount: r.details.timeSlotsCount,
        datesCount: r.details.datesCount,
        timeSlots: r.details.timeSlots,
        dates: r.details.dates,
        violations: r.details.violations || [],
      },
    }));
  } catch (error) {
    console.warn(`⚠️  Impossible de lire le rapport JSON: ${jsonPath}`);
    return [];
  }
}


/**
 * Compare les résultats avec et sans post-processing
 */
function compareResults(
  withResults: TestResult[],
  withoutResults: TestResult[]
): ComparisonResult[] {
  const comparisons: ComparisonResult[] = [];
  const allPromptIds = new Set([
    ...withResults.map(r => r.promptId),
    ...withoutResults.map(r => r.promptId),
  ]);

  for (const promptId of allPromptIds) {
    const withResult = withResults.find(r => r.promptId === promptId) || null;
    const withoutResult = withoutResults.find(r => r.promptId === promptId) || null;
    
    const scoreWith = withResult?.score || 0;
    const scoreWithout = withoutResult?.score || 0;
    const scoreDifference = scoreWithout - scoreWith;
    
    comparisons.push({
      promptId,
      input: withResult?.input || withoutResult?.input || promptId,
      withPostProcessing: withResult,
      withoutPostProcessing: withoutResult,
      scoreDifference,
      improved: scoreDifference > 0.05, // Amélioration significative (>5%)
      degraded: scoreDifference < -0.05, // Dégradation significative (>5%)
      analysis: generateAnalysis(withResult, withoutResult, scoreDifference),
    });
  }

  return comparisons;
}

/**
 * Génère une analyse pour chaque comparaison
 */
function generateAnalysis(
  withResult: TestResult | null,
  withoutResult: TestResult | null,
  scoreDifference: number
): string {
  if (!withResult && !withoutResult) {
    return 'Aucun résultat disponible';
  }

  if (!withResult) {
    return 'Test réussi uniquement sans post-processing';
  }

  if (!withoutResult) {
    return 'Test réussi uniquement avec post-processing';
  }

  const analysis: string[] = [];

  if (Math.abs(scoreDifference) < 0.05) {
    analysis.push('Score similaire avec et sans post-processing');
  } else if (scoreDifference > 0) {
    analysis.push(`Amélioration de ${(scoreDifference * 100).toFixed(1)}% sans post-processing`);
  } else {
    analysis.push(`Dégradation de ${(Math.abs(scoreDifference) * 100).toFixed(1)}% sans post-processing`);
  }

  // Comparer les détails
  if (withResult.details.datesCount !== withoutResult.details.datesCount) {
    analysis.push(
      `Dates: ${withResult.details.datesCount} → ${withoutResult.details.datesCount}`
    );
  }

  if (withResult.details.timeSlotsCount !== withoutResult.details.timeSlotsCount) {
    analysis.push(
      `Créneaux: ${withResult.details.timeSlotsCount} → ${withoutResult.details.timeSlotsCount}`
    );
  }

  if (withResult.details.violations.length !== withoutResult.details.violations.length) {
    analysis.push(
      `Violations: ${withResult.details.violations.length} → ${withoutResult.details.violations.length}`
    );
  }

  return analysis.join(' | ');
}

/**
 * Génère le rapport comparatif
 */
async function generateComparisonReport(comparisons: ComparisonResult[]): Promise<string> {
  const timestamp = new Date().toISOString().split('T')[0];
  const improved = comparisons.filter(c => c.improved);
  const degraded = comparisons.filter(c => c.degraded);
  const similar = comparisons.filter(c => !c.improved && !c.degraded);

  const avgScoreWith = comparisons
    .filter(c => c.withPostProcessing)
    .reduce((sum, c) => sum + (c.withPostProcessing?.score || 0), 0) / 
    comparisons.filter(c => c.withPostProcessing).length;

  const avgScoreWithout = comparisons
    .filter(c => c.withoutPostProcessing)
    .reduce((sum, c) => sum + (c.withoutPostProcessing?.score || 0), 0) / 
    comparisons.filter(c => c.withoutPostProcessing).length;

  let report = `# Rapport de Comparaison Post-Processing Gemini 2.0\n\n`;
  report += `**Date** : ${timestamp}\n`;
  report += `**Tests comparés** : ${comparisons.length}\n\n`;

  report += `## Résumé Exécutif\n\n`;
  report += `- **Score moyen AVEC post-processing** : ${avgScoreWith.toFixed(2)}/1.0\n`;
  report += `- **Score moyen SANS post-processing** : ${avgScoreWithout.toFixed(2)}/1.0\n`;
  report += `- **Différence** : ${((avgScoreWithout - avgScoreWith) * 100).toFixed(1)}%\n\n`;

  report += `### Statistiques\n\n`;
  report += `- **Tests améliorés** (sans post-processing) : ${improved.length} (${((improved.length / comparisons.length) * 100).toFixed(1)}%)\n`;
  report += `- **Tests dégradés** (sans post-processing) : ${degraded.length} (${((degraded.length / comparisons.length) * 100).toFixed(1)}%)\n`;
  report += `- **Tests similaires** : ${similar.length} (${((similar.length / comparisons.length) * 100).toFixed(1)}%)\n\n`;

  if (improved.length > 0) {
    report += `## Tests qui s'améliorent SANS post-processing\n\n`;
    improved.forEach(comp => {
      report += `### ${comp.input}\n\n`;
      report += `- **ID** : ${comp.promptId}\n`;
      report += `- **Score AVEC** : ${comp.withPostProcessing?.score.toFixed(2) || 'N/A'}/1.0\n`;
      report += `- **Score SANS** : ${comp.withoutPostProcessing?.score.toFixed(2) || 'N/A'}/1.0\n`;
      report += `- **Amélioration** : +${(comp.scoreDifference * 100).toFixed(1)}%\n`;
      report += `- **Analyse** : ${comp.analysis}\n\n`;
    });
  }

  if (degraded.length > 0) {
    report += `## Tests qui se dégradent SANS post-processing\n\n`;
    degraded.forEach(comp => {
      report += `### ${comp.input}\n\n`;
      report += `- **ID** : ${comp.promptId}\n`;
      report += `- **Score AVEC** : ${comp.withPostProcessing?.score.toFixed(2) || 'N/A'}/1.0\n`;
      report += `- **Score SANS** : ${comp.withoutPostProcessing?.score.toFixed(2) || 'N/A'}/1.0\n`;
      report += `- **Dégradation** : ${(comp.scoreDifference * 100).toFixed(1)}%\n`;
      report += `- **Analyse** : ${comp.analysis}\n`;
      
      if (comp.withoutPostProcessing?.details.violations.length) {
        report += `- **Violations détectées** :\n`;
        comp.withoutPostProcessing.details.violations.forEach(v => {
          report += `  - ${v}\n`;
        });
      }
      report += `\n`;
    });
  }

  report += `## Recommandations\n\n`;
  
  if (avgScoreWithout >= avgScoreWith * 0.95) {
    report += `### ✅ Scénario A : Score identique ou supérieur SANS post-processing\n\n`;
    report += `**Action recommandée** : Supprimer complètement le post-processor\n\n`;
    report += `Le modèle Gemini 2.0 avec température 1 génère des réponses de qualité suffisante sans post-processing.\n`;
  } else if (avgScoreWithout >= avgScoreWith * 0.90) {
    report += `### ⚠️ Scénario B : Score légèrement inférieur SANS post-processing\n\n`;
    report += `**Action recommandée** : Identifier les 2-3 règles critiques manquantes et créer un mini post-processor (~100 lignes)\n\n`;
    report += `Les tests dégradés nécessitent les règles suivantes :\n`;
    degraded.forEach(comp => {
      report += `- ${comp.input} : ${comp.analysis}\n`;
    });
  } else {
    report += `### ❌ Scénario C : Score significativement inférieur SANS post-processing\n\n`;
    report += `**Action recommandée** : Garder le post-processor mais le simplifier en supprimant les règles redondantes\n\n`;
    report += `Le post-processing reste nécessaire. Analyser les règles utilisées uniquement pour les tests dégradés.\n`;
  }

  return report;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n🚀 Démarrage du test A/B Post-Processing Gemini 2.0\n');

  // Étape 1: Exécuter les tests AVEC post-processing
  console.log('📊 Étape 1/3 : Exécution des tests AVEC post-processing...');
  const withResults = await runTests(false);
  
  // Attendre un peu pour éviter le rate limiting
  console.log('\n⏳ Attente de 5 secondes avant le prochain run...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Étape 2: Exécuter les tests SANS post-processing
  console.log('📊 Étape 2/3 : Exécution des tests SANS post-processing...');
  const withoutResults = await runTests(true);

  // Lire les résultats depuis les fichiers JSON générés (plus fiable que parser la console)
  console.log('\n📖 Lecture des résultats depuis les fichiers JSON générés...');
  
  // Attendre que les rapports soient générés
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const jsonWithResults = await readTestResultsFromJson('-with-postprocessing');
  const jsonWithoutResults = await readTestResultsFromJson('-no-postprocessing');
  
  // Utiliser les résultats JSON s'ils sont disponibles, sinon utiliser ceux de la console
  const finalWithResults = jsonWithResults.length > 0 ? jsonWithResults : withResults;
  const finalWithoutResults = jsonWithoutResults.length > 0 ? jsonWithoutResults : withoutResults;
  
  if (finalWithResults.length === 0 && finalWithoutResults.length === 0) {
    console.error('❌ Aucun résultat trouvé. Vérifiez que les tests ont bien généré les fichiers JSON.');
    process.exit(1);
  }
  
  console.log(`✅ Résultats chargés: ${finalWithResults.length} avec post-processing, ${finalWithoutResults.length} sans post-processing`);

  // Étape 3: Comparer les résultats
  console.log('\n📊 Étape 3/3 : Comparaison des résultats...');
  const comparisons = compareResults(finalWithResults, finalWithoutResults);

  // Générer le rapport
  const report = await generateComparisonReport(comparisons);
  
  // Sauvegarder le rapport
  const reportDir = path.resolve(__dirname, '..', 'Docs');
  const reportPath = path.resolve(reportDir, 'Post-Processing-Comparison-Report.md');
  
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(reportPath, report, 'utf-8');

  console.log('\n✅ Rapport généré avec succès !');
  console.log(`📄 Fichier : ${reportPath}\n`);
  
  // Afficher le résumé
  const avgWith = comparisons
    .filter(c => c.withPostProcessing)
    .reduce((sum, c) => sum + (c.withPostProcessing?.score || 0), 0) / 
    Math.max(1, comparisons.filter(c => c.withPostProcessing).length);
    
  const avgWithout = comparisons
    .filter(c => c.withoutPostProcessing)
    .reduce((sum, c) => sum + (c.withoutPostProcessing?.score || 0), 0) / 
    Math.max(1, comparisons.filter(c => c.withoutPostProcessing).length);

  console.log('📊 Résumé:');
  console.log(`  Score moyen AVEC post-processing: ${avgWith.toFixed(2)}/1.0`);
  console.log(`  Score moyen SANS post-processing: ${avgWithout.toFixed(2)}/1.0`);
  console.log(`  Différence: ${((avgWithout - avgWith) * 100).toFixed(1)}%`);
  console.log(`  Tests améliorés: ${comparisons.filter(c => c.improved).length}`);
  console.log(`  Tests dégradés: ${comparisons.filter(c => c.degraded).length}`);
}

// Exécuter le script
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
