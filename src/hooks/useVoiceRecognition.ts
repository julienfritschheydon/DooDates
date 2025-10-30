/**
 * Hook pour la reconnaissance vocale avec Web Speech API
 * Permet de transcrire la voix en texte pour le chat
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "../lib/logger";
import { ErrorFactory, logError } from "../lib/error-handling";
import { VOICE_RECOGNITION_CONFIG } from "../config/voiceRecognition.config";

// Types pour Web Speech API (non inclus dans TypeScript par défaut)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export interface VoiceRecognitionState {
  /** Texte transcrit en cours (interim) */
  interimTranscript: string;
  /** Texte transcrit final */
  finalTranscript: string;
  /** Est en train d'écouter */
  isListening: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** API supportée par le navigateur */
  isSupported: boolean;
}

export interface VoiceRecognitionActions {
  /** Démarrer l'écoute */
  startListening: () => void;
  /** Arrêter l'écoute */
  stopListening: () => void;
  /** Réinitialiser la transcription */
  resetTranscript: () => void;
}

export interface UseVoiceRecognitionOptions {
  /** Langue de reconnaissance (défaut: 'fr-FR') */
  lang?: string;
  /** Résultats intermédiaires (défaut: true) */
  interimResults?: boolean;
  /** Écoute continue (défaut: false) */
  continuous?: boolean;
  /** Callback quand transcription finale */
  onTranscriptChange?: (transcript: string) => void;
  /** Callback quand erreur */
  onError?: (error: string) => void;
}

/**
 * Hook pour utiliser la reconnaissance vocale
 */
export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {},
): VoiceRecognitionState & VoiceRecognitionActions {
  const {
    lang = "fr-FR",
    interimResults = true,
    continuous = false,
    onTranscriptChange,
    onError,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>(""); // Ref pour persister entre les sessions
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onErrorRef = useRef(onError);

  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
    onErrorRef.current = onError;
  }, [onTranscriptChange, onError]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
    } else {
      setIsSupported(false);
      console.warn("Web Speech API non supportée par ce navigateur");
    }
  }, []);

  // Configurer la reconnaissance vocale
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      // Configuration stable : PAS de redémarrage automatique
      // Voir voiceRecognition.config.ts pour l'explication
      if (VOICE_RECOGNITION_CONFIG.autoRestart && continuous && isListening) {
        console.log("🔄 Redémarrage automatique...");
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            logError(
              ErrorFactory.api(
                `Impossible de redémarrer la reconnaissance vocale: ${error}`,
                "Erreur lors du redémarrage automatique",
              ),
              { component: "voice-recognition", operation: "auto-restart" },
            );
            setIsListening(false);
          }
        }, VOICE_RECOGNITION_CONFIG.restartDelay);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logError(
        ErrorFactory.api(
          `Erreur reconnaissance vocale: ${event.error}`,
          "Erreur de reconnaissance",
        ),
        { metadata: { errorType: event.error } },
      );

      // Ignorer l'erreur "no-speech" (silence normal, pas une vraie erreur)
      if (event.error === "no-speech") {
        console.log("⏸️ Silence détecté, arrêt normal");
        return;
      }

      let errorMessage = "Erreur de reconnaissance vocale";

      switch (event.error) {
        case "no-speech":
          errorMessage = "Aucune parole détectée";
          break;
        case "audio-capture":
          errorMessage = "Microphone non accessible";
          break;
        case "not-allowed":
          errorMessage = "Permission microphone refusée";
          break;
        case "network":
          errorMessage = "Erreur réseau";
          break;
        case "aborted":
          errorMessage = "Reconnaissance interrompue";
          break;
        default:
          errorMessage = `Erreur: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);

      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // 🔧 FIX: Exactement comme remarkablemark
      // Boucler depuis resultIndex (pas depuis 0)
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Accumuler les résultats finaux avec la ref
      if (finalText) {
        finalTranscriptRef.current += finalText + " ";
        setFinalTranscript(finalTranscriptRef.current);
        if (onTranscriptChangeRef.current) {
          onTranscriptChangeRef.current(finalText);
        }
      }

      setInterimTranscript(interimText);
    };

    return () => {
      if (recognition && isListening) {
        recognition.stop();
      }
    };
  }, [lang, continuous, interimResults, isListening]);
  // onTranscriptChange et onError sont dans des refs, pas besoin de les mettre en dépendances

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;

    // NE PAS réinitialiser - on veut accumuler entre les sessions
    // setFinalTranscript("");
    // setInterimTranscript("");

    try {
      recognition.start();
    } catch (err: any) {
      // Ignorer l'erreur si déjà démarré
      if (err.message?.includes("already started")) {
        console.log("⚠️ Reconnaissance déjà active");
        return;
      }

      logError(
        ErrorFactory.api("Erreur démarrage reconnaissance vocale", "Impossible de démarrer"),
        { metadata: { error: err } },
      );
      setError("Impossible de démarrer la reconnaissance vocale");
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // 🔧 FIX: Mettre isListening à false AVANT d'arrêter pour éviter le redémarrage auto
    setIsListening(false);

    try {
      recognition.stop();
    } catch (err) {
      logError(ErrorFactory.api("Erreur arrêt reconnaissance vocale", "Impossible d'arrêter"), {
        metadata: { error: err },
      });
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setInterimTranscript("");
    setFinalTranscript("");
    setError(null);
  }, []);

  return {
    interimTranscript,
    finalTranscript,
    isListening,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
