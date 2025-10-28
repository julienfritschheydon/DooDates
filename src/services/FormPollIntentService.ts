/**
 * Form Poll Intent Detection Service
 *
 * Détecte les intentions de modification pour les FormPolls :
 * - Ajouter/supprimer des questions
 * - Modifier les options
 * - Changer le type de question
 * - Rendre une question requise/optionnelle
 */

import type { Poll } from "../lib/pollStorage";
import type { FormPollAction } from "@/reducers/formPollReducer";
import writtenNumber from "written-number";

/**
 * Convertit un nombre écrit en toutes lettres en nombre
 * Ex: "seconde" → 2, "troisième" → 3
 */
function parseOrdinalNumber(text: string): number | null {
  const normalized = text.toLowerCase().trim();
  
  // Essayer de parser comme nombre cardinal en français
  const result = writtenNumber(normalized, { lang: "fr" });
  if (typeof result === "number" && result > 0) {
    return result;
  }
  
  // Fallback: mapping manuel pour ordinaux courants non gérés
  const ordinalMap: { [key: string]: number } = {
    première: 1, premier: 1,
    deuxième: 2, seconde: 2, second: 2,
    troisième: 3, quatrième: 4, cinquième: 5,
    sixième: 6, septième: 7, huitième: 8,
    neuvième: 9, dixième: 10,
  };
  
  return ordinalMap[normalized] || null;
}

// Patterns de détection pour Form Polls
const FORM_PATTERNS = {
  // "ajoute une question sur [sujet]" ou "rajoute une question sur [sujet]"
  ADD_QUESTION:
    /r?ajout(?:e|er)\s+(?:une\s+)?question\s+(?:sur|concernant|à\s+propos\s+de)\s+(.+)/i,

  // "supprime/retire la/le question [numéro/ordinal]" ou "supprime Q[numéro]"
  REMOVE_QUESTION:
    /(?:supprime|retire|enl[èe]ve)\s+(?:la\s+)?question\s+(\d+)|(?:supprime|retire|enl[èe]ve)\s+Q(\d+)|(?:supprime|retire|enl[èe]ve)\s+(?:la|le)\s+([\wéèêàâûùîïôç]+)\s+question/i,

  // "change la question [numéro] en [type]"
  CHANGE_QUESTION_TYPE:
    /change\s+(?:la\s+)?question\s+(\d+)\s+en\s+(choix\s+(?:unique|multiple)|texte|matrice)/i,

  // "ajoute l'option [texte] à la question [numéro]"
  ADD_OPTION:
    /ajout(?:e|er)\s+(?:l'|l')?option\s+"([^"]+)"\s+[àa]\s+(?:la\s+)?question\s+(\d+)/i,

  // "supprime l'option [texte] de la question [numéro]"
  REMOVE_OPTION:
    /(?:supprime|retire|enl[èe]ve)\s+(?:l'|l')?option\s+"([^"]+)"\s+de\s+(?:la\s+)?question\s+(\d+)/i,

  // "rends la question [numéro] obligatoire/optionnelle"
  SET_REQUIRED:
    /rends\s+(?:la\s+)?question\s+(\d+)\s+(obligatoire|optionnelle)/i,

  // "renomme la question [numéro] en [nouveau titre]"
  RENAME_QUESTION: /renomme\s+(?:la\s+)?question\s+(\d+)\s+en\s+(.+)/i,
} as const;

export interface FormModificationIntent {
  isModification: boolean;
  action: FormPollAction["type"];
  payload: any;
  confidence: number;
  explanation?: string;
  modifiedField?: "title" | "type" | "options" | "required";
  modifiedQuestionId?: string;
}

/**
 * Service de détection d'intentions pour Form Polls
 */
