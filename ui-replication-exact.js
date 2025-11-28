// Réplication Exacte du Comportement UI - Phase 4.4
// Simule précisément le comportement de l'interface utilisateur pour le debug

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

class UIReplicationExact {
  constructor() {
    this.processors = {
      temporal: new TemporalProcessor(),
      contextual: new ContextualProcessor(),
      formatter: new PromptFormatter(),
      validator: new ResponseValidator(),
    };
  }

  async replicateCompleteFlow(userInput) {
    console.log(`🔄 Réplication du flow UI pour: "${userInput}"`);
    console.log("=".repeat(60));

    const flowSteps = [];
    let currentData = { input: userInput };

    try {
      // Étape 1: Input Processing
      console.log("\n📝 Étape 1: Input Processing");
      const processedInput = await this.processInput(userInput);
      flowSteps.push({
        step: "input_processing",
        input: userInput,
        output: processedInput,
        success: true,
      });
      currentData = { ...currentData, processed: processedInput };

      // Étape 2: Temporal Analysis
      console.log("\n⏰ Étape 2: Temporal Analysis");
      const temporalAnalysis = this.processors.temporal.analyze(userInput);
      flowSteps.push({
        step: "temporal_analysis",
        input: userInput,
        output: temporalAnalysis,
        success: true,
      });
      currentData = { ...currentData, temporal: temporalAnalysis };

      // Étape 3: Contextual Analysis
      console.log("\n🎯 Étape 3: Contextual Analysis");
      const contextualAnalysis = this.processors.contextual.analyze(userInput, temporalAnalysis);
      flowSteps.push({
        step: "contextual_analysis",
        input: userInput,
        output: contextualAnalysis,
        success: true,
      });
      currentData = { ...currentData, contextual: contextualAnalysis };

      // Étape 4: Prompt Construction
      console.log("\n🔧 Étape 4: Prompt Construction");
      const prompt = this.processors.formatter.buildPrompt(
        userInput,
        temporalAnalysis,
        contextualAnalysis,
      );
      flowSteps.push({
        step: "prompt_construction",
        input: { userInput, temporalAnalysis, contextualAnalysis },
        output: prompt,
        success: true,
      });
      currentData = { ...currentData, prompt };

      // Étape 5: Gemini API Call
      console.log("\n🤖 Étape 5: Gemini API Call");
      const geminiResponse = await this.callGemini(prompt);
      flowSteps.push({
        step: "gemini_call",
        input: prompt,
        output: geminiResponse,
        success: geminiResponse.status === 200,
      });
      currentData = { ...currentData, response: geminiResponse };

      // Étape 6: Response Validation
      console.log("\n✅ Étape 6: Response Validation");
      const validation = this.processors.validator.validate(geminiResponse);
      flowSteps.push({
        step: "response_validation",
        input: geminiResponse,
        output: validation,
        success: validation.isValid,
      });
      currentData = { ...currentData, validation };

      // Étape 7: Post-Processing
      console.log("\n🔧 Étape 7: Post-Processing");
      const finalResult = await this.postProcessResponse(geminiResponse, validation);
      flowSteps.push({
        step: "post_processing",
        input: { response: geminiResponse, validation },
        output: finalResult,
        success: finalResult.success,
      });

      console.log("\n" + "=".repeat(60));
      console.log("🎯 RÉSULTAT FINAL");
      console.log("=".repeat(60));
      console.log(`Statut: ${finalResult.success ? "✅ SUCCÈS" : "❌ ÉCHEC"}`);

      if (finalResult.errors.length > 0) {
        console.log("Erreurs:");
        finalResult.errors.forEach((error) => console.log(`   - ${error}`));
      }

      return {
        success: finalResult.success,
        flowSteps,
        finalResult,
        debugData: currentData,
      };
    } catch (error) {
      console.error(`❌ Erreur dans le flow: ${error.message}`);

      flowSteps.push({
        step: "error",
        input: currentData,
        output: { error: error.message },
        success: false,
      });

      return {
        success: false,
        flowSteps,
        error: error.message,
        debugData: currentData,
      };
    }
  }

