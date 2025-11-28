// Service sécurisé pour appeler Gemini via Edge Function
// Remplace les appels directs à Gemini API côté client

import { logger } from "@/lib/logger";
import { handleError, ErrorFactory, logError } from "@/lib/error-handling";
import { getEnv } from "@/lib/env";
import { getSupabaseSessionWithTimeout } from "@/lib/supabaseApi";

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
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  public static getInstance(): SecureGeminiService {
    if (!SecureGeminiService.instance) {
      SecureGeminiService.instance = new SecureGeminiService();
    }
    return SecureGeminiService.instance;
  }

  private constructor() {
    const envSupabaseUrl = getEnv("VITE_SUPABASE_URL");

    if (envSupabaseUrl) {
      this.supabaseUrl = envSupabaseUrl;
    } else if (typeof window !== "undefined" && window.location?.origin) {
      this.supabaseUrl = window.location.origin;
    } else {
      this.supabaseUrl = "";
    }
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
        try {
          session = await getSupabaseSessionWithTimeout(1000);
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

      // Ajouter apikey dans les headers (requis par Supabase)
      const fetchHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
      };

      if (supabaseAnonKey) {
        fetchHeaders["apikey"] = supabaseAnonKey;
      }

      // Appel avec retry automatique sur erreurs réseau
      const result = await this.retryWithBackoff(async () => {
        // Timeout de 10 secondes
        const FETCH_TIMEOUT = 20000;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(`Timeout: Edge Function a pris plus de ${FETCH_TIMEOUT / 1000} secondes`),
              ),
            FETCH_TIMEOUT,
          );
        });

        const requestBody = {
          userInput,
          prompt,
        };
        const serializedBody = JSON.stringify(requestBody);

        logger.info("SecureGeminiService payload", "api", {
          userInputLength: userInput?.length ?? 0,
          promptLength: prompt?.length ?? 0,
          bodyLength: serializedBody.length,
        });

        const fetchPromise = fetch(edgeFunctionUrl, {
          method: "POST",
          headers: fetchHeaders,
          body: serializedBody,
        }).then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            // Erreur 401 = authentification requise
            if (response.status === 401) {
              return {
                data: null,
                error: {
                  message:
                    data.message ||
                    "Authentification requise. Vérifiez que l'apikey est configuré.",
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

        return await Promise.race([fetchPromise, timeoutPromise]);
      });

      const { data, error } = result as {
        data: {
          success?: boolean;
          data?: string;
          error?: string;
          message?: string;
          creditsRemaining?: number;
        } | null;
        error: { message?: string } | null;
      };

      if (error) {
        logger.error("Edge Function error", "api", error);

        // Gérer les erreurs spécifiques
        if (error.message?.includes("QUOTA_EXCEEDED") || error.message?.includes("quota")) {
          const creditsRemaining = data?.creditsRemaining ?? 0;
          const message =
            creditsRemaining === 0
              ? "Vos crédits IA sont épuisés. Vous pouvez consulter votre consommation dans le tableau de bord et attendre le prochain renouvellement, ou mettre à niveau votre compte pour obtenir plus de crédits."
              : `Il vous reste ${creditsRemaining} crédit${creditsRemaining > 1 ? "s" : ""} IA. Cette opération nécessite plus de crédits.`;

          return {
            success: false,
            error: "QUOTA_EXCEEDED",
            message,
            creditsRemaining,
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
      if (!this.supabaseUrl) {
        return false;
      }

      const session = await getSupabaseSessionWithTimeout(1000);
      const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Toujours inclure apikey si disponible (requis par Supabase Edge Functions)
      if (supabaseAnonKey) {
        headers["apikey"] = supabaseAnonKey;
      }

      // Utiliser le token utilisateur si disponible, sinon l'anon key
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      } else if (supabaseAnonKey) {
        headers.Authorization = `Bearer ${supabaseAnonKey}`;
      }

      // Si aucun moyen d'authentification, la connexion échouera
      if (!headers.Authorization) {
        return false;
      }

      const edgeFunctionUrl = `${this.supabaseUrl}/functions/v1/hyper-task`;
      // Utiliser testConnection: true pour ne pas consommer de crédit
      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          testConnection: true,
        }),
      });

      // Log détaillé en cas d'erreur pour diagnostic
      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          // Ignore si on ne peut pas lire le body
        }

        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: edgeFunctionUrl,
          hasAuth: !!headers.Authorization,
          hasApiKey: !!headers.apikey,
          authHeader: headers.Authorization ? "Bearer ***" : "missing",
          errorBody: errorBody || "No error body",
          responseHeaders: Object.fromEntries(response.headers.entries()),
        };

        // Log avec logger ET système centralisé pour être sûr que ça s'affiche
        logger.warn("🔍 Edge Function testConnection error:", errorDetails);
        logError(new Error("Edge Function testConnection - Détails complets"), {
          operation: "testConnection",
          metadata: errorDetails,
        });

        // Si c'est un 403, essayer de parser le body pour plus d'infos
        if (response.status === 403 && errorBody) {
          try {
            const parsedError = JSON.parse(errorBody);
            logError(new Error("Edge Function 403 - Erreur parsée"), {
              operation: "testConnection",
              status: 403,
              metadata: parsedError,
            });

            // Si c'est un QUOTA_EXCEEDED, la connexion fonctionne, c'est juste le quota qui est épuisé
            if (parsedError.error === "QUOTA_EXCEEDED") {
              logger.info("✅ Edge Function accessible - Quota épuisé mais connexion OK");
              return true; // La connexion fonctionne, c'est juste le quota qui est épuisé
            }
          } catch {
            logError(new Error("Edge Function 403 - Body brut"), {
              operation: "testConnection",
              status: 403,
              metadata: { body: errorBody },
            });
          }
        }
      }

      // Même si erreur, si c'est pas une erreur d'auth, la fonction est accessible
      // 401 = non autorisé (pas de token valide)
      // 403 = interdit (peut être quota, permissions, etc.)
      // Pour testConnection, on considère que 403 avec QUOTA_EXCEEDED = connexion OK (géré ci-dessus)
      // Les autres 403 sont considérés comme des erreurs de connexion
      return response.status !== 401 && response.status !== 403;
    } catch (error) {
      logger.error("🔍 Edge Function testConnection exception:", error);
      return false;
    }
  }
}

export const secureGeminiService = SecureGeminiService.getInstance();
