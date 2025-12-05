/**
 * Prototype : Test de l'approche à deux appels IA
 * Compare un appel unique vs deux appels (premier : comprendre intention, deuxième : générer sondage)
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load .env.local
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY non trouvée dans .env.local");
    process.exit(1);
}

const GEMINI_CONFIG = require("./src/config/gemini-constants.json");
const GEMINI_MODEL = GEMINI_CONFIG.MODEL_NAME;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// Cas difficiles à tester
const difficultCases = [
    {
        id: "case-1",
        input: "Organise une réunion le 7 mars 2026",
        description: "Date avec mois explicite"
    },
    {
        id: "case-2",
        input: "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026",
        description: "Mois explicite avec jour de la semaine"
    },
    {
        id: "case-3",
        input: "Calcule un brunch samedi 23 ou dimanche 24.",
        description: "Plusieurs jours avec 'ou'"
    },
    {
        id: "case-4",
        input: "Propose trois soirées pour un escape game fin mars.",
        description: "Mois avec période (fin mars)"
    },
    {
        id: "case-5",
        input: "Bloque un créneau vendredi soir ou samedi matin pour un footing.",
        description: "Plusieurs jours avec horaires différents"
    },
    {
        id: "case-6",
        input: "Trouve un créneau pour un ciné mardi ou mercredi soir.",
        description: "Plusieurs jours avec 'ou' et horaire"
    },
];

/**
 * Approche 1 : Un seul appel (méthode actuelle)
 */
async function singleCallApproach(userInput) {
    const prompt = `Tu es l'IA DooDates, expert en planification temporelle.

Demande: "${userInput}"

RÈGLES FONDAMENTALES:
1. Dates futures uniquement (>= ${new Date().toISOString().split('T')[0]})
2. Respecter les jours demandés (si "lundi" → uniquement lundis)
3. Calculer à partir d'aujourd'hui (${new Date().toISOString().split('T')[0]})

FORMAT JSON:
{
  "title": "Titre",
  "description": "Description optionnelle",
  "dates": ["YYYY-MM-DD"],
  "timeSlots": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "dates": ["YYYY-MM-DD"]
    }
  ],
  "type": "date" ou "datetime"
}

Réponds SEULEMENT avec le JSON, aucun texte supplémentaire.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extraire le JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error(`Erreur single call: ${error.message}`);
        return null;
    }
}

/**
 * Approche 2 : Deux appels (prototype)
 * Premier appel : Comprendre l'intention et extraire les informations temporelles
 * Deuxième appel : Générer le sondage avec les informations structurées
 */
async function twoCallsApproach(userInput) {
    // PREMIER APPEL : Comprendre l'intention
    const understandingPrompt = `Tu es un assistant qui analyse les demandes de planification.

Demande utilisateur: "${userInput}"

OBJECTIF: Extraire et structurer les informations temporelles de manière précise.

Analyse la demande et retourne un JSON avec:
{
  "type": "date" | "datetime" | "form",
  "temporalInfo": {
    "dates": ["dates mentionnées explicitement"],
    "daysOfWeek": ["jours de la semaine mentionnés"],
    "months": ["mois mentionnés"],
    "timeRanges": ["plages horaires mentionnées"],
    "relativeExpressions": ["expressions relatives comme 'semaine prochaine'"],
    "constraints": {
      "hasMultipleDays": true/false,
      "isOrConstraint": true/false,  // "ou" vs "et"
      "isAndConstraint": true/false
    }
  },
  "context": {
    "eventType": "type d'événement",
    "keywords": ["mots-clés importants"]
  },
  "requirements": {
    "minDates": nombre minimum de dates,
    "maxDates": nombre maximum de dates,
    "timeSlotsRequired": true/false
  }
}

Réponds SEULEMENT avec le JSON, aucun texte supplémentaire.`;

    try {
        // Premier appel
        const understandingResult = await model.generateContent(understandingPrompt);
        const understandingText = understandingResult.response.text();
        const understandingJsonMatch = understandingText.match(/\{[\s\S]*\}/);

        if (!understandingJsonMatch) {
            console.error("❌ Impossible de parser la réponse du premier appel");
            return null;
        }

        const understanding = JSON.parse(understandingJsonMatch[0]);

        // DEUXIÈME APPEL : Générer le sondage avec les informations structurées
        const generationPrompt = `Tu es l'IA DooDates, expert en planification temporelle.

Demande utilisateur originale: "${userInput}"

INFORMATIONS EXTRAITES (premier appel):
${JSON.stringify(understanding, null, 2)}

OBJECTIF: Générer un sondage précis basé sur ces informations structurées.

RÈGLES:
1. Utiliser les informations extraites pour générer des dates précises
2. Si "isOrConstraint" = true → générer des dates pour CHAQUE jour mentionné (pas seulement un)
3. Si "isAndConstraint" = true → générer des dates qui respectent TOUS les jours
4. Respecter les contraintes temporelles extraites
5. Dates futures uniquement (>= ${new Date().toISOString().split('T')[0]})

FORMAT JSON:
{
  "title": "Titre (doit inclure les mots-clés importants)",
  "description": "Description optionnelle",
  "dates": ["YYYY-MM-DD"],
  "timeSlots": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "dates": ["YYYY-MM-DD"]
    }
  ],
  "type": "date" ou "datetime"
}

