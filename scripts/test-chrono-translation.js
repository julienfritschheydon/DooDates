/**
 * Test : Traduire les expressions temporelles françaises en anglais pour chrono-node
 * Si chrono est fort en anglais, cette approche pourrait être meilleure
 */

import * as chrono from "chrono-node";

// Mapping simple français → anglais pour les expressions temporelles
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

const dayTranslations = {
  dimanche: "sunday",
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
};

const periodTranslations = {
  début: "beginning of",
  fin: "end of",
  en: "in",
  courant: "current",
};

function translateTemporalToEnglish(frenchText) {
  let english = frenchText;

  // Traduire les mois
  for (const [fr, en] of Object.entries(monthTranslations)) {
    const regex = new RegExp(`\\b${fr}\\b`, "gi");
    english = english.replace(regex, en);
  }

  // Traduire les jours
  for (const [fr, en] of Object.entries(dayTranslations)) {
    const regex = new RegExp(`\\b${fr}\\b`, "gi");
    english = english.replace(regex, en);
  }

  // Traduire les périodes
  for (const [fr, en] of Object.entries(periodTranslations)) {
    const regex = new RegExp(`\\b${fr}\\b`, "gi");
    english = english.replace(regex, en);
  }

  // Traduire "tous les" → "every"
  english = english.replace(/\btous les\b/gi, "every");

  // Traduire "semaine prochaine" → "next week"
  english = english.replace(/\bsemaine prochaine\b/gi, "next week");

  // Traduire "cette semaine" → "this week"
  english = english.replace(/\bcette semaine\b/gi, "this week");

  // Traduire "demain" → "tomorrow"
  english = english.replace(/\bdemain\b/gi, "tomorrow");

  return english;
}

const testCases = [
  { input: "mars 2026", expected: "march 2026" },
  { input: "7 mars 2026", expected: "7 march 2026" },
  { input: "début mars", expected: "beginning of march" },
  { input: "fin mars", expected: "end of march" },
  { input: "en mars", expected: "in march" },
  { input: "tous les samedis de mars 2026", expected: "every saturday in march 2026" },
  { input: "lundi ou mardi", expected: "monday or tuesday" },
  { input: "semaine prochaine", expected: "next week" },
  { input: "Organise une réunion le 7 mars 2026", expected: "Organize a meeting on 7 march 2026" },
  {
    input: "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026",
    expected: "Create a poll for a games weekend. Add every saturday in march 2026",
  },
];

const refDate = new Date();

console.log("🔬 Test : Traduction français → anglais pour chrono-node\n");
console.log("=".repeat(80));
console.log(`Date de référence: ${refDate.toISOString().split("T")[0]}\n`);

const results = [];

testCases.forEach((testCase, index) => {
  console.log(`\n[Test ${index + 1}] Input français: "${testCase.input}"`);

  // Traduire en anglais
  const translated = translateTemporalToEnglish(testCase.input);
  console.log(`   Traduit: "${translated}"`);
  console.log(`   Attendu: "${testCase.expected}"`);

  // Tester avec chrono anglais
  try {
    const parsedEn = chrono.en.parse(translated, refDate, { forwardDate: true });

    // Tester aussi avec chrono français (pour comparaison)
    const parsedFr = chrono.fr.parse(testCase.input, refDate, { forwardDate: true });

    console.log(`\n   📊 Résultats:`);
    console.log(
      `      Chrono FR: ${parsedFr.length > 0 ? `✅ "${parsedFr[0].text}" → ${parsedFr[0].start.date().toISOString().split("T")[0]}` : "❌ RIEN"}`,
    );
    console.log(
      `      Chrono EN: ${parsedEn.length > 0 ? `✅ "${parsedEn[0].text}" → ${parsedEn[0].start.date().toISOString().split("T")[0]}` : "❌ RIEN"}`,
    );

    const improvement = parsedFr.length === 0 && parsedEn.length > 0;
    console.log(
      `      ${improvement ? "🎯 AMÉLIORATION !" : parsedEn.length > 0 ? "✅ OK" : "❌ Échec"}`,
    );

    results.push({
      input: testCase.input,
      translated,
      expected: testCase.expected,
      chronoFr: parsedFr.length > 0 ? parsedFr[0].text : null,
      chronoEn: parsedEn.length > 0 ? parsedEn[0].text : null,
      improvement,
      success: parsedEn.length > 0,
    });
  } catch (error) {
    console.log(`   ❌ ERREUR: ${error.message}`);
    results.push({
      input: testCase.input,
      translated,
      expected: testCase.expected,
      error: error.message,
      success: false,
    });
  }
});

// Résumé
console.log("\n" + "=".repeat(80));
console.log("📊 RÉSUMÉ DES RÉSULTATS\n");

const successCount = results.filter((r) => r.success).length;
const improvementCount = results.filter((r) => r.improvement).length;

console.log(`✅ Succès avec traduction: ${successCount}/${results.length}`);
console.log(`🎯 Améliorations (FR échoue, EN réussit): ${improvementCount}/${results.length}\n`);

if (improvementCount > 0) {
  console.log("🎯 CAS AMÉLIORÉS PAR LA TRADUCTION:\n");
  results
    .filter((r) => r.improvement)
    .forEach((result, index) => {
      console.log(`${index + 1}. "${result.input}"`);
      console.log(`   FR: ${result.chronoFr || "RIEN"}`);
      console.log(`   EN: ${result.chronoEn || "RIEN"}`);
      console.log(`   Traduit: "${result.translated}"\n`);
    });
}

// Générer un rapport
const reportPath = "scripts/chrono-translation-report.md";
const fs = await import("fs");

const reportContent = `# Rapport : Traduction français → anglais pour chrono-node

**Date**: ${new Date().toISOString()}

## Résumé

- **Total de tests**: ${results.length}
- **Succès avec traduction**: ${successCount}
- **Améliorations (FR échoue, EN réussit)**: ${improvementCount}

## Conclusion

${
  improvementCount > 0
    ? `✅ **La traduction améliore significativement les résultats** (${improvementCount} cas améliorés)\n\n**Recommandation**: Implémenter la traduction français → anglais avant d'appeler chrono-node.`
    : "❌ La traduction n'améliore pas significativement les résultats.\n\n**Recommandation**: Garder l'approche de normalisation actuelle."
}

## Détails par cas

${results
  .map(
    (r, index) => `
### ${index + 1}. "${r.input}"

- **Traduit**: "${r.translated}"
- **Chrono FR**: ${r.chronoFr || "RIEN"}
- **Chrono EN**: ${r.chronoEn || "RIEN"}
- **Amélioration**: ${r.improvement ? "✅ OUI" : "❌ NON"}
`,
  )
  .join("\n")}
`;

await fs.promises.writeFile(reportPath, reportContent, "utf8");
console.log(`\n📄 Rapport généré: ${reportPath}`);
