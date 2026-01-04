/**
 * Script de test pour identifier les faiblesses de chrono-node
 * Teste directement chrono-node sur les cas problématiques identifiés dans les tests Gemini
 */

import * as chrono from "chrono-node";

const testCases = [
  // Bug #1 - Mois Explicite
  {
    input: "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026",
    expected: "mars 2026",
  },
  { input: "Organise une réunion le 7 mars 2026", expected: "7 mars 2026" },
  { input: "Planifie un événement tous les samedis de mai 2026", expected: "mai 2026" },
  { input: "Crée un sondage pour les dimanches de décembre 2025", expected: "décembre 2025" },
  { input: "Ajoute le 15 janvier 2026", expected: "15 janvier 2026" },

  // Cas avec mois seul
  { input: "mars 2026", expected: "mars 2026" },
  { input: "7 mars 2026", expected: "7 mars 2026" },
  { input: "mars", expected: "mars" },
  { input: "en mars", expected: "mars" },
  { input: "début mars", expected: "début mars" },
  { input: "fin mars", expected: "fin mars" },

  // Cas avec jours de la semaine
  { input: "lundi ou mardi", expected: "lundi ou mardi" },
  { input: "lundi et mardi", expected: "lundi et mardi" },
  { input: "vendredi soir ou samedi matin", expected: "vendredi ou samedi" },

  // Cas réalistes
  { input: "Calcule un brunch samedi 23 ou dimanche 24.", expected: "samedi 23 ou dimanche 24" },
  { input: "Propose trois soirées pour un escape game fin mars.", expected: "fin mars" },
  {
    input: "Trouve un après-midi libre la semaine prochaine pour la visite au musée.",
    expected: "semaine prochaine",
  },
  {
    input: "Bloque un créneau vendredi soir ou samedi matin pour un footing.",
    expected: "vendredi ou samedi",
  },
];

const refDate = new Date(); // Date de référence : aujourd'hui

console.log("🔍 Test des faiblesses de chrono-node\n");
console.log("=".repeat(80));
console.log(`Date de référence: ${refDate.toISOString().split("T")[0]}\n`);

const results = [];

testCases.forEach((testCase, index) => {
  console.log(`\n[Test ${index + 1}] Input: "${testCase.input}"`);
  console.log(`  Attendu: ${testCase.expected}`);

  try {
    const parsed = chrono.fr.parse(testCase.input, refDate, { forwardDate: true });

    if (parsed.length === 0) {
      console.log(`  ❌ CHRONO N'A RIEN DÉTECTÉ`);
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        detected: null,
        success: false,
        issue: "Aucune date détectée",
      });
    } else {
      const firstResult = parsed[0];
      const detectedText = firstResult.text;
      const detectedDate = firstResult.start.date();
      const dateStr = detectedDate.toISOString().split("T")[0];

      console.log(`  ✅ Chrono a détecté: "${detectedText}"`);
      console.log(`  📅 Date extraite: ${dateStr}`);

      // Vérifier si le texte détecté correspond à l'attendu
      const matchesExpected =
        detectedText.toLowerCase().includes(testCase.expected.toLowerCase()) ||
        testCase.expected.toLowerCase().includes(detectedText.toLowerCase());

      if (!matchesExpected) {
        console.log(`  ⚠️  Texte détecté ne correspond pas à l'attendu`);
      }

      results.push({
        input: testCase.input,
        expected: testCase.expected,
        detected: detectedText,
        date: dateStr,
        success: matchesExpected,
        issue: matchesExpected ? null : "Texte détecté ne correspond pas",
      });
    }
  } catch (error) {
    console.log(`  ❌ ERREUR: ${error.message}`);
    results.push({
      input: testCase.input,
      expected: testCase.expected,
      detected: null,
      success: false,
      issue: `Erreur: ${error.message}`,
    });
  }
});

// Résumé
console.log("\n" + "=".repeat(80));
console.log("📊 RÉSUMÉ DES RÉSULTATS\n");

const successCount = results.filter((r) => r.success).length;
const failCount = results.filter((r) => !r.success).length;

console.log(`✅ Succès: ${successCount}/${results.length}`);
console.log(`❌ Échecs: ${failCount}/${results.length}\n`);

if (failCount > 0) {
  console.log("🔴 CAS PROBLÉMATIQUES:\n");
  results
    .filter((r) => !r.success)
    .forEach((result, index) => {
      console.log(`${index + 1}. "${result.input}"`);
      console.log(`   Attendu: ${result.expected}`);
      console.log(`   Détecté: ${result.detected || "RIEN"}`);
      console.log(`   Problème: ${result.issue}\n`);
    });
}

// Patterns non reconnus
const unrecognizedPatterns = results
  .filter((r) => !r.success && r.detected === null)
  .map((r) => r.input);

if (unrecognizedPatterns.length > 0) {
  console.log("📋 PATTERNS NON RECONNUS PAR CHRONO:\n");
  unrecognizedPatterns.forEach((pattern, index) => {
    console.log(`${index + 1}. "${pattern}"`);
  });
}

// Générer un rapport markdown
const reportPath = "scripts/chrono-weaknesses-report.md";
const fs = await import("fs");
const reportContent = `# Rapport des faiblesses de chrono-node

**Date**: ${new Date().toISOString()}
**Date de référence**: ${refDate.toISOString().split("T")[0]}

## Résumé

- **Total de tests**: ${results.length}
- **Succès**: ${successCount}
- **Échecs**: ${failCount}
- **Taux de réussite**: ${Math.round((successCount / results.length) * 100)}%

## Cas problématiques

${results
  .filter((r) => !r.success)
  .map(
    (result, index) => `
### ${index + 1}. "${result.input}"

- **Attendu**: ${result.expected}
- **Détecté**: ${result.detected || "RIEN"}
- **Problème**: ${result.issue}
- **Date extraite**: ${result.date || "N/A"}
`,
  )
  .join("\n")}

## Patterns non reconnus

${unrecognizedPatterns.length > 0 ? unrecognizedPatterns.map((pattern, index) => `${index + 1}. "${pattern}"`).join("\n") : "Aucun"}

## Recommandations

1. **Normalisation des mois français**: Avant d'appeler chrono-node, normaliser les noms de mois français
2. **Pré-processing**: Ajouter des indices contextuels pour aider chrono-node (ex: "mars 2026" → "en mars 2026")
3. **Fallback manuel**: Pour les cas non reconnus, utiliser un parsing manuel basé sur les patterns identifiés
`;

await fs.promises.writeFile(reportPath, reportContent, "utf8");
console.log(`\n📄 Rapport généré: ${reportPath}`);
