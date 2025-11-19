import { useState, useCallback, useEffect } from "react";
import { Poll as TypesPoll, PollOption, PollData as TypesPollData } from "../types/poll";
import { useAuth } from "../contexts/AuthContext";
import { EmailService } from "../lib/email-service";
import { v4 as uuidv4 } from "uuid";
import {
  getPollBySlugOrId,
  deletePollById,
  addPoll,
  getAllPolls,
  deleteVotesByPollId,
  Poll as StoragePoll,
  getCurrentUserId,
} from "../lib/pollStorage";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";
import { logger } from "@/lib/logger";
import { supabaseInsert, getSupabaseToken, supabaseUpdate } from "../lib/supabaseApi";
import type { Conversation } from "../types/conversation";

// Type for Supabase conversation response (snake_case)
interface SupabaseConversation {
  id: string;
  user_id: string | null;
  session_id: string;
  title: string;
  first_message: string;
  message_count: number;
  messages: unknown[];
  context: Record<string, unknown>;
  poll_data: {
    type?: "date" | "form";
    title?: string;
    description?: string | null;
    dates?: string[];
    timeSlots?: Record<string, unknown>;
    questions?: unknown[];
    settings?: {
      timeGranularity?: number;
      allowAnonymousVotes?: boolean;
      allowMaybeVotes?: boolean;
      sendNotifications?: boolean;
      allowAnonymousResponses?: boolean;
      expiresAt?: string;
    };
    creatorEmail?: string;
  } | null;
  poll_type: "date" | "form" | null;
  poll_status: "draft" | "active" | "closed" | "archived" | null;
  poll_slug: string | null;
  status: "active" | "completed" | "archived";
  is_favorite: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Convert Supabase conversation (snake_case) to Conversation type (camelCase)
function convertSupabaseConversationToConversation(
  supabaseConv: SupabaseConversation,
): Conversation {
  return {
    id: supabaseConv.id,
    userId: supabaseConv.user_id || undefined,
    title: supabaseConv.title,
    status: supabaseConv.status,
    createdAt: new Date(supabaseConv.created_at),
    updatedAt: new Date(supabaseConv.updated_at),
    firstMessage: supabaseConv.first_message,
    messageCount: supabaseConv.message_count,
    pollId: supabaseConv.id,
    pollType: supabaseConv.poll_type || undefined,
    pollStatus: supabaseConv.poll_status || undefined,
    isFavorite: supabaseConv.is_favorite,
    tags: supabaseConv.tags,
    metadata: supabaseConv.metadata as Conversation["metadata"],
  };
}

// Interface pour les sondages de dates
export interface DatePollData {
  type: "date";
  title: string;
  description?: string | null;
  selectedDates: string[];
  timeSlotsByDate: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>;
  participantEmails: string[];
  settings: {
    timeGranularity: number;
    allowAnonymousVotes: boolean;
    allowMaybeVotes: boolean;
    sendNotifications: boolean;
    expiresAt?: string;
  };
}

// Interface pour les formulaires
export interface FormPollData {
  type: "form";
  title: string;
  description?: string | null;
  questions: import("../lib/pollStorage").FormQuestionShape[]; // Questions du formulaire
  settings?: {
    allowAnonymousResponses?: boolean;
    expiresAt?: string;
  };
  slug?: string; // Slug optionnel pour conserver le slug du draft lors de la publication
}

// Union type pour supporter les deux
export type PollData = DatePollData | FormPollData;

// Poll interface is now imported from pollStorage.ts as StoragePoll

// PollOption interface is imported from ../types/poll

export function usePolls() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState<StoragePoll[]>([]);

  const generateSlug = useCallback((title: string): string => {
    return (
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .replace(/[^a-z0-9\s-]/g, "") // Garder seulement lettres, chiffres, espaces et tirets
        .trim()
        .replace(/\s+/g, "-") // Remplacer espaces par tirets
        .replace(/-+/g, "-") // Éviter les tirets multiples
        .substring(0, 50) + // Limiter la longueur
      "-" +
      uuidv4().substring(0, 8)
    ); // Ajouter un ID unique
  }, []);

