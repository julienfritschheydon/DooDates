#!/usr/bin/env node
/**
 * Script pour monitorer les échecs de workflows GitHub Actions
 * Génère un rapport consultable par l'IA dans le dépôt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REPORT_DIR = path.join(process.cwd(), 'Docs', 'monitoring');
const REPORT_FILE = path.join(REPORT_DIR, 'workflow-failures-report.md');
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
      `${GITHUB_API_BASE}/repos/${REPO}/actions/runs/${runId}/jobs`,
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

