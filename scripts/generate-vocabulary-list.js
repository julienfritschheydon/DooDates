/**
 * Script pour générer une liste exhaustive de vocabulaire français
 * utilisé dans les sondages et événements, afin d'enrichir la traduction manuelle
 *
 * Usage: node scripts/generate-vocabulary-list.js
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire tous les prompts de test
const testFile = join(__dirname, "../src/test/gemini-comprehensive.test.ts");
const testContent = readFileSync(testFile, "utf-8");

// Extraire tous les inputs
const inputRegex = /input:\s*"([^"]+)"/g;
const inputs = [];
let match;
while ((match = inputRegex.exec(testContent)) !== null) {
  inputs.push(match[1]);
}

console.log(`📋 ${inputs.length} prompts trouvés`);

// Analyser les mots français dans les prompts
const frenchWords = new Set();
const frenchVerbs = new Set();
const frenchNouns = new Set();
const frenchExpressions = new Set();

// Patterns pour identifier différents types de mots
const verbPatterns = [
  /\b(planifie|planifier|trouve|trouver|organise|organiser|bloque|bloquer|propose|proposer|cherche|chercher|crée|créer|fais|faire|prévois|prévoir|génère|générer|ajoute|ajouter|calcule|calculer|repère|repérer|créé|crée|organise|organiser|trouve|trouver|bloque|bloquer|propose|proposer|cherche|chercher|génère|générer|prévois|prévoir|fais|faire|crée|créer|ajoute|ajouter|calcule|calculer|repère|repérer)\b/gi,
];

const nounPatterns = [
  /\b(réunion|équipe|entretien|client|visioconférence|partenaires|suivi|projet|déjeuner|soirée|amis|anniversaire|barbecue|formation|sécurité|atelier|créatif|brainstorming|webinaire|technique|brunch|footing|escape game|visite|musée|apéro|voisins|ciné|AG|association|tournoi|pétanque|bureau|vide-grenier|gala|stand-up|point|budget|lancement|démo|présentation|slides|revue|partenariats|canadien|questionnaire|sondage|satisfaction|produit|service|contact|feedback|évaluation|qualité|prix|matrice|enquête|préférences|participants|nourriture|horaire|allergies|alimentaires|étoiles|commentaires|aspects|réponses)\b/gi,
];

// Extraire les mots français
inputs.forEach((input) => {
  // Extraire les verbes
  verbPatterns.forEach((pattern) => {
    const matches = input.match(pattern);
    if (matches) {
      matches.forEach((m) => {
        frenchVerbs.add(m.toLowerCase());
        frenchWords.add(m.toLowerCase());
      });
    }
  });

  // Extraire les noms
  nounPatterns.forEach((pattern) => {
    const matches = input.match(pattern);
    if (matches) {
      matches.forEach((m) => {
        frenchNouns.add(m.toLowerCase());
        frenchWords.add(m.toLowerCase());
      });
    }
  });

  // Extraire les expressions temporelles
  const temporalExpressions = input.match(
    /\b(début|fin|en|courant|semaine prochaine|cette semaine|semaine dernière|demain|aujourd'hui|hier|dans|deux semaines|trois semaines|quatre semaines|quinze jours|quatorze jours|matin|midi|après-midi|d'après-midi|soir|soirée|nuit|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/gi,
  );
  if (temporalExpressions) {
    temporalExpressions.forEach((expr) => {
      frenchExpressions.add(expr.toLowerCase());
      frenchWords.add(expr.toLowerCase());
    });
  }
});

// Générer le prompt pour Gemini
const geminiPrompt = `Tu es un expert en vocabulaire français pour les sondages, événements et réunions professionnelles.

À partir de cette liste de ${inputs.length} prompts réels extraits de tests :
${inputs
  .slice(0, 10)
  .map((inp, i) => `${i + 1}. "${inp}"`)
  .join("\n")}
... et ${inputs.length - 10} autres prompts similaires.

Génère une liste EXHAUSTIVE de vocabulaire français qui pourrait apparaître dans des prompts de sondages/événements, organisée par catégories :

1. **VERBES D'ACTION** (tous les verbes possibles pour créer/organiser des sondages)
2. **NOMS D'ÉVÉNEMENTS** (types d'événements, réunions, activités)
3. **NOMS DE PARTICIPANTS** (qui participe aux événements)
4. **EXPRESSIONS TEMPORELLES** (toutes les façons de dire dates/heures en français)
5. **ADJECTIFS** (qualificatifs pour événements)
6. **EXPRESSIONS COURANTES** (phrases complètes fréquentes)

Pour chaque mot/expression, fournis :
- Le mot français
- Sa traduction anglaise
- Le contexte d'utilisation (optionnel)

Format de sortie : JSON avec cette structure :
{
  "verbs": [{"fr": "organiser", "en": "organize"}, ...],
  "nouns": [{"fr": "réunion", "en": "meeting"}, ...],
  "temporal": [{"fr": "semaine prochaine", "en": "next week"}, ...],
  "adjectives": [{"fr": "mensuel", "en": "monthly"}, ...],
  "expressions": [{"fr": "faire le point", "en": "check in"}, ...]
}

Sois EXHAUSTIF : pense à tous les synonymes, variantes, et expressions courantes.`;

// Sauvegarder les résultats
const output = {
  extractedFromPrompts: {
    verbs: Array.from(frenchVerbs).sort(),
    nouns: Array.from(frenchNouns).sort(),
    expressions: Array.from(frenchExpressions).sort(),
    allWords: Array.from(frenchWords).sort(),
  },
  geminiPrompt,
  stats: {
    totalPrompts: inputs.length,
    uniqueVerbs: frenchVerbs.size,
    uniqueNouns: frenchNouns.size,
    uniqueExpressions: frenchExpressions.size,
    totalUniqueWords: frenchWords.size,
  },
};

const outputFile = join(
  __dirname,
  "../Docs/TEST/2025-11-21-gemini-parsing-improvements/vocabulary-extraction.json",
);
writeFileSync(outputFile, JSON.stringify(output, null, 2), "utf-8");

console.log("\n✅ Analyse terminée !");
console.log(`📊 Statistiques :`);
console.log(`   - Verbes uniques : ${frenchVerbs.size}`);
console.log(`   - Noms uniques : ${frenchNouns.size}`);
console.log(`   - Expressions temporelles : ${frenchExpressions.size}`);
console.log(`   - Total mots uniques : ${frenchWords.size}`);
console.log(`\n📝 Fichier généré : ${outputFile}`);
console.log(`\n💡 Prochaine étape : Utiliser le prompt Gemini pour générer une liste exhaustive.`);
