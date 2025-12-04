import { formatDateLocal, getTodayLocal } from "../../date-utils";
import { buildContextualHints } from "./contextualHints";

/**
 * Construit le prompt principal pour la génération de sondages
 * Extrait de gemini.ts pour modularité
 */
export function buildPollGenerationPrompt(userInput: string, dateHints: string = ""): string {
    const contextualHints = buildContextualHints(userInput);
    const today = new Date();

    // Détecter contexte repas + date spécifique
    // const isMealContext = /(déjeuner|dîner|brunch|lunch|repas)/i.test(userInput);
    // const isSpecificDateInInput =
    //   /(demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|dans \d+ jours?)/i.test(
    //     userInput,
    //   );

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

Exemples OBLIGATOIRES :
- "déjeuner demain midi" → 1 date (demain), 1 créneau (12h30-13h30) - PAS 3 créneaux !
- "dîner vendredi soir" → 1 date (vendredi), 1 créneau (19h00-20h00) - PAS plusieurs créneaux !
- "brunch dimanche" → 1 date (dimanche), 1 créneau (10h00-11h00) - PAS plusieurs créneaux !
- "repas lundi midi" → 1 date (lundi), 1 créneau (12h30-13h30) - PAS plusieurs créneaux !

CRÉNEAUX PAR TYPE D'ÉVÉNEMENT:
⚠️ IMPORTANT : Si REPAS + DATE SPÉCIFIQUE → Voir règle absolue ci-dessus (1 créneau uniquement)

Pour les autres cas :
- Déjeuners ("déjeuner", "midi") : 1 créneau (12h30-13h30) par date
- Dîners : 1 créneau (19h00-20h00) par date
- Matin : Plusieurs créneaux (8h-12h, toutes les 30min) - SEULEMENT si pas repas + date spécifique
- Après-midi : Plusieurs créneaux (14h-17h, toutes les 30min) - SEULEMENT si pas repas + date spécifique
- Soir : Plusieurs créneaux (18h30-21h00) - SEULEMENT si pas repas + date spécifique

EXPRESSIONS TEMPORELLES:
- "cette semaine" = semaine actuelle (du ${getTodayLocal()} à 7 jours)
- "semaine prochaine" = semaine suivante
- "demain" = ${formatDateLocal(new Date(today.getTime() + 24 * 60 * 60 * 1000))}
- "dans X jours" = ${getTodayLocal()} + X jours
- "dans X semaines" = ${getTodayLocal()} + (X × 7) jours

EXEMPLES:
- "réunion lundi ou mardi" → type: "date", timeSlots: []
- "réunion lundi matin" → 1 date (lundi), plusieurs créneaux matin
- "déjeuner demain midi" → 1 date (demain), 1 créneau (12h00-13h00)
- "disponibilité cette semaine" → 5-7 dates, pas de créneaux

FORMAT JSON:
{
  "title": "Titre",
  "description": "Description optionnelle",
  "type": "date",
  "dates": ["YYYY-MM-DD"],
  "timeSlots": [{"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}]
}

IMPORTANT:
- Répondre UNIQUEMENT avec le JSON valide.
- Pas de markdown, pas de texte avant/après.
`;
}
