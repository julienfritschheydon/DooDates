/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "../../../logger";
import { ErrorFactory, logError, handleError } from "../../../error-handling";
import { isDev } from "../../../env";

// Types pour Form Polls (questionnaires)
export interface FormQuestion {
  text: string;
  title: string;
  type: "single" | "multiple" | "text" | "long-text" | "rating" | "nps" | "matrix" | "date";
  required: boolean;
  options?: string[]; // Pour single/multiple
  maxChoices?: number; // Pour multiple
  placeholder?: string; // Pour text/long-text
  maxLength?: number; // Pour text/long-text
  // Rating-specific fields
  ratingScale?: number; // 5 ou 10 (par défaut 5)
  ratingStyle?: "numbers" | "stars" | "emojis"; // Style d'affichage (par défaut numbers)
  ratingMinLabel?: string; // Label pour la valeur minimale
  ratingMaxLabel?: string; // Label pour la valeur maximale
  // Text validation fields
  validationType?: "email" | "phone" | "url" | "number" | "date"; // Type de validation pour champs text
  // Matrix-specific fields
  matrixRows?: Array<{ id: string; label: string }>; // Lignes (aspects à évaluer)
  matrixColumns?: Array<{ id: string; label: string }>; // Colonnes (échelle de réponse)
  matrixType?: "single" | "multiple"; // Une seule réponse par ligne ou plusieurs
  matrixColumnsNumeric?: boolean; // Colonnes numériques (1-5) au lieu de texte
  // Date-specific fields
  selectedDates?: string[]; // Dates au format ISO string (YYYY-MM-DD)
  timeSlotsByDate?: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>; // Créneaux horaires par date
  timeGranularity?: "15min" | "30min" | "1h"; // Granularité des créneaux horaires
  allowMaybeVotes?: boolean; // Permettre les votes "peut-être"
  allowAnonymousVotes?: boolean; // Permettre les votes anonymes
}

export interface FormPollSuggestion {
  title: string;
  description?: string;
  questions: FormQuestion[];
  type: "form";
  conditionalRules?: any[];
}

export class FormPollService {
  private static instance: FormPollService;

  private constructor() {}

  public static getInstance(): FormPollService {
    if (!FormPollService.instance) {
      FormPollService.instance = new FormPollService();
    }
    return FormPollService.instance;
  }

