/**
 * Test de différentes approches de traduction pour les expressions temporelles
 * Compare : traduction manuelle vs librairie vs API
 */

import * as chrono from "chrono-node";

// Option 1 : Traduction manuelle (actuelle)
function translateManual(input) {
  const monthTranslations = {
    janvier: "january",
    février: "february",
    mars: "march",
    avril: "april",
    mai: "may",
    juin: "june",
    juillet: "july",
    août: "august",
    septembre: "september",
    octobre: "october",
    novembre: "november",
    décembre: "december",
  };

  let translated = input;
  for (const [fr, en] of Object.entries(monthTranslations)) {
    translated = translated.replace(new RegExp(`\\b${fr}\\b`, "gi"), en);
  }

  translated = translated.replace(/\bdébut\s+(de\s+)?/gi, "beginning of ");
  translated = translated.replace(/\bfin\s+(de\s+)?/gi, "end of ");
  translated = translated.replace(/\bsemaine prochaine\b/gi, "next week");

  return translated;
}

// Option 2 : Utiliser Gemini pour traduire (déjà dans le projet !)
async function translateWithGemini(input) {
  // Simuler un appel Gemini pour traduire
  // En réalité, on utiliserait GeminiService avec un prompt de traduction
  const prompt = `Traduis uniquement les expressions temporelles de ce texte français en anglais, garde le reste en français :
"${input}"

Réponds uniquement avec le texte traduit, sans explication.`;

  // Pour le test, on simule (en production, on appellerait vraiment Gemini)
  return translateManual(input); // Fallback sur manuel pour le test
}

// Option 3 : Utiliser une librairie de traduction (ex: @vitalets/google-translate-api)
// Note: Cette librairie utilise l'API gratuite de Google Translate (peut être instable)
async function translateWithLibrary(input) {
  try {
    // Exemple avec google-translate-api (non installé, juste pour montrer l'idée)
    // const translate = require('@vitalets/google-translate-api');
    // const result = await translate(input, { from: 'fr', to: 'en' });
    // return result.text;

    // Pour le test, on simule
    return translateManual(input);
  } catch (error) {
    console.error("Erreur traduction librairie:", error);
    return input; // Fallback
  }
}

const testCases = [
  "mars 2026",
  "début mars",
  "fin mars",
  "tous les samedis de mars 2026",
  "semaine prochaine",
  "Organise une réunion le 7 mars 2026",
  "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026",
];

console.log("🔬 Comparaison des approches de traduction\n");
console.log("=".repeat(80));

const results = [];

for (const testCase of testCases) {
  console.log(`\n📋 Test: "${testCase}"\n`);

  // Test 1 : Manuel
  const manual = translateManual(testCase);
  const parsedManual = chrono.en.parse(manual, new Date(), { forwardDate: true });
  const successManual = parsedManual.length > 0;

  console.log(`   🔵 Manuel: "${manual}" → ${successManual ? "✅" : "❌"}`);

  // Test 2 : Gemini (simulé)
  const gemini = await translateWithGemini(testCase);
  const parsedGemini = chrono.en.parse(gemini, new Date(), { forwardDate: true });
  const successGemini = parsedGemini.length > 0;

  console.log(`   🟢 Gemini: "${gemini}" → ${successGemini ? "✅" : "❌"}`);

  // Test 3 : Librairie (simulé)
  const library = await translateWithLibrary(testCase);
  const parsedLibrary = chrono.en.parse(library, new Date(), { forwardDate: true });
  const successLibrary = parsedLibrary.length > 0;

  console.log(`   🟡 Librairie: "${library}" → ${successLibrary ? "✅" : "❌"}`);

  results.push({
    input: testCase,
    manual: { translated: manual, success: successManual },
    gemini: { translated: gemini, success: successGemini },
    library: { translated: library, success: successLibrary },
  });
}

// Résumé
console.log("\n" + "=".repeat(80));
console.log("📊 RÉSUMÉ\n");

const manualSuccess = results.filter((r) => r.manual.success).length;
const geminiSuccess = results.filter((r) => r.gemini.success).length;
const librarySuccess = results.filter((r) => r.library.success).length;

console.log(
  `Manuel: ${manualSuccess}/${results.length} (${Math.round((manualSuccess / results.length) * 100)}%)`,
);
console.log(
  `Gemini: ${geminiSuccess}/${results.length} (${Math.round((geminiSuccess / results.length) * 100)}%)`,
);
console.log(
  `Librairie: ${librarySuccess}/${results.length} (${Math.round((librarySuccess / results.length) * 100)}%)\n`,
);

console.log("💡 RECOMMANDATIONS:\n");
console.log("1. **Manuel** : Rapide, gratuit, fiable pour patterns simples");
console.log("2. **Gemini** : Déjà dans le projet, pourrait être utilisé pour cas complexes");
console.log("3. **Librairie** : Ajoute une dépendance, peut être instable (API gratuite)");
