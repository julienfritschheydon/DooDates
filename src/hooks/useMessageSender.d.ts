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
  pollSuggestion?: import("../lib/gemini").PollSuggestion;
  isGenerating?: boolean;
}
/**
 * Options pour le hook useMessageSender
 */
interface UseMessageSenderOptions {
  /** Indique si un envoi est en cours */
  isLoading: boolean;
  /** Hook de gestion des quotas conversation */
  quota: {
    canUseFeature: (feature: string) => boolean;
    incrementConversationCreated: () => Promise<void>;
  };
  /** Hook de gestion des quotas AI messages */
  aiQuota: { canSendMessage: () => boolean; incrementMessageSent: () => Promise<void> };
  /** Fonction toast pour afficher les notifications */
  toast: {
    toast: (props: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => void;
  };
  /** Hook de détection d'intentions */
  intentDetection: { detectIntent: (text: string) => Promise<{ handled: boolean }> };
  /** Hook API Gemini */
  geminiAPI: {
    sendMessage: (
      text: string,
    ) => Promise<{ content: string; pollSuggestion?: import("../lib/gemini").PollSuggestion }>;
  };
  /** Hook auto-save des messages */
  autoSave: {
    addMessage: (message: { id: string; content: string; isAI: boolean; timestamp: Date }) => void;
  };
  /** Callback appelé quand l'utilisateur envoie un message */
  onUserMessage?: () => void;
  /** Fonction pour mettre à jour la liste des messages */
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  /** Fonction pour mettre à jour l'état de chargement */
  setIsLoading: (loading: boolean) => void;
  /** Fonction pour stocker la dernière proposition IA */
  setLastAIProposal: (proposal: import("../lib/gemini").PollSuggestion | null) => void;
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
