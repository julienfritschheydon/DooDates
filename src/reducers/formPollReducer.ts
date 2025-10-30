/**
 * Form Poll Reducer - Gestion centralisée des modifications de FormPoll
 *
 * Actions supportées :
 * - ADD_QUESTION : Ajouter une question
 * - REMOVE_QUESTION : Supprimer une question
 * - CHANGE_QUESTION_TYPE : Changer le type d'une question
 * - ADD_OPTION : Ajouter une option à une question
 * - REMOVE_OPTION : Supprimer une option d'une question
 * - SET_REQUIRED : Rendre une question obligatoire/optionnelle
 * - RENAME_QUESTION : Renommer une question
 * - REPLACE_POLL : Remplacer complètement le poll (initialisation)
 */

import type { Poll, FormQuestionShape, FormQuestionOption } from "../lib/pollStorage";

// Types d'actions
export type FormPollAction =
  | { type: "ADD_QUESTION"; payload: { subject: string } }
  | { type: "REMOVE_QUESTION"; payload: { questionIndex: number } }
  | {
      type: "CHANGE_QUESTION_TYPE";
      payload: {
        questionIndex: number;
        newType: "single" | "multiple" | "text" | "matrix";
      };
    }
  | {
      type: "ADD_OPTION";
      payload: { questionIndex: number; optionText: string };
    }
  | {
      type: "REMOVE_OPTION";
      payload: { questionIndex: number; optionText: string };
    }
  | {
      type: "SET_REQUIRED";
      payload: { questionIndex: number; required: boolean };
    }
  | {
      type: "RENAME_QUESTION";
      payload: { questionIndex: number; newTitle: string };
    }
  | { type: "REPLACE_POLL"; payload: Poll };

/**
 * Génère un ID unique pour une question ou option
 */
function generateId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée une nouvelle question par défaut basée sur le sujet
 */
function createDefaultQuestion(subject: string): FormQuestionShape {
  return {
    id: generateId(),
    kind: "single",
    title: subject,
    required: false,
    options: [
      { id: generateId(), label: "Oui" },
      { id: generateId(), label: "Non" },
    ],
  };
}

/**
 * Convertit une question vers un nouveau type
 */
function convertQuestionType(
  question: FormQuestionShape,
  newType: "single" | "multiple" | "text" | "matrix",
): FormQuestionShape {
  const converted: FormQuestionShape = {
    ...question,
    kind: newType,
    type: newType, // Compatibilité avec l'ancien format
  };

  // Gérer les options selon le type
  if (newType === "text") {
    // Questions texte n'ont pas d'options
    delete converted.options;
    delete converted.maxChoices;
    converted.placeholder = "Votre réponse...";
  } else if (newType === "matrix") {
    // Matrices ont des lignes et colonnes
    converted.matrixRows = question.options || [{ id: generateId(), label: "Ligne 1" }];
    converted.matrixColumns = [
      { id: generateId(), label: "Pas du tout" },
      { id: generateId(), label: "Peu" },
      { id: generateId(), label: "Moyennement" },
      { id: generateId(), label: "Beaucoup" },
      { id: generateId(), label: "Énormément" },
    ];
    converted.matrixType = "single";
    delete converted.options;
  } else {
    // single ou multiple : garder les options existantes ou créer par défaut
    if (!converted.options || converted.options.length === 0) {
      converted.options = [
        { id: generateId(), label: "Option 1" },
        { id: generateId(), label: "Option 2" },
      ];
    }

    if (newType === "multiple") {
      converted.maxChoices = converted.options.length;
    } else {
      delete converted.maxChoices;
    }
  }

  return converted;
}

/**
 * Reducer pour gérer les modifications du FormPoll
 * Retourne le poll avec une propriété temporaire _highlightedId pour les animations
 */
