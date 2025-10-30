/**
 * Hook pour la reconnaissance vocale avec Web Speech API
 * Permet de transcrire la voix en texte pour le chat
 */

import { useState, useEffect, useCallback, useRef } from "react";

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

  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Vérifier support navigateur
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
      console.log("🎤 Reconnaissance vocale démarrée");
    };

    recognition.onend = () => {
      console.log("🎤 Reconnaissance vocale arrêtée");

      // 🔧 FIX: Redémarrer automatiquement en mode continu
      // Web Speech API s'arrête après ~5-15 secondes, on le relance
      if (continuous && isListening) {
        console.log("🔄 Redémarrage automatique dans 300ms...");
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.warn("⚠️ Impossible de redémarrer:", error);
          }
        }, 300); // Délai pour laisser le temps à la transcription finale
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("❌ Erreur reconnaissance vocale:", event.error);

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

      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript + " ";
          console.log("📝 Transcription finale:", transcript);
        } else {
          interim += transcript;
          console.log("📝 Transcription intermédiaire:", transcript);
        }
      }

      setInterimTranscript(interim);

      if (final) {
        setFinalTranscript((prev) => {
          const newTranscript = prev + final;
          console.log("💾 Transcription totale:", newTranscript);
          return newTranscript;
        });

        if (onTranscriptChange) {
          console.log("🔔 Callback onTranscriptChange:", final.trim());
          onTranscriptChange(final.trim());
        }
      }
    };

    return () => {
      if (recognition && isListening) {
        recognition.stop();
      }
    };
  }, [lang, continuous, interimResults, isListening, onTranscriptChange, onError]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;

    try {
      recognition.start();
    } catch (err) {
      console.error("Erreur démarrage reconnaissance:", err);
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
      console.error("Erreur arrêt reconnaissance:", err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
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
