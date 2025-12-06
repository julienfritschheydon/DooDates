/**
 * Configuration centralisée pour Google Gemini
 * Ce fichier doit être la SEULE source de vérité pour le nom du modèle
 */

import constants from "./gemini-constants.json";

export const GEMINI_CONFIG = {
  // Modèle actuel : version Flash 2.0 (non expérimentale)
  // Utiliser "gemini-2.0-flash" pour la prod, "gemini-2.0-flash-exp" pour les tests si besoin
  MODEL_NAME: constants.MODEL_NAME,

  // URL de base pour l'API directe (bypass edge function)
  API_BASE_URL: constants.API_BASE_URL,

  // Versions
  API_VERSION: constants.API_VERSION,

  // Defaults
  DEFAULT_TEMPERATURE: constants.DEFAULT_TEMPERATURE,
  DEFAULT_TOP_K: constants.DEFAULT_TOP_K,
  DEFAULT_TOP_P: constants.DEFAULT_TOP_P,
} as const;

export const getGeminiModelName = () => GEMINI_CONFIG.MODEL_NAME;

export const getGeminiApiUrl = (apiKey: string) => {
  return `${GEMINI_CONFIG.API_BASE_URL}/${GEMINI_CONFIG.MODEL_NAME}:generateContent?key=${apiKey}`;
};
