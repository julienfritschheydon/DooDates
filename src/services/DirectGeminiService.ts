/* eslint-disable @typescript-eslint/no-explicit-any */
// Service pour appeler DIRECTEMENT l'API Gemini (bypass Edge Function)
// À utiliser en développement ou quand Edge Function est HS
// Utilise fetch directement au lieu du SDK Google pour éviter les problèmes de version

import { logger } from "../lib/logger";
import { getEnv } from "../lib/env";
import { GEMINI_CONFIG, getGeminiApiUrl } from "../config/gemini";
import type { GeminiAttachedFile } from "@/services/FileAttachmentService";

export interface DirectGeminiResponse {
  success: boolean;
  data?: string;
  error?: string;
  message?: string;
}

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string; // Base64 encoded image
  };
}

export class DirectGeminiService {
  private static instance: DirectGeminiService;
  private apiKey: string | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  public static getInstance(): DirectGeminiService {
    if (!DirectGeminiService.instance) {
      DirectGeminiService.instance = new DirectGeminiService();
    }
    return DirectGeminiService.instance;
  }

  private constructor() {
    this.initialize();
  }

  private initialize() {
    this.apiKey = getEnv("VITE_GEMINI_API_KEY") || null;

    if (!this.apiKey) {
      logger.error("VITE_GEMINI_API_KEY manquante", "api");
      return;
    }

    logger.info("✅ Direct Gemini API initialisée (fetch direct)", "api");
  }

  /**
   * Retry helper avec backoff exponentiel
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < retries - 1) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt);
          logger.warn(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`, "api", { error });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Appelle DIRECTEMENT l'API Gemini (bypass Edge Function)
   * @param userInput Texte de l'utilisateur
   * @param config Configuration optionnelle (temperature, etc.)
   * @returns Réponse Gemini ou erreur
   */
  async generateContent(
    userInput: string,
    prompt?: string,
    attachedFile?: GeminiAttachedFile,
    config?: { temperature?: number; topK?: number; topP?: number },
  ): Promise<DirectGeminiResponse> {
    try {
      // Tentative de rechargement de la clé si elle est manquante (utile pour les scripts)
      if (!this.apiKey) {
        this.apiKey = getEnv("VITE_GEMINI_API_KEY") || null;
      }

      if (!this.apiKey) {
        return {
          success: false,
          error: "MODEL_NOT_INITIALIZED",
          message: "Gemini API non initialisée. Vérifiez VITE_GEMINI_API_KEY.",
        };
      }

      logger.info("🔵 Appel DIRECT à Gemini API (fetch)", "api", {
        inputLength: userInput.length,
        hasPrompt: !!prompt,
        config,
      });

      const textToSend = prompt || userInput;

      const apiUrl = getGeminiApiUrl(this.apiKey);

      const parts = attachedFile
        ? [
            {
              inlineData: {
                mimeType: attachedFile.mimeType,
                data: attachedFile.contentBase64,
              },
            },
            {
              text: textToSend,
            },
          ]
        : [
            {
              text: textToSend,
            },
          ];

      const requestBody = {
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          temperature: config?.temperature ?? GEMINI_CONFIG.DEFAULT_TEMPERATURE, // Utiliser la config ou défaut
          topK: config?.topK ?? GEMINI_CONFIG.DEFAULT_TOP_K,
          topP: config?.topP ?? GEMINI_CONFIG.DEFAULT_TOP_P,
          maxOutputTokens: 2048,
        },
      };

      // Appel avec retry automatique sur erreurs réseau
      const response = await this.retryWithBackoff(async () => {
        return await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || JSON.stringify(errorData);

        logger.error("Erreur HTTP Gemini", "api", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          errorMessage: errorMessage,
        });

        if (response.status === 429) {
          return {
            success: false,
            error: "RATE_LIMIT_EXCEEDED",
            message: "Trop de requêtes. Veuillez patienter.",
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            error: "QUOTA_EXCEEDED",
            message: "Quota API Gemini dépassé",
          };
        }

        return {
          success: false,
          error: "API_ERROR",
          message: `Erreur HTTP ${response.status}: ${response.statusText} - ${errorMessage}`,
        };
      }

      const data = await response.json();

      // Extraire le texte de la réponse
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) {
        logger.error("Réponse Gemini vide", "api", { data });
        return {
          success: false,
          error: "EMPTY_RESPONSE",
          message: "Réponse Gemini vide",
        };
      }

