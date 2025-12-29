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

  const isE2ETesting =
    typeof window !== "undefined" &&
    (window.location.search.includes("e2e-test") ||
      window.navigator.userAgent.includes("Playwright") ||
      (window.navigator as Navigator & { webdriver?: boolean }).webdriver === true);

  const testConnection = useCallback(async () => {
    try {
      // Prevent execution during test teardown when window is undefined
      if (typeof window === "undefined") {
        return;
      }

      if (isE2ETesting) {
        const newStatus: ConnectionStatus = "connected";
        setStatus(newStatus);
        onConnectionChange?.(newStatus);
        return;
      }

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
      // Only update state if we're in a browser environment
      // This prevents "window is not defined" errors during test teardown
      if (typeof window !== "undefined") {
        setStatus("error");
        onConnectionChange?.("error");
      }

      const processedError = handleError(
        error,
        {
          component: "useConnectionStatus",
          operation: "testConnection",
        },
        "Erreur de connexion à Gemini",
      );

      if (!isE2ETesting) {
        logError(processedError, {
          component: "useConnectionStatus",
          operation: "testConnection",
        });
      }

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
      if (!isE2ETesting) {
        reconnectionTimeoutRef.current = setTimeout(() => {
          testConnection();
        }, 10000);
      }
    }
  }, [status, onConnectionChange, onAddMessage, isE2ETesting]);

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
