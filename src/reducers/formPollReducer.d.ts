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
import type { Poll } from "../lib/pollStorage";
export type FormPollAction =
  | {
      type: "ADD_QUESTION";
      payload: {
        subject: string;
      };
    }
  | {
      type: "REMOVE_QUESTION";
      payload: {
        questionIndex: number;
      };
    }
  | {
      type: "CHANGE_QUESTION_TYPE";
      payload: {
        questionIndex: number;
        newType: "single" | "multiple" | "text" | "matrix";
      };
    }
  | {
      type: "ADD_OPTION";
      payload: {
        questionIndex: number;
        optionText: string;
      };
    }
  | {
      type: "REMOVE_OPTION";
      payload: {
        questionIndex: number;
        optionText: string;
      };
    }
  | {
      type: "SET_REQUIRED";
      payload: {
        questionIndex: number;
        required: boolean;
      };
    }
  | {
      type: "RENAME_QUESTION";
      payload: {
        questionIndex: number;
        newTitle: string;
      };
    }
  | {
      type: "REPLACE_POLL";
      payload: Poll;
    };
/**
 * Reducer pour gérer les modifications du FormPoll
 * Retourne le poll avec une propriété temporaire _highlightedId pour les animations
 */
export declare function formPollReducer(state: Poll | null, action: FormPollAction): Poll | null;