Réponds SEULEMENT avec le JSON, aucun texte supplémentaire.`;

        const generationResult = await model.generateContent(generationPrompt);
        const generationText = generationResult.response.text();
        const generationJsonMatch = generationText.match(/\{[\s\S]*\}/);

        if (!generationJsonMatch) {
            console.error("❌ Impossible de parser la réponse du deuxième appel");
            return null;
        }

        return {
            understanding,
            poll: JSON.parse(generationJsonMatch[0])
        };
    } catch (error) {
        console.error(`Erreur two calls: ${error.message}`);
        return null;
    }
}

/**
 * Compare les deux approches
 */
async function compareApproaches() {
    console.log("🔬 Prototype : Comparaison un appel vs deux appels IA\n");
    console.log("=".repeat(80));

    const results = [];

    for (const testCase of difficultCases) {
        console.log(`\n📋 Test: ${testCase.description}`);
        console.log(`   Input: "${testCase.input}"\n`);

        // Approche 1 : Un seul appel
        console.log("   🔵 Approche 1 (un appel)...");
        const start1 = Date.now();
        const result1 = await singleCallApproach(testCase.input);
        const time1 = Date.now() - start1;

        // Approche 2 : Deux appels
        console.log("   🟢 Approche 2 (deux appels)...");
        const start2 = Date.now();
        const result2 = await twoCallsApproach(testCase.input);
        const time2 = Date.now() - start2;

        // Comparer les résultats
        const comparison = {
            caseId: testCase.id,
            input: testCase.input,
            description: testCase.description,
            singleCall: {
                result: result1,
                time: time1,
                hasDates: result1?.dates?.length > 0,
                datesCount: result1?.dates?.length || 0,
                hasTimeSlots: result1?.timeSlots?.length > 0,
                timeSlotsCount: result1?.timeSlots?.length || 0,
                title: result1?.title || "N/A"
            },
            twoCalls: {
                result: result2,
                time: time2,
                hasDates: result2?.poll?.dates?.length > 0,
                datesCount: result2?.poll?.dates?.length || 0,
                hasTimeSlots: result2?.poll?.timeSlots?.length > 0,
                timeSlotsCount: result2?.poll?.timeSlots?.length || 0,
                title: result2?.poll?.title || "N/A",
                understanding: result2?.understanding
            }
        };

        results.push(comparison);

        // Afficher la comparaison
        console.log(`\n   📊 Comparaison:`);
        console.log(`      Un appel: ${comparison.singleCall.datesCount} dates, ${comparison.singleCall.timeSlotsCount} créneaux (${time1}ms)`);
        console.log(`      Deux appels: ${comparison.twoCalls.datesCount} dates, ${comparison.twoCalls.timeSlotsCount} créneaux (${time2}ms)`);
        console.log(`      Titre (un appel): "${comparison.singleCall.title}"`);
        console.log(`      Titre (deux appels): "${comparison.twoCalls.title}"`);

        if (result2?.understanding) {
            console.log(`      Compréhension (deux appels):`);
            console.log(`         - Type: ${result2.understanding.type}`);
            console.log(`         - Jours: ${result2.understanding.temporalInfo?.daysOfWeek?.join(", ") || "aucun"}`);
            console.log(`         - Mois: ${result2.understanding.temporalInfo?.months?.join(", ") || "aucun"}`);
            console.log(`         - Contrainte "ou": ${result2.understanding.temporalInfo?.constraints?.isOrConstraint || false}`);
        }

        // Attendre un peu entre les tests pour éviter les rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Générer un rapport
    const reportPath = "scripts/two-calls-prototype-report.md";
    const fs = await import("fs");

    let reportContent = `# Rapport du prototype : Deux appels IA

**Date**: ${new Date().toISOString()}

## Résumé

- **Total de cas testés**: ${difficultCases.length}
- **Temps moyen (un appel)**: ${Math.round(results.reduce((sum, r) => sum + r.singleCall.time, 0) / results.length)}ms
- **Temps moyen (deux appels)**: ${Math.round(results.reduce((sum, r) => sum + r.twoCalls.time, 0) / results.length)}ms

## Détails par cas

${results.map((r, index) => `
### ${index + 1}. ${r.description}

**Input**: "${r.input}"

#### Approche 1 (un appel)
- Dates: ${r.singleCall.datesCount}
- Créneaux: ${r.singleCall.timeSlotsCount}
- Titre: "${r.singleCall.title}"
- Temps: ${r.singleCall.time}ms

#### Approche 2 (deux appels)
- Dates: ${r.twoCalls.datesCount}
- Créneaux: ${r.twoCalls.timeSlotsCount}
- Titre: "${r.twoCalls.title}"
- Temps: ${r.twoCalls.time}ms
- Compréhension: ${r.twoCalls.understanding ? JSON.stringify(r.twoCalls.understanding, null, 2) : "N/A"}

#### Comparaison
- Amélioration dates: ${r.twoCalls.datesCount > r.singleCall.datesCount ? "✅" : r.twoCalls.datesCount < r.singleCall.datesCount ? "❌" : "="}
- Amélioration créneaux: ${r.twoCalls.timeSlotsCount > r.singleCall.timeSlotsCount ? "✅" : r.twoCalls.timeSlotsCount < r.singleCall.timeSlotsCount ? "❌" : "="}
- Surcoût temps: ${r.twoCalls.time - r.singleCall.time}ms (${Math.round(((r.twoCalls.time - r.singleCall.time) / r.singleCall.time) * 100)}%)
`).join("\n")}

## Conclusion

${results.filter(r => r.twoCalls.datesCount > r.singleCall.datesCount || r.twoCalls.timeSlotsCount > r.singleCall.timeSlotsCount).length > 0
            ? "✅ L'approche à deux appels montre des améliorations sur certains cas."
            : "❌ L'approche à deux appels ne montre pas d'amélioration significative."}
`;

    await fs.promises.writeFile(reportPath, reportContent, "utf8");
    console.log(`\n📄 Rapport généré: ${reportPath}`);
}

// Exécuter
compareApproaches().catch(console.error);

