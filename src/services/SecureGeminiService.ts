// Service sécurisé pour appeler Gemini via Edge Function
// Remplace les appels directs à Gemini API côté client

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { handleError, ErrorFactory, logError } from "@/lib/error-handling";

export interface SecureGeminiResponse {
  success: boolean;
  data?: string;
  error?: string;
  message?: string;
  creditsRemaining?: number;
}

export class SecureGeminiService {
  private static instance: SecureGeminiService;
  private supabaseUrl: string;

  public static getInstance(): SecureGeminiService {
    if (!SecureGeminiService.instance) {
      SecureGeminiService.instance = new SecureGeminiService();
    }
    return SecureGeminiService.instance;
  }

  private constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  }

  /**
   * Appelle Gemini API via Edge Function sécurisée
   * @param userInput Texte de l'utilisateur
   * @param prompt Prompt optionnel (si déjà formaté)
   * @returns Réponse Gemini ou erreur
   */
  async generateContent(userInput: string, prompt?: string): Promise<SecureGeminiResponse> {
    try {
      // Vérifier que Supabase est configuré
      if (!this.supabaseUrl) {
        return {
          success: false,
          error: "CONFIG_ERROR",
          message: "Configuration Supabase manquante",
        };
      }

      // Récupérer la session Supabase (optionnelle pour invités)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Appeler l'Edge Function (avec ou sans token selon authentification)
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke("check-quota-and-chat", {
        body: {
          userInput,
          prompt,
        },
        headers,
      });

      if (error) {
        logger.error("Edge Function error", "api", error);

        // Gérer les erreurs spécifiques
        if (error.message?.includes("QUOTA_EXCEEDED") || error.message?.includes("quota")) {
          return {
            success: false,
            error: "QUOTA_EXCEEDED",
            message: "Quota de crédits IA dépassé",
            creditsRemaining: data?.creditsRemaining || 0,
          };
        }

        if (error.message?.includes("RATE_LIMIT")) {
          return {
            success: false,
            error: "RATE_LIMIT_EXCEEDED",
            message: "Trop de requêtes. Veuillez patienter avant de réessayer.",
          };
        }

        return {
          success: false,
          error: "API_ERROR",
          message: error.message || "Erreur lors de l'appel à l'API",
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || "UNKNOWN_ERROR",
          message: data?.message || "Erreur lors de la génération",
          creditsRemaining: data?.creditsRemaining,
        };
      }

      return {
        success: true,
        data: data.data,
        creditsRemaining: data.creditsRemaining,
      };
    } catch (error) {
      const processedError = handleError(
        error,
        {
          component: "SecureGeminiService",
          operation: "generateContent",
        },
        "Erreur lors de l'appel sécurisé à Gemini",
      );

      logError(processedError, {
        component: "SecureGeminiService",
        operation: "generateContent",
      });

      return {
        success: false,
        error: "NETWORK_ERROR",
        message: "Erreur réseau lors de l'appel à l'API",
      };
    }
  }

  /**
   * Teste la connexion à l'Edge Function
   */
  async testConnection(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { error } = await supabase.functions.invoke("check-quota-and-chat", {
        body: {
          userInput: "test",
        },
        headers,
      });

      // Même si erreur, si c'est pas une erreur d'auth, la fonction est accessible
      return !error || !error.message?.includes("UNAUTHORIZED");
    } catch {
      return false;
    }
  }
}

export const secureGeminiService = SecureGeminiService.getInstance();
