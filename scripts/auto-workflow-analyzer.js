#!/usr/bin/env node
/**
 * Auto Workflow Analyzer - Analyse automatique des échecs GitHub Actions
 *
 * Fonctionnalités :
 * - Analyse automatique des nouveaux échecs workflow
 * - Diagnostic IA des causes racines
 * - Suggestions de solutions personnalisées
 * - Rapport intégré au monitoring existant
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔥 NOUVEAU: Import du service prédictif Gemini
import { geminiPredictor, analyzeCommitRisk, analyzeFailureTrends, generateProactiveRecommendations } from './gemini-predictive-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REPORT_DIR = path.join(process.cwd(), 'Docs', 'monitoring');
const KNOWLEDGE_FILE = path.join(process.cwd(), 'data', 'workflow-knowledge.json');

/**
 * Charge la base de connaissances des erreurs connues
 */
function loadKnowledgeBase() {
  try {
    if (fs.existsSync(KNOWLEDGE_FILE)) {
      const data = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('⚠️ Impossible de charger la base de connaissances:', error.message);
  }

  // Base de connaissances par défaut
  return {
    error_patterns: {
      "Cannot find package '@playwright/test'": {
        solution: "Utiliser `npm install` au lieu de `npm ci` dans les workflows",
        priority: "high",
        category: "dependencies"
      },
      "Cannot read properties of undefined": {
        solution: "Ajouter vérification null/undefined avant accès aux propriétés",
        priority: "medium",
        category: "runtime"
      },
      "Module not found": {
        solution: "Vérifier les imports et l'existence des fichiers",
        priority: "high",
        category: "build"
      },
      "Timeout": {
        solution: "Augmenter le timeout ou optimiser les opérations asynchrones",
        priority: "medium",
        category: "performance"
      },
      "Supabase": {
        solution: "Vérifier la configuration Supabase et les variables d'environnement",
        priority: "high",
        category: "database"
      }
    },
    workflow_patterns: {
      "production-smoke": {
        critical: true,
        description: "Tests de production - bloque le déploiement"
      },
      "tests-e2e": {
        critical: true,
        description: "Tests end-to-end - qualité utilisateur"
      },
      "tests-unit": {
        critical: false,
        description: "Tests unitaires - logique métier"
      }
    }
  };
}

/**
 * Analyse un échec individuel et génère un diagnostic
 */
function analyzeFailure(failure, knowledgeBase) {
  const analysis = {
    summary: '',
    rootCause: '',
    solutions: [],
    priority: 'medium',
    category: 'unknown'
  };

  // Déterminer la catégorie du workflow
  const workflowName = failure.name.toLowerCase();
  const workflowInfo = knowledgeBase.workflow_patterns[workflowName] ||
                      Object.values(knowledgeBase.workflow_patterns).find(w =>
                        workflowName.includes(Object.keys(knowledgeBase.workflow_patterns).find(k => k === workflowName.split('-')[0]) || ''));

  if (workflowInfo?.critical) {
    analysis.priority = 'high';
  }

  // Analyser les erreurs dans les logs
  const errorText = failure.error || '';
  const logsText = failure.logs || '';

  // Chercher des patterns d'erreur connus
  for (const [pattern, info] of Object.entries(knowledgeBase.error_patterns)) {
    if (errorText.includes(pattern) || logsText.includes(pattern)) {
      analysis.rootCause = `Erreur reconnue : ${pattern}`;
      analysis.solutions.push(info.solution);
      analysis.priority = info.priority;
      analysis.category = info.category;
      break;
    }
  }

  // Si aucun pattern reconnu, analyse générique
  if (!analysis.rootCause) {
    analysis.rootCause = 'Erreur non cataloguée - nécessite analyse manuelle';

    // Suggestions génériques selon le type d'erreur
    if (errorText.includes('npm') || errorText.includes('package')) {
      analysis.solutions.push('Vérifier la configuration npm et les dépendances');
      analysis.category = 'dependencies';
    } else if (errorText.includes('test') || errorText.includes('spec')) {
      analysis.solutions.push('Vérifier les tests et leur configuration');
      analysis.category = 'testing';
    } else if (errorText.includes('build') || errorText.includes('TypeScript')) {
      analysis.solutions.push('Vérifier la compilation et les types TypeScript');
      analysis.category = 'build';
    } else {
      analysis.solutions.push('Consulter les logs détaillés du workflow');
      analysis.category = 'unknown';
    }
  }

  // Résumé
  analysis.summary = `Échec ${failure.name} - ${analysis.category} (${analysis.priority})`;

  return analysis;
}

/**
 * Génère une analyse prédictive avec Gemini
 */
async function generatePredictiveAnalysis(failures, context = {}) {
  if (!geminiPredictor.isAvailable) {
    return `## 🔮 Analyse Prédictive (Indisponible)

⚠️ **Service Gemini non configuré**
- Définir la variable \`GEMINI_API_KEY\` pour activer l'analyse prédictive
- L'analyse de risque et les recommandations proactives seront disponibles

`;
  }

  try {
    let predictiveReport = `## 🔮 Analyse Prédictive avec Gemini AI

*Généré par Google Gemini ${geminiPredictor.model || '1.5-flash'} - ${new Date().toISOString()}*

`;

    // Analyse des tendances d'échec
    const failureHistory = context.failureHistory || failures.map(f => ({
      timestamp: new Date().toISOString(),
      workflow: f.name,
      error: f.error
    }));

    const trendAnalysis = await analyzeFailureTrends(failureHistory);
    if (trendAnalysis.available && !trendAnalysis.error) {
      predictiveReport += `### 📈 Tendances d'Échec

**Score de risque global :** ${trendAnalysis.riskScore}/100

**Tendances identifiées :**
${trendAnalysis.trends.map(trend => `- ${trend}`).join('\n')}

**Risques émergents :**
${trendAnalysis.emergingRisks.map(risk => `- ⚠️ ${risk}`).join('\n')}

**Prévisions :**
${trendAnalysis.predictions.map(pred => `- 🔮 ${pred}`).join('\n')}

**Actions préventives recommandées :**
${trendAnalysis.preventiveActions.map(action => `- 🛡️ ${action}`).join('\n')}

`;
    }

    // Analyse de risque pour le commit actuel (si contexte disponible)
    if (context.commitData) {
      const riskAnalysis = await analyzeCommitRisk(context.commitData, failures);
      if (riskAnalysis.available && !riskAnalysis.error) {
        predictiveReport += `### 🎯 Analyse de Risque du Commit Actuel

**Niveau de risque :** ${getRiskBadge(riskAnalysis.riskLevel)}
**Confiance de l'analyse :** ${riskAnalysis.confidence}%

**Raisons du risque :**
${riskAnalysis.reasons.map(reason => `- ${reason}`).join('\n')}

**Workflows à risque élevé :**
${riskAnalysis.riskyWorkflows.map(wf => `- 🚨 ${wf}`).join('\n')}

**Recommandations immédiates :**
${riskAnalysis.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}

**Actions préventives :**
${riskAnalysis.preventiveActions.map(action => `- 🛡️ ${action}`).join('\n')}

${riskAnalysis.estimatedTimeToFailure !== 'unknown'
  ? `**Temps estimé avant échec :** ${riskAnalysis.estimatedTimeToFailure}`
  : '**Temps estimé :** Non déterminable'
}

`;
      }
    }

    // Recommandations proactives
    const proactiveRecs = await generateProactiveRecommendations({
      lastSuccess: context.lastSuccess || 'unknown',
      failureRate: context.failureRate || 'unknown',
      criticalWorkflows: context.criticalWorkflows || ['production-smoke', 'tests-e2e'],
      technologies: context.technologies || ['React', 'TypeScript', 'Playwright', 'Supabase']
    });

    if (proactiveRecs.available && !proactiveRecs.error) {
      predictiveReport += `### 🚀 Recommandations Proactives

**Actions rapides (impact immédiat) :**
${proactiveRecs.quickWins.map(win => `- ⚡ ${win}`).join('\n')}

**Améliorations à long terme :**
${proactiveRecs.longTerm.map(lt => `- 🏗️ ${lt}`).join('\n')}

**Recommandations détaillées :**

`;

      proactiveRecs.recommendations.forEach((rec, index) => {
        predictiveReport += `${index + 1}. **${rec.title}**\n`;
        predictiveReport += `   - **${rec.description}**\n`;
        predictiveReport += `   - **Priorité :** ${getPriorityBadge(rec.priority)} | **Impact :** ${getImpactBadge(rec.impact)} | **Effort :** ${getEffortBadge(rec.effort)}\n`;
        predictiveReport += `   - **Catégorie :** ${rec.category}\n\n`;
      });
    }

    predictiveReport += `\n---\n\n`;

    return predictiveReport;
  } catch (error) {
    console.error('❌ Erreur génération analyse prédictive:', error.message);
    return `## 🔮 Analyse Prédictive (Erreur)

❌ **Erreur lors de l'analyse prédictive**
- Message: ${error.message}
- Service: Google Gemini AI

*L'analyse classique reste disponible ci-dessus*

`;
  }
}

/**
 * Fonctions utilitaires pour les badges
 */
function getRiskBadge(level) {
  const badges = {
    low: '🟢 FAIBLE',
    medium: '🟡 MOYEN',
    high: '🔴 ÉLEVÉ',
    critical: '🚨 CRITIQUE',
    unknown: '❓ INCONNU'
  };
  return badges[level] || badges.unknown;
}

function getPriorityBadge(priority) {
  const badges = {
    high: '🔴 Haute',
    medium: '🟡 Moyenne',
    low: '🟢 Basse'
  };
  return badges[priority] || '❓ Inconnue';
}

function getImpactBadge(impact) {
  const badges = {
    high: '💪 Élevé',
    medium: '🤝 Moyen',
    low: '👆 Faible'
  };
  return badges[impact] || '❓ Inconnu';
}

function getEffortBadge(effort) {
  const badges = {
    low: '🚀 Faible',
    medium: '⚖️ Moyen',
    high: '⏳ Élevé'
  };
  return badges[effort] || '❓ Inconnu';
}

/**
 * Analyse tous les nouveaux échecs et génère un rapport IA
 */
export async function analyzeWorkflowFailures(failures, context = {}) {
  if (!failures || failures.length === 0) {
    return '✅ Aucun nouvel échec détecté - tout fonctionne correctement !';
  }

  const knowledgeBase = loadKnowledgeBase();
  const analyses = failures.map(failure => analyzeFailure(failure, knowledgeBase));

  // 🔥 NOUVEAU: Analyse prédictive avec Gemini
  console.log('🔮 Génération de l\'analyse prédictive avec Gemini...');
  const predictiveAnalysis = await generatePredictiveAnalysis(failures, context);

  // Statistiques globales
  const criticalCount = analyses.filter(a => a.priority === 'high').length;
  const categories = {};
  analyses.forEach(a => {
    categories[a.category] = (categories[a.category] || 0) + 1;
  });

  // Générer le rapport
  let report = '';

  // En-tête avec statistiques
  report += `## 📊 Analyse des ${failures.length} échec(s) détecté(s)\n\n`;
  report += `**Statistiques :**\n`;
  report += `- 🔴 Critiques : ${criticalCount}\n`;
  report += `- 📂 Catégories : ${Object.entries(categories).map(([cat, count]) => `${cat} (${count})`).join(', ')}\n\n`;

  // Analyse détaillée de chaque échec
  failures.forEach((failure, index) => {
    const analysis = analyses[index];

    report += `### 🚨 ${index + 1}. ${failure.name}\n\n`;
    report += `**Résumé :** ${analysis.summary}\n\n`;
    report += `**Cause identifiée :** ${analysis.rootCause}\n\n`;

    if (analysis.solutions.length > 0) {
      report += `**Solutions suggérées :**\n`;
      analysis.solutions.forEach((solution, i) => {
        report += `${i + 1}. ${solution}\n`;
      });
      report += '\n';
    }

    // Actions selon priorité
    if (analysis.priority === 'high') {
      report += `**⚠️ Action requise :** Résoudre immédiatement - bloque le déploiement\n\n`;
    } else {
      report += `**ℹ️ Action recommandée :** Résoudre prochainement\n\n`;
    }

    report += `---\n\n`;
  });

  // Recommandations générales
  if (criticalCount > 0) {
    report += `## 🚨 Actions prioritaires\n\n`;
    report += `**${criticalCount} échec(s) critique(s) détecté(s) :**\n\n`;

    const criticalFailures = failures.filter((_, i) => analyses[i].priority === 'high');
    criticalFailures.forEach((failure, i) => {
      const analysis = analyses[failures.indexOf(failure)];
      report += `${i + 1}. **${failure.name}** - ${analysis.solutions[0]}\n`;
    });

    report += `\n**Impact :** Ces échecs bloquent potentiellement le déploiement en production.\n\n`;
  }

  // Suggestions d'amélioration
  report += `## 💡 Améliorations suggérées\n\n`;

  if (categories.dependencies > 0) {
    report += `- **Dépendances :** Auditer la gestion npm/package.json\n`;
  }

  if (categories.testing > 0) {
    report += `- **Tests :** Renforcer la stabilité des tests automatisés\n`;
  }

  if (categories.build > 0) {
    report += `- **Build :** Optimiser la compilation et les vérifications\n`;
  }

  report += `- **Monitoring :** Ajouter des métriques de performance\n\n`;

  // 🔥 NOUVEAU: Section analyse prédictive
  if (predictiveAnalysis) {
    report += predictiveAnalysis;
  }

  report += `---\n\n`;
  report += `*Rapport généré automatiquement par l'analyseur IA - ${new Date().toISOString()}*`;

  return report;
}

// Fonction principale pour usage en ligne de commande
if (import.meta.url === `file://${process.argv[1]}`) {
  // Mode CLI - pour test manuel
  console.log('🤖 Auto Workflow Analyzer - Mode test\n');

  // Simuler des échecs pour test
  const mockFailures = [
    {
      id: 'test-1',
      name: 'production-smoke',
      conclusion: 'failure',
      error: "Cannot find package '@playwright/test'"
    },
    {
      id: 'test-2',
      name: 'tests-unit',
      conclusion: 'failure',
      error: 'Cannot read properties of undefined (reading \'id\')'
    }
  ];

  const analysis = analyzeWorkflowFailures(mockFailures);
  console.log(analysis);
}
