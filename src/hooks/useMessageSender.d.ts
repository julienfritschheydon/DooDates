/**
 * Hook de gestion de l'envoi de messages et des appels à l'API Gemini.
 *
 * Centralise toute la logique d'envoi de messages :
 * - Vérification des quotas
 * - Détection d'intentions
 * - Appel API Gemini
 * - Auto-save des messages
 * - Gestion des erreurs
 *
 * @example
 * ```tsx
 * const messageSender = useMessageSender({
 *   isLoading,
 *   quota,
 *   aiQuota,
 *   toast,
 *   intentDetection,
 *   geminiAPI,
 *   autoSave,
 *   onUserMessage,
 *   setMessages,
 *   setIsLoading,
 *   setLastAIProposal,
 *   setModifiedQuestion,
 * });
 *
 * // Envoyer un message
 * await messageSender.sendMessage("Crée un sondage", true);
 * ```
 *
 * @module hooks/useMessageSender
 */
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: any;
  isGenerating?: boolean;
}
/**
 * Options pour le hook useMessageSender
 */
interface UseMessageSenderOptions {
  /** Indique si un envoi est en cours */
  isLoading: boolean;
  /** Hook de gestion des quotas conversation */
  quota: any;
  /** Hook de gestion des quotas AI messages */
  aiQuota: any;
  /** Fonction toast pour afficher les notifications */
  toast: any;
  /** Hook de détection d'intentions */
  intentDetection: any;
  /** Hook API Gemini */
  geminiAPI: any;
  /** Hook auto-save des messages */
  autoSave: any;
  /** Callback appelé quand l'utilisateur envoie un message */
  onUserMessage?: () => void;
  /** Fonction pour mettre à jour la liste des messages */
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  /** Fonction pour mettre à jour l'état de chargement */
  setIsLoading: (loading: boolean) => void;
  /** Fonction pour stocker la dernière proposition IA */
  setLastAIProposal: (proposal: any) => void;
  /** Fonction pour marquer une question comme modifiée */
  setModifiedQuestion: (
    questionId: string,
    field: "title" | "type" | "options" | "required",
  ) => void;
  /** Callback pour démarrer un nouveau chat (changement de type de sondage) */
  onStartNewChat?: () => Promise<void>;
}
/**
 * Hook de gestion de l'envoi de messages avec appel Gemini.
 *
 * Gère le cycle complet :
 * 1. Vérification quotas
 * 2. Détection intentions (modifications directes)
 * 3. Appel API Gemini si nécessaire
 * 4. Auto-save des messages
 * 5. Gestion erreurs et feedback
 *
 * @param options - Configuration du hook
 * @returns Objet avec la fonction sendMessage
 */
export declare function useMessageSender(options: UseMessageSenderOptions): {
  sendMessage: (text: string, notifyParent: boolean) => Promise<void>;
};
export {};
