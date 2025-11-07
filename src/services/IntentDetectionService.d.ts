/**
 * Intent Detection Service - Détection des intentions de modification
 *
 * Utilise Chrono.js pour un parsing de dates robuste et multilingue :
 * - Jours de la semaine (lundi, mardi, etc.)
 * - Dates complètes (DD/MM/YYYY, YYYY-MM-DD)
 * - Dates relatives (demain, la semaine prochaine, jeudi prochain)
 * - Plages de dates (du 4 au 8)
 * - Support multilingue (FR, EN, etc.)
 *
 * chrono-node est lazy loaded pour réduire le bundle initial
 */
import type { Poll } from "../lib/pollStorage";
import type { PollAction } from "../reducers/pollReducer";
export interface ModificationIntent {
    isModification: boolean;
    action: PollAction["type"];
    payload: unknown;
    confidence: number;
    explanation?: string;
}
export interface MultiModificationIntent {
    isModification: boolean;
    intents: ModificationIntent[];
    confidence: number;
    explanation?: string;
}
/**
 * Détecte si le message utilisateur contient une intention de modification
 */
export declare class IntentDetectionService {
    /**
     * Détecte plusieurs intentions dans une même phrase
     * Ex: "ajoute vendredi 7 et jeudi 13" → 2 intentions
     */
    static detectMultipleIntents(message: string, currentPoll: Poll | null): Promise<MultiModificationIntent | null>;
    static detectSimpleIntent(message: string, currentPoll: Poll | null): Promise<ModificationIntent | null>;
    /**
     * Obtient le numéro du jour de la semaine (0=dimanche, 1=lundi, etc.)
     */
    private static getWeekdayNumber;
    /**
     * Trouve une date correspondant à un jour de la semaine
     * @param weekdayName Nom du jour (lundi, mardi, etc.)
     * @param currentPoll Le sondage actuel
     * @param onlyExisting Si true, cherche uniquement dans les dates existantes du sondage
     * @returns Date au format YYYY-MM-DD ou null
     */
    private static findDateByWeekday;
    /**
     * Construit une intention pour un créneau horaire
     */
    private static buildTimeslotIntent;
}