export class FormPollIntentService {
  /**
   * Détecte si le message contient une intention de modification de Form Poll
   */
  static detectIntent(
    message: string,
    currentPoll: Poll | null,
  ): FormModificationIntent | null {
    // Vérifier que c'est bien un Form Poll
    if (!currentPoll || currentPoll.type !== "form") {
      return null;
    }

    // Pattern 1 : Ajouter une question
    const addQuestionMatch = message.match(FORM_PATTERNS.ADD_QUESTION);
    if (addQuestionMatch) {
      const subject = addQuestionMatch[1].trim();

      return {
        isModification: true,
        action: "ADD_QUESTION",
        payload: { subject },
        confidence: 0.9,
        explanation: `Ajout d'une question sur "${subject}"`,
      };
    }

    // Pattern 2 : Supprimer une question
    const removeQuestionMatch = message.match(FORM_PATTERNS.REMOVE_QUESTION);
    if (removeQuestionMatch) {
      // Groupe 1: "question 1", Groupe 2: "Q1", Groupe 3: "première question"
      const questionStr = removeQuestionMatch[1] || removeQuestionMatch[2] || removeQuestionMatch[3];
      
      // Convertir ordinal/nombre en nombre si nécessaire
      let questionNumber: number;
      if (/^\d+$/.test(questionStr)) {
        questionNumber = parseInt(questionStr);
      } else {
        const parsed = parseOrdinalNumber(questionStr);
        if (!parsed) return null; // Nombre non reconnu
        questionNumber = parsed;
      }
      
      const questionIndex = questionNumber - 1; // Convertir en index 0-based

      // Vérifier que la question existe
      if (
        !currentPoll.questions ||
        questionIndex < 0 ||
        questionIndex >= currentPoll.questions.length
      ) {
        return null;
      }

      return {
        isModification: true,
        action: "REMOVE_QUESTION",
        payload: { questionIndex },
        confidence: 0.95,
        explanation: `Suppression de la question ${questionNumber}`,
      };
    }

    // Pattern 3 : Changer le type de question
    const changeTypeMatch = message.match(FORM_PATTERNS.CHANGE_QUESTION_TYPE);
    if (changeTypeMatch) {
      const questionNumber = parseInt(changeTypeMatch[1]);
      const questionIndex = questionNumber - 1;
      const typeText = changeTypeMatch[2].toLowerCase();

      // Mapper le texte vers le type
      let newType: "single" | "multiple" | "text" | "matrix";
      if (typeText.includes("unique")) {
        newType = "single";
      } else if (typeText.includes("multiple")) {
        newType = "multiple";
      } else if (typeText.includes("texte")) {
        newType = "text";
      } else if (typeText.includes("matrice")) {
        newType = "matrix";
      } else {
        return null;
      }

      // Vérifier que la question existe
      if (
        !currentPoll.questions ||
        questionIndex < 0 ||
        questionIndex >= currentPoll.questions.length
      ) {
        return null;
      }

      return {
        isModification: true,
        action: "CHANGE_QUESTION_TYPE",
        payload: { questionIndex, newType },
        confidence: 0.9,
        explanation: `Question ${questionNumber} changée en ${typeText}`,
        modifiedField: "type",
        modifiedQuestionId: currentPoll.questions[questionIndex].id,
      };
    }

    // Pattern 4 : Ajouter une option
    const addOptionMatch = message.match(FORM_PATTERNS.ADD_OPTION);
    if (addOptionMatch) {
      const optionText = addOptionMatch[1].trim();
      const questionNumber = parseInt(addOptionMatch[2]);
      const questionIndex = questionNumber - 1;

      // Vérifier que la question existe et supporte les options
      if (
        !currentPoll.questions ||
        questionIndex < 0 ||
        questionIndex >= currentPoll.questions.length
      ) {
        return null;
      }

      const question = currentPoll.questions[questionIndex];
      if (question.kind === "text") {
        return null; // Les questions texte n'ont pas d'options
      }

      return {
        isModification: true,
        action: "ADD_OPTION",
        payload: { questionIndex, optionText },
        confidence: 0.9,
        explanation: `Ajout de l'option "${optionText}" à la question ${questionNumber}`,
        modifiedField: "options",
        modifiedQuestionId: currentPoll.questions[questionIndex].id,
      };
    }

    // Pattern 5 : Supprimer une option
    const removeOptionMatch = message.match(FORM_PATTERNS.REMOVE_OPTION);
    if (removeOptionMatch) {
      const optionText = removeOptionMatch[1].trim();
      const questionNumber = parseInt(removeOptionMatch[2]);
      const questionIndex = questionNumber - 1;

      // Vérifier que la question existe
      if (
        !currentPoll.questions ||
        questionIndex < 0 ||
        questionIndex >= currentPoll.questions.length
      ) {
        return null;
      }

      return {
        isModification: true,
        action: "REMOVE_OPTION",
        payload: { questionIndex, optionText },
        confidence: 0.9,
        explanation: `Suppression de l'option "${optionText}" de la question ${questionNumber}`,
        modifiedField: "options",
        modifiedQuestionId: currentPoll.questions[questionIndex].id,
      };
    }

    // Pattern 6 : Rendre obligatoire/optionnelle
    const setRequiredMatch = message.match(FORM_PATTERNS.SET_REQUIRED);
    if (setRequiredMatch) {
      const questionNumber = parseInt(setRequiredMatch[1]);
      const questionIndex = questionNumber - 1;
      const required = setRequiredMatch[2].toLowerCase() === "obligatoire";

      // Vérifier que la question existe
      if (
        !currentPoll.questions ||
        questionIndex < 0 ||
        questionIndex >= currentPoll.questions.length
      ) {
        return null;
      }

      return {
        isModification: true,
        action: "SET_REQUIRED",
        payload: { questionIndex, required },
        confidence: 0.95,
        explanation: `Question ${questionNumber} ${required ? "obligatoire" : "optionnelle"}`,
        modifiedField: "required",
        modifiedQuestionId: currentPoll.questions[questionIndex].id,
      };
    }

    // Pattern 7 : Renommer une question
    const renameMatch = message.match(FORM_PATTERNS.RENAME_QUESTION);
    if (renameMatch) {
      const questionNumber = parseInt(renameMatch[1]);
      const questionIndex = questionNumber - 1;
      const newTitle = renameMatch[2].trim();

      // Vérifier que la question existe et que le titre n'est pas vide
      if (
        !currentPoll.questions ||
        questionIndex < 0 ||
        questionIndex >= currentPoll.questions.length ||
        !newTitle
      ) {
        return null;
      }

      return {
        isModification: true,
        action: "RENAME_QUESTION",
        payload: { questionIndex, newTitle },
        confidence: 0.95,
        explanation: `Question ${questionNumber} renommée en "${newTitle}"`,
        modifiedField: "title",
        modifiedQuestionId: currentPoll.questions[questionIndex].id,
      };
    }

    return null;
  }
}
