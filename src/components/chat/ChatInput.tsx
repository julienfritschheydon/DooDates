import React from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onUserMessage?: () => void;
  isLoading: boolean;
  darkTheme: boolean;
  voiceRecognition: {
    isSupported: boolean;
    isListening: boolean;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
  };
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  onUserMessage,
  isLoading,
  darkTheme,
  voiceRecognition,
  textareaRef,
}) => {
  return (
    <div
      className={`p-4 md:p-6 fixed bottom-0 left-0 right-0 z-40 ${
        darkTheme ? "bg-[#0a0a0a]" : "bg-white border-t border-gray-200"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`flex items-center gap-2 md:gap-3 rounded-full p-2 border ${
            darkTheme ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200 shadow-lg"
          }`}
        >
          <textarea
            ref={textareaRef}
            data-testid="message-input"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // Notify parent on typing to allow mobile auto-toggle to Chat
              if (typeof onUserMessage === "function") onUserMessage();
            }}
            onFocus={() => {
              // Notify parent on focus as well (helps when Preview is visible on mobile)
              if (typeof onUserMessage === "function") onUserMessage();
            }}
            onKeyDown={onKeyPress}
            placeholder={isLoading ? "Génération en cours..." : "Décrivez votre sondage..."}
            disabled={isLoading}
            className={`flex-1 min-w-0 resize-none border-0 px-2 md:px-4 py-3 focus:outline-none min-h-[44px] max-h-32 text-sm md:text-base bg-transparent ${
              darkTheme ? "text-white placeholder-gray-400" : "text-gray-900 placeholder-gray-500"
            } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            rows={1}
          />

          {/* Bouton micro pour reconnaissance vocale */}
          {voiceRecognition.isSupported && (
            <button
              onClick={() => {
                if (voiceRecognition.isListening) {
                  voiceRecognition.stopListening();
                  // Garder le texte dans l'input après l'arrêt
                } else {
                  // Réinitialiser avant de démarrer pour repartir de zéro
                  voiceRecognition.resetTranscript();
                  voiceRecognition.startListening();
                }
              }}
              disabled={isLoading}
              className={`
                rounded-full p-2 transition-all flex-shrink-0
                ${
                  isLoading
                    ? "bg-transparent text-gray-500 cursor-not-allowed"
                    : voiceRecognition.isListening
                      ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                      : darkTheme
                        ? "bg-transparent text-gray-300 hover:bg-gray-700"
                        : "bg-transparent text-gray-600 hover:bg-gray-100"
                }
              `}
              title={voiceRecognition.isListening ? "Arrêter l'écoute" : "Activer le micro"}
              aria-label={voiceRecognition.isListening ? "Arrêter l'écoute" : "Activer le micro"}
            >
              {voiceRecognition.isListening ? (
                <MicOff className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          )}

          <button
            data-testid="send-message-button"
            onClick={onSend}
            disabled={isLoading || !value.trim()}
            className={`
              rounded-full p-2 transition-all flex-shrink-0
              ${
                isLoading || !value.trim()
                  ? "bg-transparent text-gray-500 cursor-not-allowed"
                  : darkTheme
                    ? "bg-transparent text-gray-300 hover:bg-gray-700"
                    : "bg-transparent text-gray-600 hover:bg-gray-100"
              }
            `}
            title={isLoading ? "Génération en cours..." : "Envoyer"}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