  async processInput(userInput) {
    // Nettoyage et normalisation de l'input
    const cleaned = userInput
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\sàáâäãåçèéêëìíîïñòóôöõùúûüýÿ.,!?@#]/g, "");

    return {
      original: userInput,
      cleaned,
      length: cleaned.length,
      wordCount: cleaned.split(" ").length,
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(userInput),
      language: this.detectLanguage(cleaned),
    };
  }

  detectLanguage(text) {
    const frenchPatterns = [
      /\b(aujourd'hui|demain|hier|ce|cet|cette|ces|mes|tes|ses|notre|votre|leur)\b/i,
      /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
      /\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
    ];

    const englishPatterns = [
      /\b(today|tomorrow|yesterday|this|that|these|those|my|your|our|their)\b/i,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
    ];

    const frenchScore = frenchPatterns.reduce((score, pattern) => {
      return score + (text.match(pattern) || []).length;
    }, 0);

    const englishScore = englishPatterns.reduce((score, pattern) => {
      return score + (text.match(pattern) || []).length;
    }, 0);

    return frenchScore > englishScore ? "fr" : "en";
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

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

  async postProcessResponse(response, validation) {
    const result = {
      success: validation.isValid,
      data: null,
      errors: [...validation.errors],
      warnings: [],
      processedAt: new Date().toISOString(),
    };

    if (validation.isValid && response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        let text = response.data.candidates[0].content.parts[0].text;

        // Nettoyer le JSON
        text = text.replace(/```json\n?|\n?```/g, "").trim();

        // Parser
        const parsed = JSON.parse(text);

        // Validation finale
        if (this.validateFinalResult(parsed)) {
          result.data = parsed;
          result.success = true;
        } else {
          result.errors.push("Final validation failed");
          result.success = false;
        }
      } catch (e) {
        result.errors.push(`JSON parsing failed: ${e.message}`);
        result.success = false;
      }
    }

    return result;
  }

  validateFinalResult(data) {
    if (!data || typeof data !== "object") return false;
    if (data.type !== "date") return false;
    if (!data.title || typeof data.title !== "string") return false;
    if (!data.dates || !Array.isArray(data.dates)) return false;
    if (data.dates.length === 0) return false;

    // Vérifier que toutes les dates sont valides
    const today = new Date().toISOString().split("T")[0];
    const allFuture = data.dates.every((date) => {
      const dateObj = new Date(date);
      return !isNaN(dateObj.getTime()) && date >= today;
    });

    return allFuture;
  }

  generateDebugReport(flowResult) {
    const report = [
      "# Rapport de Debug UI Exact",
      `Input: "${flowResult.debugData.input}"`,
      `Statut final: ${flowResult.success ? "✅ SUCCÈS" : "❌ ÉCHEC"}`,
      "",
      "## Détail du flow:",
    ];

    flowResult.flowSteps.forEach((step, index) => {
      report.push(`\n### Étape ${index + 1}: ${step.step}`);
      report.push(`Statut: ${step.success ? "✅" : "❌"}`);

      if (step.output) {
        if (typeof step.output === "object") {
          report.push("```json");
          report.push(JSON.stringify(step.output, null, 2));
          report.push("```");
        } else {
          report.push(`Output: ${step.output}`);
        }
      }
    });

    if (flowResult.finalResult && flowResult.finalResult.errors.length > 0) {
      report.push("\n## Erreurs:");
      flowResult.finalResult.errors.forEach((error) => {
        report.push(`- ${error}`);
      });
    }

    return report.join("\n");
  }

  saveDebugReport(flowResult, filename) {
    const report = this.generateDebugReport(flowResult);
    const defaultFilename = `ui-debug-${Date.now()}.md`;
    const finalFilename = filename || defaultFilename;

    fs.writeFileSync(finalFilename, report, "utf8");
    console.log(`📄 Rapport de debug sauvegardé: ${finalFilename}`);
  }
}

class TemporalProcessor {
  analyze(userInput) {
    return {
      needsHints: this.detectComplexCase(userInput),
      hasTimeKeywords: this.detectTimeKeywords(userInput),
      isProfessional: this.detectProfessionalContext(userInput),
      pollType: this.detectPollType(userInput),
      keywords: this.extractKeywords(userInput),
      patterns: this.detectPatterns(userInput),
      urgency: this.detectUrgency(userInput),
      duration: this.estimateDuration(userInput),
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

  detectUrgency(userInput) {
    const urgentPatterns = [
      /\b(urgent|urgence|immédiat|dès que possible|asap)\b/i,
      /\b(aujourd'hui|maintenant|tout de suite)\b/i,
    ];

    return urgentPatterns.some((pattern) => pattern.test(userInput));
  }

  estimateDuration(userInput) {
    const durationPatterns = [
      { pattern: /\b(\d+)\s*heure(s)?\b/i, unit: "hours" },
      { pattern: /\b(\d+)\s*minute(s)?\b/i, unit: "minutes" },
      { pattern: /\b(\d+)\s*jour(s)?\b/i, unit: "days" },
    ];

    for (const { pattern, unit } of durationPatterns) {
      const match = userInput.match(pattern);
      if (match) {
        return { value: parseInt(match[1]), unit };
      }
    }

    return null;
  }
}

class ContextualProcessor {
  analyze(userInput, temporalAnalysis) {
    return {
      context: this.determineContext(userInput),
      priority: this.determinePriority(userInput),
      audience: this.determineAudience(userInput),
      location: this.extractLocation(userInput),
      constraints: this.extractConstraints(userInput, temporalAnalysis),
      preferences: this.extractPreferences(userInput),
    };
  }

  determineContext(userInput) {
    if (temporalAnalysis.isProfessional) return "professional";
    if (this.detectPersonalContext(userInput)) return "personal";
    if (this.detectSocialContext(userInput)) return "social";
    return "general";
  }

  detectPersonalContext(userInput) {
    const personalPatterns = [
      /\b(personnel|privé|ma|mon|mes)\b/i,
      /\b(famille|parents|enfants|conjoint)\b/i,
    ];

    return personalPatterns.some((pattern) => pattern.test(userInput));
  }

  detectSocialContext(userInput) {
    const socialPatterns = [
      /\b(amis|copains|sortie|fête|soirée)\b/i,
      /\b(cinéma|restaurant|bar|café)\b/i,
    ];

    return socialPatterns.some((pattern) => pattern.test(userInput));
  }

  determinePriority(userInput) {
    if (temporalAnalysis.urgency) return "high";
    if (this.detectHighPriorityWords(userInput)) return "medium";
    return "normal";
  }

  detectHighPriorityWords(userInput) {
    const highPriorityPatterns = [
      /\b(important|crucial|nécessaire|obligatoire)\b/i,
      /\b(début|lancement|livraison|échéance)\b/i,
    ];

    return highPriorityPatterns.some((pattern) => pattern.test(userInput));
  }

  determineAudience(userInput) {
    if (temporalAnalysis.isProfessional) {
      if (/\b(client|externe)\b/i.test(userInput)) return "external";
      if (/\b(équipe|interne|collaborateur)\b/i.test(userInput)) return "internal";
      return "mixed";
    }

    if (this.detectPersonalContext(userInput)) return "family";
    if (this.detectSocialContext(userInput)) return "friends";
    return "general";
  }

  extractLocation(userInput) {
    const locationPatterns = [
      /\b(bureau|domicile|maison|home|office)\b/i,
      /\b(paris|lyon|marseille|lille|bordeaux|toulouse)\b/i,
      /\b(chez|à|au)\s+(\w+)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = userInput.match(pattern);
      if (match) return match[0];
    }

    return null;
  }

  extractConstraints(userInput, temporalAnalysis) {
    const constraints = [];

    if (temporalAnalysis.isProfessional) {
      constraints.push("business_hours");
      constraints.push("weekdays_preferred");
    }

    if (temporalAnalysis.hasTimeKeywords) {
      constraints.push("time_specific");
    }

    if (this.detectBudgetConstraint(userInput)) {
      constraints.push("budget_limited");
    }

    return constraints;
  }

  detectBudgetConstraint(userInput) {
    const budgetPatterns = [
      /\b(gratuit|free|pas cher|économique)\b/i,
      /\b(budget|coût|prix|tarif)\b/i,
    ];

    return budgetPatterns.some((pattern) => pattern.test(userInput));
  }

  extractPreferences(userInput) {
    const preferences = [];

    if (/\b(matin|matinée)\b/i.test(userInput)) preferences.push("morning");
    if (/\b(soir|soirée)\b/i.test(userInput)) preferences.push("evening");
    if (/\b(début|matin)\b/i.test(userInput)) preferences.push("early");
    if (/\b(fin|après-midi)\b/i.test(userInput)) preferences.push("late");

    return preferences;
  }
}

class PromptFormatter {
  buildPrompt(userInput, temporalAnalysis, contextualAnalysis) {
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

    // Ajouter les hints contextuels si nécessaire
    const hints = this.buildContextualHints(temporalAnalysis, contextualAnalysis);
    if (hints) {
      prompt += "\n\n" + hints;
    }

    // Ajouter les règles critiques
    prompt += "\n\nRÈGLES CRITIQUES:\n";
    prompt += "- Réponds SEULEMENT avec le JSON, aucun texte supplémentaire\n";
    prompt += "- Génère UNIQUEMENT des sondages de dates (jamais de formulaires)\n";
    prompt += "- Toutes les dates doivent être dans le futur\n";

    if (temporalAnalysis.pollType === "datetime") {
      prompt += "- Inclure des timeSlots pour les heures spécifiées\n";
    }

    return prompt;
  }

  buildContextualHints(temporalAnalysis, contextualAnalysis) {
    let hints = "";

    if (temporalAnalysis.needsHints) {
      hints += "CONTEXTE TEMPOREL:\n";

      if (temporalAnalysis.keywords.length > 0) {
        hints += `- Mots-clés détectés: ${temporalAnalysis.keywords.join(", ")}\n`;
      }

      if (temporalAnalysis.patterns.length > 0) {
        hints += `- Patterns détectés: ${temporalAnalysis.patterns.join(", ")}\n`;
      }

      hints += "- Toutes les dates doivent être dans le futur\n";
    }

    if (contextualAnalysis.context !== "general") {
      if (hints) hints += "\n";
      hints += "CONTEXTE UTILISATEUR:\n";
      hints += `- Contexte: ${contextualAnalysis.context}\n`;

      if (contextualAnalysis.audience) {
        hints += `- Audience: ${contextualAnalysis.audience}\n`;
      }

      if (contextualAnalysis.constraints.length > 0) {
        hints += `- Contraintes: ${contextualAnalysis.constraints.join(", ")}\n`;
      }
    }

    return hints;
  }
}

class ResponseValidator {
  validate(response) {
    const validation = {
      isValid: false,
      isJSON: false,
      isDatePoll: false,
      hasValidDates: false,
      hasFutureDates: true,
      hasTimeSlots: false,
      errors: [],
    };

    if (response.status !== 200) {
      validation.errors.push(`HTTP ${response.status}`);
      return validation;
    }

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      validation.errors.push("No content in response");
      return validation;
    }

    const text = response.data.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanedText);
      validation.isJSON = true;
      validation.isDatePoll = parsed.type === "date";
      validation.hasTimeSlots = parsed.timeSlots && parsed.timeSlots.length > 0;

      if (parsed.dates && Array.isArray(parsed.dates)) {
        validation.hasValidDates = parsed.dates.length > 0;
        const today = new Date().toISOString().split("T")[0];
        validation.hasFutureDates = parsed.dates.every((date) => date >= today);
      }

      validation.isValid = validation.isDatePoll && parsed.title && parsed.dates;
    } catch (e) {
      validation.errors.push("JSON parsing failed");
    }

    return validation;
  }
}

// Fonction utilitaire pour lancer la réplication
async function replicateUIFlow(userInput) {
  if (!API_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY non trouvé dans .env.local");
    return;
  }

  const replicator = new UIReplicationExact();
  const result = await replicator.replicateCompleteFlow(userInput);

  replicator.saveDebugReport(result);
  return result;
}

// Export pour utilisation
module.exports = {
  UIReplicationExact,
  replicateUIFlow,
  TemporalProcessor,
  ContextualProcessor,
  PromptFormatter,
  ResponseValidator,
};

// Si appelé directement
if (require.main === module) {
  const userInput = process.argv[2];
  if (!userInput) {
    console.log('Usage: node ui-replication-exact.js "votre input ici"');
    console.log('Exemple: node ui-replication-exact.js "réunion d\'équipe ce weekend"');
    process.exit(1);
  }

  replicateUIFlow(userInput);
}
