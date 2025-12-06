import { formatDateLocal, getTodayLocal } from "../../date-utils";
import { buildContextualHints } from "./contextualHints";

/**
 * Prompt SIMPLIFIÉ pour le mode direct (test A/B)
 * Sans pré-processing temporel, Gemini gère tout seul
 */
export function buildDirectPrompt(userInput: string): string {
    const today = new Date();

    return `Tu es l'IA DooDates, expert en planification temporelle.

Demande: "${userInput}"

Aujourd'hui: ${getTodayLocal()} (${today.toLocaleDateString("fr-FR", { weekday: "long" })})
Demain: ${formatDateLocal(new Date(today.getTime() + 24 * 60 * 60 * 1000))}

RÈGLES:
1. Dates FUTURES uniquement (>= ${getTodayLocal()})
2. Si durée mentionnée → générer des timeSlots de cette durée
3. Si "créneau" mentionné → générer des timeSlots
4. Si heure/plage horaire mentionnée → générer des timeSlots

FORMAT JSON (OBLIGATOIRE):
{
  "title": "Titre court",
  "description": "Description optionnelle",
  "type": "date",
  "dates": ["YYYY-MM-DD"],  // ⚠️ OBLIGATOIRE - Liste des dates au niveau racine
  "timeSlots": [{"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}]
}

⚠️ RÈGLE CRITIQUE: Le champ "dates" est OBLIGATOIRE au niveau racine, même si timeSlots existe.

Répondre UNIQUEMENT avec le JSON valide.
`;
}

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

    // Les INSTRUCTIONS STRICTES (dateHints) PRIMENT sur les règles générales
    return `Tu es l'IA DooDates, expert en planification temporelle.
${dateHints}
${contextualHints}

Demande: "${userInput}"

RÈGLES FONDAMENTALES:
- Dates futures uniquement (>= ${getTodayLocal()})
- Calculer à partir d'aujourd'hui (${getTodayLocal()})

⚠️ NOTE: Si des INSTRUCTIONS STRICTES SUR LES DATES sont présentes ci-dessus, elles PRIMENT sur les règles ci-dessous.

PRIORITÉ #1 - SPÉCIFICITÉ DE LA DEMANDE:
- Date très spécifique → 1 DATE PRINCIPALE
- Période vague → 5-7 dates

PRIORITÉ #2 - CRÉNEAUX HORAIRES:
Générer timeSlots UNIQUEMENT si mentionné :
- Heures précises ("9h", "14h30")
- Plages horaires ("matin", "après-midi", "soir", "midi")
- Mots-clés repas ("déjeuner", "dîner", "brunch")
- Durées ("1h", "30 minutes")

⚠️⚠️⚠️ RÈGLE ABSOLUE - REPAS + DATE SPÉCIFIQUE ⚠️⚠️⚠️
Si REPAS et DATE SPÉCIFIQUE :
→ 1 DATE UNIQUEMENT
→ 1 CRÉNEAU UNIQUEMENT autour de l'heure du repas

EXCEPTION À LA RÈGLE ABSOLUE :
Si la demande contient "ou" :
→ Générer TOUTES les options mentionnées

CRÉNEAUX PAR TYPE D'ÉVÉNEMENT:
⚠️ IMPORTANT : Si REPAS + DATE SPÉCIFIQUE → Voir règle absolue ci-dessus

Pour les autres cas :
- Déjeuners : 1 créneau (12h30-13h30) par date
- Dîners : 1 créneau (19h00-20h00) par date
- Matin : Plusieurs créneaux (8h-12h, toutes les 30min)
- Après-midi : Plusieurs créneaux (14h-17h, toutes les 30min)
- Soir : Plusieurs créneaux (18h30-21h00)

EXPRESSIONS TEMPORELLES:
- "cette semaine" = semaine actuelle
- "semaine prochaine" = semaine suivante
- "demain" = ${formatDateLocal(new Date(today.getTime() + 24 * 60 * 60 * 1000))}
- "dans X jours" = ${getTodayLocal()} + X jours
- "dans X semaines" = ${getTodayLocal()} + (X × 7) jours

EXEMPLES:
- "réunion lundi ou mardi" → type: "date", timeSlots: []
- "réunion lundi matin" → 1 date (lundi), plusieurs créneaux matin
- "déjeuner demain midi" → 1 date (demain), 1 créneau (12h00-13h00)
- "disponibilité cette semaine" → 5-7 dates, pas de créneaux

FORMAT JSON (OBLIGATOIRE):
{
  "title": "Titre",
  "description": "Description optionnelle",
  "type": "date",
  "dates": ["YYYY-MM-DD"],  // ⚠️ OBLIGATOIRE - Toujours lister les dates ici
  "timeSlots": [{"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}]
}

IMPORTANT:
- Le champ "dates" est OBLIGATOIRE au niveau racine, même si timeSlots existe.
- Répondre UNIQUEMENT avec le JSON valide.
- Pas de markdown, pas de texte avant/après.
`;
}
