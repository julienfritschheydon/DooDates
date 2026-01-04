/**
 * Script pour générer le prompt à utiliser avec Gemini pour créer une liste exhaustive
 * de vocabulaire français pour les sondages/événements
 *
 * Usage: node scripts/ask-gemini-vocabulary.js
 *
 * Le script génère un fichier avec le prompt à copier-coller dans Gemini,
 * puis vous pouvez coller la réponse dans gemini-vocabulary.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire les prompts extraits
const vocabFile = join(
  __dirname,
  "../Docs/TEST/2025-11-21-gemini-parsing-improvements/vocabulary-extraction.json",
);
const vocabData = JSON.parse(readFileSync(vocabFile, "utf-8"));

const prompt = `Tu es un expert en vocabulaire français pour les sondages, événements et réunions professionnelles.

À partir de cette analyse de ${vocabData.stats.totalPrompts} prompts réels :

**Verbes identifiés** (${vocabData.stats.uniqueVerbs}) :
${vocabData.extractedFromPrompts.verbs.join(", ")}

**Noms identifiés** (${vocabData.stats.uniqueNouns}) :
${vocabData.extractedFromPrompts.nouns.join(", ")}

**Expressions temporelles** (${vocabData.stats.uniqueExpressions}) :
${vocabData.extractedFromPrompts.expressions.join(", ")}

Génère une liste EXHAUSTIVE et COMPLÈTE de vocabulaire français qui pourrait apparaître dans des prompts de sondages/événements, organisée par catégories :

1. **VERBES D'ACTION** : Tous les verbes possibles pour créer/organiser des sondages (synonymes, variantes, conjugaisons)
2. **NOMS D'ÉVÉNEMENTS** : Types d'événements, réunions, activités (professionnels, personnels, associatifs)
3. **NOMS DE PARTICIPANTS** : Qui participe aux événements (équipe, clients, partenaires, etc.)
4. **EXPRESSIONS TEMPORELLES** : Toutes les façons de dire dates/heures en français (variantes, expressions courantes)
5. **ADJECTIFS** : Qualificatifs pour événements (mensuel, hebdomadaire, annuel, etc.)
6. **EXPRESSIONS COURANTES** : Phrases complètes fréquentes ("faire le point", "passer en revue", etc.)

Pour chaque mot/expression, fournis :
- Le mot français (forme canonique)
- Sa traduction anglaise
- Les variantes possibles (pluriel, conjugaisons, synonymes)

Format de sortie : JSON strict avec cette structure :
\`\`\`json
{
  "verbs": [
    {"fr": "organiser", "en": "organize", "variants": ["organise", "organiser", "organisé", "organisation"]},
    ...
  ],
  "nouns": [
    {"fr": "réunion", "en": "meeting", "variants": ["réunions"]},
    ...
  ],
  "temporal": [
    {"fr": "semaine prochaine", "en": "next week", "variants": ["semaine suivante"]},
    ...
  ],
  "adjectives": [
    {"fr": "mensuel", "en": "monthly", "variants": ["mensuelle", "mensuels", "mensuelles"]},
    ...
  ],
  "expressions": [
    {"fr": "faire le point", "en": "check in", "variants": ["faire un point", "point"]},
    ...
  ]
}
\`\`\`

Sois EXHAUSTIF : pense à tous les synonymes, variantes, expressions courantes, et termes du domaine professionnel.`;

// Sauvegarder le prompt
const promptFile = join(
  __dirname,
  "../Docs/TEST/2025-11-21-gemini-parsing-improvements/gemini-vocabulary-prompt.txt",
);
writeFileSync(promptFile, prompt, "utf-8");

console.log("✅ Prompt généré avec succès !");
console.log(`\n📝 Fichier : ${promptFile}`);
console.log(`\n💡 Instructions :`);
console.log(`   1. Copiez le contenu du fichier`);
console.log(`   2. Collez-le dans Gemini (via l'interface DooDates ou directement)`);
console.log(`   3. Copiez la réponse JSON`);
console.log(`   4. Collez-la dans : Docs/TEST/.../gemini-vocabulary.json`);
console.log(`\n📋 Ou exécutez directement via l'interface DooDates en utilisant ce prompt.`);