  const generateAdminToken = useCallback((): string => {
    // Générer un token d'administration pour les sondages anonymes
    return uuidv4().replace(/-/g, ""); // Token sans tirets pour plus de sécurité
  }, []);

  const createPoll = useCallback(
    async (pollData: PollData): Promise<{ poll?: StoragePoll; error?: string }> => {
      // Permettre la création avec ou sans utilisateur connecté

      setLoading(true);
      setError(null);

      try {
        // Validation selon le type
        if (pollData.type === "date") {
          // Validation stricte: au moins une date doit être sélectionnée
          if (!Array.isArray(pollData.selectedDates) || pollData.selectedDates.length === 0) {
            throw ErrorFactory.validation(
              "No dates selected for poll creation",
              "Sélectionnez au moins une date pour créer le sondage.",
            );
          }
        } else if (pollData.type === "form") {
          // Validation formulaire: au moins une question
          if (!Array.isArray(pollData.questions) || pollData.questions.length === 0) {
            throw ErrorFactory.validation(
              "No questions in form",
              "Ajoutez au moins une question pour créer le formulaire.",
            );
          }
        }

        // Utiliser le slug fourni si disponible, sinon générer un nouveau slug
        const slug = (pollData.type === "form" && pollData.slug) || generateSlug(pollData.title);

        // Préparer les settings selon le type
        let mergedSettings: import("../lib/pollStorage").PollSettings;
        if (pollData.type === "date") {
          // Toujours embarquer les dates et créneaux dans settings pour cohérence UI
          mergedSettings = {
            ...pollData.settings,
            selectedDates: pollData.selectedDates,
            timeSlotsByDate: pollData.timeSlotsByDate,
          };
        } else {
          // Formulaire
          mergedSettings = {
            ...pollData.settings,
          };
        }

        const adminToken = user ? null : generateAdminToken(); // Token admin seulement pour sondages anonymes

        // Creating poll with generated slug and admin token if needed

        // Vérifier si mode local/test ou si Supabase n'est pas configuré
        const isLocalMode =
          import.meta.env.MODE === "test" ||
          Boolean(import.meta.env.VITEST) ||
          (typeof window !== "undefined" &&
            (() => {
              try {
                return (
                  (window as Window & { __E2E__?: boolean }).__E2E__ === true ||
                  localStorage.getItem("e2e") === "1" ||
                  localStorage.getItem("dev-local-mode") === "1"
                );
              } catch (_) {
                return false;
              }
            })()) ||
          !import.meta.env.VITE_SUPABASE_URL ||
          !import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (isLocalMode) {
          // Supabase not configured - using local simulation

          // Récupérer conversationId depuis l'URL si présent
          const urlParams = new URLSearchParams(window.location.search);
          const conversationId = urlParams.get("conversationId");

          // Simuler la création avec localStorage
          // Utiliser getCurrentUserId pour être cohérent avec le filtrage du dashboard
          const currentUserId = getCurrentUserId(user?.id);

          // Construire mockPoll selon le type
          const basePoll = {
            id: `local-${Date.now()}`,
            creator_id: currentUserId,
            title: pollData.title,
            description: pollData.description || undefined,
            slug,
            settings: mergedSettings,
            status: "active" as const,
            expires_at: pollData.settings?.expiresAt || undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creatorEmail: user?.email || undefined,
            type: pollData.type,
            relatedConversationId: conversationId || undefined,
          };

          const mockPoll: StoragePoll = {
            ...basePoll,
            ...(pollData.type === "date" ? { dates: pollData.selectedDates } : {}),
            ...(pollData.type === "form" ? { questions: pollData.questions } : {}),
          } as StoragePoll;

          // Use centralized pollStorage instead of direct localStorage access
          await addPoll(mockPoll);

          // Émettre un événement pour notifier les composants de la création
          window.dispatchEvent(
            new CustomEvent("pollCreated", {
              detail: { poll: mockPoll },
            }),
          );

          return { poll: mockPoll };
        }

        // 🆕 ARCHITECTURE V2 : Créer dans table conversations (pas polls)
        // Préparer poll_data avec toutes les infos selon le type
        let pollData_json: Record<string, unknown>;
        let firstMessage: string;

        if (pollData.type === "date") {
          pollData_json = {
            type: "date",
            title: pollData.title,
            description: pollData.description || null,
            dates: pollData.selectedDates,
            timeSlots: pollData.timeSlotsByDate,
            settings: {
              timeGranularity: pollData.settings.timeGranularity,
              allowAnonymousVotes: pollData.settings.allowAnonymousVotes,
              allowMaybeVotes: pollData.settings.allowMaybeVotes,
              sendNotifications: pollData.settings.sendNotifications,
              expiresAt: pollData.settings.expiresAt,
            },
            creatorEmail: user?.email || undefined,
          };
          firstMessage = "Sondage de dates créé manuellement";
        } else {
          // type === "form"
          pollData_json = {
            type: "form",
            title: pollData.title,
            description: pollData.description || null,
            questions: pollData.questions,
            settings: {
              allowAnonymousResponses: pollData.settings?.allowAnonymousResponses,
              expiresAt: pollData.settings?.expiresAt,
            },
            creatorEmail: user?.email || undefined,
          };
          firstMessage = "Formulaire créé manuellement";
        }

        // Préparer les données de la conversation
        const conversationData = {
          user_id: user?.id || null,
          session_id: user?.id || `guest-${Date.now()}`,
          title: pollData.title,
          first_message: firstMessage,
          message_count: 0,
          messages: [],
          context: {},
          poll_data: pollData_json,
          poll_type: pollData.type,
          poll_status: "active",
          poll_slug: slug,
          status: "completed", // Conversation complétée car poll créé
          is_favorite: false,
          tags: [],
          metadata: {
            created_manually: true,
            admin_token: adminToken,
          },
        };

        let conversation: SupabaseConversation;
        try {
          if (!user) {
            // Utilisateur non connecté - utiliser localStorage pour l'instant
            // TODO : Gérer les invités dans Supabase
            logger.warn("Utilisateur non connecté, sauvegarde en localStorage", "poll");

            const currentUserId = getCurrentUserId(user?.id);
            const basePoll = {
              id: `local-${Date.now()}`,
              creator_id: currentUserId,
              title: pollData.title,
              description: pollData.description || undefined,
              slug,
              settings: mergedSettings,
              status: "active" as const,
              expires_at: pollData.settings?.expiresAt || undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              creatorEmail: user?.email || undefined,
              type: pollData.type,
            };

            const mockPoll: StoragePoll =
              pollData.type === "date"
                ? {
                    ...basePoll,
                    dates: pollData.selectedDates,
                  }
                : {
                    ...basePoll,
                    questions: pollData.questions,
                  };

            addPoll(mockPoll);
            window.dispatchEvent(
              new CustomEvent("pollCreated", {
                detail: { poll: mockPoll },
              }),
            );

            return { poll: mockPoll };
          }

          // Utilisateur connecté - sauvegarder dans Supabase
          // Récupérer le token JWT via fonction utilitaire
          const token = getSupabaseToken();

          if (!token) {
            logger.warn("Token non trouvé, sauvegarde en localStorage", "poll");

            const currentUserId = getCurrentUserId(user?.id);
            const basePoll = {
              id: `local-${Date.now()}`,
              creator_id: currentUserId,
              title: pollData.title,
              description: pollData.description || undefined,
              slug,
              settings: mergedSettings,
              status: "active" as const,
              expires_at: pollData.settings?.expiresAt || undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              creatorEmail: user?.email || undefined,
              type: pollData.type,
            };

            const mockPoll: StoragePoll =
              pollData.type === "date"
                ? {
                    ...basePoll,
                    dates: pollData.selectedDates,
                  }
                : {
                    ...basePoll,
                    questions: pollData.questions,
                  };

            addPoll(mockPoll);
            return { poll: mockPoll };
          }

          // Créer dans table conversations avec fonction utilitaire
          logger.info("💾 Sauvegarde dans Supabase (table conversations)", "poll");

          try {
            conversation = await supabaseInsert("conversations", conversationData, {
              timeout: 10000,
            });
          } catch (error: unknown) {
            logger.error("Erreur création conversation", "poll", {
              error: error instanceof Error ? error.message : String(error),
            });

            // Fallback sur localStorage
            logger.warn("Fallback sur localStorage après erreur Supabase", "poll");
            const currentUserId = getCurrentUserId(user?.id);
            const basePoll = {
              id: `local-${Date.now()}`,
              creator_id: currentUserId,
              title: pollData.title,
              description: pollData.description || undefined,
              slug,
              settings: mergedSettings,
              status: "active" as const,
              expires_at: pollData.settings?.expiresAt || undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              creatorEmail: user?.email || undefined,
              type: pollData.type,
            };

            const mockPoll: StoragePoll =
              pollData.type === "date"
                ? {
                    ...basePoll,
                    dates: pollData.selectedDates,
                  }
                : {
                    ...basePoll,
                    questions: pollData.questions,
                  };

            addPoll(mockPoll);
            return { poll: mockPoll };
          }

          logger.info("✅ Conversation créée dans Supabase", "poll", {
            conversationId: conversation.id,
            pollSlug: slug,
          });

          // Convertir conversation → poll pour compatibilité
          const basePollFromConversation = {
            id: conversation.id,
            creator_id: conversation.user_id || undefined,
            title: conversation.title,
            description: conversation.poll_data?.description || undefined,
            slug: conversation.poll_slug || undefined,
            settings: conversation.poll_data?.settings || {},
            status: conversation.poll_status || "active",
            expires_at: conversation.poll_data?.settings?.expiresAt,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
            creatorEmail: user?.email || undefined,
            type: conversation.poll_type || pollData.type,
            conversationId: conversation.id,
          };

          const createdPoll: StoragePoll = {
            ...basePollFromConversation,
            ...(conversation.poll_type === "date"
              ? {
                  settings: {
                    ...conversation.poll_data?.settings,
                    selectedDates: conversation.poll_data?.dates || [], // 🔧 Fix validation
                  },
                  dates: conversation.poll_data?.dates || [],
                }
              : {
                  questions: (conversation.poll_data?.questions as StoragePoll["questions"]) || [],
                }),
          } as StoragePoll;

          // Sauvegarder aussi dans localStorage pour cache local
          addPoll(createdPoll);
          setPolls((prev) => [...prev, createdPoll]);

          return { poll: createdPoll };
        } catch (fetchError) {
          logError(fetchError as Error, {
            component: "usePolls",
            operation: "createPoll",
          });

          // Fallback localStorage en cas d'erreur
          logger.warn("Fallback localStorage après erreur réseau", "poll");
          const currentUserId = getCurrentUserId(user?.id);
          const basePoll = {
            id: `local-${Date.now()}`,
            creator_id: currentUserId,
            title: pollData.title,
            description: pollData.description || undefined,
            slug,
            settings: mergedSettings,
            status: "active" as const,
            expires_at: pollData.settings?.expiresAt || undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creatorEmail: user?.email || undefined,
            type: pollData.type,
          };

          const mockPoll: StoragePoll = {
            ...basePoll,
            ...(pollData.type === "date" ? { dates: pollData.selectedDates } : {}),
            ...(pollData.type === "form" ? { questions: pollData.questions } : {}),
          } as StoragePoll;

          addPoll(mockPoll);
          return { poll: mockPoll };
        }

        // ❌ ANCIEN CODE SUPPRIMÉ : poll_options (maintenant dans poll_data)
        // Les dates et créneaux sont maintenant dans conversations.poll_data.timeSlots

        logger.info("✅ Sondage créé avec succès", "poll");
      } catch (error: unknown) {
        const processedError = handleError(
          error instanceof Error ? error : new Error(String(error)),
          {
            component: "usePolls",
            operation: "createPoll",
          },
          "Erreur lors de la création du sondage",
        );

        logError(processedError, {
          component: "usePolls",
          operation: "createPoll",
        });

        // Améliorer les messages d'erreur pour l'utilisateur
        let userFriendlyMessage = "Erreur lors de la création du sondage";

        const errorMessage = error instanceof Error ? error.message : String(error);

        if (error instanceof TypeError && errorMessage.includes("fetch")) {
          userFriendlyMessage =
            "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.";
        } else if (errorMessage.includes("Failed to fetch")) {
          userFriendlyMessage =
            "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.";
        } else if (errorMessage.includes("NetworkError")) {
          userFriendlyMessage = "Erreur réseau. Vérifiez votre connexion internet.";
        } else if (errorMessage.includes("CORS")) {
          userFriendlyMessage = "Erreur de configuration serveur. Contactez le support.";
        } else if (errorMessage) {
          userFriendlyMessage = errorMessage;
        }

        setError(userFriendlyMessage);
        return { error: userFriendlyMessage };
      } finally {
        setLoading(false);
      }
    },
    [user, generateSlug, generateAdminToken],
  );