      logger.info("✅ Réponse Gemini reçue (fetch direct)", "api", {
        responseLength: text.length,
      });

      return {
        success: true,
        data: text,
      };
    } catch (error: unknown) {
      logger.error("Erreur appel direct Gemini", "api", error);
      const err = error as any;

      // Gérer les erreurs réseau
      if (err.message?.includes("fetch") || err.message?.includes("network")) {
        return {
          success: false,
          error: "NETWORK_ERROR",
          message: "Erreur réseau. Vérifiez votre connexion.",
        };
      }

      return {
        success: false,
        error: "API_ERROR",
        message: err.message || "Erreur lors de l'appel direct à Gemini",
      };
    }
  }

  /**
   * Appelle Gemini avec une image (Vision)
   * @param imageBase64 Image en base64 (sans le préfixe data:image/...)
   * @param mimeType Type MIME de l'image (image/jpeg, image/png, etc.)
   * @param prompt Prompt textuel accompagnant l'image
   * @param config Configuration optionnelle
   * @returns Réponse Gemini ou erreur
   */
  async generateContentWithImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    config?: { temperature?: number; topK?: number; topP?: number },
  ): Promise<DirectGeminiResponse> {
    try {
      if (!this.apiKey) {
        this.apiKey = getEnv("VITE_GEMINI_API_KEY") || null;
      }

      if (!this.apiKey) {
        return {
          success: false,
          error: "MODEL_NOT_INITIALIZED",
          message: "Gemini API non initialisée. Vérifiez VITE_GEMINI_API_KEY.",
        };
      }

      logger.info("🔵 Appel DIRECT à Gemini Vision API", "api", {
        mimeType,
        imageSize: imageBase64.length,
        promptLength: prompt.length,
      });

      const apiUrl = getGeminiApiUrl(this.apiKey);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: config?.temperature ?? GEMINI_CONFIG.DEFAULT_TEMPERATURE,
          topK: config?.topK ?? GEMINI_CONFIG.DEFAULT_TOP_K,
          topP: config?.topP ?? GEMINI_CONFIG.DEFAULT_TOP_P,
          maxOutputTokens: 4096, // Plus de tokens pour les réponses détaillées
        },
      };

      const response = await this.retryWithBackoff(async () => {
        return await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || JSON.stringify(errorData);

        logger.error("Erreur HTTP Gemini Vision", "api", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        if (response.status === 429) {
          return {
            success: false,
            error: "RATE_LIMIT_EXCEEDED",
            message: "Trop de requêtes. Veuillez patienter.",
          };
        }

        return {
          success: false,
          error: "API_ERROR",
          message: `Erreur HTTP ${response.status}: ${errorMessage}`,
        };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) {
        logger.error("Réponse Gemini Vision vide", "api", { data });
        return {
          success: false,
          error: "EMPTY_RESPONSE",
          message: "Réponse Gemini Vision vide",
        };
      }

      logger.info("✅ Réponse Gemini Vision reçue", "api", {
        responseLength: text.length,
      });

      return {
        success: true,
        data: text,
      };
    } catch (error: unknown) {
      logger.error("Erreur appel Gemini Vision", "api", error);
      const err = error as any;

      return {
        success: false,
        error: "API_ERROR",
        message: err.message || "Erreur lors de l'appel à Gemini Vision",
      };
    }
  }
}

export const directGeminiService = DirectGeminiService.getInstance();
