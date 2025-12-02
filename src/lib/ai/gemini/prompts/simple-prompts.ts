import { formatDateLocal, getTodayLocal } from "../../../date-utils";
import { isDev } from "../../../env";
import { logger } from "../../../logger";

/**
 * Build contextual hints for date poll generation
 */
export function buildContextualHints(userInput: string): string {
  const today = new Date();
  const currentMonth = today.toLocaleDateString("fr-FR", { month: "long" });
  const currentYear = today.getFullYear();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleDateString(
    "fr-FR",
    { month: "long" },
  );

  // Détecter contexte repas
  const isMealContext = /(déjeuner|dîner|brunch|lunch|repas)/i.test(userInput);

  // Détecter contexte professionnel
  const isWorkContext = /(réunion|meeting|travail|bureau|professionnel|collègue)/i.test(userInput);

  // Détecter contexte événementiel
  const isEventContext = /(anniversaire|fête|célébration|soirée|weekend|vacances)/i.test(userInput);

  let contextualHints = "";

  if (isMealContext) {
    contextualHints += `
🍽️ CONTEXTE REPAS DÉTECTÉ
- Privilégier les créneaux horaires de repas (12h-14h pour déjeuner, 19h-21h pour dîner)
- Durée typique: 1h à 2h maximum
- Éviter les créneaux trop tardifs ou trop matinaux
`;
  }

  if (isWorkContext) {
    contextualHints += `
💼 CONTEXTE PROFESSIONNEL DÉTECTÉ
- Privilégier les horaires de travail (9h-18h)
- Éviter les week-ends et jours fériés
- Durée typique: 30min à 2h selon le type de réunion
`;
  }

  if (isEventContext) {
    contextualHints += `
🎉 CONTEXTE ÉVÉNEMENTIEL DÉTECTÉ
- Privilégier les soirs et week-ends
- Durée typique: 2h à 4h
- Ambiance décontractée
`;
  }

  // Ajouter hints temporels selon le mois actuel
  contextualHints += `
📅 CONTEXTE TEMPOREL ACTUEL
- Mois actuel: ${currentMonth} ${currentYear}
- Mois suivant: ${nextMonth}
- Aujourd'hui: ${getTodayLocal()}
- Saison: ${getSeason(today)}
`;

  return contextualHints;
}

/**
 * Get current season based on date
 */
function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "Printemps";
  if (month >= 5 && month <= 7) return "Été";
  if (month >= 8 && month <= 10) return "Automne";
  return "Hiver";
}

/**
 * Detect if input requires complex hints (date parsing, contextual analysis)
 */
export function isComplexCase(userInput: string): boolean {
  const complexPatterns = [
    // Temporal patterns
    /(dans \d+ (jours|semaines|mois))/i,
    /(le \d{1,2} (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i,
    /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (prochain|dernier)/i,
    // Multiple dates
    /(ou|et|plusieurs)/i,
    // Specific contexts
    /(réunion|meeting|travail|bureau)/i,
    /(anniversaire|fête|célébration|soirée)/i,
    // Meal contexts
    /(déjeuner|dîner|brunch|lunch|repas)/i,
    // Time ranges
    /(matin|après-midi|soir|nuit)/i,
    /(\d{1,2}h|\d{1,2}h\d{2})/i,
  ];

  return complexPatterns.some((pattern) => pattern.test(userInput));
}

/**
 * Build simple prompt for basic date poll generation (no hints)
 */
export function buildSimpleDatePollPrompt(userInput: string): string {
  return `Tu es l'IA DooDates, expert en planification temporelle.

Demande: "${userInput}"

RÈGLES FONDAMENTALES:
1. Dates futures uniquement (>= ${getTodayLocal()})
2. Calculer à partir d'aujourd'hui (${getTodayLocal()})
3. Générer 3-5 dates maximum
4. Format de sortie JSON obligatoire

FORMAT DE SORTIE OBLIGATOIRE:
{
  "title": "Titre clair et descriptif",
  "description": "Description optionnelle",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {
      "start": "HH:MM",
      "end": "HH:MM"
    }
  ],
  "type": "date"
}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
}

/**
 * Build complex prompt with hints for advanced date poll generation
 */
export function buildComplexDatePollPrompt(userInput: string, dateHints: string = ""): string {
  const contextualHints = buildContextualHints(userInput);

  return `Tu es l'IA DooDates, expert en planification temporelle.
${dateHints}
${contextualHints}

Demande: "${userInput}"

RÈGLES FONDAMENTALES:
1. Dates futures uniquement (>= ${getTodayLocal()})
2. Respecter les jours demandés (si "lundi" → uniquement lundis)
3. Calculer à partir d'aujourd'hui (${getTodayLocal()})

PRIORITÉ #1 - SPÉCIFICITÉ DE LA DEMANDE:
- Date très spécifique ("demain", "lundi", "vendredi 15") → 1 DATE PRINCIPALE, max 1-2 alternatives
- Période vague ("cette semaine", "semaine prochaine") → 5-7 dates

PRIORITÉ #2 - CRÉNEAUX HORAIRES:
Générer timeSlots UNIQUEMENT si mentionné :
- Heures précises ("9h", "14h30")
- Plages horaires ("matin", "après-midi", "soir", "midi")
- Mots-clés repas ("déjeuner", "dîner", "brunch")
- Durées ("1h", "30 minutes")

⚠️⚠️⚠️ RÈGLE ABSOLUE - REPAS + DATE SPÉCIFIQUE ⚠️⚠️⚠️
Si la demande contient un mot-clé de REPAS ("déjeuner", "dîner", "brunch", "lunch", "repas")
ET une DATE SPÉCIFIQUE ("demain", "lundi", "vendredi", "dans X jours") :
→ OBLIGATOIRE : 1 DATE UNIQUEMENT (la date spécifique)
→ OBLIGATOIRE : 1 CRÉNEAU UNIQUEMENT autour de l'heure du repas
→ INTERDIT : Générer plusieurs créneaux
→ INTERDIT : Générer plusieurs dates

Cette règle PRIME sur toutes les autres règles de génération de créneaux !

FORMAT DE SORTIE OBLIGATOIRE:
{
  "title": "Titre clair et descriptif",
  "description": "Description optionnelle",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {
      "start": "HH:MM",
      "end": "HH:MM"
    }
  ],
  "type": "date"
}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
}
