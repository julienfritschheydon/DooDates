/**
 * Hook pour la reconnaissance vocale avec Web Speech API
 * Permet de transcrire la voix en texte pour le chat
 */
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
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
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
  /** Est sur mobile (pour afficher des messages adaptés) */
  isMobile: boolean;
  /** Navigateur non supporté (ex: Safari iOS) */
  isUnsupportedBrowser: boolean;
}
export interface VoiceRecognitionActions {
  /** Démarrer l'écoute (async pour demander permissions sur mobile) */
  startListening: () => Promise<void>;
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
export declare function useVoiceRecognition(
  options?: UseVoiceRecognitionOptions,
): VoiceRecognitionState & VoiceRecognitionActions;
export {};
