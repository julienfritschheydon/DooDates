#!/usr/bin/env node
/**
 * Script pour générer un résumé des tests de régression nocturne
 * Extrait les erreurs des rapports Playwright et les publie dans GitHub Actions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECTS = ['chromium', 'firefox', 'webkit', 'Mobile Chrome', 'Mobile Safari'];
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts');
const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results');

/**
 * Parse les résultats JSON de Playwright
 * Playwright génère test-results.json à la racine ou dans test-results/
 */
function parsePlaywrightResults(projectName) {
  // Chercher test-results.json à la racine du dossier téléchargé
  const rootJsonFile = path.join(TEST_RESULTS_DIR, 'test-results.json');
  if (fs.existsSync(rootJsonFile)) {
    try {
      const content = fs.readFileSync(rootJsonFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${rootJsonFile}:`, error.message);
    }
  }

  // Chercher dans un sous-dossier spécifique au projet
  const resultsDir = path.join(TEST_RESULTS_DIR, projectName);
  if (fs.existsSync(resultsDir)) {
    const resultsFile = path.join(resultsDir, 'results.json');
    if (fs.existsSync(resultsFile)) {
      try {
        const content = fs.readFileSync(resultsFile, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error(`Erreur lors de la lecture des résultats pour ${projectName}:`, error.message);
      }
    }
  }

  // Chercher test-results.json dans le dossier du projet
  const projectJsonFile = path.join(TEST_RESULTS_DIR, projectName, 'test-results.json');
  if (fs.existsSync(projectJsonFile)) {
    try {
      const content = fs.readFileSync(projectJsonFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${projectJsonFile}:`, error.message);
    }
  }

  return null;
}

/**
 * Parse les résultats depuis les artefacts téléchargés
 */
