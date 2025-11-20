#!/usr/bin/env node
/**
 * Service d'analyse prédictive utilisant Gemini AI
 * Intègre l'intelligence artificielle pour la prédiction des risques CI/CD
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis .env.local si disponible
async function loadEnvironment() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const dotenv = await import('dotenv');
    dotenv.config({ path: envLocalPath });
  }
}

// Configuration Gemini
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash'; // Modèle rapide pour les analyses temps réel

/**
 * Service d'analyse prédictive avec Gemini
 */
class GeminiPredictiveAnalyzer {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isAvailable = false;
    // L'initialisation sera faite de manière asynchrone via initialize()
  }

  /**
   * Initialise la connexion à Gemini de manière asynchrone
   */
  async initialize() {
    // Charger les variables d'environnement
    await loadEnvironment();

    // Re-vérifier la clé après chargement
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY non configuré - analyse prédictive désactivée');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: MODEL_NAME });
      this.isAvailable = true;
      console.log('✅ Service Gemini initialisé pour l\'analyse prédictive');
    } catch (error) {
      console.error('❌ Erreur d\'initialisation Gemini:', error.message);
    }
  }

  /**
   * Analyse prédictive des risques pour un commit
   * @param {Object} commitData - Données du commit à analyser
   * @param {Array} recentFailures - Échecs récents pour contexte
   * @returns {Promise<Object>} Analyse prédictive
   */
  async analyzeCommitRisk(commitData, recentFailures = []) {
    if (!this.isAvailable) {
      return {
        available: false,
        message: 'Service Gemini non disponible'
      };
    }

    try {
      const prompt = this.buildRiskAnalysisPrompt(commitData, recentFailures);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = this.parseGeminiResponse(response.text());

      return {
        available: true,
        ...analysis,
        timestamp: new Date().toISOString(),
        model: MODEL_NAME
      };
    } catch (error) {
      console.error('❌ Erreur analyse prédictive:', error.message);
      return {
        available: true,
        error: true,
        message: `Erreur d'analyse: ${error.message}`,
        riskLevel: 'unknown'
      };
    }
  }

  /**
   * Analyse prédictive des tendances d'échec
   * @param {Array} failureHistory - Historique des échecs
   * @returns {Promise<Object>} Analyse des tendances
   */
  async analyzeFailureTrends(failureHistory = []) {
    if (!this.isAvailable) {
      return { available: false };
    }

    try {
      const prompt = this.buildTrendAnalysisPrompt(failureHistory);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = this.parseTrendResponse(response.text());

      return {
        available: true,
        ...analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur analyse tendances:', error.message);
      return {
        available: true,
        error: true,
        message: `Erreur d'analyse: ${error.message}`
      };
    }
  }

  /**
   * Génère des recommandations proactives
   * @param {Object} context - Contexte actuel du projet
   * @returns {Promise<Object>} Recommandations
   */
  async generateProactiveRecommendations(context = {}) {
    if (!this.isAvailable) {
      return { available: false };
    }

    try {
      const prompt = this.buildRecommendationPrompt(context);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendations = this.parseRecommendationResponse(response.text());

      return {
        available: true,
        ...recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur recommandations proactives:', error.message);
      return {
        available: true,
        error: true,
        message: `Erreur génération: ${error.message}`
      };
    }
  }

  /**
   * Construit le prompt pour l'analyse de risque
   */
  buildRiskAnalysisPrompt(commitData, recentFailures) {
    const failuresContext = recentFailures.length > 0
      ? `Échecs récents: ${recentFailures.map(f => `${f.name} (${f.error})`).join(', ')}`
      : 'Aucun échec récent';

    return `Tu es un expert DevOps spécialisé dans l'analyse prédictive des risques CI/CD.

Analyse ce commit et prédis le risque d'échec des workflows GitHub Actions :

**Informations du commit :**
- SHA: ${commitData.sha || 'unknown'}
- Branche: ${commitData.branch || 'unknown'}
- Auteur: ${commitData.author || 'unknown'}
- Message: ${commitData.message || 'no message'}
- Fichiers modifiés: ${commitData.files?.join(', ') || 'unknown'}

**Contexte des échecs récents :**
${failuresContext}

**Analyse demandée :**
1. **Niveau de risque** : Faible/Moyen/Élevé/Critique
2. **Raisons principales** : Quels éléments rendent ce commit risqué ?
3. **Workflows à risque** : Quels workflows sont les plus susceptibles d'échouer ?
4. **Actions recommandées** : Que faire pour réduire les risques ?
5. **Temps estimé** : Durée probable avant échec si risque élevé

**Réponds en JSON structuré :**
{
  "riskLevel": "low|medium|high|critical",
  "confidence": 0-100,
  "reasons": ["raison1", "raison2"],
  "riskyWorkflows": ["workflow1", "workflow2"],
  "recommendations": ["action1", "action2"],
  "estimatedTimeToFailure": "X minutes/heures",
  "preventiveActions": ["mesure1", "mesure2"]
}`;
  }

  /**
   * Construit le prompt pour l'analyse des tendances
   */
  buildTrendAnalysisPrompt(failureHistory) {
    const historyText = failureHistory.length > 0
      ? failureHistory.map(f => `- ${f.timestamp}: ${f.workflow} - ${f.error}`).join('\n')
      : 'Aucun historique disponible';

    return `Analyse les tendances d'échec CI/CD suivantes et prédis les risques futurs :

**Historique des échecs :**
${historyText}

**Analyse demandée :**
1. **Tendances identifiées** : Patterns récurrents ?
2. **Risques émergents** : Nouveaux problèmes potentiels ?
3. **Prévisions** : Risques dans les prochains jours ?
4. **Actions préventives** : Que faire pour éviter ?

Réponds en JSON :
{
  "trends": ["tendance1", "tendance2"],
  "emergingRisks": ["risque1", "risque2"],
  "predictions": ["prévision1", "prévision2"],
  "preventiveActions": ["action1", "action2"],
  "riskScore": 0-100
}`;
  }

  /**
   * Construit le prompt pour les recommandations proactives
   */
  buildRecommendationPrompt(context) {
    return `En tant qu'expert DevOps, génère des recommandations proactives pour améliorer la stabilité CI/CD :

**Contexte actuel :**
- Dernier succès: ${context.lastSuccess || 'unknown'}
- Fréquence d'échec: ${context.failureRate || 'unknown'}
- Workflows critiques: ${context.criticalWorkflows?.join(', ') || 'unknown'}
- Technologies: ${context.technologies?.join(', ') || 'unknown'}

Génère 5-10 recommandations concrètes et actionnables pour :
1. Réduire les risques d'échec
2. Améliorer la vitesse de détection
3. Optimiser les workflows
4. Renforcer la stabilité

Réponds en JSON :
{
  "recommendations": [
    {
      "title": "Titre court",
      "description": "Description détaillée",
      "priority": "high|medium|low",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "category": "prevention|optimization|monitoring"
    }
  ],
  "quickWins": ["action rapide 1", "action rapide 2"],
  "longTerm": ["amélioration long terme 1", "amélioration long terme 2"]
}`;
  }

  /**
   * Parse la réponse de Gemini pour l'analyse de risque
   */
  parseGeminiResponse(text) {
    try {
      // Nettoie la réponse et extrait le JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validation et valeurs par défaut
      return {
        riskLevel: parsed.riskLevel || 'unknown',
        confidence: parsed.confidence || 50,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        riskyWorkflows: Array.isArray(parsed.riskyWorkflows) ? parsed.riskyWorkflows : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        estimatedTimeToFailure: parsed.estimatedTimeToFailure || 'unknown',
        preventiveActions: Array.isArray(parsed.preventiveActions) ? parsed.preventiveActions : []
      };
    } catch (error) {
      console.error('❌ Erreur parsing réponse Gemini:', error.message);
      return {
        riskLevel: 'unknown',
        confidence: 0,
        reasons: ['Erreur d\'analyse'],
        error: true
      };
    }
  }

  /**
   * Parse la réponse des tendances
   */
  parseTrendResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        trends: Array.isArray(parsed.trends) ? parsed.trends : [],
        emergingRisks: Array.isArray(parsed.emergingRisks) ? parsed.emergingRisks : [],
        predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
        preventiveActions: Array.isArray(parsed.preventiveActions) ? parsed.preventiveActions : [],
        riskScore: parsed.riskScore || 50
      };
    } catch (error) {
      return {
        trends: [],
        emergingRisks: [],
        predictions: ['Analyse des tendances indisponible'],
        riskScore: 50,
        error: true
      };
    }
  }

  /**
   * Parse la réponse des recommandations
   */
  parseRecommendationResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
        longTerm: Array.isArray(parsed.longTerm) ? parsed.longTerm : []
      };
    } catch (error) {
      return {
        recommendations: [],
        quickWins: ['Recommandations indisponibles'],
        longTerm: [],
        error: true
      };
    }
  }
}

