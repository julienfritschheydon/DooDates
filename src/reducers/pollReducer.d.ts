/**
 * Poll Reducer - Gestion centralisée de l'état du sondage
 *
 * Actions supportées :
 * - ADD_DATE : Ajouter une date au sondage
 * - REMOVE_DATE : Retirer une date du sondage
 * - UPDATE_TITLE : Modifier le titre du sondage
 * - ADD_TIMESLOT : Ajouter un créneau horaire à une date
 * - REPLACE_POLL : Remplacer complètement le sondage
 */
import { Poll } from "../lib/pollStorage";
import { type FormPollAction } from "./formPollReducer";
export type PollAction = {
    type: "ADD_DATE";
    payload: string;
} | {
    type: "REMOVE_DATE";
    payload: string;
} | {
    type: "UPDATE_TITLE";
    payload: string;
} | {
    type: "ADD_TIMESLOT";
    payload: {
        date: string;
        start: string;
        end: string;
    };
} | {
    type: "REPLACE_POLL";
    payload: Poll;
} | FormPollAction;
/**
 * Reducer pour gérer les modifications du sondage
 */
export declare function pollReducer(state: Poll | null, action: PollAction): Poll | null;
