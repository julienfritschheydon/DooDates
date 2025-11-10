#!/usr/bin/env node
/**
 * Script pour monitorer les échecs de workflows GitHub Actions
 * Génère un rapport consultable par l'IA dans le dépôt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env.local si disponible
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REPORT_DIR = path.join(process.cwd(), 'Docs', 'monitoring');
const REPORT_FILE = path.join(REPORT_DIR, 'workflow-failures-report.md');
const ARTIFACTS_DIR = path.join(process.cwd(), 'temp-artifacts');
const GITHUB_API_BASE = process.env.GITHUB_API_URL || 'https://api.github.com';
const REPO = process.env.GITHUB_REPOSITORY || 'owner/repo';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Workflows à monitorer
const WORKFLOWS_TO_MONITOR = [
  '1️⃣ PR Complete Validation',
  '2️⃣ Develop → Main (Auto-merge)',
  '3️⃣ Main Post-Merge E2E',
  '4️⃣ Main Deploy Pages',
  '6️⃣ Nightly Full Regression',
  '7️⃣ Monthly Gemini',
];

/**
 * Récupère les workflows du dépôt
 */
async function getWorkflows() {
  if (!GITHUB_TOKEN) {
    console.warn('⚠️ GITHUB_TOKEN non défini, utilisation de données mockées');
    return getMockWorkflows();
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO}/actions/workflows`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.workflows || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des workflows:', error.message);
    return getMockWorkflows();
  }
}

/**
 * Récupère les runs récents d'un workflow
 */
async function getWorkflowRuns(workflowId, limit = 10) {
  if (!GITHUB_TOKEN) {
    return getMockRuns();
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/actions/workflows/${workflowId}/runs?per_page=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.workflow_runs || [];
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des runs pour workflow ${workflowId}:`, error.message);
    return getMockRuns();
  }
}

/**
 * Récupère les jobs d'un run
 */
async function getRunJobs(runId) {
  if (!GITHUB_TOKEN) {
    return getMockJobs();
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/actions/runs/${runId}/jobs?per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des jobs pour run ${runId}:`, error.message);
    return getMockJobs();
  }
}

/**
 * Récupère les logs d'un job
 */
async function getJobLogs(jobId) {
  if (!GITHUB_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/actions/jobs/${jobId}/logs`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des logs pour job ${jobId}:`, error.message);
    return null;
  }
}

/**
 * Analyse les artefacts de test téléchargés pour extraire les échecs détaillés
 */
function analyzeTestArtifacts(runId) {
  const runDir = path.join(ARTIFACTS_DIR, runId.toString());
  if (!fs.existsSync(runDir)) {
    return null;
  }

  const failures = [];
  
  // Chercher les fichiers test-results.json dans les artefacts
  const findJsonFiles = (dir) => {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...findJsonFiles(fullPath));
      } else if (item.name === 'test-results.json') {
        files.push(fullPath);
      }
    }
    return files;
  };

  const jsonFiles = findJsonFiles(runDir);
  
  for (const jsonFile of jsonFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      
      // Analyser les résultats Playwright
      if (content.suites) {
        for (const suite of content.suites) {
          for (const spec of suite.specs || []) {
            for (const test of spec.tests || []) {
              for (const result of test.results || []) {
                if (result.status === 'failed' || result.status === 'timedOut') {
                  failures.push({
                    file: spec.file,
                    title: spec.title,
                    error: result.error?.message || 'Unknown error',
                    browser: suite.title,
                  });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`⚠️ Erreur lors de l'analyse de ${jsonFile}:`, err.message);
    }
  }

  return failures.length > 0 ? failures : null;
}

/**
 * Extrait les erreurs principales des logs avec numéros de lignes et détails
 */
