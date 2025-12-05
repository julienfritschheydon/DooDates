// Système de Comparaison - Phase 4.5
// Compare les réponses Gemini avec les réponses attendues pour identifier les écarts

const fs = require("fs");
const path = require("path");

function getApiKey() {
  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

const API_KEY = getApiKey();
const GEMINI_CONFIG = require("./src/config/gemini-constants.json");
const GEMINI_MODEL = GEMINI_CONFIG.MODEL_NAME;

class SystemComparison {
  constructor() {
    this.testCases = this.loadTestCases();
    this.expectedResults = this.loadExpectedResults();
    this.comparisonResults = [];
  }

  loadTestCases() {
    return [
      // Tests Simples
      {
        id: "simple_1",
        category: "simple",
        input: "réunion demain",
        description: "Date simple avec demain",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
      },
      {
        id: "simple_2",
        category: "simple",
        input: "appel lundi",
        description: "Date simple avec jour de semaine",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
      },
      {
        id: "simple_3",
        category: "simple",
        input: "sortie ce weekend",
        description: "Date simple avec weekend",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
      },

      // Tests Complexes
      {
        id: "complex_1",
        category: "complex",
        input: "réunion lundi ou mardi",
        description: "Multiple jours avec ou",
        expectedType: "date",
        expectedDateCount: { min: 2, max: 4 },
        expectedTimeSlots: false,
      },
      {
        id: "complex_2",
        category: "complex",
        input: "conférence en décembre",
        description: "Mois spécifique",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
      },
      {
        id: "complex_3",
        category: "complex",
        input: "réunion chaque lundi",
        description: "Pattern récurrent",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
      },

      // Tests avec TimeSlots
      {
        id: "datetime_1",
        category: "datetime",
        input: "déjeuner 12h",
        description: "Heure spécifique",
        expectedType: "datetime",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: true,
      },
      {
        id: "datetime_2",
        category: "datetime",
        input: "réunion 14h30",
        description: "Heure précise",
        expectedType: "datetime",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: true,
      },
      {
        id: "datetime_3",
        category: "datetime",
        input: "appel matin",
        description: "Période de la journée",
        expectedType: "datetime",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: true,
      },

      // Tests Contextuels
      {
        id: "context_1",
        category: "context",
        input: "réunion client",
        description: "Contexte professionnel",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
        expectedContext: "professional",
      },
      {
        id: "context_2",
        category: "context",
        input: "sortie amis",
        description: "Contexte personnel",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
        expectedContext: "personal",
      },

      // Tests Edge Cases
      {
        id: "edge_1",
        category: "edge",
        input: "",
        description: "Input vide",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
      },
      {
        id: "edge_2",
        category: "edge",
        input: "réunion @work #urgent",
        description: "Caractères spéciaux",
        expectedType: "date",
        expectedDateCount: { min: 1, max: 3 },
        expectedTimeSlots: false,
      },
    ];
  }

  loadExpectedResults() {
    // Charger les résultats attendus si disponibles
    const expectedPath = path.join(__dirname, "expected-results.json");
    if (fs.existsSync(expectedPath)) {
      try {
        return JSON.parse(fs.readFileSync(expectedPath, "utf8"));
      } catch (e) {
        console.log("⚠️ Impossible de charger les résultats attendus");
      }
    }
    return {};
  }

  async runFullComparison() {
    console.log("🔄 Lancement de la comparaison système complète...");
    console.log("=".repeat(60));

    for (const testCase of this.testCases) {
      console.log(`\n🧪 Test: ${testCase.id} - ${testCase.description}`);
      console.log(`   Input: "${testCase.input}"`);

      try {
        const result = await this.runComparison(testCase);
        this.comparisonResults.push(result);

        console.log(`   Résultat: ${result.match ? "✅ CORRESPOND" : "❌ ÉCART"}`);

        if (!result.match) {
          console.log(`   Écarts détectés: ${result.differences.length}`);
          result.differences.forEach((diff) => {
            console.log(`      - ${diff.type}: ${diff.expected} vs ${diff.actual}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        this.comparisonResults.push({
          testCase,
          error: error.message,
          match: false,
        });
      }
    }

    this.generateComparisonReport();
    return this.comparisonResults;
  }

  async runComparison(testCase) {
    // 1. Obtenir la réponse Gemini
    const geminiResponse = await this.getGeminiResponse(testCase.input);

    // 2. Analyser la réponse
    const analysis = this.analyzeGeminiResponse(geminiResponse);

    // 3. Comparer avec les attentes
    const comparison = this.compareWithExpected(testCase, analysis);

    return {
      testCase,
      geminiResponse,
      analysis,
      comparison,
      match: comparison.differences.length === 0,
      differences: comparison.differences,
    };
  }

  async getGeminiResponse(userInput) {
    // Simuler le comportement UI pour construire le prompt
    const prompt = this.buildUIPrompt(userInput);

    const https = require("https");
    const url = require("url");

    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.parse(geminiUrl).hostname,
        path: url.parse(geminiUrl).path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: result,
              rawResponse: data,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              error: "Invalid JSON response",
              rawResponse: data,
            });
          }
        });
      });

      req.on("error", (err) => {
        reject(new Error(`Network error: ${err.message}`));
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.write(postData);
      req.end();
    });
  }

  buildUIPrompt(userInput) {
    // Simuler le parsing temporel
    const temporalInfo = this.parseTemporalInfo(userInput);

    // Construction des hints
    const dateHints = temporalInfo.needsHints ? this.buildDateHints(temporalInfo) : "";
    const contextualHints = this.buildContextualHints(userInput, temporalInfo);

    // Construction du prompt final
    let prompt = `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "${userInput}"

FORMAT JSON EXACT:
{
  "type": "date",
  "title": "Titre clair et concis",
  "description": "Description détaillée",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [{"start": "HH:MM", "end": "HH:MM"}]
}`;

    if (dateHints || contextualHints) {
      prompt += "\n\nRÈGLES SPÉCIFIQUES:\n";
      if (dateHints) prompt += dateHints + "\n";
      if (contextualHints) prompt += contextualHints + "\n";
    }

    prompt += "\n\nRÈGLES CRITIQUES:\n";
    prompt += "- Réponds SEULEMENT avec le JSON, aucun texte supplémentaire\n";
    prompt += "- Génère UNIQUEMENT des sondages de dates (jamais de formulaires)\n";
    prompt += "- Toutes les dates doivent être dans le futur\n";

    if (temporalInfo.hasTimeKeywords) {
      prompt += "- Inclure des timeSlots pour les heures spécifiées\n";
    }

    return prompt;
  }

  parseTemporalInfo(userInput) {
    const needsHints = this.detectComplexCase(userInput);
    const hasTimeKeywords = this.detectTimeKeywords(userInput);
    const isProfessional = this.detectProfessionalContext(userInput);
    const pollType = this.detectPollType(userInput);
    const keywords = this.extractKeywords(userInput);

    return {
      needsHints,
      hasTimeKeywords,
      isProfessional,
      pollType,
      keywords,
      detectedPatterns: this.detectPatterns(userInput),
    };
  }

  detectComplexCase(userInput) {
    const complexPatterns = [
      /\b(ou|et)\b.*\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
      /\b(chaque|tous les)\b/i,
      /\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
      /\b(trimestre|semestre|vacances)\b/i,
      /\b(prochain|dernier)\b.*\b(mois|semaine|weekend)\b/i,
    ];

    return complexPatterns.some((pattern) => pattern.test(userInput));
  }

  detectTimeKeywords(userInput) {
    const timePatterns = [
      /\b(matin|après-midi|soir|nuit)\b/i,
      /\b(\d{1,2}h|\d{1,2}:\d{2})\b/i,
      /\b(déjeuner|dîner|petit-déjeuner)\b/i,
      /\b(début|fin|ouverture|fermeture)\b/i,
    ];

    return timePatterns.some((pattern) => pattern.test(userInput));
  }

  detectProfessionalContext(userInput) {
    const professionalPatterns = [
      /\b(réunion|meeting|présentation|conférence|appel|visio|visioconférence)\b/i,
      /\b(client|projet|équipe|collaborateur|manager|direction)\b/i,
      /\b(bureau|travail|professionnel|entreprise|société)\b/i,
    ];

    const nonProfessionalPatterns = [
      /\b(amis|famille|sortie|fête|weekend|vacances)\b/i,
      /\b(sport|match|footing|entraînement|course)\b/i,
    ];

    const isProfessional = professionalPatterns.some((pattern) => pattern.test(userInput));
    const isNonProfessional = nonProfessionalPatterns.some((pattern) => pattern.test(userInput));

    return isProfessional && !isNonProfessional;
  }

  detectPollType(userInput) {
    if (this.detectTimeKeywords(userInput)) return "datetime";
    return "date";
  }

  extractKeywords(userInput) {
    const keywords = [];
    const text = userInput.toLowerCase();

    // Jours
    const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    days.forEach((day) => {
      if (text.includes(day)) keywords.push(day);
    });

    // Mois
    const months = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];
    months.forEach((month) => {
      if (text.includes(month)) keywords.push(month);
    });

    // Périodes
    const periods = [
      "aujourd'hui",
      "demain",
      "hier",
      "ce weekend",
      "la semaine prochaine",
      "ce mois",
    ];
    periods.forEach((period) => {
      if (text.includes(period)) keywords.push(period);
    });

    return keywords;
  }

  detectPatterns(userInput) {
    const patterns = [];

    if (/\b(ou|et)\b.*\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i.test(userInput)) {
      patterns.push("multiple_days");
    }

    if (/\b(chaque|tous les)\b/i.test(userInput)) {
      patterns.push("recurring");
    }

    if (/\b(prochain|dernier)\b/i.test(userInput)) {
      patterns.push("relative_time");
    }

    if (this.detectTimeKeywords(userInput)) {
      patterns.push("time_specific");
    }

    return patterns;
  }

  buildDateHints(temporalInfo) {
    if (!temporalInfo.needsHints) return "";

    let hints = "CONTEXTE TEMPOREL:\n";

    if (temporalInfo.keywords.length > 0) {
      hints += `- Mots-clés détectés: ${temporalInfo.keywords.join(", ")}\n`;
    }

    if (temporalInfo.detectedPatterns.length > 0) {
      hints += `- Patterns détectés: ${temporalInfo.detectedPatterns.join(", ")}\n`;
    }

    if (temporalInfo.isProfessional) {
      hints += "- Contexte professionnel: heures de bureau (8h-18h)\n";
    }

    hints += "- Toutes les dates doivent être dans le futur\n";

    return hints;
  }

  buildContextualHints(userInput, temporalInfo) {
    let hints = "CONTEXTE UTILISATEUR:\n";

    if (temporalInfo.isProfessional) {
      hints += "- Contexte professionnel détecté\n";
      hints += "- Privilégier les jours ouvrables si non spécifié\n";
      hints += "- Éviter les week-ends sauf si explicitement demandé\n";
    } else {
      hints += "- Contexte personnel détecté\n";
      hints += "- Week-ends autorisés si demandés\n";
    }

    if (temporalInfo.hasTimeKeywords) {
      hints += "- Créer des timeSlots pour les heures mentionnées\n";
    }

    return hints;
  }

  analyzeGeminiResponse(response) {
    const analysis = {
      isValid: false,
      isJSON: false,
      isDatePoll: false,
      hasValidDates: false,
      hasFutureDates: true,
      hasTimeSlots: false,
      dateCount: 0,
      timeSlotCount: 0,
      type: null,
      errors: [],
    };

    if (response.status !== 200) {
      analysis.errors.push(`HTTP ${response.status}`);
      return analysis;
    }

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      analysis.errors.push("No content in response");
      return analysis;
    }

    const text = response.data.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanedText);
      analysis.isJSON = true;
      analysis.type = parsed.type;
      analysis.isDatePoll = parsed.type === "date";

      if (parsed.dates && Array.isArray(parsed.dates)) {
        analysis.dateCount = parsed.dates.length;
        analysis.hasValidDates = parsed.dates.length > 0;

        const today = new Date().toISOString().split("T")[0];
        analysis.hasFutureDates = parsed.dates.every((date) => date >= today);
      }

      if (parsed.timeSlots && Array.isArray(parsed.timeSlots)) {
        analysis.timeSlotCount = parsed.timeSlots.length;
        analysis.hasTimeSlots = parsed.timeSlots.length > 0;
      }

      analysis.isValid = analysis.isDatePoll && parsed.title && parsed.dates;
    } catch (e) {
      analysis.errors.push("JSON parsing failed");
    }

    return analysis;
  }

  compareWithExpected(testCase, analysis) {
    const differences = [];

    // Comparer le type
    if (testCase.expectedType && analysis.type !== testCase.expectedType) {
      differences.push({
        type: "type",
        expected: testCase.expectedType,
        actual: analysis.type,
        severity: "high",
      });
    }

    // Comparer le nombre de dates
    if (testCase.expectedDateCount) {
      const { min, max } = testCase.expectedDateCount;
      if (analysis.dateCount < min || analysis.dateCount > max) {
        differences.push({
          type: "date_count",
          expected: `${min}-${max}`,
          actual: analysis.dateCount,
          severity: "medium",
        });
      }
    }

    // Comparer les timeSlots
    if (testCase.expectedTimeSlots !== undefined) {
      const hasTimeSlots = analysis.hasTimeSlots;
      if (testCase.expectedTimeSlots !== hasTimeSlots) {
        differences.push({
          type: "time_slots",
          expected: testCase.expectedTimeSlots,
          actual: hasTimeSlots,
          severity: "medium",
        });
      }
    }

    // Comparer la validité globale
    if (!analysis.isValid) {
      differences.push({
        type: "validity",
        expected: "valid",
        actual: "invalid",
        severity: "high",
        details: analysis.errors,
      });
    }

    return {
      differences,
      score: this.calculateComparisonScore(testCase, analysis),
    };
  }

  calculateComparisonScore(testCase, analysis) {
    let score = 100;

    // Pénaliser les différences
    if (testCase.expectedType && analysis.type !== testCase.expectedType) {
      score -= 30;
    }

    if (testCase.expectedDateCount) {
      const { min, max } = testCase.expectedDateCount;
      if (analysis.dateCount < min || analysis.dateCount > max) {
        score -= 20;
      }
    }

    if (
      testCase.expectedTimeSlots !== undefined &&
      testCase.expectedTimeSlots !== analysis.hasTimeSlots
    ) {
      score -= 15;
    }

    if (!analysis.isValid) {
      score -= 35;
    }

    return Math.max(0, score);
  }

  generateComparisonReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 RAPPORT DE COMPARAISON SYSTÈME");
    console.log("=".repeat(60));

    const totalTests = this.comparisonResults.length;
    const matchingTests = this.comparisonResults.filter((r) => r.match).length;
    const nonMatchingTests = totalTests - matchingTests;
    const matchRate = ((matchingTests / totalTests) * 100).toFixed(1);

    console.log(`📈 Statistiques générales:`);
    console.log(`   Total: ${totalTests} tests`);
    console.log(`   Correspondances: ${matchingTests} (${matchRate}%)`);
    console.log(`   Écarts: ${nonMatchingTests}`);

    // Analyser par catégorie
    const categoryStats = {};
    this.comparisonResults.forEach((result) => {
      if (result.error) return;

      const category = result.testCase.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, matching: 0, scores: [] };
      }

      categoryStats[category].total++;
      if (result.match) {
        categoryStats[category].matching++;
      }

      if (result.comparison && result.comparison.score) {
        categoryStats[category].scores.push(result.comparison.score);
      }
    });

    console.log(`\n📂 Résultats par catégorie:`);
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const rate = ((stats.matching / stats.total) * 100).toFixed(1);
      const avgScore =
        stats.scores.length > 0
          ? (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length).toFixed(1)
          : "N/A";

      console.log(
        `   ${category}: ${stats.matching}/${stats.total} (${rate}%) - Score moyen: ${avgScore}`,
      );
    });

    // Analyser les types d'écarts les plus fréquents
    const differenceTypes = {};
    this.comparisonResults.forEach((result) => {
      if (result.differences) {
        result.differences.forEach((diff) => {
          if (!differenceTypes[diff.type]) {
            differenceTypes[diff.type] = 0;
          }
          differenceTypes[diff.type]++;
        });
      }
    });

    if (Object.keys(differenceTypes).length > 0) {
      console.log(`\n🔍 Types d'écarts les plus fréquents:`);
      Object.entries(differenceTypes)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count} occurrences`);
        });
    }

    // Identifier les tests problématiques
    const problematicTests = this.comparisonResults.filter((r) => !r.match && !r.error);
    if (problematicTests.length > 0) {
      console.log(`\n❌ Tests problématiques (${problematicTests.length}):`);
      problematicTests.forEach((test) => {
        console.log(`   - ${test.testCase.id}: ${test.testCase.description}`);
        if (test.differences.length > 0) {
          console.log(`     Écarts: ${test.differences.map((d) => d.type).join(", ")}`);
        }
      });
    }

    // Sauvegarder les résultats
    this.saveComparisonResults();
  }

  saveComparisonResults() {
    const resultsPath = path.join(__dirname, `comparison-results-${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(this.comparisonResults, null, 2));
    console.log(`\n💾 Résultats sauvegardés dans: ${resultsPath}`);
  }
}

// Fonction utilitaire pour lancer la comparaison
async function runSystemComparison() {
  if (!API_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY non trouvé dans .env.local");
    return;
  }

  const comparison = new SystemComparison();
  return await comparison.runFullComparison();
}

// Export pour utilisation
module.exports = { SystemComparison, runSystemComparison };

// Si appelé directement
if (require.main === module) {
  runSystemComparison();
}