  /**
   * Prompt pour GÉNÉRER un questionnaire créatif (demande simple)
   */
  public buildFormPollPromptGenerate(userInput: string): string {
    return `Tu es l'IA DooDates, expert en création de questionnaires et formulaires.

OBJECTIF: Créer un questionnaire pertinent à partir de la demande utilisateur.

Demande: "${userInput}"

RÈGLES DE GÉNÉRATION (MODE CRÉATIF):
1. **TITRE** - Clair et descriptif (max 100 caractères)
2. **QUESTIONS** - 3 à 10 questions pertinentes et logiques
3. **TYPES DE QUESTIONS**:
 - "single" : Choix unique (radio buttons) - pour sélectionner UNE option
 - "multiple" : Choix multiple (checkboxes) - pour sélectionner PLUSIEURS options
 - "text" : Réponse libre courte (une ligne)
 - "long-text" : Réponse libre longue (paragraphe)
 - "rating" : Note sur 5 ou 10 étoiles/chiffres
 - "nps" : Net Promoter Score (0-10)
 - "matrix" : Grille d'évaluation (plusieurs aspects sur une même échelle)
 - "date" : Sélection de date/heure (si pertinent)

4. **OPTIONS** - Pour single/multiple/matrix, fournir des options claires et distinctes.
5. **LOGIQUE** - Ordre logique des questions (du général au particulier).

FORMAT JSON REQUIS:
{
"title": "Titre du questionnaire",
"description": "Description optionnelle (1-2 phrases)",
"questions": [
  {
    "title": "Texte de la question",
    "type": "single" | "multiple" | "text" | "rating" | "nps" | "matrix" | "date",
    "required": true | false,
    "options": ["Option 1", "Option 2", "..."], // SEULEMENT pour single/multiple
    "maxChoices": 3, // SEULEMENT pour multiple (optionnel)
    "placeholder": "Texte d'aide", // SEULEMENT pour text (optionnel)
    "maxLength": 500, // SEULEMENT pour text (optionnel)
    "validationType": "email" | "phone" | "url" | "number" | "date", // SEULEMENT pour text (optionnel)
    "ratingScale": 5, // SEULEMENT pour rating (5 ou 10)
    "ratingStyle": "stars", // SEULEMENT pour rating (stars/numbers/emojis)
    "matrixRows": [{"id": "r1", "label": "Aspect 1"}], // SEULEMENT pour matrix
    "matrixColumns": [{"id": "c1", "label": "Mauvais"}, {"id": "c2", "label": "Bon"}] // SEULEMENT pour matrix
  }
],
"type": "form"
}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
  }

  /**
   * Prompt pour COPIER un questionnaire existant (markdown parsé)
   */
  public buildFormPollPromptCopy(userInput: string): string {
    return `Tu es l'IA DooDates, expert en conversion de questionnaires.

OBJECTIF: Convertir EXACTEMENT ce questionnaire au format JSON sans AUCUNE modification.

QUESTIONNAIRE À COPIER:
${userInput}

FORMAT DU QUESTIONNAIRE:
- Ligne "TITRE:" suivi du titre exact
- "QUESTION X [type, required]:" suivi du texte de la question
- Options listées avec "- " (une par ligne)
- "(réponse libre)" pour les questions texte
- Section "RÈGLES CONDITIONNELLES:" si présente (optionnelle)

RÈGLES DE CONVERSION (MODE COPIE STRICTE):
1. **FIDÉLITÉ TOTALE** - Copier le titre et les questions mot pour mot.
2. **TYPES** - Respecter scrupuleusement les types indiqués entre crochets [single, multiple, text, etc.].
3. **OPTIONS** - Copier exactement les options listées.
4. **OBLIGATOIRE** - Respecter le flag "required" indiqué.
5. **RÈGLES** - Convertir les règles conditionnelles si présentes.

FORMAT JSON REQUIS:
{
"title": "Titre exact",
"description": "Description (si présente)",
"questions": [
  {
    "title": "Texte exact de la question",
    "type": "single" | "multiple" | "text",
    "required": true | false,
    "options": ["Option 1", "Option 2"] // Si applicable
  }
],
"conditionalRules": [ // OPTIONNEL - seulement si règles détectées
  {
    "questionId": "question-4",  // ID de la question à masquer/afficher
    "dependsOn": "question-3",   // ID de la question dont elle dépend
    "showIf": {
      "operator": "equals",
      "value": "Non"  // Valeur qui déclenche l'affichage
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
   * Parse un questionnaire markdown et extrait la structure
   */
  public parseMarkdownQuestionnaire(markdown: string): string | null {
    try {
      // Nettoyer les commentaires HTML
      let cleaned = markdown.replace(/<!--[\s\S]*?-->/g, "");
      cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

      // Extraire titre principal
      const titleMatch = cleaned.match(/^#\s+(.+?)$/m);
      if (!titleMatch) return null;
      const title = titleMatch[1].trim();

      // Construire un format UNIFORME simplifié pour Gemini
      let prompt = `TITRE: ${title}\n\n`;

      // Extraire les sections (questions)
      // Regex pour trouver "### Q1. Titre" ou "### 1. Titre" ou "### Titre"
      const questionRegex = /^###\s*(?:Q?\d+[.:]?)?\s*(.+)$/gm;
      const questions: Array<{ title: string; start: number; end: number }> = [];

      let match;
      while ((match = questionRegex.exec(cleaned)) !== null) {
        questions.push({
          title: match[1].trim(),
          start: match.index,
          end: 0,
        });
      }

      // Définir les limites de chaque bloc question
      for (let i = 0; i < questions.length; i++) {
        questions[i].end = i < questions.length - 1 ? questions[i + 1].start : cleaned.length;
      }

      // Stocker les règles conditionnelles détectées pour les ajouter à la fin
      const conditionalPatterns: Array<{ title: string; questionNumber: number }> = [];

      // Traiter chaque question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionBlock = cleaned.substring(q.start, q.end);
        const questionNumber = i + 1;
        const questionTitle = q.title;

        // Détecter si c'est une question conditionnelle (ex: "Si NON à Q3...")
        if (questionTitle.match(/^Si\s+(NON|OUI|non|oui)/i)) {
          conditionalPatterns.push({ title: questionTitle, questionNumber });
        } else {
          // Détecter type de question
          const lowerBlock = questionBlock.toLowerCase();
          let type = "single";
          let maxChoices = undefined;

          // Texte libre (détection étendue)
          if (
            lowerBlock.includes("réponse libre") ||
            lowerBlock.includes("texte libre") ||
            lowerBlock.includes("votre réponse") ||
            lowerBlock.includes("_votre réponse") ||
            lowerBlock.includes("commentaires") ||
            lowerBlock.includes("expliquez") ||
            lowerBlock.includes("précisez") ||
            lowerBlock.includes("détailler")
          ) {
            type = "text";
          }
          // Choix multiple avec contrainte
          else {
            const maxMatch = lowerBlock.match(/max\s+(\d+)|(\d+)\s+max/);
            if (maxMatch) {
              type = "multiple";
              maxChoices = parseInt(maxMatch[1] || maxMatch[2]);
            }
            // Choix unique explicite
            else if (
              lowerBlock.includes("1 seule réponse") ||
              lowerBlock.includes("une réponse") ||
              lowerBlock.includes("une seule")
            ) {
              type = "single";
            }
          }

          // Format UNIFORME simplifié
          prompt += `QUESTION ${questionNumber} [${type}`;
          if (maxChoices) prompt += `, max=${maxChoices}`;
          prompt += `, required]:\n${questionTitle}\n`;

          // Extraire options (support TOUS les formats)
          if (type !== "text") {
            // Support: -, *, •, ○, ☐, □, ✓, [ ]
            const optionRegex = /^[\s]*[-*\u2022\u25cb\u2610\u25a1\u2713]\s*(?:\[\s*\])?\s*(.+)$/gm;
            const options: string[] = [];
            let optionMatch;

            while ((optionMatch = optionRegex.exec(questionBlock)) !== null) {
              let option = optionMatch[1].trim();

              // Nettoyer les symboles checkbox résiduels (☐, □, ✓, [ ])
              option = option.replace(/^[☐□✓\u2610\u25a1\u2713]\s*/, "");
              option = option.replace(/^\[\s*\]\s*/, "");
              option = option.trim();

              // Ignorer les sous-titres markdown et "Autre :"
              if (!option.startsWith("#") && !option.startsWith("Autre :") && option.length > 0) {
                options.push(option);
              }
            }

            if (options.length > 0) {
              // Format simple : une ligne par option
              options.forEach((opt: string) => {
                prompt += `- ${opt}\n`;
              });
            }
          } else {
            prompt += `(réponse libre)\n`;
          }

          prompt += "\n";
        }
      }

      // Ajouter les règles conditionnelles détectées
      if (conditionalPatterns.length > 0) {
        prompt += `\nRÈGLES CONDITIONNELLES:\n`;
        for (const pattern of conditionalPatterns) {
          const match = pattern.title.match(/^Si\s+(NON|OUI|non|oui)[,\s]+(.+)/i);
          if (match) {
            const condition = match[1].toUpperCase();
            const dependsOnQuestion = pattern.questionNumber - 1;
            prompt += `- Question ${pattern.questionNumber} s'affiche seulement si Question ${dependsOnQuestion} = "${condition === "OUI" ? "Oui" : "Non"}"\n`;
          }
        }
        prompt += "\n";
      }

      return prompt;
    } catch (error) {
      logger.error("Erreur parsing markdown questionnaire", "api", error);
      return null;
    }
  }

  /**
   * Parse la réponse Gemini pour les Form Polls (questionnaires)
   * @param text Réponse brute de Gemini
   * @returns FormPollSuggestion validée ou null
   */
  public parseFormPollResponse(text: string): FormPollSuggestion | null {
    try {
      // Nettoyer le texte pour extraire le JSON
      const cleanText = text.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // Validation structure Form Poll
        if (
          parsed.title &&
          parsed.questions &&
          Array.isArray(parsed.questions) &&
          (parsed.type === "form" || !parsed.type) // Default to form if structure matches
        ) {
          // Valider chaque question
          const validQuestions = parsed.questions.filter((q: any) => {
            // Titre obligatoire
            if (!q.title || typeof q.title !== "string") return false;

            // Type valide
            const validTypes = [
              "single",
              "multiple",
              "text",
              "long-text",
              "rating",
              "nps",
              "matrix",
              "date",
            ];
            if (!q.type || !validTypes.includes(q.type)) {
              // Fallback: deviner le type
              if (q.options && q.options.length > 0) q.type = "single";
              else q.type = "text";
            }

            // Options obligatoires pour single/multiple
            if (
              (q.type === "single" || q.type === "multiple") &&
              (!q.options || !Array.isArray(q.options) || q.options.length === 0)
            ) {
              return false;
            }

            // Matrix validation
            if (q.type === "matrix") {
              if (
                !q.matrixRows ||
                !Array.isArray(q.matrixRows) ||
                !q.matrixColumns ||
                !Array.isArray(q.matrixColumns)
              ) {
                return false;
              }
            }

            return true;
          });

          // Il faut au moins 1 question valide
          if (validQuestions.length === 0) {
            logError(
              ErrorFactory.validation(
                "No valid questions in form poll",
                "Aucune question valide dans le questionnaire",
              ),
              {
                component: "GeminiService",
                operation: "parseFormPollResponse",
              },
            );
            return null;
          }

          if (isDev()) {
            logger.info(`Form Poll parsed: ${validQuestions.length} questions`, "api");
          }

          return {
            title: parsed.title,
            description: parsed.description,
            questions: validQuestions,
            type: "form",
            conditionalRules: parsed.conditionalRules,
          };
        }
      }

      return null;
    } catch (error) {
      const parseError = handleError(
        error,
        {
          component: "GeminiService",
          operation: "parseFormPollResponse",
        },
        "Erreur lors du parsing de la réponse Form Poll",
      );

      logError(parseError, {
        component: "GeminiService",
        operation: "parseFormPollResponse",
      });

      return null;
    }
  }

  /**
   * Détecte si l'input contient du markdown de questionnaire
   */
  public isMarkdownQuestionnaire(text: string): boolean {
    const hasTitle = /^#\s+.+$/m.test(text);
    const hasSections = /^##\s+.+$/m.test(text);
    const hasQuestions = /^###\s*Q\d+/m.test(text);
    // Support multiple checkbox formats: ☐, □, - [ ], etc.
    const hasCheckboxes = /-\s*[☐□]|^-\s*\[\s*\]/m.test(text);

    const isMarkdown = hasTitle && hasSections && hasQuestions && text.length > 200;

    if (isDev()) {
      logger.info(
        `Markdown detection: title=${hasTitle}, sections=${hasSections}, questions=${hasQuestions}, checkboxes=${hasCheckboxes}, length=${text.length}, result=${isMarkdown}`,
        "api",
      );
    }

    // Doit avoir au moins titre + questions ET sections
    return isMarkdown;
  }

  /**
   * Détecte si l'input est un questionnaire structuré (markdown parsé) ou une simple demande
   */
  public isStructuredQuestionnaire(input: string): boolean {
    // Détecter le nouveau format uniforme
    return (
      input.startsWith("TITRE:") &&
      input.includes("QUESTION") &&
      input.includes("[") &&
      (input.includes("- ") || input.includes("(réponse libre)"))
    );
  }
}

export const formPollService = FormPollService.getInstance();
