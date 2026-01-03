#!/usr/bin/env node
/**
 * Script de Debug Gemini Pipeline
 * Affiche chaque étape du traitement d'un prompt Gemini pour diagnostic
 *
 * Usage: node scripts/gemini-debug.js "fais-moi un sondage pour un déjeuner la semaine prochaine entre midi et deux"
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

function loadEnvironment() {
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvironment();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const GEMINI_CONFIG = require("../src/config/gemini-constants.json");
const MODEL_NAME = GEMINI_CONFIG.MODEL_NAME;

// ============================================================================
// Couleurs pour le terminal
// ============================================================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
};

function header(text) {
  console.log(`\n${colors.bgBlue}${colors.white}${colors.bright} ${text} ${colors.reset}\n`);
}

function subHeader(text) {
  console.log(`${colors.cyan}${colors.bright}▶ ${text}${colors.reset}`);
}

function success(text) {
  console.log(`${colors.green}✅ ${text}${colors.reset}`);
}

function warning(text) {
  console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`);
}

function error(text) {
  console.log(`${colors.red}❌ ${text}${colors.reset}`);
}

function info(text) {
  console.log(`${colors.dim}${text}${colors.reset}`);
}

function highlight(label, value) {
  console.log(`  ${colors.bright}${label}:${colors.reset} ${value}`);
}

function jsonBlock(obj) {
  console.log(colors.dim + JSON.stringify(obj, null, 2) + colors.reset);
}

// ============================================================================
// Fonctions de parsing temporel simplifiées (version standalone)
// ============================================================================

function parseTemporalInputSimple(userInput) {
  const lowerInput = userInput.toLowerCase();
  const today = new Date();

  const result = {
    type: "unknown",
    dayOfWeek: [],
    isMealContext: false,
    hasExplicitTimeRange: false,
    relativeWeeks: 0,
    allowedDates: [],
    detectedKeywords: [],
  };

  // Détection du contexte repas
  if (/(déjeuner|dîner|dinner|lunch|brunch|repas|petit[- ]?déjeuner)/i.test(lowerInput)) {
    result.isMealContext = true;
    result.detectedKeywords.push("repas");
  }

  // Détection de "entre midi et deux" ou plages horaires explicites
  if (/entre\s+\d+h?\s*(et|à)\s+\d+h?/i.test(lowerInput)) {
    result.hasExplicitTimeRange = true;
    result.detectedKeywords.push("plage horaire explicite");
  }

  // Cas spécial "entre midi et deux"
  if (/entre\s+midi\s+(et|à)\s+(deux|2)/i.test(lowerInput)) {
    result.hasExplicitTimeRange = true;
    result.detectedKeywords.push("midi-deux (12h-14h)");
  }

  // Détection semaine prochaine
  if (/semaine\s+prochaine/i.test(lowerInput)) {
    result.relativeWeeks = 1;
    result.type = "period";
    result.detectedKeywords.push("semaine prochaine");
  }

  // Détection jours de la semaine
  const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  dayNames.forEach((day, index) => {
    if (lowerInput.includes(day)) {
      result.dayOfWeek.push(index);
      result.detectedKeywords.push(day);
    }
  });

  // Générer les dates autorisées (7 jours à partir d'aujourd'hui ou semaine prochaine)
  const startOffset = result.relativeWeeks === 1 ? 7 : 0;
  for (let i = startOffset; i < startOffset + 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    result.allowedDates.push(date.toISOString().split("T")[0]);
  }

  return result;
}

// ============================================================================
// Construction des hints (version simplifiée)
// ============================================================================

function buildHintsFromParsed(parsed, userInput) {
  const hints = [];

  if (parsed.isMealContext) {
    hints.push({
      type: "CONTEXTE REPAS",
      rule: "1 créneau uniquement par jour si date spécifique",
      reason: "Mot-clé détecté: déjeuner/dîner/brunch",
    });
  }

  if (parsed.hasExplicitTimeRange) {
    hints.push({
      type: "PLAGE HORAIRE EXPLICITE",
      rule: "Respecter la plage demandée",
      reason: 'Pattern "entre X et Y" détecté',
    });
  }

  if (parsed.relativeWeeks > 0) {
    hints.push({
      type: "PÉRIODE RELATIVE",
      rule: `Dans ${parsed.relativeWeeks} semaine(s)`,
      reason: 'Pattern "semaine prochaine" détecté',
    });
  }

  if (parsed.dayOfWeek.length > 0) {
    const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    hints.push({
      type: "JOURS SPÉCIFIQUES",
      rule: `Filtrer pour ${parsed.dayOfWeek.map((d) => dayNames[d]).join(", ")}`,
      reason: "Jours de la semaine mentionnés",
    });
  }

  return hints;
}

// ============================================================================
// Construction du prompt (version simplifiée)
// ============================================================================

function buildPrompt(userInput, hints) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let prompt = `Tu es un assistant intelligent qui génère des sondages de dates.
Aujourd'hui: ${dateStr}

DEMANDE UTILISATEUR: "${userInput}"

`;

  if (hints.length > 0) {
    prompt += `⚠️ RÈGLES IMPORTANTES:
`;
    hints.forEach((hint, i) => {
      prompt += `${i + 1}. ${hint.type}: ${hint.rule}
`;
    });
    prompt += `
`;
  }

  prompt += `Génère un JSON avec:
- title: titre du sondage
- dates: tableau de dates YYYY-MM-DD
- timeSlots: tableau de créneaux { start: "HH:MM", end: "HH:MM" }
- type: "date" ou "datetime"

Réponds UNIQUEMENT avec le JSON, sans texte autour.`;

  return prompt;
}

// ============================================================================
// Appel Gemini
// ============================================================================

async function callGemini(prompt) {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY non configuré");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// ============================================================================
// Post-processing (simulation)
// ============================================================================

function simulatePostProcessing(rawResponse, parsed, userInput) {
  const lowerInput = userInput.toLowerCase();

  // Extraire le JSON de la réponse
  let suggestion;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      suggestion = JSON.parse(jsonMatch[0]);
    } else {
      return { error: "Pas de JSON dans la réponse" };
    }
  } catch (e) {
    return { error: `Erreur parsing: ${e.message}` };
  }

  const processing = {
    rulesApplied: [],
    originalSlots: suggestion.timeSlots?.length || 0,
    originalDates: suggestion.dates?.length || 0,
  };

  // Règle "1 slot pour repas + date spécifique"
  if (parsed.isMealContext) {
    // VÉRIFIER si hasExplicitTimeRange désactive le contexte repas
    if (parsed.hasExplicitTimeRange) {
      processing.rulesApplied.push({
        rule: "hasExplicitTimeRange détecté",
        effect: "⚠️ isMealContext désactivé! (ligne 1022 du post-processor)",
        problem: 'Le pattern "entre" match même si c\'est "entre midi et deux"',
      });
    } else {
      processing.rulesApplied.push({
        rule: "isMealContext = true",
        effect: "Limitation à 1 créneau par jour",
      });
    }
  }

  processing.finalSlots = suggestion.timeSlots?.length || 0;
  processing.finalDates = suggestion.dates?.length || 0;

  return {
    suggestion,
    processing,
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const userInput = process.argv[2];

  if (!userInput) {
    console.log(`
${colors.bright}Usage:${colors.reset}
  node scripts/gemini-debug.js "votre prompt"

${colors.bright}Exemples:${colors.reset}
  node scripts/gemini-debug.js "fais-moi un sondage pour un déjeuner la semaine prochaine entre midi et deux"
  node scripts/gemini-debug.js "réunion mardi ou mercredi prochain"
  node scripts/gemini-debug.js "brunch samedi ou dimanche"
`);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(80));
  console.log(`${colors.bright}${colors.cyan}  GEMINI PIPELINE DEBUG${colors.reset}`);
  console.log("=".repeat(80));

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1: Question utilisateur
  // ═══════════════════════════════════════════════════════════════════════════
  header("1. QUESTION UTILISATEUR");
  console.log(`  "${colors.yellow}${userInput}${colors.reset}"`);

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2: Parsing temporel
  // ═══════════════════════════════════════════════════════════════════════════
  header("2. PARSING TEMPOREL");
  const parsed = parseTemporalInputSimple(userInput);

  highlight("Type détecté", parsed.type);
  highlight("Contexte repas", parsed.isMealContext ? "✅ OUI" : "❌ NON");
  highlight("Plage horaire explicite", parsed.hasExplicitTimeRange ? "✅ OUI" : "❌ NON");
  highlight("Semaines relatives", parsed.relativeWeeks);
  highlight(
    "Jours de la semaine",
    parsed.dayOfWeek.length > 0 ? parsed.dayOfWeek.join(", ") : "Aucun",
  );
  highlight("Mots-clés détectés", parsed.detectedKeywords.join(", ") || "Aucun");
  highlight(
    "Dates autorisées",
    `${parsed.allowedDates[0]} → ${parsed.allowedDates[parsed.allowedDates.length - 1]}`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3: Hints activés
  // ═══════════════════════════════════════════════════════════════════════════
  header("3. HINTS ACTIVÉS");
  const hints = buildHintsFromParsed(parsed, userInput);

  if (hints.length === 0) {
    warning("Aucun hint activé");
  } else {
    hints.forEach((hint, i) => {
      console.log(`  ${colors.magenta}${i + 1}. ${hint.type}${colors.reset}`);
      console.log(`     Règle: ${hint.rule}`);
      console.log(`     Raison: ${colors.dim}${hint.reason}${colors.reset}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4: Prompt envoyé à Gemini
  // ═══════════════════════════════════════════════════════════════════════════
  header("4. PROMPT ENVOYÉ À GEMINI");
  const prompt = buildPrompt(userInput, hints);
  console.log(colors.dim + "─".repeat(60) + colors.reset);
  console.log(prompt);
  console.log(colors.dim + "─".repeat(60) + colors.reset);

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 5: Appel Gemini
  // ═══════════════════════════════════════════════════════════════════════════
  header("5. RÉPONSE GEMINI BRUTE");

  if (!API_KEY) {
    error("VITE_GEMINI_API_KEY non configuré dans .env.local");
    console.log(
      `\n${colors.dim}Pour activer l'appel Gemini, configurez la clé API dans .env.local${colors.reset}`,
    );
    process.exit(1);
  }

  try {
    info("Appel en cours...");
    const startTime = Date.now();
    const rawResponse = await callGemini(prompt);
    const duration = Date.now() - startTime;

    success(`Réponse reçue en ${duration}ms`);
    console.log(colors.dim + "─".repeat(60) + colors.reset);
    console.log(rawResponse);
    console.log(colors.dim + "─".repeat(60) + colors.reset);

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 6: Post-traitement
    // ═══════════════════════════════════════════════════════════════════════════
    header("6. POST-TRAITEMENT");

    const postProcessed = simulatePostProcessing(rawResponse, parsed, userInput);

    if (postProcessed.error) {
      error(postProcessed.error);
    } else {
      subHeader("Règles appliquées:");
      if (postProcessed.processing.rulesApplied.length === 0) {
        warning("Aucune règle spécifique appliquée");
      } else {
        postProcessed.processing.rulesApplied.forEach((rule) => {
          console.log(`  ${colors.yellow}• ${rule.rule}${colors.reset}`);
          console.log(`    → ${rule.effect}`);
          if (rule.problem) {
            console.log(`    ${colors.red}⚠️ ${rule.problem}${colors.reset}`);
          }
        });
      }

      subHeader("Statistiques:");
      highlight(
        "Dates",
        `${postProcessed.processing.originalDates} → ${postProcessed.processing.finalDates}`,
      );
      highlight(
        "Créneaux",
        `${postProcessed.processing.originalSlots} → ${postProcessed.processing.finalSlots}`,
      );

      // ═══════════════════════════════════════════════════════════════════════════
      // ÉTAPE 7: Résultat final
      // ═══════════════════════════════════════════════════════════════════════════
      header("7. RÉSULTAT FINAL");
      jsonBlock(postProcessed.suggestion);

      // Analyse
      header("8. DIAGNOSTIC");

      const suggestion = postProcessed.suggestion;
      const slotsCount = suggestion.timeSlots?.length || 0;
      const datesCount = suggestion.dates?.length || 0;

      if (parsed.isMealContext && slotsCount > 1) {
        error(
          `PROBLÈME DÉTECTÉ: ${slotsCount} créneaux générés alors que contexte repas = 1 créneau`,
        );
        console.log(`\n${colors.yellow}Cause probable:${colors.reset}`);
        console.log(`  Le regex hasExplicitTimeRange match "entre midi et deux"`);
        console.log(`  → isMealContext est forcé à false (ligne 1022)`);
        console.log(`  → La règle "1 slot pour repas" n'est pas appliquée`);
        console.log(`\n${colors.green}Solution:${colors.reset}`);
        console.log(`  Modifier le regex pour exclure "entre midi" ou ajouter une exception`);
      } else if (parsed.isMealContext && slotsCount === 1) {
        success("OK: Contexte repas avec 1 créneau ✓");
      }

      if (datesCount > 7 && parsed.relativeWeeks === 1) {
        warning(`${datesCount} dates pour "semaine prochaine" - attendu ~5-7`);
      }
    }
  } catch (err) {
    error(`Erreur: ${err.message}`);
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

main().catch(console.error);
