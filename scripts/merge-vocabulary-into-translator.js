/**
 * Script pour fusionner le vocabulaire généré dans temporalTranslator.ts
 *
 * Usage: node scripts/merge-vocabulary-into-translator.js
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire le vocabulaire généré
const vocabFile = join(
  __dirname,
  "../Docs/TEST/2025-11-21-gemini-parsing-improvements/gemini-vocabulary.json",
);
const translatorFile = join(__dirname, "../src/lib/temporalTranslator.ts");

try {
  const vocabData = JSON.parse(readFileSync(vocabFile, "utf-8"));
  const translatorContent = readFileSync(translatorFile, "utf-8");

  console.log("📚 Fusion du vocabulaire dans temporalTranslator.ts...\n");

  // Extraire les nouvelles traductions
  const newTranslations = {
    verbs: {},
    nouns: {},
    temporal: {},
    adjectives: {},
    expressions: {},
  };

  // Traiter les verbes
  if (vocabData.verbs) {
    vocabData.verbs.forEach((item) => {
      newTranslations.verbs[item.fr] = item.en;
      if (item.variants) {
        item.variants.forEach((variant) => {
          newTranslations.verbs[variant] = item.en;
        });
      }
    });
  }

  // Traiter les noms
  if (vocabData.nouns) {
    vocabData.nouns.forEach((item) => {
      newTranslations.nouns[item.fr] = item.en;
      if (item.variants) {
        item.variants.forEach((variant) => {
          newTranslations.nouns[variant] = item.en;
        });
      }
    });
  }

  // Traiter les expressions temporelles
  if (vocabData.temporal) {
    vocabData.temporal.forEach((item) => {
      newTranslations.temporal[item.fr] = item.en;
      if (item.variants) {
        item.variants.forEach((variant) => {
          newTranslations.temporal[variant] = item.en;
        });
      }
    });
  }

  // Générer le rapport
  const report = {
    timestamp: new Date().toISOString(),
    stats: {
      verbs: Object.keys(newTranslations.verbs).length,
      nouns: Object.keys(newTranslations.nouns).length,
      temporal: Object.keys(newTranslations.temporal).length,
      adjectives: Object.keys(newTranslations.adjectives).length,
      expressions: Object.keys(newTranslations.expressions).length,
    },
    newTranslations,
    instructions: `
Pour intégrer ces traductions dans temporalTranslator.ts :

1. **Verbes** : Ajouter dans TEMPORAL_TRANSLATIONS.verbs (nouvelle section)
2. **Noms** : Ajouter dans TEMPORAL_TRANSLATIONS.nouns (nouvelle section)
3. **Expressions temporelles** : Ajouter dans TEMPORAL_TRANSLATIONS.expressions
4. **Adjectifs** : Ajouter dans TEMPORAL_TRANSLATIONS.adjectives (nouvelle section)
5. **Expressions** : Traiter dans translateManual() avec des regex spécifiques

Note: Vérifier les doublons avec les traductions existantes avant d'ajouter.
    `,
  };

  const reportFile = join(
    __dirname,
    "../Docs/TEST/2025-11-21-gemini-parsing-improvements/vocabulary-merge-report.json",
  );
  writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf-8");

  console.log("✅ Rapport de fusion généré !");
  console.log(`📊 Statistiques :`);
  console.log(`   - Verbes : ${report.stats.verbs}`);
  console.log(`   - Noms : ${report.stats.nouns}`);
  console.log(`   - Expressions temporelles : ${report.stats.temporal}`);
  console.log(`   - Adjectifs : ${report.stats.adjectives}`);
  console.log(`   - Expressions : ${report.stats.expressions}`);
  console.log(`\n📝 Rapport : ${reportFile}`);
  console.log(`\n💡 Consultez le rapport pour les instructions d'intégration.`);
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("⚠️  Fichier vocabulaire non trouvé. Exécutez d'abord ask-gemini-vocabulary.js");
  } else {
    console.error("❌ Erreur :", error.message);
  }
}
