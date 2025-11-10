// Service sécurisé pour appeler Gemini via Edge Function
// Remplace les appels directs à Gemini API côté client

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { handleError, ErrorFactory, logError } from "@/lib/error-handling";
import { getEnv } from "@/lib/env";

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
    this.supabaseUrl = getEnv("VITE_SUPABASE_URL") || "";
  }

  /**
   * Appelle Gemini API via Edge Function sécurisée
   * @param userInput Texte de l'utilisateur
   * @param prompt Prompt optionnel (si déjà formaté)
   * @returns Réponse Gemini ou erreur
   */
  async generateContent(userInput: string, prompt?: string): Promise<SecureGeminiResponse> {
    try {
      if (!this.supabaseUrl) {
        return {
          success: false,
          error: "CONFIG_ERROR",
          message: "Configuration Supabase manquante",
        };
      }

      // OPTIMISATION: Récupérer la session avec un timeout très court (1s) ou skip si localStorage indique mode invité
      // Vérifier d'abord si on est probablement en mode invité pour éviter l'appel inutile
      let session = null;
      const sessionStartTime = Date.now();

      // Vérifier rapidement si une session existe dans localStorage (sans timeout long)
      // Supabase stocke la session dans localStorage avec une clé comme "sb-<project-ref>-auth-token"
      const hasStoredSession =
        typeof window !== "undefined" &&
        (() => {
          try {
            // Chercher toutes les clés Supabase dans localStorage
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("sb-") && key.includes("-auth-token")) {
                const value = localStorage.getItem(key);
                if (value && value !== "null" && value !== "undefined") {
                  return true;
                }
              }
            }
            return false;
          } catch {
            return false;
          }
        })();

      if (hasStoredSession) {
        // Seulement essayer getSession si on pense avoir une session
        const SESSION_TIMEOUT = 1000; // Timeout réduit à 1 seconde
        const sessionTimeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(`Timeout: getSession a pris plus de ${SESSION_TIMEOUT / 1000} secondes`),
              ),
            SESSION_TIMEOUT,
          );
        });

        try {
          const sessionPromise = supabase.auth.getSession();
          const sessionResult = await Promise.race([sessionPromise, sessionTimeoutPromise]);
          session = (sessionResult as any)?.data?.session || null;
        } catch {
          session = null;
        }
      }

      // Appeler l'Edge Function (avec ou sans token selon authentification)
      // IMPORTANT: Supabase nécessite toujours un header Authorization, même pour les invités
      // On utilise l'anon key pour les invités, ou le token utilisateur si authentifié
      const headers: Record<string, string> = {};
      const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      } else if (supabaseAnonKey) {
        // Mode invité: utiliser l'anon key pour autoriser l'appel
        headers.Authorization = `Bearer ${supabaseAnonKey}`;
      }

      // Utiliser fetch direct au lieu de supabase.functions.invoke() pour plus de contrôle
      const edgeFunctionUrl = `${this.supabaseUrl}/functions/v1/hyper-task`;
      const invokeStartTime = Date.now();

      // Timeout de 10 secondes
      const FETCH_TIMEOUT = 10000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(`Timeout: Edge Function a pris plus de ${FETCH_TIMEOUT / 1000} secondes`),
            ),
          FETCH_TIMEOUT,
        );
      });

      // Ajouter apikey dans les headers (requis par Supabase)
      const fetchHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
      };

      if (supabaseAnonKey) {
        fetchHeaders["apikey"] = supabaseAnonKey;
      }

      const fetchPromise = fetch(edgeFunctionUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify({
          userInput,
          prompt,
        }),
      }).then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          // Erreur 401 = authentification requise
          if (response.status === 401) {
            return {
              data: null,
              error: {
                message:
                  data.message || "Authentification requise. Vérifiez que l'apikey est configuré.",
                status: response.status,
                code: "UNAUTHORIZED",
              },
            };
          }

          return {
            data: null,
            error: {
              message: data.message || `HTTP ${response.status}: ${response.statusText}`,
              status: response.status,
            },
          };
        }

        return {
          data,
          error: data.error ? { message: data.error } : null,
        };
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      const { data, error } = result as any;

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

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");
        if (supabaseAnonKey) {
          headers.Authorization = `Bearer ${supabaseAnonKey}`;
          headers["apikey"] = supabaseAnonKey;
        }
      }

      const edgeFunctionUrl = `${this.supabaseUrl}/functions/v1/hyper-task`;
      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userInput: "test",
        }),
      });

      // Même si erreur, si c'est pas une erreur d'auth, la fonction est accessible
      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }
}

export const secureGeminiService = SecureGeminiService.getInstance();