function parseArtifactResults(projectName) {
  // Chercher dans test-results-{project} (artefact téléchargé)
  const testResultsArtifactDir = path.join(TEST_RESULTS_DIR, `test-results-${projectName}`);
  if (fs.existsSync(testResultsArtifactDir)) {
    // Chercher test-results.json à la racine
    const rootJson = path.join(testResultsArtifactDir, 'test-results.json');
    if (fs.existsSync(rootJson)) {
      try {
        const content = fs.readFileSync(rootJson, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error(`Erreur lors de la lecture de ${rootJson}:`, error.message);
      }
    }
  }

  // Chercher dans playwright-report (rapport HTML contient aussi les données)
  const artifactDir = path.join(ARTIFACTS_DIR, `playwright-report-nightly-${projectName}`);
  if (!fs.existsSync(artifactDir)) {
    return null;
  }

  // Chercher les fichiers JSON dans les sous-dossiers
  const findJsonFiles = (dir) => {
    const files = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findJsonFiles(fullPath));
        } else if (entry.name === 'test-results.json' || entry.name === 'results.json' || entry.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorer les erreurs de lecture
    }
    return files;
  };

  const jsonFiles = findJsonFiles(artifactDir);
  if (jsonFiles.length === 0) {
    return null;
  }

  // Essayer de parser le premier fichier JSON trouvé
  try {
    const content = fs.readFileSync(jsonFiles[0], 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Extrait les informations d'erreur d'un test
 */
function extractTestErrors(test) {
  const errors = [];
  
  if (test.status === 'failed' || test.status === 'timedOut') {
    const error = {
      title: test.title || 'Test sans titre',
      file: test.location?.file || 'Fichier inconnu',
      line: test.location?.line || 0,
      status: test.status,
      duration: test.duration || 0,
      error: null,
      attachments: []
    };

    // Extraire le message d'erreur
    if (test.results && test.results.length > 0) {
      for (const result of test.results) {
        if (result.status === 'failed' || result.status === 'timedOut') {
          if (result.error) {
            error.error = {
              message: result.error.message || 'Erreur inconnue',
              stack: result.error.stack || ''
            };
          }
        }
        
        // Extraire les attachments (screenshots, traces)
        if (result.attachments) {
          for (const attachment of result.attachments) {
            if (attachment.name && attachment.path) {
              error.attachments.push({
                name: attachment.name,
                path: attachment.path,
                contentType: attachment.contentType
              });
            }
          }
        }
      }
    }

    // Erreur directe du test
    if (test.errors && test.errors.length > 0) {
      error.error = {
        message: test.errors[0].message || 'Erreur inconnue',
        stack: test.errors[0].stack || ''
      };
    }

    if (error.error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Parse récursivement tous les tests
 */
function parseAllTests(suites) {
  const allErrors = [];
  
  if (!suites || !Array.isArray(suites)) {
    return allErrors;
  }

  for (const suite of suites) {
    // Tests directs
    if (suite.tests && Array.isArray(suite.tests)) {
      for (const test of suite.tests) {
        allErrors.push(...extractTestErrors(test));
      }
    }

    // Suites imbriquées
    if (suite.suites && Array.isArray(suite.suites)) {
      allErrors.push(...parseAllTests(suite.suites));
    }
  }

  return allErrors;
}

/**
 * Génère le résumé Markdown
 */
function generateMarkdownSummary(summaries) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('fr-FR', { timeZone: 'UTC' });
  
  let md = `# 📊 Résumé des Tests de Régression Nocturne\n\n`;
  md += `**Date:** ${date} ${time} UTC\n\n`;
  md += `---\n\n`;

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const summary of summaries) {
    if (!summary) continue;
    
    totalPassed += summary.passed || 0;
    totalFailed += summary.failed || 0;
    totalSkipped += summary.skipped || 0;
    totalErrors += summary.errors.length;
  }

  // Vue d'ensemble
  md += `## 📈 Vue d'Ensemble\n\n`;
  md += `| Métrique | Valeur |\n`;
  md += `|----------|--------|\n`;
  md += `| ✅ Tests réussis | ${totalPassed} |\n`;
  md += `| ❌ Tests échoués | ${totalFailed} |\n`;
  md += `| ⏭️ Tests ignorés | ${totalSkipped} |\n`;
  md += `| 🔴 Erreurs totales | ${totalErrors} |\n`;
  md += `| 📦 Navigateurs testés | ${summaries.filter(s => s).length}/${PROJECTS.length} |\n\n`;

  // Résultats par navigateur
  md += `## 🌐 Résultats par Navigateur\n\n`;
  for (const summary of summaries) {
    if (!summary) continue;
    
    let status = '⚠️';
    if (summary.noResults) {
      status = '❌';
    } else if (summary.failed > 0) {
      status = '❌';
    } else if (summary.passed > 0) {
      status = '✅';
    }
    
    md += `### ${status} ${summary.project}\n\n`;
    
    if (summary.noResults) {
      md += `⚠️ **Aucun résultat de test trouvé pour ce navigateur**\n\n`;
      md += `Les tests ont peut-être échoué avant de générer un rapport, ou les fichiers de résultats n'ont pas été trouvés.\n\n`;
    } else {
      md += `- ✅ Réussis: ${summary.passed || 0}\n`;
      md += `- ❌ Échoués: ${summary.failed || 0}\n`;
      md += `- ⏭️ Ignorés: ${summary.skipped || 0}\n`;
      md += `- ⏱️ Durée: ${summary.duration ? (summary.duration / 1000).toFixed(1) + 's' : 'N/A'}\n\n`;
      
      if (summary.errors.length > 0) {
        md += `**Erreurs détectées:** ${summary.errors.length}\n\n`;
      }
    }
  }

  // Détails des erreurs
  if (totalErrors > 0) {
    md += `## 🔴 Détails des Erreurs\n\n`;
    
    for (const summary of summaries) {
      if (!summary || summary.errors.length === 0) continue;
      
      md += `### ${summary.project}\n\n`;
      
      for (let i = 0; i < summary.errors.length; i++) {
        const error = summary.errors[i];
        md += `#### ${i + 1}. ${error.title}\n\n`;
        md += `- **Fichier:** \`${error.file}\`\n`;
        if (error.line > 0) {
          md += `- **Ligne:** ${error.line}\n`;
        }
        md += `- **Status:** ${error.status}\n`;
        if (error.duration > 0) {
          md += `- **Durée:** ${(error.duration / 1000).toFixed(1)}s\n`;
        }
        md += `\n`;
        
        if (error.error) {
          md += `**Message d'erreur:**\n`;
          md += `\`\`\`\n`;
          md += `${error.error.message}\n`;
          md += `\`\`\`\n\n`;
          
          if (error.error.stack && error.error.stack.length > 0) {
            // Limiter la stack trace à 20 lignes
            const stackLines = error.error.stack.split('\n').slice(0, 20);
            md += `<details>\n<summary>Stack trace (${stackLines.length} lignes)</summary>\n\n`;
            md += `\`\`\`\n`;
            md += stackLines.join('\n');
            md += `\n\`\`\`\n\n`;
            md += `</details>\n\n`;
          }
        }
        
        if (error.attachments && error.attachments.length > 0) {
          md += `**Attachments disponibles:**\n`;
          for (const attachment of error.attachments) {
            md += `- ${attachment.name} (${attachment.contentType})\n`;
          }
          md += `\n`;
        }
        
        md += `---\n\n`;
      }
    }
  } else {
    md += `## ✅ Aucune Erreur Détectée\n\n`;
    md += `Tous les tests de régression sont passés avec succès ! 🎉\n\n`;
  }

  // Lien vers les rapports
  md += `## 📋 Rapports Détaillés\n\n`;
  md += `Les rapports HTML complets sont disponibles dans les artefacts GitHub Actions:\n\n`;
  for (const summary of summaries) {
    if (!summary) continue;
    md += `- \`playwright-report-nightly-${summary.project}\`\n`;
  }

  return md;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Analyse des résultats de régression...\n');

  const summaries = [];

  for (const project of PROJECTS) {
    console.log(`📦 Analyse de ${project}...`);
    
    let results = parsePlaywrightResults(project);
    if (!results) {
      results = parseArtifactResults(project);
    }

    if (!results) {
      console.log(`  ⚠️ Aucun résultat trouvé pour ${project}`);
      // Si aucun résultat n'est trouvé, créer un résumé vide pour indiquer le problème
      summaries.push({
        project,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        errors: [],
        noResults: true
      });
      continue;
    }

    const summary = {
      project,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: []
    };

    // Compter les résultats
    if (results.stats) {
      summary.passed = results.stats.expected || 0;
      summary.failed = results.stats.unexpected || 0;
      summary.skipped = results.stats.skipped || 0;
      summary.duration = results.stats.duration || 0;
    }

    // Extraire les erreurs
    if (results.suites) {
      summary.errors = parseAllTests(results.suites);
    }

    summaries.push(summary);
    console.log(`  ✅ ${summary.passed} réussis, ${summary.failed} échoués, ${summary.errors.length} erreurs`);
  }

  // Générer le résumé Markdown
  const markdown = generateMarkdownSummary(summaries);
  
  // Sauvegarder le résumé
  const summaryPath = path.join(process.cwd(), 'regression-summary.md');
  fs.writeFileSync(summaryPath, markdown, 'utf-8');
  console.log(`\n✅ Résumé généré: ${summaryPath}`);

  // Afficher le résumé dans la console
  console.log('\n' + '='.repeat(80));
  console.log(markdown);
  console.log('='.repeat(80));

  // Dans GitHub Actions, écrire dans GITHUB_STEP_SUMMARY pour l'afficher dans le workflow
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
    console.log('\n✅ Résumé ajouté à GitHub Actions Step Summary');
  }

  // Écrire aussi dans un fichier pour utilisation ultérieure
  if (process.env.GITHUB_OUTPUT) {
    const escapedMarkdown = markdown.replace(/\n/g, '%0A').replace(/\r/g, '');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `regression-summary<<EOF\n${markdown}\nEOF\n`);
    console.log('✅ Résumé ajouté à GitHub Actions Output');
  }

  // Code de sortie - échouer si des tests ont échoué ou si aucun résultat n'a été trouvé
  const hasFailures = summaries.some(s => s && (s.failed > 0 || s.noResults));
  const hasNoResults = summaries.every(s => !s || s.noResults);
  
  if (hasNoResults) {
    console.error('❌ Aucun résultat de test trouvé pour aucun navigateur');
    process.exit(1);
  }
  
  if (hasFailures) {
    console.error('❌ Des tests ont échoué ou des résultats sont manquants');
    process.exit(1);
  }
  
  console.log('✅ Tous les tests sont passés avec succès');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

