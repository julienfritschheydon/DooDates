/**
 * Hook de détection et traitement des intentions de modification de polls via langage naturel.
 *
 * Détecte automatiquement les intentions de l'utilisateur pour modifier un poll existant
 * (Date Poll ou Form Poll) sans passer par l'interface graphique.
 *
 * @example
 * ```tsx
 * const intentDetection = useIntentDetection({
 *   currentPoll: poll,
 *   onDispatchAction: dispatchPollAction,
 * });
 *
 * const result = await intentDetection.detectIntent("Ajoute une question sur l'âge");
 * if (result.handled) {
 *   // L'intention a été traitée, pas besoin d'appeler Gemini
 * }
 * ```
 *
 * @module hooks/useIntentDetection
 */
interface Message {
    id: string;
    content: string;
    isAI: boolean;
    timestamp: Date;
}
interface IntentResult {
    handled: boolean;
    userMessage?: Message;
    confirmMessage?: Message;
    aiProposal?: {
        userRequest: string;
        generatedContent: any;
        pollContext?: {
            pollId?: string;
            pollTitle?: string;
            pollType?: string;
            action?: string;
        };
    };
    action?: {
        type: string;
        payload: any;
    };
    modifiedQuestionId?: string;
    modifiedField?: "title" | "type" | "options" | "required";
    /** Indique qu'un changement de type de sondage a été détecté */
    isTypeSwitch?: boolean;
    /** Le message original pour créer un nouveau sondage */
    originalMessage?: string;
    /** Type de sondage demandé */
    requestedType?: "date" | "form";
}
/**
 * Options pour le hook useIntentDetection
 */
interface UseIntentDetectionOptions {
    /** Poll actuellement édité (Date ou Form) */
    currentPoll: any;
    /** Callback pour dispatcher les actions de modification du poll */
    onDispatchAction: (action: {
        type: string;
        payload: any;
    }) => void;
}
/**
 * Hook de détection d'intentions pour modifications de polls.
 *
 * Supporte :
 * - Date Polls : Ajout/suppression de dates
 * - Form Polls : Ajout/suppression/modification de questions
 *
 * @param options - Configuration du hook
 * @returns Objet avec la fonction detectIntent
 */
export declare function useIntentDetection(options: UseIntentDetectionOptions): {
    detectIntent: (trimmedText: string) => Promise<IntentResult>;
};
export {};
