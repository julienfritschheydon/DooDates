interface HistoryPanelProps {
  onClose: () => void;
  onConversationSelect?: (conversationId: string) => void;
}
/**
 * Panel historique collapsible (style ChatGPT) - Phase 6C: Historique fonctionnel
 *
 * S'ouvre depuis le burger, affiche l'historique réel des conversations
 */
export default function HistoryPanel({
  onClose,
  onConversationSelect,
}: HistoryPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
