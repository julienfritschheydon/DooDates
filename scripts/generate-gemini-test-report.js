/**
 * Script pour générer un rapport amélioré des tests Gemini
 * 
 * Usage:
 *   npm run test:gemini 2>&1 | node scripts/generate-gemini-test-report.js
 * 
 * Ou avec fichiers séparés:
 *   npm run test:gemini > gemini_output.txt 2> gemini_errors.txt
 *   node scripts/generate-gemini-test-report.js gemini_output.txt gemini_errors.txt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire les arguments ou stdin
const args = process.argv.slice(2);
let stdout = '';
let stderr = '';

if (args.length >= 2) {
  // Lire depuis fichiers
  stdout = fs.readFileSync(path.resolve(args[0]), 'utf8');
  stderr = fs.readFileSync(path.resolve(args[1]), 'utf8');
  generateReport(stdout, stderr);
} else {
  // Lire depuis stdin
  const chunks = [];
  process.stdin.on('data', chunk => chunks.push(chunk));
  process.stdin.on('end', () => {
    const input = chunks.join('');
    // Séparer stdout et stderr (approximation)
    const lines = input.split('\n');
    lines.forEach(line => {
      if (line.includes('stderr') || line.includes('Error') || line.includes('DooDates Error')) {
        stderr += line + '\n';
      } else {
        stdout += line + '\n';
      }
    });
    generateReport(stdout, stderr);
  });
}

function generateReport(stdout, stderr) {
  const timestamp = new Date().toISOString();
  const reportDir = path.resolve(process.cwd(), 'tests', 'reports');
  
  // Créer le répertoire si nécessaire
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Analyser les résultats
  const stats = analyzeResults(stdout, stderr);
  
  // Générer rapport JSON
  const jsonReport = {
    timestamp,
    summary: stats.summary,
    categories: stats.categories,
    errors: stats.errors,
    translations: stats.translations,
    recommendations: generateRecommendations(stats)
  };
  
  const jsonPath = path.resolve(reportDir, `gemini-test-report-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  
  // Générer rapport Markdown
  const mdReport = generateMarkdownReport(jsonReport, stdout, stderr);
  const mdPath = path.resolve(reportDir, 'gemini-comprehensive-report.md');
  fs.writeFileSync(mdPath, mdReport);
  
  // Afficher résumé dans la console
  console.log('\n📊 RAPPORT GEMINI TEST - RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`✅ Succès: ${stats.summary.success}/${stats.summary.total}`);
  console.log(`❌ Échecs: ${stats.summary.failures}/${stats.summary.total}`);
  console.log(`📈 Score estimé: ${stats.summary.estimatedScore}%`);
  console.log(`🎯 Objectif: 70% - ${stats.summary.estimatedScore >= 70 ? '✅ ATTEINT' : '❌ NON ATTEINT'}`);
  console.log(`\n📄 Rapports générés:`);
  console.log(`   - JSON: ${jsonPath}`);
  console.log(`   - Markdown: ${mdPath}`);
}

function analyzeResults(stdout, stderr) {
  const totalTests = 57; // Nombre total de tests
  
  // Compter les succès
  const successMatches = stdout.match(/Date Poll successfully generated|Form Poll successfully generated/g);
  const successCount = successMatches ? successMatches.length : 0;
  
  // Compter les erreurs
  const pastDatesErrors = (stderr.match(/All dates were in the past/g) || []).length;
  const parseErrors = (stderr.match(/Failed to parse Gemini response/g) || []).length;
  const totalErrors = pastDatesErrors + parseErrors;
  
  // Analyser les traductions
  const translationIssues = extractTranslationIssues(stdout);
  
  // Analyser par catégorie
  const categories = analyzeByCategory(stdout);
  
  // Estimer le score (si 36 succès avec score moyen 3/4)
  const estimatedScore = Math.round((successCount * 3 / totalTests / 4) * 100);
  
  return {
    summary: {
      total: totalTests,
      success: successCount,
      failures: totalErrors,
      estimatedScore
    },
    categories,
    errors: {
      pastDates: pastDatesErrors,
      parseErrors: parseErrors,
      total: totalErrors
    },
    translations: translationIssues
  };
}

function extractTranslationIssues(stdout) {
  const issues = {
    untranslatedWords: [],
    incorrectTranslations: [],
    patterns: []
  };
  
  // Extraire les traductions
  const translationMatches = stdout.match(/translated:([^']+)/g) || [];
  
  translationMatches.forEach(match => {
    const translated = match.replace('translated:', '');
    
    // Détecter les mots français non traduits
    const frenchWords = translated.match(/\b(pour|avec|de|la|le|les|et|ou)\b/gi);
    if (frenchWords) {
      issues.untranslatedWords.push(...frenchWords.map(w => w.toLowerCase()));
    }
    
    // Détecter les traductions incorrectes
    if (translated.includes('from bureau') || translated.includes('from 15')) {
      issues.incorrectTranslations.push('Regex "du" trop agressive');
    }
    if (translated.includes('la next semaine')) {
      issues.incorrectTranslations.push('"la semaine" non traduit');
    }
    if (translated.includes('et 13:00')) {
      issues.incorrectTranslations.push('"et" non traduit dans plages horaires');
    }
  });
  
  // Compter les patterns
  issues.patterns = {
    'du bureau → from bureau': (stdout.match(/from bureau/g) || []).length,
    'la semaine non traduit': (stdout.match(/la (next |semaine)/g) || []).length,
    'pour non traduit': (stdout.match(/pour [a-z]/g) || []).length,
    'et non traduit': (stdout.match(/\bet \d/gi) || []).length
  };
  
  return issues;
}

function analyzeByCategory(stdout) {
  const categories = {};
  
  // Extraire les catégories depuis les logs
  const categoryMatches = stdout.match(/\[([^\]]+)\]/g) || [];
  
  categoryMatches.forEach(match => {
    const category = match.replace(/[\[\]]/g, '');
    if (!categories[category]) {
      categories[category] = { total: 0, success: 0, failures: 0 };
    }
    categories[category].total++;
  });
  
  // Compter les succès par catégorie (approximation)
  const successLines = stdout.split('\n').filter(line => 
    line.includes('successfully generated')
  );
  
  return categories;
}

function generateRecommendations(stats) {
  const recommendations = [];
  
  if (stats.summary.estimatedScore < 70) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Score insuffisant',
      action: 'Corriger les problèmes de traduction et améliorer les prompts Gemini'
    });
  }
  
  if (stats.errors.pastDates > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: `${stats.errors.pastDates} tests avec dates passées`,
      action: 'Mettre à jour les dates dans les tests ou améliorer la génération Gemini'
    });
  }
  
  if (stats.translations.patterns['du bureau → from bureau'] > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Regex "du" trop agressive',
      action: 'Améliorer le regex pour distinguer "du" (article) vs "du" (préposition temporelle)'
    });
  }
  
  if (stats.translations.patterns['la semaine non traduit'] > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: '"la semaine" non traduit',
      action: 'Ajouter la traduction de "la semaine" → "the week" ou mieux gérer "la semaine prochaine"'
    });
  }
  
  if (stats.translations.patterns['pour non traduit'] > 0) {
    recommendations.push({
      priority: 'LOW',
      issue: 'Mots français non traduits (pour, avec, de)',
      action: 'Traduire les prépositions françaises restantes'
    });
  }
  
  return recommendations;
}

function generateMarkdownReport(jsonReport, stdout, stderr) {
  let md = `# Rapport Gemini Comprehensive Test Suite\n\n`;
  md += `**Date:** ${jsonReport.timestamp}\n`;
  md += `**Score Final:** ${jsonReport.summary.estimatedScore}% (estimé)\n`;
  md += `**Tests réussis:** ${jsonReport.summary.success}/${jsonReport.summary.total}\n`;
  md += `**Tests échoués:** ${jsonReport.summary.failures}/${jsonReport.summary.total}\n\n`;
  
  md += `## 🎯 Évaluation Qualité\n\n`;
  if (jsonReport.summary.estimatedScore >= 90) {
    md += `✅ **EXCELLENT** (${jsonReport.summary.estimatedScore}%) - Prêt pour production\n\n`;
  } else if (jsonReport.summary.estimatedScore >= 80) {
    md += `🟢 **TRÈS BON** (${jsonReport.summary.estimatedScore}%) - Quelques ajustements mineurs\n\n`;
  } else if (jsonReport.summary.estimatedScore >= 70) {
    md += `🟡 **BON** (${jsonReport.summary.estimatedScore}%) - Améliorations nécessaires\n\n`;
  } else {
    md += `🔴 **INSUFFISANT** (${jsonReport.summary.estimatedScore}%) - Révision requise\n\n`;
  }
  
  md += `## 🔍 Analyse des Erreurs\n\n`;
  md += `- **Dates passées:** ${jsonReport.errors.pastDates}\n`;
  md += `- **Erreurs de parsing:** ${jsonReport.errors.parseErrors}\n`;
  md += `- **Total erreurs:** ${jsonReport.errors.total}\n\n`;
  
  md += `## 🌐 Problèmes de Traduction\n\n`;
  md += `### Patterns détectés:\n\n`;
  Object.entries(jsonReport.translations.patterns).forEach(([pattern, count]) => {
    if (count > 0) {
      md += `- **${pattern}**: ${count} occurrence(s)\n`;
    }
  });
  
  md += `\n## 📈 Recommandations\n\n`;
  jsonReport.recommendations.forEach(rec => {
    md += `### ${rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'} ${rec.issue}\n\n`;
    md += `${rec.action}\n\n`;
  });
  
  return md;
}

