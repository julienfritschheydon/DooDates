import { useState, useCallback } from "react";
import {
  Poll as TypesPoll,
  PollOption,
  PollData as TypesPollData,
} from "../types/poll";
import { supabase } from "../lib/supabase";
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
} from "../lib/pollStorage";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";
import { logger } from "@/lib/logger";

export interface PollData {
  title: string;
  description?: string | null;
  selectedDates: string[];
  timeSlotsByDate: Record<
    string,
    Array<{ hour: number; minute: number; enabled: boolean }>
  >;
  participantEmails: string[];
  settings: {
    timeGranularity: number;
    allowAnonymousVotes: boolean;
    allowMaybeVotes: boolean;
    sendNotifications: boolean;
    expiresAt?: string;
  };
}

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
    async (
      pollData: PollData,
    ): Promise<{ poll?: StoragePoll; error?: string }> => {
      // Permettre la création avec ou sans utilisateur connecté

      setLoading(true);
      setError(null);

      try {
        // Validation stricte: au moins une date doit être sélectionnée
        if (
          !Array.isArray(pollData.selectedDates) ||
          pollData.selectedDates.length === 0
        ) {
          throw ErrorFactory.validation(
            "No dates selected for poll creation",
            "Sélectionnez au moins une date pour créer le sondage.",
          );
        }

        const slug = generateSlug(pollData.title);
        // Toujours embarquer les dates et créneaux dans settings pour cohérence UI
        const mergedSettings = {
          ...pollData.settings,
          selectedDates: pollData.selectedDates,
          timeSlotsByDate: pollData.timeSlotsByDate,
        } as any;
        const adminToken = user ? null : generateAdminToken(); // Token admin seulement pour sondages anonymes

        // Creating poll with generated slug and admin token if needed

        // Mode local/mock si Supabase n'est pas configuré, en environnement de test/Vitest,
        // ou si le runtime E2E (Playwright) est actif via indicateur global/localStorage.
        const isLocalMode =
          import.meta.env.MODE === "test" ||
          Boolean(import.meta.env.VITEST) ||
          import.meta.env.MODE === "development" ||
          // Détection runtime E2E côté navigateur
          (typeof window !== "undefined" &&
            (() => {
              try {
                return (
                  (window as any).__E2E__ === true ||
                  localStorage.getItem("e2e") === "1" ||
                  localStorage.getItem("dev-local-mode") === "1"
                );
              } catch (_) {
                return false;
              }
            })()) ||
          // Fallback: variables d'env manquantes
          !import.meta.env.VITE_SUPABASE_URL ||
          !import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (isLocalMode) {
          // Supabase not configured - using local simulation

          // Récupérer conversationId depuis l'URL si présent
          const urlParams = new URLSearchParams(window.location.search);
          const conversationId = urlParams.get("conversationId");

          // Simuler la création avec localStorage
          const mockPoll: StoragePoll = {
            id: `local-${Date.now()}`,
            creator_id: user?.id || "anonymous",
            title: pollData.title,
            description: pollData.description || undefined,
            slug,
            settings: mergedSettings,
            status: "active",
            expires_at: pollData.settings.expiresAt || undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creatorEmail: user?.email || undefined,
            dates: pollData.selectedDates,
            type: "date",
            relatedConversationId: conversationId || undefined,
          };

          // Use centralized pollStorage instead of direct localStorage access
          addPoll(mockPoll);

          // Émettre un événement pour notifier les composants de la création
          window.dispatchEvent(
            new CustomEvent("pollCreated", {
              detail: { poll: mockPoll },
            }),
          );

          return { poll: mockPoll };
        }

        // 1. Créer le sondage principal
        const insertData = {
          creator_id: user?.id || null, // null pour les sondages anonymes
          title: pollData.title,
          description: pollData.description || null,
          slug: slug,
          admin_token: adminToken, // Token pour gérer les sondages anonymes
          settings: mergedSettings,
          status: "active" as const,
          expires_at: pollData.settings.expiresAt || null,
        };

        // Utiliser fetch() direct pour les sondages (comme pour les options)
        let poll: any;
        try {
          // Pour les sondages anonymes, pas besoin de token JWT
          if (!user) {
            // Creating anonymous poll - no token required

            // Utiliser la clé API publique pour les sondages anonymes
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/polls`,
              {
                method: "POST",
                headers: {
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify(insertData),
              },
            );

            if (!response.ok) {
              const errorData = await response.text();
              const apiError = ErrorFactory.api(
                `Erreur API Supabase ${response.status}`,
                "Erreur lors de la création du sondage",
                { status: response.status, errorData },
              );

              logError(apiError, {
                component: "usePolls",
                operation: "createPoll",
                status: response.status,
              });

              throw apiError;
            }

            const result = await response.json();
            poll = Array.isArray(result) ? result[0] : result;
          } else {
            // Pour les utilisateurs connectés, récupérer le token JWT
            let token = null;
            const supabaseSession = localStorage.getItem("supabase.auth.token");
            if (supabaseSession) {
              const sessionData = JSON.parse(supabaseSession);
              token =
                sessionData?.access_token ||
                sessionData?.currentSession?.access_token;
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

            if (!token) {
              const authError = ErrorFactory.auth(
                "Token d'authentification non trouvé pour utilisateur connecté",
              );

              logError(authError, {
                component: "usePolls",
                operation: "createPollOptions",
              });

              throw authError;
            }

            // Faire l'insertion avec token d'authentification
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/polls`,
              {
                method: "POST",
                headers: {
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify(insertData),
              },
            );

            if (!response.ok) {
              const errorData = await response.text();
              const apiError = ErrorFactory.api(
                `Erreur API Supabase ${response.status}`,
                "Erreur lors de la création du sondage",
                { status: response.status, errorData },
              );

              logError(apiError, {
                component: "usePolls",
                operation: "createPoll",
                status: response.status,
              });

              throw apiError;
            }

            const result = await response.json();
            poll = Array.isArray(result) ? result[0] : result;
          }
        } catch (fetchError) {
          logError(fetchError as Error, {
            component: "usePolls",
            operation: "createPoll",
          });
          // Améliorer le message d'erreur pour l'utilisateur
          if (
            fetchError instanceof TypeError &&
            fetchError.message.includes("fetch")
          ) {
            throw ErrorFactory.network(
              fetchError.message,
              "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.",
            );
          }
          throw handleError(fetchError, {
            component: "usePolls",
            operation: "createPoll",
          });
        }

        // Step 2: Creating date options

        const pollOptions = pollData.selectedDates.map((date, index) => {
          const timeSlots = pollData.timeSlotsByDate[date] || [];

          // Transformer les créneaux au format attendu par la DB
          const enabledSlots = timeSlots.filter((slot) => slot.enabled);

          // Trier les créneaux par heure et minute
          const sortedSlots = enabledSlots.sort((a, b) => {
            if (a.hour !== b.hour) return a.hour - b.hour;
            return a.minute - b.minute;
          });

          const formattedTimeSlots = sortedSlots.map((slot, slotIndex) => {
            // Calculer l'heure de fin correctement
            const totalMinutes =
              slot.hour * 60 +
              slot.minute +
              (pollData.settings?.timeGranularity || 30);
            const endHour = Math.floor(totalMinutes / 60);
            const endMinute = totalMinutes % 60;

            return {
              id: `slot-${date}-${slotIndex + 1}`,
              start_hour: slot.hour,
              start_minute: slot.minute,
              end_hour: endHour,
              end_minute: endMinute,
              duration: pollData.settings?.timeGranularity || 30,
              label: `${slot.hour.toString().padStart(2, "0")}:${slot.minute.toString().padStart(2, "0")} - ${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`,
            };
          });

          return {
            poll_id: poll.id,
            option_date: date,
            time_slots: formattedTimeSlots,
            display_order: index,
          };
        });

        // Utiliser fetch() direct pour les options (comme pour le sondage principal)
        try {
          // Pour les sondages anonymes, pas besoin de token JWT
          if (!user) {
            // Creating anonymous poll - no token required

            // Utiliser la clé API publique pour les sondages anonymes
            const optionsResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/poll_options`,
              {
                method: "POST",
                headers: {
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify(pollOptions),
              },
            );

            console.log(
              " Réponse insertion options:",
              optionsResponse.status,
              optionsResponse.statusText,
            );

            if (!optionsResponse.ok) {
              const errorText = await optionsResponse.text();
              const optionsError = ErrorFactory.api(
                `Erreur création options ${optionsResponse.status}`,
                "Erreur lors de la création des options du sondage",
                { status: optionsResponse.status, errorText },
              );

              logError(optionsError, {
                component: "usePolls",
                operation: "createPollOptions",
              });

              throw optionsError;
            }

            const optionsData = await optionsResponse.json();
            logger.info("Options créées avec succès", "poll", {
              optionsCount: optionsData.length,
            });
          } else {
            // Pour les utilisateurs connectés, récupérer le token JWT
            let token = null;
            const supabaseSession = localStorage.getItem("supabase.auth.token");
            if (supabaseSession) {
              const sessionData = JSON.parse(supabaseSession);
              token =
                sessionData?.access_token ||
                sessionData?.currentSession?.access_token;
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

            if (!token) {
              const authError = ErrorFactory.auth(
                "Token d'authentification non trouvé pour utilisateur connecté",
              );

              logError(authError, {
                component: "usePolls",
                operation: "createPollOptions",
              });

              throw authError;
            }

            // Faire l'insertion avec token d'authentification
            const optionsResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/poll_options`,
              {
                method: "POST",
                headers: {
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify(pollOptions),
              },
            );

            console.log(
              " Réponse insertion options:",
              optionsResponse.status,
              optionsResponse.statusText,
            );

            if (!optionsResponse.ok) {
              const errorText = await optionsResponse.text();
              const optionsError = ErrorFactory.api(
                `Erreur création options ${optionsResponse.status}`,
                "Erreur lors de la création des options du sondage",
                { status: optionsResponse.status, errorText },
              );

              logError(optionsError, {
                component: "usePolls",
                operation: "createPollOptions",
              });

              throw optionsError;
            }

            const optionsData = await optionsResponse.json();
            // Options created successfully
          }
        } catch (optionsError) {
          const processedError = handleError(
            optionsError,
            {
              component: "usePolls",
              operation: "createPollOptions",
            },
            "Erreur lors de la création des options du sondage",
          );

          logError(processedError, {
            component: "usePolls",
            operation: "createPollOptions",
            pollId: poll.id,
          });

          // Nettoyer le sondage créé en cas d'erreur sur les options
          try {
            await supabase.from("polls").delete().eq("id", poll.id);
          } catch (cleanupError) {
            const cleanupErr = handleError(
              cleanupError,
              {
                component: "usePolls",
                operation: "pollCleanup",
              },
              "Erreur lors du nettoyage du sondage",
            );

            logError(cleanupErr, {
              component: "usePolls",
              operation: "pollCleanup",
              pollId: poll.id,
            });
          }

          throw optionsError;
        }

        // 3. Envoyer les emails aux participants si demandé

        if (
          pollData.settings.sendNotifications &&
          pollData.participantEmails.length > 0
        ) {
          try {
            const emailResult = await EmailService.sendPollCreatedNotification(
              pollData.title,
              poll.slug,
              user?.email ||
                user?.user_metadata?.full_name ||
                "Un organisateur",
              pollData.participantEmails,
            );

            if (emailResult.success) {
              // Emails sent successfully
            } else {
              logger.warn("Email sending error", "api", emailResult.error);
              // Ne pas faire échouer la création du sondage si l'email échoue
            }
          } catch (emailError) {
            logger.warn("Error sending emails", "api", emailError);
            // Ne pas faire échouer la création du sondage si l'email échoue
          }
        }

        // 4. Analytics (optionnel - ne doit pas bloquer la création)

        return { poll };
      } catch (error: any) {
        const processedError = handleError(
          error,
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

        if (error instanceof TypeError && error.message.includes("fetch")) {
          userFriendlyMessage =
            "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.";
        } else if (error.message.includes("Failed to fetch")) {
          userFriendlyMessage =
            "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.";
        } else if (error.message.includes("NetworkError")) {
          userFriendlyMessage =
            "Erreur réseau. Vérifiez votre connexion internet.";
        } else if (error.message.includes("CORS")) {
          userFriendlyMessage =
            "Erreur de configuration serveur. Contactez le support.";
        } else if (error.message) {
          userFriendlyMessage = error.message;
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
      // Mode développement local - utiliser getAllPolls() pour cohérence avec le Dashboard
      const userPolls = getAllPolls();

      setPolls(userPolls);
      return { polls: userPolls };
    } catch (err: any) {
      const errorMessage =
        err.message || "Erreur lors de la récupération des sondages";
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
      } catch (err: any) {
        const errorMessage = err.message || "Sondage non trouvé";
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updatePollStatus = useCallback(
    async (
      pollId: string,
      status: StoragePoll["status"],
    ): Promise<{ error?: string }> => {
      if (!user) {
        return { error: "Utilisateur non connecté" };
      }

      setLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from("polls")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", pollId)
          .eq("creator_id", user.id); // Sécurité : seul le créateur peut modifier

        if (updateError) {
          throw updateError;
        }

        return {};
      } catch (err: any) {
        const errorMessage =
          err.message || "Erreur lors de la mise à jour du sondage";
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
      console.log(
        `🗑️ usePolls.deletePoll: Starting deletion of poll ${pollId}`,
      );
      setLoading(true);
      setError(null);

      try {
        // Use centralized pollStorage instead of direct localStorage access
        console.log(`💾 usePolls.deletePoll: Calling deletePollById...`);
        deletePollById(pollId);
        console.log(`✅ usePolls.deletePoll: Poll deleted from storage`);

        // Use centralized vote storage instead of direct localStorage access
        console.log(`💾 usePolls.deletePoll: Deleting votes...`);
        deleteVotesByPollId(pollId);
        console.log(`✅ usePolls.deletePoll: Votes deleted`);

        // Rafraîchir la liste des sondages
        console.log(`🔄 usePolls.deletePoll: Refreshing polls list...`);
        await getUserPolls();
        console.log(`✅ usePolls.deletePoll: Polls list refreshed`);

        return {};
      } catch (err: any) {
        logger.error(`usePolls.deletePoll: Error during deletion`, err);
        const errorMessage =
          err.message || "Erreur lors de la suppression du sondage";
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [getUserPolls],
  );

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
