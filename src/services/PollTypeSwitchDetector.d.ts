/**
 * Service de détection des tentatives de changement de type de sondage.
 *
 * Détecte quand un utilisateur essaie de passer d'un type de sondage à un autre
 * (date poll → form poll ou inversement) afin de démarrer automatiquement
 * une nouvelle conversation au lieu d'afficher une erreur.
 *
 * @module services/PollTypeSwitchDetector
 */
import { Poll } from "../types/poll";
/**
 * Résultat de la détection de changement de type
 */
export interface TypeSwitchDetectionResult {
    /** Indique si un changement de type est détecté */
    isTypeSwitch: boolean;
    /** Type actuel du poll (si applicable) */
    currentType?: "date" | "form";
    /** Type demandé par l'utilisateur */
    requestedType?: "date" | "form";
    /** Niveau de confiance de la détection (0-1) */
    confidence: number;
    /** Explication de la détection */
    explanation: string;
}
/**
 * Service de détection des changements de type de sondage
 */
export declare class PollTypeSwitchDetector {
    /**
     * Mots-clés pour Form Polls (questionnaires)
     */
    private static readonly FORM_KEYWORDS;
    /**
     * Mots-clés pour Date Polls (sondages de dates)
     */
    private static readonly DATE_KEYWORDS;
    /**
     * Phrases explicites de changement de type
     */
    private static readonly EXPLICIT_SWITCH_PATTERNS;
    /**
     * Détecte le type demandé dans un message utilisateur
     */
    private static detectRequestedType;
    /**
     * Détecte une phrase explicite de changement ou de création d'un nouveau type
     */
    private static hasExplicitSwitchPhrase;
    /**
     * Détecte si l'utilisateur tente de changer le type de sondage
     *
     * @param message Message de l'utilisateur
     * @param currentPoll Poll actuellement en cours d'édition
     * @returns Résultat de la détection
     */
    static detectTypeSwitch(message: string, currentPoll: Poll | null): TypeSwitchDetectionResult;
    /**
     * Détecte un changement de type avec l'aide de l'IA (fallback pour cas ambigus)
     *
     * @param message Message de l'utilisateur
     * @param currentPoll Poll actuellement en cours d'édition
     * @returns Résultat de la détection avec IA ou null si l'IA n'est pas disponible
     */
    static detectTypeSwitchWithAI(message: string, currentPoll: Poll | null): Promise<TypeSwitchDetectionResult | null>;
}
