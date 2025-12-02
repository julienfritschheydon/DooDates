import { formatDateLocal, getTodayLocal } from "../../../date-utils";
import { isDev } from "../../../env";
import { logger } from "../../../logger";
import {
  buildSimpleDatePollPrompt,
  buildComplexDatePollPrompt,
  isComplexCase,
} from "./simple-prompts";
import { buildDateHintsFromParsed } from "../hints/hints-service";

/**
 * Prompt builder service - orchestrates prompt creation based on input complexity
 */
export class PromptBuilder {
  /**
   * Build the appropriate prompt based on input complexity
   */
  static buildDatePollPrompt(userInput: string, dateHints: string = ""): string {
    const isComplex = isComplexCase(userInput);

    if (isDev()) {
      logger.info(`PromptBuilder: ${isComplex ? "COMPLEX" : "SIMPLE"} mode detected`, "api", {
        userInput: userInput.substring(0, 100),
      });
    }

    return isComplex
      ? buildComplexDatePollPrompt(userInput, dateHints)
      : buildSimpleDatePollPrompt(userInput);
  }

  /**
   * Build form poll prompt for structured markdown (COPY mode)
   */
  static buildFormPollPromptCopy(userInput: string): string {
    return `Tu es l'IA DooDates, expert en création de questionnaires.

OBJECTIF: Recopier EXACTEMENT le questionnaire markdown fourni en JSON.

CONTEXTE: L'utilisateur fournit un questionnaire déjà structuré en markdown.
TA MISSION: Le convertir en JSON sans rien inventer.

Markdown fourni:
"${userInput}"

RÈGLES DE CONVERSION:
1. **TITRE** - Extraire le titre principal (# Titre)
2. **QUESTIONS** - Recopier chaque question EXACTEMENT comme dans le markdown
3. **TYPES** - Détecter automatiquement le type selon le format:
   - ☐ ou □ ou - [ ] → "single" (choix unique)
   - ☑ ou ☒ ou - [x] → "multiple" (choix multiples)
   - Ligne vide sans options → "text" (réponse libre)
   - Échelle (1-5, 1-10) → "rating"
   - Questions avec dates → "date"
4. **OPTIONS** - Recopier les options EXACTEMENT comme dans le markdown
5. **ORDRE** - Conserver l'ordre exact des questions
6. **CONDITIONNELLES** - Détecter les règles "Si NON...", "Si OUI..."

FORMAT DE SORTIE OBLIGATOIRE:
{
  "title": "Titre exact extrait du markdown",
  "description": "Description optionnelle",
  "questions": [
    {
      "title": "Question exacte copiée telle quelle",
      "type": "single" | "multiple" | "text" | "rating" | "nps" | "matrix" | "date",
      "required": true,
      "options": ["Option 1 exacte", "Option 2 exacte"],
      "maxChoices": X,
      "ratingScale": 5 | 10,
      "ratingStyle": "numbers" | "stars" | "emojis",
      "validationType": "email" | "phone" | "url" | "number" | "date",
      "selectedDates": ["${getTodayLocal()}"],
      "timeSlotsByDate": {
        "${getTodayLocal()}": [{"hour": 10, "minute": 0, "enabled": true}]
      },
      "timeGranularity": "15min" | "30min" | "1h",
      "allowMaybeVotes": true | false,
      "allowAnonymousVotes": true | false
    }
  ],
  "conditionalRules": [
    {
      "questionId": "question-4",
      "dependsOn": "question-3",
      "showIf": {
        "operator": "equals",
        "value": "Non"
      }
    }
  ],
  "type": "form"
}

IMPORTANT pour les conditionalRules:
- Les IDs des questions doivent correspondre à l'index dans le tableau questions
- Exemple: Question 1 → "question-1", Question 4 → "question-4"
- Si pas de règles conditionnelles, ne pas inclure le champ "conditionalRules"

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
  }

  /**
   * Build form poll prompt for creative generation (GENERATE mode)
   */
  static buildFormPollPromptGenerate(userInput: string): string {
    return `Tu es l'IA DooDates, expert en création de questionnaires et formulaires.

OBJECTIF: Créer un questionnaire pertinent à partir de la demande utilisateur.

Demande: "${userInput}"

RÈGLES DE GÉNÉRATION (MODE CRÉATIF):
1. **TITRE** - Clair et descriptif (max 100 caractères)
2. **QUESTIONS** - 3 à 10 questions pertinentes et logiques
3. **TYPES DE QUESTIONS**:
   - "single" : Choix unique (radio buttons)
   - "multiple" : Choix multiples (checkboxes)
   - "text" : Réponse libre
   - "rating" : Échelle de notation (1-5 ou 1-10)
   - "nps" : Net Promoter Score (0-10)
   - "matrix" : Matrice (lignes × colonnes)
   - "date" : Sélection de dates et horaires
4. **OPTIONS** - Pour single/multiple : 2 à 8 options claires
5. **COHÉRENCE** - Questions logiques, ordonnées et sans redondance
6. **PERTINENCE** - Adapter précisément au contexte de la demande

FORMAT DE SORTIE OBLIGATOIRE:
{
  "title": "Titre clair et descriptif",
  "description": "Description optionnelle",
  "questions": [
    {
      "title": "Question pertinente",
      "type": "single" | "multiple" | "text" | "rating" | "nps" | "matrix" | "date",
      "required": true,
      "options": ["Option 1", "Option 2", "Option 3"],
      "maxChoices": 3,
      "ratingScale": 5,
      "ratingStyle": "numbers",
      "placeholder": "Réponse ici...",
      "maxLength": 500,
      "validationType": "email",
      "selectedDates": ["${getTodayLocal()}"],
      "timeSlotsByDate": {
        "${getTodayLocal()}": [{"hour": 10, "minute": 0, "enabled": true}]
      },
      "timeGranularity": "30min",
      "allowMaybeVotes": false,
      "allowAnonymousVotes": false
    }
  ],
  "type": "form"
}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
  }

  /**
   * Build chat prompt for conversational responses
   */
  static buildChatPrompt(userInput: string, context?: string): string {
    const contextSection = context ? `\nContexte: ${context}\n` : "";

    return `Tu es l'IA DooDates, assistant intelligent pour la planification d'événements et la création de sondages.
${contextSection}
Demande utilisateur: "${userInput}"

RÈGLES DE RÉPONSE:
1. **UTILE** - Fournir une aide concrète et pertinente
2. **PRÉCIS** - Donner des informations exactes et vérifiables
3. **COURTOIS** - Utiliser un ton amical et professionnel
4. **CONCIS** - Aller droit au but sans superflu
5. **ACTIONNABLE** - Proposer des solutions ou prochaines étapes

Si l'utilisateur demande de créer un sondage, propose-lui de l'aider à générer automatiquement le sondage idéal.

Réponds de manière naturelle et utile.`;
  }

  /**
   * Determine if form poll input is structured (markdown) or simple (creative)
   */
  static isStructuredQuestionnaire(input: string): boolean {
    const markdownPatterns = [
      /^#\s+.+$/m, // Titre principal
      /^##\s+.+$/m, // Sections
      /^###\s*Q\d+/m, // Questions numérotées
      /-\s*[☐□]/m, // Checkboxes vides
      /-\s*\[\s*\]/m, // Checkboxes vides (format alternatif)
    ];

    return markdownPatterns.some((pattern) => pattern.test(input)) && input.length > 200;
  }
}