function extractErrorsFromLogs(logs) {
  if (!logs) return [];
  
  const errors = [];
  const lines = logs.split('\n');
  
  // Patterns pour détecter les erreurs de tests Vitest
  const vitestFailurePattern = /FAIL\s+(.+\.test\.(?:ts|tsx|js|jsx))\s+\((\d+)\s+test.*?\)/i;
  const vitestTestPattern = /×\s+(.+?)\s+\((\d+)\s+ms\)/;
  const vitestAssertPattern = /AssertionError|Expected.*but got|Expected.*received/i;
  const vitestSummaryPattern = /Test Files\s+(\d+)\s+failed/i;
  const vitestTestCountPattern = /Tests\s+(\d+)\s+failed/i;
  
  // Patterns pour détecter les erreurs Playwright
  const playwrightErrorPattern = /Error:\s+.*expect\(.*\)\.(toContainText|toBeVisible|toBeEnabled|toHaveText)/i;
  const playwrightTimeoutPattern = /Timeout.*ms|element\(s\) not found/i;
  const playwrightLocatorPattern = /Locator:\s+(.+)/i;
  const playwrightExpectedPattern = /Expected.*:\s*(.+)/i;
  
  // Patterns généraux
  const errorPattern = /(Error|AssertionError|TypeError|ReferenceError|SyntaxError|Test failed)/i;
  const fileLinePattern = /at\s+(.+?):(\d+):(\d+)/;
  const fileLinePattern2 = /(.+\.(?:ts|tsx|js|jsx|spec\.ts)):(\d+):(\d+)/;
  
  let currentError = null;
  let errorContext = [];
  let inErrorBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Détecter un échec de test Vitest
    const vitestMatch = line.match(vitestFailurePattern);
    if (vitestMatch) {
      if (currentError) {
        errors.push({
          type: 'test_failure',
          file: currentError.file,
          testName: currentError.testName,
          message: currentError.message,
          context: errorContext.join('\n'),
          line: currentError.line,
        });
      }
      currentError = {
        file: vitestMatch[1],
        testName: null,
        message: null,
        line: lineNum,
      };
      errorContext = [line];
      inErrorBlock = true;
      continue;
    }
    
    // Détecter une erreur Playwright
    if (playwrightErrorPattern.test(line) || playwrightTimeoutPattern.test(line)) {
      if (!currentError) {
        currentError = {
          file: null,
          testName: null,
          message: line.trim(),
          line: lineNum,
        };
        inErrorBlock = true;
      }
      errorContext.push(line);
      
      // Chercher le locator et l'expected
      const locatorMatch = line.match(playwrightLocatorPattern);
      if (locatorMatch && currentError) {
        currentError.message = `${currentError.message}\nLocator: ${locatorMatch[1]}`;
      }
      const expectedMatch = line.match(playwrightExpectedPattern);
      if (expectedMatch && currentError) {
        currentError.message = `${currentError.message}\nExpected: ${expectedMatch[1]}`;
      }
      continue;
    }
    
    // Détecter le nom du test qui échoue (Vitest)
    const vitestTestMatch = line.match(vitestTestPattern);
    if (vitestTestMatch && currentError) {
      currentError.testName = vitestTestMatch[1].trim();
      errorContext.push(line);
      continue;
    }
    
    // Détecter un fichier de test dans la ligne (pour Playwright)
    const fileMatch2 = line.match(fileLinePattern2);
    if (fileMatch2 && currentError && !currentError.file) {
      currentError.file = fileMatch2[1];
      currentError.line = fileMatch2[2];
      errorContext.push(line);
      continue;
    }
    
    // Détecter une erreur (Vitest assertion)
    if (vitestAssertPattern.test(line) || (errorPattern.test(line) && !playwrightErrorPattern.test(line))) {
      if (!currentError) {
        currentError = {
          file: null,
          testName: null,
          message: null,
          line: lineNum,
        };
        inErrorBlock = true;
      }
      if (!currentError.message) {
        currentError.message = line.trim();
      }
      errorContext.push(line);
      continue;
    }
    
    // Détecter un fichier et numéro de ligne dans la stack trace
    const fileMatch = line.match(fileLinePattern);
    if (fileMatch && currentError && !currentError.file) {
      currentError.file = fileMatch[1];
      currentError.line = fileMatch[2];
      errorContext.push(line);
      continue;
    }
    
    // Continuer à collecter le contexte de l'erreur
    if (inErrorBlock && currentError) {
      // Collecter jusqu'à 15 lignes de contexte
      if (errorContext.length < 15) {
        if (line.trim().startsWith('at ') || 
            line.trim().startsWith('  ') || 
            line.trim().startsWith('❌') ||
            line.trim().startsWith('×') ||
            line.trim() === '' ||
            /^\s+\^/.test(line) ||
            /Expected|Received|Assertion|Error/.test(line)) {
          errorContext.push(line);
        } else if (errorContext.length > 3) {
          // Fin du bloc d'erreur
          errors.push({
            type: currentError.testName ? 'test_failure' : 'error',
            file: currentError.file || 'unknown',
            testName: currentError.testName,
            message: currentError.message || errorContext[0] || 'Unknown error',
            context: errorContext.join('\n'),
            line: currentError.line,
          });
          currentError = null;
          errorContext = [];
          inErrorBlock = false;
        }
      } else {
        // Trop de lignes, sauvegarder et continuer
        errors.push({
          type: currentError.testName ? 'test_failure' : 'error',
          file: currentError.file || 'unknown',
          testName: currentError.testName,
          message: currentError.message || errorContext[0] || 'Unknown error',
          context: errorContext.join('\n'),
          line: currentError.line,
        });
        currentError = null;
        errorContext = [];
        inErrorBlock = false;
      }
    }
  }
  
  // Sauvegarder la dernière erreur
  if (currentError && errorContext.length > 0) {
    errors.push({
      type: currentError.testName ? 'test_failure' : 'error',
      file: currentError.file || 'unknown',
      testName: currentError.testName,
      message: currentError.message || errorContext[0] || 'Unknown error',
      context: errorContext.join('\n'),
      line: currentError.line,
    });
  }
  
  // Filtrer les erreurs : exclure les logs normaux (Storage error de fallback Supabase)
  const filteredErrors = errors.filter(err => {
    // Exclure les erreurs qui sont juste des logs de fallback Supabase
    if (err.message && err.message.includes('Erreur lors du chargement depuis Supabase, utilisation de localStorage')) {
      // Garder seulement si c'est un vrai échec de test (avec testName)
      return err.testName !== null;
    }
    // Garder toutes les autres erreurs
    return true;
  });
  
  // Formater les erreurs pour l'affichage
  return filteredErrors.slice(0, 10).map(err => {
    let formatted = '';
    if (err.testName) {
      formatted += `Test: ${err.testName}\n`;
    }
    if (err.file && err.file !== 'unknown') {
      // Nettoyer le chemin du fichier (enlever les codes ANSI et chemins absolus)
      let cleanFile = err.file.replace(/\x1b\[[0-9;]*m/g, ''); // Enlever codes ANSI
      cleanFile = cleanFile.replace(/.*\/(src|tests)\//, '$1/'); // Simplifier le chemin
      formatted += `File: ${cleanFile}`;
      if (err.line) {
        formatted += `:${err.line}`;
      }
      formatted += '\n';
    }
    // Nettoyer le message (enlever timestamps et codes ANSI)
    let cleanMessage = err.message.replace(/\d{4}-\d{2}-\d{2}T[\d:\.]+Z\s*/g, ''); // Timestamps
    cleanMessage = cleanMessage.replace(/\x1b\[[0-9;]*m/g, ''); // Codes ANSI
    cleanMessage = cleanMessage.replace(/\[22m|\[39m|\[90m|\[2m/g, ''); // Codes ANSI spécifiques
    formatted += `Error: ${cleanMessage.trim()}\n`;
    if (err.context) {
      // Nettoyer le contexte aussi
      let cleanContext = err.context.replace(/\d{4}-\d{2}-\d{2}T[\d:\.]+Z\s*/g, '');
      cleanContext = cleanContext.replace(/\x1b\[[0-9;]*m/g, '');
      cleanContext = cleanContext.replace(/\[22m|\[39m|\[90m|\[2m/g, '');
      formatted += `\n${cleanContext.substring(0, 800)}`;
      if (cleanContext.length > 800) {
        formatted += '\n... (truncated)';
      }
    }
    return formatted;
  });
}

/**
 * Génère le rapport markdown
 */
async function generateReport() {
  console.log('📊 Génération du rapport de monitoring des workflows...\n');

  const workflows = await getWorkflows();
  const reportSections = [];
  
  // En-tête du rapport
  const now = new Date();
  reportSections.push(`# 📊 Rapport de Monitoring des Workflows GitHub Actions\n\n`);
  reportSections.push(`**Dernière mise à jour:** ${now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n\n`);
  reportSections.push(`> Ce rapport est généré automatiquement pour suivre les échecs de workflows.\n`);
  reportSections.push(`> Il peut être consulté par l'IA pour comprendre l'état de santé du CI/CD.\n\n`);
  reportSections.push(`---\n\n`);

  // Analyser chaque workflow
  for (const workflowName of WORKFLOWS_TO_MONITOR) {
    const workflow = workflows.find(w => w.name === workflowName);
    
    if (!workflow) {
      console.log(`⚠️ Workflow "${workflowName}" non trouvé`);
      continue;
    }

    console.log(`📋 Analyse de "${workflowName}"...`);
    const runs = await getWorkflowRuns(workflow.id, 20);
    
    // Filtrer les échecs récents (dernières 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFailures = runs.filter(run => {
      const runDate = new Date(run.created_at);
      return runDate >= oneDayAgo && run.conclusion === 'failure';
    });

    // Filtrer les échecs des 7 derniers jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekFailures = runs.filter(run => {
      const runDate = new Date(run.created_at);
      return runDate >= sevenDaysAgo && run.conclusion === 'failure';
    });

    // Dernier run
    const lastRun = runs[0];
    const lastRunDate = lastRun ? new Date(lastRun.created_at) : null;
    const lastRunStatus = lastRun ? lastRun.conclusion : 'unknown';

    // Section du workflow
    reportSections.push(`## ${workflowName}\n\n`);
    
    // Statut global
    const statusEmoji = lastRunStatus === 'success' ? '✅' : 
                        lastRunStatus === 'failure' ? '❌' : 
                        lastRunStatus === 'cancelled' ? '⏸️' : '⏳';
    
    reportSections.push(`**Statut:** ${statusEmoji} ${lastRunStatus || 'unknown'}\n\n`);
    
    if (lastRunDate) {
      reportSections.push(`**Dernier run:** ${lastRunDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n\n`);
    }

    // Statistiques
    reportSections.push(`**Statistiques:**\n`);
    reportSections.push(`- ❌ Échecs (24h): **${recentFailures.length}**\n`);
    reportSections.push(`- ❌ Échecs (7 jours): **${weekFailures.length}**\n`);
    reportSections.push(`- 📊 Total runs analysés: **${runs.length}**\n\n`);

    // Détails des échecs récents
    if (recentFailures.length > 0) {
      reportSections.push(`### 🔴 Échecs récents (24h)\n\n`);
      
      for (const failure of recentFailures.slice(0, 5)) {
        const failureDate = new Date(failure.created_at);
        const jobs = await getRunJobs(failure.id);
        const failedJobs = jobs.filter(j => j.conclusion === 'failure');
        
        reportSections.push(`#### Run #${failure.run_number} - ${failureDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n\n`);
        reportSections.push(`- **Commit:** \`${failure.head_sha.substring(0, 7)}\`\n`);
        reportSections.push(`- **Auteur:** ${failure.actor?.login || 'unknown'}\n`);
        reportSections.push(`- **Branche:** \`${failure.head_branch}\`\n`);
        reportSections.push(`- **Lien:** [Voir les détails](${failure.html_url})\n`);
        
        if (failedJobs.length > 0) {
          reportSections.push(`- **Jobs en échec:**\n`);
          for (const job of failedJobs) {
            reportSections.push(`  - ❌ \`${job.name}\` (${job.conclusion})\n`);
            // Afficher les steps qui ont échoué
            if (job.steps && job.steps.length > 0) {
              const failedSteps = job.steps.filter(s => s.conclusion === 'failure');
              if (failedSteps.length > 0) {
                reportSections.push(`    - Steps en échec: ${failedSteps.map(s => `\`${s.name}\``).join(', ')}\n`);
              }
            }
            
            // Pour le dernier run seulement, analyser les artefacts ou les logs
            if (failure.id === recentFailures[0].id) {
              // D'abord essayer d'analyser les artefacts téléchargés
              const artifactFailures = analyzeTestArtifacts(failure.id);
              if (artifactFailures && artifactFailures.length > 0) {
                reportSections.push(`    - **Tests en échec (${artifactFailures.length}):**\n`);
                for (const testFailure of artifactFailures.slice(0, 10)) {
                  reportSections.push(`      - ❌ **[${testFailure.browser}]** \`${testFailure.file}\`\n`);
                  reportSections.push(`        - Test: ${testFailure.title}\n`);
                  reportSections.push(`        - Erreur: \`${testFailure.error.substring(0, 200)}${testFailure.error.length > 200 ? '...' : ''}\`\n`);
                }
                if (artifactFailures.length > 10) {
                  reportSections.push(`      *... et ${artifactFailures.length - 10} autre(s) test(s) en échec*\n`);
                }
              } else if (GITHUB_TOKEN) {
                // Fallback sur les logs si pas d'artefacts
                try {
                  console.log(`  📥 Récupération des logs pour job ${job.id}...`);
                  const logs = await getJobLogs(job.id);
                  if (logs) {
                    const errors = extractErrorsFromLogs(logs);
                    if (errors.length > 0) {
                      reportSections.push(`    - **Erreurs détectées (${errors.length}):**\n`);
                      for (const error of errors.slice(0, 5)) {
                        reportSections.push(`      \`\`\`\n${error}\n\`\`\`\n`);
                      }
                      if (errors.length > 5) {
                        reportSections.push(`      *... et ${errors.length - 5} autre(s) erreur(s)*\n`);
                      }
                    } else {
                      reportSections.push(`    - ⚠️ Aucune erreur structurée détectée\n`);
                    }
                  }
                } catch (err) {
                  reportSections.push(`    - ⚠️ Impossible de récupérer les détails: ${err.message}\n`);
                }
              }
            }
          }
        }
        
        reportSections.push(`\n`);
      }
    } else if (weekFailures.length > 0) {
      reportSections.push(`### ⚠️ Échecs récents (7 jours)\n\n`);
      reportSections.push(`Aucun échec dans les 24 dernières heures, mais **${weekFailures.length}** échec(s) cette semaine.\n\n`);
    } else {
      reportSections.push(`### ✅ Aucun échec récent\n\n`);
      reportSections.push(`Aucun échec détecté dans les 7 derniers jours.\n\n`);
    }

    reportSections.push(`---\n\n`);
  }

  // Résumé global
  reportSections.push(`## 📈 Résumé Global\n\n`);
  
  const allRuns = [];
  for (const workflow of workflows.filter(w => WORKFLOWS_TO_MONITOR.includes(w.name))) {
    const runs = await getWorkflowRuns(workflow.id, 10);
    allRuns.push(...runs);
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const totalFailures24h = allRuns.filter(run => {
    const runDate = new Date(run.created_at);
    return runDate >= oneDayAgo && run.conclusion === 'failure';
  }).length;

  const totalFailures7d = allRuns.filter(run => {
    const runDate = new Date(run.created_at);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return runDate >= sevenDaysAgo && run.conclusion === 'failure';
  }).length;

  reportSections.push(`- ❌ **Total échecs (24h):** ${totalFailures24h}\n`);
  reportSections.push(`- ❌ **Total échecs (7 jours):** ${totalFailures7d}\n`);
  reportSections.push(`- 📊 **Workflows monitorés:** ${WORKFLOWS_TO_MONITOR.length}\n\n`);

  // Recommandations
  if (totalFailures24h > 0) {
    reportSections.push(`### ⚠️ Recommandations\n\n`);
    reportSections.push(`Des échecs ont été détectés dans les 24 dernières heures. `);
    reportSections.push(`Consultez les sections ci-dessus pour plus de détails.\n\n`);
  } else {
    reportSections.push(`### ✅ État de santé\n\n`);
    reportSections.push(`Aucun échec détecté dans les 24 dernières heures. Le système CI/CD est en bonne santé.\n\n`);
  }

  // Écrire le rapport
  const reportContent = reportSections.join('');
  
  // Créer le dossier si nécessaire
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  fs.writeFileSync(REPORT_FILE, reportContent, 'utf-8');
  console.log(`\n✅ Rapport généré: ${REPORT_FILE}`);
  console.log(`📊 ${totalFailures24h} échec(s) détecté(s) dans les 24h`);

  // Générer un fichier JSON de statut rapide pour consultation facile
  const statusFile = path.join(REPORT_DIR, 'workflow-status.json');
  const statusData = {
    lastUpdate: now.toISOString(),
    totalFailures24h,
    totalFailures7d,
    workflowsMonitored: WORKFLOWS_TO_MONITOR.length,
    hasFailures: totalFailures24h > 0,
    reportPath: 'Docs/monitoring/workflow-failures-report.md',
  };
  fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2), 'utf-8');
  console.log(`📊 Statut rapide généré: ${statusFile}`);

  // Créer/mettre à jour une issue GitHub si échecs critiques
  if (totalFailures24h > 0 && GITHUB_TOKEN) {
    await createOrUpdateAlertIssue(totalFailures24h, totalFailures7d, reportContent);
  } else if (totalFailures24h === 0 && GITHUB_TOKEN) {
    // Fermer les issues d'alerte si tout est OK
    await closeAlertIssuesIfResolved();
  }
}

/**
 * Crée ou met à jour une issue d'alerte pour les échecs critiques
 */
async function createOrUpdateAlertIssue(failures24h, failures7d, reportContent) {
  if (!GITHUB_TOKEN) {
    console.log('⚠️ GITHUB_TOKEN non disponible, skip création issue');
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const issueTitle = `🚨 CI/CD Health Alert - ${failures24h} échec(s) dans les 24h`;

    // Chercher une issue existante ouverte avec le label 'ci-health'
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/issues?state=open&labels=ci-health,automated&per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    let issues = [];
    if (response.ok) {
      issues = await response.json();
    }

    const existingIssue = issues.find(issue => 
      issue.title.includes('CI/CD Health Alert') && 
      issue.state === 'open'
    );

    const issueBody = `## 🚨 Alerte Santé CI/CD

**Date:** ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}

### 📊 Résumé
- ❌ **Échecs (24h):** ${failures24h}
- ❌ **Échecs (7 jours):** ${failures7d}
- 📊 **Workflows monitorés:** ${WORKFLOWS_TO_MONITOR.length}

### 📋 Rapport Complet
Consultez le [rapport détaillé](https://github.com/${REPO}/blob/main/Docs/monitoring/workflow-failures-report.md) pour plus d'informations.

### 🤖 Pour l'IA
Lorsque cette issue est ouverte, l'IA doit automatiquement consulter le fichier \`Docs/monitoring/workflow-failures-report.md\` pour analyser les échecs et proposer des solutions.

---

*Cette issue est générée automatiquement par le workflow de monitoring. Elle sera fermée automatiquement quand il n'y aura plus d'échecs dans les 24h.*`;

    if (existingIssue) {
      // Mettre à jour l'issue existante
      await fetch(
        `${GITHUB_API_BASE}/repos/${REPO}/issues/${existingIssue.number}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: issueTitle,
            body: issueBody,
          }),
        }
      );

      // Ajouter un commentaire avec le nouveau statut
      await fetch(
        `${GITHUB_API_BASE}/repos/${REPO}/issues/${existingIssue.number}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: `🔄 **Mise à jour** - ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n\n${failures24h} échec(s) détecté(s) dans les 24 dernières heures.`,
          }),
        }
      );

      console.log(`✅ Issue #${existingIssue.number} mise à jour`);
    } else {
      // Créer une nouvelle issue
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${REPO}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: issueTitle,
            body: issueBody,
            labels: ['ci-health', 'automated', 'urgent'],
          }),
        }
      );

      if (response.ok) {
        const issue = await response.json();
        console.log(`✅ Issue #${issue.number} créée pour alerter sur les échecs`);
      } else {
        const error = await response.text();
        console.error(`❌ Erreur lors de la création de l'issue: ${response.status} ${error}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création/mise à jour de l\'issue:', error.message);
  }
}

/**
 * Ferme les issues d'alerte si tout est résolu
 */
async function closeAlertIssuesIfResolved() {
  if (!GITHUB_TOKEN) {
    return;
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO}/issues?state=open&labels=ci-health,automated&per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    let issues = [];
    if (response.ok) {
      issues = await response.json();
    }

    const alertIssues = issues.filter(issue => 
      issue.title.includes('CI/CD Health Alert')
    );

    for (const issue of alertIssues) {
      await fetch(
        `${GITHUB_API_BASE}/repos/${REPO}/issues/${issue.number}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: 'closed',
            state_reason: 'completed',
          }),
        }
      );

      // Ajouter un commentaire de résolution
      await fetch(
        `${GITHUB_API_BASE}/repos/${REPO}/issues/${issue.number}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: `✅ **Résolu** - ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n\nAucun échec détecté dans les 24 dernières heures. Le système CI/CD est de nouveau en bonne santé.`,
          }),
        }
      );

      console.log(`✅ Issue #${issue.number} fermée (problèmes résolus)`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture des issues:', error.message);
  }
}

// Fonctions mock pour les tests sans token
function getMockWorkflows() {
  return WORKFLOWS_TO_MONITOR.map((name, index) => ({
    id: index + 1,
    name,
    path: `.github/workflows/${index + 1}-workflow.yml`,
  }));
}

function getMockRuns() {
  return [];
}

function getMockJobs() {
  return [];
}

// Exécution
generateReport().catch(error => {
  console.error('❌ Erreur lors de la génération du rapport:', error);
  process.exit(1);
});

