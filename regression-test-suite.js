// Suite de Tests de Régression - Phase 4.2
// Permet de vérifier que les corrections n'introduisent pas de régressions

const fs = require("fs");
const path = require("path");
const API_KEY = null; // Direct access disabled
const GEMINI_CONFIG = require("./src/config/gemini-constants.json");
const GEMINI_MODEL = GEMINI_CONFIG.MODEL_NAME;

class RegressionTestSuite {
  constructor() {
    this.testResults = [];
    this.baselineResults = [];
    this.loadBaseline();
  }

  loadBaseline() {
    // Charger les résultats de référence si disponibles
    const baselinePath = path.join(__dirname, "test-baseline.json");
    if (fs.existsSync(baselinePath)) {
      try {
        this.baselineResults = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
        console.log(`📊 Baseline chargée: ${this.baselineResults.length} tests de référence`);
      } catch (e) {
        console.log("⚠️ Impossible de charger la baseline, tests sans comparaison");
      }
    }
  }

  async runFullRegressionSuite() {
    console.log("🔄 Lancement de la suite de régression complète...");
    console.log("=".repeat(60));

    const testCategories = [
      { name: "Tests Simples", tests: this.getSimpleTests() },
      { name: "Tests Complexes", tests: this.getComplexTests() },
      { name: "Tests Ambigus", tests: this.getAmbiguousTests() },
      { name: "Tests Edge Cases", tests: this.getEdgeCaseTests() },
      { name: "Tests Erreurs", tests: this.getErrorTests() },
      { name: "Tests Contextuels", tests: this.getContextualTests() },
    ];

    for (const category of testCategories) {
      console.log(`\n📂 ${category.name}:`);
      await this.runCategoryTests(category);
    }

    this.generateRegressionReport();
    return this.testResults;
  }

  async runCategoryTests(category) {
    for (const test of category.tests) {
      console.log(`   🧪 ${test.name}...`);

      try {
        const result = await this.runSingleTest(test);
        this.testResults.push(result);

        // Comparer avec la baseline si disponible
        const baseline = this.baselineResults.find((b) => b.name === test.name);
        if (baseline) {
          const regression = this.compareWithBaseline(result, baseline);
          if (regression.hasRegression) {
            console.log(`      ❌ RÉGRESSION DÉTECTÉE: ${regression.details}`);
          } else {
            console.log(`      ✅ OK (stable)`);
          }
        } else {
          console.log(`      ${result.success ? "✅ SUCCÈS" : "❌ ÉCHEC"}`);
        }
      } catch (error) {
        console.log(`      ❌ ERREUR: ${error.message}`);
        this.testResults.push({
          name: test.name,
          success: false,
          error: error.message,
          category: category.name,
        });
      }
    }
  }

  async runSingleTest(test) {
    // Simuler le comportement de la UI
    const uiBehavior = await this.simulateUIBehavior(test.input);

    // Appeler Gemini avec le prompt construit
    const geminiResponse = await this.callGemini(uiBehavior.prompt);

    // Analyser la réponse
    const analysis = this.analyzeResponse(geminiResponse, test.expected);

    return {
      name: test.name,
      input: test.input,
      expected: test.expected,
      success: analysis.success,
      analysis: analysis,
      uiBehavior: uiBehavior,
      response: geminiResponse,
      timestamp: new Date().toISOString(),
    };
  }

  async simulateUIBehavior(userInput) {
    // Simulation du parsing temporel
    const temporalInfo = this.parseTemporalInfo(userInput);

    // Construction des hints
    const dateHints = temporalInfo.needsHints ? this.buildDateHints(temporalInfo) : "";
    const contextualHints = this.buildContextualHints(userInput, temporalInfo);

    // Construction du prompt final
    const prompt = this.buildPrompt(userInput, dateHints, contextualHints, temporalInfo);

    return {
      userInput,
      temporalInfo,
      dateHints,
      contextualHints,
      prompt,
      rulesUsed: this.getRulesUsed(temporalInfo, userInput),
    };
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
      /\b(commercial|technique|développement|marketing)\b/i,
    ];

