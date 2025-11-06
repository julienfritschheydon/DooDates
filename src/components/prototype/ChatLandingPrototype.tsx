import { useNavigate } from "react-router-dom";
import GeminiChatInterface from "../GeminiChatInterface";
import { useConversation } from "./ConversationProvider";

/**
 * Chat Landing Prototype - Phase 6A: Intégration IA réelle
 *
 * Interface chat plein écran avec vraie IA Gemini
 * Remplace le dashboard quand feature flag AI_FIRST_UX est activé
 */
interface ChatLandingPrototypeProps {
  onPollCreated?: (poll: any) => void;
}

export function ChatLandingPrototype({ onPollCreated }: ChatLandingPrototypeProps) {
  const navigate = useNavigate();
  const { createPollFromChat } = useConversation();

  // Quand un sondage est créé, créer dans le Context et naviguer vers /workspace
  const handlePollCreated = (poll: any) => {
    // Créer le sondage dans le Context (ouvre l'éditeur)
    createPollFromChat(poll);

    // Appeler le callback parent si fourni
    onPollCreated?.(poll);

    // Naviguer vers workspace pour afficher le layout avec éditeur
    navigate("/workspace");
  };

  // Layout pleine page pour le chat
  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Padding top pour le header */}
      <div className="pt-14 h-full">
        <GeminiChatInterface onPollCreated={handlePollCreated} darkTheme={true} />
      </div>
    </div>
  );
}
