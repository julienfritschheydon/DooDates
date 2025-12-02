import { useState, useRef, useCallback } from "react";
import { geminiService } from "../lib/ai/gemini";
import { handleError, logError } from "../lib/error-handling";

export type ConnectionStatus = "unknown" | "connected" | "error";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

interface UseConnectionStatusOptions {
  onConnectionChange?: (status: ConnectionStatus) => void;
  onAddMessage?: (message: Message) => void;
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}) {
  const { onConnectionChange, onAddMessage } = options;

  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const hasShownOfflineMessage = useRef(false);
  const wasOffline = useRef(false);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const testConnection = useCallback(async () => {
    try {
      const isConnected = await geminiService.testConnection();
      const newStatus: ConnectionStatus = isConnected ? "connected" : "error";

      // Si l'IA était hors ligne et redevient disponible
      if (wasOffline.current && isConnected && status === "error") {
        onAddMessage?.({
          id: `reconnected-${Date.now()}`,
          content: "✅ Je suis de nouveau disponible ! Vous pouvez maintenant créer vos sondages.",
          isAI: true,
          timestamp: new Date(),
        });
        wasOffline.current = false;
        hasShownOfflineMessage.current = false;
      }

      setStatus(newStatus);
      onConnectionChange?.(newStatus);

      if (!isConnected) {
        // Afficher le message d'erreur seulement la première fois
        if (!hasShownOfflineMessage.current) {
          const errorMessage =
            "⚠️ Je suis temporairement indisponible. Je vais réessayer de me connecter automatiquement...";

          onAddMessage?.({
            id: `error-${Date.now()}`,
            content: errorMessage,
            isAI: true,
            timestamp: new Date(),
          });
          hasShownOfflineMessage.current = true;
          wasOffline.current = true;
        }

        // Nettoyer le timeout précédent s'il existe
        if (reconnectionTimeoutRef.current) {
          clearTimeout(reconnectionTimeoutRef.current);
        }

        // Réessayer dans 10 secondes
        reconnectionTimeoutRef.current = setTimeout(() => {
          testConnection();
        }, 10000);
      }
    } catch (error) {
      setStatus("error");
      onConnectionChange?.("error");

      const processedError = handleError(
        error,
        {
          component: "useConnectionStatus",
          operation: "testConnection",
        },
        "Erreur de connexion à Gemini",
      );

      logError(processedError, {
        component: "useConnectionStatus",
        operation: "testConnection",
      });

      // Afficher le message d'erreur seulement la première fois
      if (!hasShownOfflineMessage.current) {
        const errorMessage =
          "⚠️ Je suis temporairement indisponible. Je vais réessayer de me connecter automatiquement...";

        onAddMessage?.({
          id: `connection-error-${Date.now()}`,
          content: errorMessage,
          isAI: true,
          timestamp: new Date(),
        });
        hasShownOfflineMessage.current = true;
        wasOffline.current = true;
      }

      // Nettoyer le timeout précédent s'il existe
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }

      // Réessayer dans 10 secondes
      reconnectionTimeoutRef.current = setTimeout(() => {
        testConnection();
      }, 10000);
    }
  }, [status, onConnectionChange, onAddMessage]);

  // Cleanup function pour nettoyer les timeouts
  const cleanup = useCallback(() => {
    if (reconnectionTimeoutRef.current) {
      clearTimeout(reconnectionTimeoutRef.current);
      reconnectionTimeoutRef.current = null;
    }
  }, []);

  return {
    status,
    testConnection,
    cleanup,
  };
}