    const nonProfessionalPatterns = [
      /\b(amis|famille|sortie|fête|weekend|vacances)\b/i,
      /\b(sport|match|footing|entraînement|course)\b/i,
      /\b(cinéma|restaurant|bar|soirée)\b/i,
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

    // Jours de la semaine
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

    // Périodes temporelles
    const periods = [
      "aujourd'hui",
      "demain",
      "hier",
      "ce weekend",
      "la semaine prochaine",
      "ce mois",
      "le mois prochain",
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

  buildPrompt(userInput, dateHints, contextualHints, temporalInfo) {
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

    if (temporalInfo.pollType === "datetime") {
      prompt += "- Inclure des timeSlots pour les heures spécifiées\n";
    }

    return prompt;
  }

  getRulesUsed(temporalInfo, userInput) {
    const rules = [];

    if (temporalInfo.needsHints) rules.push("dateHints", "contextualHints");
    if (temporalInfo.hasTimeKeywords) rules.push("timeSlots");
    if (temporalInfo.isProfessional) rules.push("professionalContext");
    if (temporalInfo.detectedPatterns.includes("recurring")) rules.push("recurringPattern");
    if (temporalInfo.detectedPatterns.includes("multiple_days")) rules.push("multipleDays");

    return rules;
  }

  async callGemini(prompt) {
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

  analyzeResponse(response, expected) {
    const analysis = {
      success: false,
      isJSON: false,
      isDatePoll: false,
      hasValidDates: false,
      hasFutureDates: true,
      hasTimeSlots: false,
      matchesExpected: false,
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
      analysis.isDatePoll = parsed.type === "date";
      analysis.hasTimeSlots = parsed.timeSlots && parsed.timeSlots.length > 0;

      if (parsed.dates && Array.isArray(parsed.dates)) {
        analysis.hasValidDates = parsed.dates.length > 0;
        const today = new Date().toISOString().split("T")[0];
        analysis.hasFutureDates = parsed.dates.every((date) => date >= today);
      }

      analysis.success = analysis.isDatePoll && parsed.title && parsed.dates;
      analysis.matchesExpected = this.matchesExpectedResults(parsed, expected);
    } catch (e) {
      analysis.errors.push("JSON parsing failed");
    }

    return analysis;
  }

  matchesExpectedResults(result, expected) {
    if (!expected) return true; // Pas d'attente spécifique

    let matches = true;

    if (expected.type && result.type !== expected.type) {
      matches = false;
    }

    if (expected.minDates && (!result.dates || result.dates.length < expected.minDates)) {
      matches = false;
    }

    if (expected.maxDates && (!result.dates || result.dates.length > expected.maxDates)) {
      matches = false;
    }

    if (expected.hasTimeSlots !== undefined) {
      const hasTimeSlots = result.timeSlots && result.timeSlots.length > 0;
      if (expected.hasTimeSlots !== hasTimeSlots) {
        matches = false;
      }
    }

    return matches;
  }

  compareWithBaseline(current, baseline) {
    const regression = {
      hasRegression: false,
      details: [],
      severity: "none",
    };

    // Vérifier si un test qui passait maintenant échoue
    if (baseline.success && !current.success) {
      regression.hasRegression = true;
      regression.details.push("Success → Failure");
      regression.severity = "critical";
    }

    // Vérifier la dégradation des propriétés
    if (baseline.analysis && current.analysis) {
      const baselineAnalysis = baseline.analysis;
      const currentAnalysis = current.analysis;

      if (baselineAnalysis.isJSON && !currentAnalysis.isJSON) {
        regression.hasRegression = true;
        regression.details.push("JSON parsing degraded");
        regression.severity = "high";
      }

      if (baselineAnalysis.hasValidDates && !currentAnalysis.hasValidDates) {
        regression.hasRegression = true;
        regression.details.push("Date generation degraded");
        regression.severity = "high";
      }

      if (baselineAnalysis.hasFutureDates && !currentAnalysis.hasFutureDates) {
        regression.hasRegression = true;
        regression.details.push("Future dates rule degraded");
        regression.severity = "medium";
      }
    }

    return regression;
  }

  generateRegressionReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 RAPPORT DE RÉGRESSION");
    console.log("=".repeat(60));

    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter((t) => t.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);

    console.log(`📈 Statistiques générales:`);
    console.log(`   Total: ${totalTests} tests`);
    console.log(`   Succès: ${successfulTests} (${successRate}%)`);
    console.log(`   Échecs: ${failedTests}`);

    // Analyser les régressions
    const regressions = [];
    this.testResults.forEach((test) => {
      const baseline = this.baselineResults.find((b) => b.name === test.name);
      if (baseline && baseline.success && !test.success) {
        regressions.push(test.name);
      }
    });

    if (regressions.length > 0) {
      console.log(`\n❌ Régressions détectées (${regressions.length}):`);
      regressions.forEach((name) => {
        console.log(`   - ${name}`);
      });
    } else {
      console.log(`\n✅ Aucune régression détectée`);
    }

    // Analyser les catégories problématiques
    const categoryStats = {};
    this.testResults.forEach((test) => {
      const category = test.category || "Unknown";
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, success: 0 };
      }
      categoryStats[category].total++;
      if (test.success) categoryStats[category].success++;
    });

    console.log(`\n📂 Résultats par catégorie:`);
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const rate = ((stats.success / stats.total) * 100).toFixed(1);
      console.log(`   ${category}: ${stats.success}/${stats.total} (${rate}%)`);
    });

    // Sauvegarder les résultats
    this.saveResults();
  }

  saveResults() {
    const resultsPath = path.join(__dirname, `regression-results-${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n💾 Résultats sauvegardés dans: ${resultsPath}`);
  }

  // Définition des tests
  getSimpleTests() {
    return [
      {
        name: "Simple Date Demain",
        input: "réunion demain",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
      {
        name: "Simple Date Weekend",
        input: "sortie ce weekend",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
      {
        name: "Simple Date Lundi",
        input: "appel lundi",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
    ];
  }

  getComplexTests() {
    return [
      {
        name: "Multiple Jours",
        input: "réunion lundi ou mardi",
        expected: { type: "date", minDates: 2, maxDates: 4 },
      },
      {
        name: "Recurring Pattern",
        input: "réunion chaque lundi",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
      {
        name: "Mois Spécifique",
        input: "conférence en décembre",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
    ];
  }

  getAmbiguousTests() {
    return [
      {
        name: "Ambigu Temps",
        input: "réunion prochainement",
        expected: { type: "date", minDates: 1, maxDates: 5 },
      },
      {
        name: "Ambigu Contexte",
        input: "activité de fin de journée",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
    ];
  }

  getEdgeCaseTests() {
    return [
      {
        name: "Empty Input",
        input: "",
        expected: { type: "date" },
      },
      {
        name: "Special Characters",
        input: "réunion @work #urgent",
        expected: { type: "date" },
      },
      {
        name: "Very Long Input",
        input:
          "réunion très importante avec tous les membres de l'équipe pour discuter du projet stratégique annuel",
        expected: { type: "date" },
      },
    ];
  }

  getErrorTests() {
    return [
      {
        name: "Non-Date Request",
        input: "quel temps fait-il",
        expected: { type: "date" },
      },
      {
        name: "Question Form",
        input: "pourquoi faire une réunion",
        expected: { type: "date" },
      },
    ];
  }

  getContextualTests() {
    return [
      {
        name: "Professional Context",
        input: "réunion client",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
      {
        name: "Personal Context",
        input: "sortie amis",
        expected: { type: "date", minDates: 1, maxDates: 3 },
      },
      {
        name: "Time Specific",
        input: "déjeuner 12h",
        expected: { type: "datetime", hasTimeSlots: true },
      },
    ];
  }
}

// Fonction utilitaire pour lancer la suite
async function runRegressionSuite() {
  if (!API_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY non trouvé dans .env.local");
    return;
  }

  const suite = new RegressionTestSuite();
  return await suite.runFullRegressionSuite();
}

// Export pour utilisation
module.exports = { RegressionTestSuite, runRegressionSuite };

// Si appelé directement
if (require.main === module) {
  runRegressionSuite();
}
