import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { SignInInput, SignUpInput } from "../lib/schemas";
import { isLocalDevelopment } from "../lib/supabase";
import { isE2ETestingEnvironment } from "@/lib/e2e-detection";
import { logger } from "@/lib/logger";
import {
  getSupabaseSessionFromLocalStorage,
  supabaseSelectSingle,
  supabaseUpdate,
  supabaseInsert,
} from "../lib/supabaseApi";

// Variables d'environnement pour validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  preferences: Record<string, unknown>;
  plan_type: "free" | "pro" | "premium";
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Méthodes d'authentification
  signIn: (data: SignInInput) => Promise<{ error?: AuthError }>;
  signUp: (data: SignUpInput) => Promise<{ error?: AuthError }>;
  signInWithGoogle: () => Promise<{ error?: AuthError }>;
  signOut: () => Promise<{ error?: AuthError }>;

  // Méthodes de profil
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  // Logger uniquement les changements importants (pas à chaque rendu)
  React.useEffect(() => {
    // Log uniquement quand l'état de connexion change
    if (context.user) {
      logger.debug("✅ Utilisateur connecté", "auth", {
        userId: context.user.id,
        userEmail: context.user.email,
      });
    } else if (!context.loading) {
      logger.debug("❌ Aucun utilisateur connecté", "auth", {
        hasSession: !!context.session,
      });
    }
  }, [context.user?.id, context.loading]); // Seulement si l'ID change ou loading termine

  return context;
}

const isE2ETestEnvironment = () =>
  typeof window !== "undefined" &&
  (isE2ETestingEnvironment() ||
    ("__IS_E2E_TESTING__" in window &&
      (window as { __IS_E2E_TESTING__?: boolean }).__IS_E2E_TESTING__ === true));