  const getUserPolls = useCallback(async (): Promise<{
    polls?: StoragePoll[];
    error?: string;
  }> => {
    setLoading(true);
    setError(null);

    try {
      let userPolls: StoragePoll[] = [];

      // 🆕 ARCHITECTURE V2 : Charger depuis conversations (pas polls)

      // Si l'utilisateur est connecté, essayer de charger depuis Supabase
      if (user?.id) {
        try {
          // Récupérer le token JWT
          let token = null;
          const supabaseSession = localStorage.getItem("supabase.auth.token");
          if (supabaseSession) {
            const sessionData = JSON.parse(supabaseSession);
            token = sessionData?.access_token || sessionData?.currentSession?.access_token;
          }

          if (!token) {
            const authData = localStorage.getItem(
              `sb-${import.meta.env.VITE_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`,
            );
            if (authData) {
              const parsed = JSON.parse(authData);
              token = parsed?.access_token;
            }
          }

          if (token) {
            // Charger les conversations avec polls depuis Supabase
            logger.info("📥 Chargement depuis Supabase (table conversations)", "poll");
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/conversations?user_id=eq.${user.id}&poll_data=not.is.null&select=*`,
              {
                method: "GET",
                headers: {
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            );

            if (response.ok) {
              const conversations: SupabaseConversation[] = await response.json();
              logger.info("✅ Conversations chargées depuis Supabase", "poll", {
                count: conversations.length,
                userId: user.id,
              });

              // Convertir conversations → polls
              userPolls = conversations.map((c) => ({
                id: c.id,
                conversationId: c.id,
                title: c.title || c.poll_data?.title || "",
                slug: c.poll_slug || undefined,
                description: c.poll_data?.description || undefined,
                type: c.poll_type || "date",
                status: c.poll_status || "active",
                created_at: c.created_at,
                updated_at: c.updated_at,
                creator_id: c.user_id || undefined,
                dates: c.poll_data?.dates || [],
                settings: {
                  ...c.poll_data?.settings,
                  selectedDates: c.poll_data?.dates || [], // 🔧 Fix validation
                },
              }));

              // Sauvegarder aussi les conversations dans localStorage
              const { addConversation, getConversation } = await import(
                "../lib/storage/ConversationStorageSimple"
              );
              conversations.forEach((c) => {
                // Vérifier si la conversation existe déjà
                const existingConv = getConversation(c.id);
                if (!existingConv) {
                  // Créer la conversation dans localStorage
                  addConversation({
                    id: c.id,
                    title: c.title || c.poll_data?.title || "Sondage sans titre",
                    status: c.status,
                    createdAt: new Date(c.created_at),
                    updatedAt: new Date(c.updated_at),
                    firstMessage: c.first_message || "Sondage créé",
                    messageCount: 0,
                    isFavorite: c.is_favorite || false,
                    tags: c.tags || [],
                    userId: c.user_id || undefined,
                    pollId: c.id,
                    pollType: c.poll_type || undefined,
                    pollStatus: c.poll_status || undefined,
                  });
                }
              });

              // Fusionner avec localStorage pour garder polls locaux
              const localPolls = getAllPolls();
              const mergedPolls = [...localPolls];

              userPolls.forEach((supabasePoll) => {
                const exists = mergedPolls.find((p) => p.id === supabasePoll.id);
                if (!exists) {
                  mergedPolls.push(supabasePoll);
                } else {
                  const existingDate = new Date(exists.updated_at || exists.created_at).getTime();
                  const supabaseDate = new Date(
                    supabasePoll.updated_at || supabasePoll.created_at,
                  ).getTime();
                  if (supabaseDate > existingDate) {
                    const index = mergedPolls.findIndex((p) => p.id === supabasePoll.id);
                    if (index !== -1) {
                      mergedPolls[index] = supabasePoll;
                    }
                  }
                }
              });

              const { savePolls } = await import("../lib/pollStorage");
              savePolls(mergedPolls);
              userPolls = mergedPolls;
            } else {
              logger.warn("Erreur chargement conversations, utilisation localStorage", "poll", {
                status: response.status,
              });
              userPolls = getAllPolls();
            }
          } else {
            logger.warn("Token non trouvé, utilisation localStorage", "poll");
            userPolls = getAllPolls();
          }
        } catch (supabaseError) {
          logger.error(
            "Erreur chargement Supabase, utilisation localStorage",
            "poll",
            supabaseError,
          );
          userPolls = getAllPolls();
        }
      } else {
        // Mode guest - localStorage uniquement
        logger.info("Mode guest - utilisation localStorage", "poll");
        userPolls = getAllPolls();
      }

      setPolls(userPolls);
      return { polls: userPolls };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de la récupération des sondages";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getPollBySlug = useCallback(
    async (
      slug: string,
    ): Promise<{
      poll?: StoragePoll;
      options?: PollOption[];
      error?: string;
    }> => {
      setLoading(true);
      setError(null);

      try {
        // Use centralized pollStorage instead of direct localStorage access
        const poll = getPollBySlugOrId(slug);

        if (!poll) {
          const notFoundError = ErrorFactory.validation(
            `Sondage avec slug "${slug}" non trouvé`,
            "Sondage non trouvé",
            { slug },
          );

          logError(notFoundError, {
            component: "usePolls",
            operation: "getPollBySlug",
            slug,
          });

          throw notFoundError;
        }

        // Pour le mode développement, créer des options basiques à partir des settings
        const mockOptions: PollOption[] =
          poll.settings?.selectedDates?.map((date: string, index: number) => ({
            id: `option-${index}`,
            poll_id: poll.id,
            option_date: date,
            time_slots: poll.settings?.timeSlotsByDate?.[date] || null,
            display_order: index,
            created_at: poll.created_at,
          })) || [];

        return { poll: poll as StoragePoll, options: mockOptions };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Sondage non trouvé";
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updatePollStatus = useCallback(
    async (pollId: string, status: StoragePoll["status"]): Promise<{ error?: string }> => {
      if (!user) {
        return { error: "Utilisateur non connecté" };
      }

      setLoading(true);
      setError(null);

      try {
        await supabaseUpdate(
          "polls",
          { status, updated_at: new Date().toISOString() },
          {
            id: `eq.${pollId}`,
            creator_id: `eq.${user.id}`, // Sécurité : seul le créateur peut modifier
          },
          { timeout: 10000 },
        );

        return {};
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur lors de la mise à jour du sondage";
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const deletePoll = useCallback(
    async (pollId: string) => {
      logger.info(`Starting deletion of poll ${pollId}`, "poll");
      setLoading(true);
      setError(null);

      try {
        // Use centralized pollStorage instead of direct localStorage access
        logger.debug("Calling deletePollById", "poll", { pollId });
        deletePollById(pollId);
        logger.debug("Poll deleted from storage", "poll");

        // Use centralized vote storage instead of direct localStorage access
        logger.debug("Deleting votes", "poll", { pollId });
        deleteVotesByPollId(pollId);
        logger.debug("Votes deleted", "poll");

        // Rafraîchir la liste des sondages
        logger.debug("Refreshing polls list", "poll");
        await getUserPolls();
        logger.info("Poll deleted and list refreshed", "poll", { pollId });

        return {};
      } catch (err: unknown) {
        logger.error(`usePolls.deletePoll: Error during deletion`, "poll", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur lors de la suppression du sondage";
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [getUserPolls],
  );

  // Charger automatiquement les sondages quand l'utilisateur change
  useEffect(() => {
    getUserPolls();
  }, [user?.id, getUserPolls]);

  return {
    loading,
    error,
    polls,
    createPoll,
    getUserPolls,
    getPollBySlug,
    updatePollStatus,
    deletePoll,
  };
}