// Instance globale du service
const geminiPredictorInstance = new GeminiPredictiveAnalyzer();

// Initialiser l'instance de manière asynchrone
geminiPredictorInstance.initialize().catch(error => {
  console.error('❌ Erreur lors de l\'initialisation du service Gemini:', error);
});

// Exporter l'instance initialisée
export const geminiPredictor = geminiPredictorInstance;

// Fonctions d'export pour utilisation directe
export async function analyzeCommitRisk(commitData, recentFailures) {
  return await geminiPredictor.analyzeCommitRisk(commitData, recentFailures);
}

export async function analyzeFailureTrends(failureHistory) {
  return await geminiPredictor.analyzeFailureTrends(failureHistory);
}

export async function generateProactiveRecommendations(context) {
  return await geminiPredictor.generateProactiveRecommendations(context);
}

// Test du service si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Test du service Gemini prédictif...');

  // Attendre l'initialisation
  setTimeout(async () => {
    console.log('Service disponible:', geminiPredictor.isAvailable ? '✅' : '❌');

    if (geminiPredictor.isAvailable) {
      // Test d'analyse de risque
      const testCommit = {
        sha: 'abc123',
        branch: 'main',
        author: 'test-user',
        message: 'Fix critical bug in authentication',
        files: ['src/auth.js', 'package.json']
      };

      console.log('Test analyse de risque...');
      try {
        const riskAnalysis = await geminiPredictor.analyzeCommitRisk(testCommit);
        console.log('✅ Analyse de risque réussie');
        console.log('Résultat:', JSON.stringify(riskAnalysis, null, 2));
      } catch (error) {
        console.log('❌ Erreur analyse de risque:', error.message);
      }
    } else {
      console.log('⚠️ Service non disponible - vérifiez VITE_GEMINI_API_KEY');
    }
  }, 1000); // Attendre 1 seconde pour l'initialisation
}