export function formPollReducer(state: Poll | null, action: FormPollAction): Poll | null {
  switch (action.type) {
    case "REPLACE_POLL": {
      return action.payload;
    }

    case "ADD_QUESTION": {
      if (!state || state.type !== "form") return state;

      const { subject } = action.payload;
      const newQuestion = createDefaultQuestion(subject);

      const updatedQuestions = [...(state.questions || []), newQuestion];

      return {
        ...state,
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
        _highlightedId: newQuestion.id, // Pour animation
        _highlightType: "add",
      } as any;
    }

    case "REMOVE_QUESTION": {
      if (!state || state.type !== "form") return state;

      const { questionIndex } = action.payload;

      // Vérifier que l'index est valide
      if (!state.questions || questionIndex < 0 || questionIndex >= state.questions.length) {
        return state;
      }

      const updatedQuestions = state.questions.filter((_, index) => index !== questionIndex);

      return {
        ...state,
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
      };
    }

    case "CHANGE_QUESTION_TYPE": {
      if (!state || state.type !== "form") return state;

      const { questionIndex, newType } = action.payload;

      // Vérifier que l'index est valide
      if (!state.questions || questionIndex < 0 || questionIndex >= state.questions.length) {
        return state;
      }

      const updatedQuestions = state.questions.map((q, index) => {
        if (index === questionIndex) {
          return convertQuestionType(q, newType);
        }
        return q;
      });

      return {
        ...state,
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
        _highlightedId: state.questions[questionIndex].id,
        _highlightType: "modify",
      } as any;
    }

    case "ADD_OPTION": {
      if (!state || state.type !== "form") return state;

      const { questionIndex, optionText } = action.payload;

      // Vérifier que l'index est valide
      if (!state.questions || questionIndex < 0 || questionIndex >= state.questions.length) {
        return state;
      }

      const question = state.questions[questionIndex];

      // Vérifier que la question supporte les options
      if (question.kind === "text") {
        return state;
      }

      // Détecter si c'est l'option "Autre" spéciale (avec texte libre)
      const isSpecialOther =
        optionText.toLowerCase() === "autre" || optionText.toLowerCase() === "other";

      const newOption: FormQuestionOption = {
        id: generateId(),
        label: isSpecialOther ? "Autre" : optionText,
        isOther: isSpecialOther, // Marquer comme option spéciale si c'est "Autre"
      };

      const updatedQuestions = state.questions.map((q, index) => {
        if (index === questionIndex) {
          return {
            ...q,
            options: [...(q.options || []), newOption],
          };
        }
        return q;
      });

      return {
        ...state,
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
        _highlightedId: state.questions[questionIndex].id,
        _highlightType: "modify",
      } as any;
    }

    case "REMOVE_OPTION": {
      if (!state || state.type !== "form") return state;

      const { questionIndex, optionText } = action.payload;

      // Vérifier que l'index est valide
      if (!state.questions || questionIndex < 0 || questionIndex >= state.questions.length) {
        return state;
      }

      const question = state.questions[questionIndex];

      // Vérifier que la question a des options
      if (!question.options) {
        return state;
      }

      const updatedQuestions = state.questions.map((q, index) => {
        if (index === questionIndex) {
          return {
            ...q,
            options: q.options?.filter((opt) => opt.label !== optionText),
          };
        }
        return q;
      });

      return {
        ...state,
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
        _highlightedId: state.questions[questionIndex].id,
        _highlightType: "modify",
      } as any;
    }

    case "SET_REQUIRED": {
      if (!state || state.type !== "form") return state;

      const { questionIndex, required } = action.payload;

      // Vérifier que l'index est valide
      if (!state.questions || questionIndex < 0 || questionIndex >= state.questions.length) {
        return state;
      }

      const updatedQuestions = state.questions.map((q, index) => {
        if (index === questionIndex) {
          return {
            ...q,
            required,
          };
        }
        return q;
      });

      return {
        ...state,
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
        _highlightedId: state.questions[questionIndex].id,
        _highlightType: "modify",
      } as any;
    }

    case "RENAME_QUESTION": {
      if (!state || state.type !== "form") {
        return state;
      }

      const { questionIndex, newTitle } = action.payload;

      // Vérifier que l'index est valide et que le titre n'est pas vide
      if (
        !state.questions ||
        questionIndex < 0 ||
        questionIndex >= state.questions.length ||
        !newTitle.trim()
      ) {
        return state;
      }

      const updatedQuestions = state.questions.map((q, index) => {
        if (index === questionIndex) {
          return {
            ...q,
            title: newTitle.trim(),
          };
        }
        return q;
      });

      return {
        ...state,
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
        _highlightedId: state.questions[questionIndex].id,
        _highlightType: "modify",
      } as any;
    }

    default:
      return state;
  }
}