// Use centralized function from supabaseApi
const getSessionFromLocalStorage = getSupabaseSessionFromLocalStorage;

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération du profil utilisateur
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (isLocalDevelopment) {
      // En mode local/mock, ne pas appeler Supabase
      return null;
    }
    try {
      const data = await supabaseSelectSingle<Profile>(
        "profiles",
        {
          id: `eq.${userId}`,
          select: "*",
        },
        { timeout: 5000 },
      );

      return data;
    } catch (err) {
      logger.error("Error in fetchProfile", "auth", err);
      return null;
    }
  };

  // Mise à jour du profil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: "Utilisateur non connecté" } };
    }

    if (isLocalDevelopment) {
      // No-op en mode local/mock
      return { error: null };
    }

    try {
      const data = await supabaseUpdate<Profile>(
        "profiles",
        updates,
        { id: `eq.${user.id}` },
        { timeout: 5000 },
      );

      setProfile(data);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  // Actualisation du profil
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Connexion email/password
  const signIn = async (data: SignInInput) => {
    setError(null);
    setLoading(true);

    try {
      // En mode local, désactiver l'authentification Supabase
      if (isLocalDevelopment) {
        const errorMessage =
          "L'authentification n'est pas disponible en mode développement local. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour utiliser l'authentification.";
        logger.warn("Tentative de connexion en mode local", "auth", { email: data.email });
        setError(errorMessage);
        return { error: { message: errorMessage } as AuthError };
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Log détaillé pour diagnostic
        logger.error("Erreur de connexion", "auth", {
          message: error.message,
          status: error.status,
          email: data.email,
        });

        // Messages d'erreur plus clairs
        let userMessage = error.message;
        if (error.message?.includes("Invalid login credentials")) {
          userMessage = "Email ou mot de passe incorrect";
        } else if (error.message?.includes("Email not confirmed")) {
          userMessage =
            "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.";
        } else if (error.message?.includes("User not found")) {
          userMessage = "Aucun compte trouvé avec cet email. Voulez-vous créer un compte ?";
        }

        setError(userMessage);
        return { error: { ...error, message: userMessage } };
      }

      logger.info("Connexion réussie", "auth", { email: data.email });
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      logger.error("Exception lors de la connexion", "auth", err);
      setError(error.message || "Une erreur inattendue s'est produite");
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const signUp = async (data: SignUpInput) => {
    setError(null);
    setLoading(true);

    try {
      // En mode local, désactiver l'authentification Supabase
      if (isLocalDevelopment) {
        const errorMessage =
          "L'inscription n'est pas disponible en mode développement local. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour utiliser l'authentification.";
        logger.warn("Tentative d'inscription en mode local", "auth", { email: data.email });
        setError(errorMessage);
        return { error: { message: errorMessage } as AuthError };
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      return { error };
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Connexion Google
  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      // En mode local, désactiver l'authentification Supabase
      if (isLocalDevelopment) {
        const errorMessage =
          "L'authentification Google n'est pas disponible en mode développement local. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour utiliser l'authentification.";
        logger.warn("Tentative de connexion Google en mode local", "auth");
        setError(errorMessage);
        setLoading(false);
        return { error: { message: errorMessage } as AuthError };
      }

      logger.info("Tentative de connexion Google", "auth");

      // Sauvegarder la page actuelle pour y revenir après la connexion
      const currentPath = window.location.pathname + window.location.search;
      logger.info("Sauvegarde de la page actuelle pour redirection", "auth", { currentPath });
      if (currentPath !== "/DooDates/auth/callback" && currentPath !== "/DooDates/auth/callback/" && currentPath !== "/auth/callback" && currentPath !== "/auth/callback/") {
        localStorage.setItem("auth_return_to", currentPath);
        logger.info("Page sauvegardée dans localStorage", "auth", { savedPath: currentPath });
      } else {
        logger.info("Page callback détectée, pas de sauvegarde", "auth");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/DooDates/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes:
            "email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar",
        },
      });

      if (error) {
        logger.error("Google OAuth Error", "auth", error);
        setError(`Erreur Google OAuth: ${error.message}`);
        setLoading(false);
        return { error };
      }

      logger.info("Redirection Google OAuth démarrée", "auth");
      // Ne pas setLoading(false) ici car la redirection va se faire
      return { error: null };
    } catch (err) {
      logger.error("Google OAuth Exception", "auth", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur de connexion Google";
      setError(`Erreur connexion: ${errorMessage}`);
      setLoading(false);
      return { error: { message: errorMessage } as AuthError };
    }
  };

  // Déconnexion
  const signOut = async () => {
    setError(null);
    setLoading(true);

    try {
      // Nettoyer l'état local IMMÉDIATEMENT (avant l'appel Supabase qui peut bloquer)
      setUser(null);
      setProfile(null);
      setSession(null);

      // Nettoyer le localStorage Supabase IMMÉDIATEMENT
      if (typeof window !== "undefined") {
        // Nettoyer toutes les clés Supabase
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      // Appel Supabase avec timeout pour éviter le blocage
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<{ error: AuthError | null }>((resolve) => {
        setTimeout(() => {
          logger.warn(
            "Timeout lors de la déconnexion Supabase, continuation de la déconnexion locale",
            "auth",
          );
          resolve({ error: null });
        }, 3000);
      });

      await Promise.race([signOutPromise, timeoutPromise]);

      logger.info("Déconnexion réussie", "auth");
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      logger.error("Erreur lors de la déconnexion", "auth", err);

      // Même en cas d'erreur, nettoyer l'état local
      setUser(null);
      setProfile(null);
      setSession(null);

      if (typeof window !== "undefined") {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Effet pour écouter les changements d'authentification
  useEffect(() => {
    let mounted = true;

    // Timeout de sécurité pour forcer loading=false si l'init bloque
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        logger.warn("Timeout d'initialisation auth - forçage loading=false", "auth");
        setLoading(false);
      }
    }, 5000); // 5 secondes max

    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        // Essayer d'abord localStorage (plus rapide et évite les timeouts)
        let effectiveSession = getSessionFromLocalStorage();
        logger.debug("🔍 AuthContext - Session depuis localStorage", "auth", {
          found: !!effectiveSession,
          userId: effectiveSession?.user?.id || null,
          hasAccessToken: !!effectiveSession?.access_token,
        });

        if (!effectiveSession) {
          // Fallback vers getSession() avec timeout
          try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
              setTimeout(() => resolve({ data: { session: null } }), 2000),
            );

            const result = await Promise.race([sessionPromise, timeoutPromise]);
            effectiveSession = result.data.session;
            logger.debug("🔍 AuthContext - Session depuis getSession()", "auth", {
              found: !!effectiveSession,
              userId: effectiveSession?.user?.id || null,
            });
          } catch (error) {
            logger.warn(
              "getSession() a échoué ou timeout, utilisation de localStorage",
              "auth",
              error,
            );
            // Si getSession() échoue, réessayer localStorage au cas où la session aurait été stockée entre-temps
            effectiveSession = getSessionFromLocalStorage();
            logger.debug("🔍 AuthContext - Session depuis localStorage (fallback)", "auth", {
              found: !!effectiveSession,
              userId: effectiveSession?.user?.id || null,
            });
          }
        }

        // Fallback final pour E2E
        if (!effectiveSession && isE2ETestEnvironment()) {
          effectiveSession = getSessionFromLocalStorage();
          logger.debug("🔍 AuthContext - Session depuis localStorage (E2E fallback)", "auth", {
            found: !!effectiveSession,
            userId: effectiveSession?.user?.id || null,
            isE2ETestEnvironment: isE2ETestEnvironment(),
          });
        }

        if (mounted) {
          logger.debug("🔍 AuthContext - Initialisation user", "auth", {
            hasSession: !!effectiveSession,
            userId: effectiveSession?.user?.id || null,
            willSetUser: !!effectiveSession?.user,
          });
          setSession(effectiveSession);
          setUser(effectiveSession?.user ?? null);

          const sessionUserId = effectiveSession?.user?.id;

          if (sessionUserId && !isLocalDevelopment) {
            if (isE2ETestEnvironment()) {
              logger.debug("Skip Supabase profile fetch in E2E mode", "auth");
              setProfile(null);
            } else {
              const profileData = await fetchProfile(sessionUserId);
              setProfile(profileData);

              // Migrate guest conversations to Supabase on initial session
              try {
                const { migrateGuestConversations } = await import(
                  "../lib/storage/autoMigrateGuestConversations"
                );
                const migrationResult = await migrateGuestConversations(sessionUserId);
                if (migrationResult.migratedCount > 0) {
                  logger.info(
                    "Conversations guest migrées automatiquement (session initiale)",
                    "conversation",
                    {
                      userId: sessionUserId,
                      migratedCount: migrationResult.migratedCount,
                    },
                  );
                }
              } catch (migrationError) {
                logger.error(
                  "Erreur lors de la migration automatique (session initiale)",
                  "conversation",
                  migrationError,
                );
                // Don't block login if migration fails
              }
            }
          }

          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      } catch (error) {
        logger.error("Erreur lors de l'initialisation de la session", "auth", error);
        if (mounted) {
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      let effectiveSession = session;

      // Si pas de session depuis onAuthStateChange, vérifier localStorage
      if (!effectiveSession) {
        effectiveSession = getSessionFromLocalStorage();
      }

      // Fallback final pour E2E
      if (!effectiveSession && isE2ETestEnvironment()) {
        effectiveSession = getSessionFromLocalStorage();
      }

      setSession(effectiveSession ?? null);
      setUser(effectiveSession?.user ?? null);
      setError(null);

      const sessionUserId = effectiveSession?.user?.id;

      if (sessionUserId && !isLocalDevelopment) {
        if (isE2ETestEnvironment()) {
          logger.debug("Skip Supabase auth state sync in E2E mode", "auth");
          setProfile(null);
        } else {
          // Récupérer le profil pour les nouveaux utilisateurs
          const profileData = await fetchProfile(sessionUserId);
          setProfile(profileData);

          // Migrate guest conversations to Supabase
          try {
            const { migrateGuestConversations } = await import(
              "../lib/storage/autoMigrateGuestConversations"
            );
            const migrationResult = await migrateGuestConversations(sessionUserId);
            if (migrationResult.migratedCount > 0) {
              logger.info("Conversations guest migrées automatiquement", "conversation", {
                userId: sessionUserId,
                migratedCount: migrationResult.migratedCount,
              });
            }
          } catch (migrationError) {
            logger.error("Erreur lors de la migration automatique", "conversation", migrationError);
            // Don't block login if migration fails
          }
        }
      } else {
        setProfile(null);
      }

      setLoading(false);

      // Analytics pour les événements d'auth
      if (event === "SIGNED_IN" && !isLocalDevelopment) {
        // Tracker la connexion (fire-and-forget)
        supabaseInsert(
          "analytics_events",
          {
            event_type: "user_signed_in",
            event_data: {
              method: session?.user?.app_metadata?.provider || "email",
              timestamp: new Date().toISOString(),
            },
            user_id: session?.user?.id,
          },
          { timeout: 2000 },
        ).catch((err) => {
          logger.debug("Failed to track sign-in event", "auth", err);
        });
      } else if (event === "SIGNED_OUT" && !isLocalDevelopment) {
        // Tracker la déconnexion (fire-and-forget)
        supabaseInsert(
          "analytics_events",
          {
            event_type: "user_signed_out",
            event_data: {
              timestamp: new Date().toISOString(),
            },
          },
          { timeout: 2000 },
        ).catch((err) => {
          logger.debug("Failed to track sign-out event", "auth", err);
        });
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
