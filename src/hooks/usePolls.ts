import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "../lib/email-service";

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

export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings: any;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Type facultatif pour compatibilité avec le stockage unifié local (date | form)
  type?: "date" | "form";
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: any;
  display_order: number;
  created_at: string;
}

export function usePolls() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);

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
    async (pollData: PollData): Promise<{ poll?: Poll; error?: string }> => {
      // Permettre la création avec ou sans utilisateur connecté

      setLoading(true);
      setError(null);

      try {
        // Validation stricte: au moins une date doit être sélectionnée
        if (
          !Array.isArray(pollData.selectedDates) ||
          pollData.selectedDates.length === 0
        ) {
          throw new Error(
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

        console.log("Création sondage:", {
          slug,
          isAnonymous: !user,
          adminToken: adminToken ? "généré" : "non requis",
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL
            ? "✅ configurée"
            : "❌ manquante",
          supabaseUrlValue: import.meta.env.VITE_SUPABASE_URL,
          supabaseKeyExists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        });

        // Mode local/mock si Supabase n'est pas configuré (utilisé aussi en CI E2E)
        const isLocalMode =
          !import.meta.env.VITE_SUPABASE_URL ||
          !import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (isLocalMode) {
          console.warn(
            "🚧 Supabase non configuré - Simulation locale de la création de sondage",
          );

          // Simuler la création avec localStorage
          const mockPoll: Poll = {
            id: `local-${Date.now()}`,
            creator_id: user?.id || "anonymous",
            title: pollData.title,
            description: pollData.description || null,
            slug,
            settings: mergedSettings,
            status: "active",
            expires_at: pollData.settings.expiresAt || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            type: "date",
          };

          // Sauvegarder en localStorage pour le développement
          const existingPolls = JSON.parse(
            localStorage.getItem("dev-polls") || "[]",
          );
          existingPolls.push(mockPoll);
          localStorage.setItem("dev-polls", JSON.stringify(existingPolls));

          console.log(
            "✅ Sondage créé en mode développement local:",
            mockPoll.slug,
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

        // console.log("Tentative d'insertion avec:", insertData);

        // Utiliser fetch direct car le client supabase se bloque
        let poll;
        try {
          // Pour les sondages anonymes, pas besoin de token JWT
          if (!user) {
            console.log(" Création sondage anonyme - pas de token requis");

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
              console.error("Erreur API Supabase:", response.status, errorData);

              // Messages d'erreur plus explicites
              let errorMessage = `Erreur ${response.status}`;
              if (response.status === 401) {
                errorMessage =
                  "Erreur d'authentification. Veuillez vous reconnecter.";
              } else if (response.status === 403) {
                errorMessage =
                  "Permissions insuffisantes pour créer un sondage.";
              } else if (response.status === 400) {
                errorMessage =
                  "Données invalides. Vérifiez les informations du sondage.";
              } else if (response.status >= 500) {
                errorMessage =
                  "Erreur serveur. Veuillez réessayer dans quelques instants.";
              } else {
                errorMessage = `Erreur ${response.status}: ${errorData}`;
              }

              throw new Error(errorMessage);
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
              throw new Error(
                "Token d'authentification non trouvé pour utilisateur connecté",
              );
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
              console.error("Erreur API Supabase:", response.status, errorData);

              // Messages d'erreur plus explicites
              let errorMessage = `Erreur ${response.status}`;
              if (response.status === 401) {
                errorMessage =
                  "Erreur d'authentification. Veuillez vous reconnecter.";
              } else if (response.status === 403) {
                errorMessage =
                  "Permissions insuffisantes pour créer un sondage.";
              } else if (response.status === 400) {
                errorMessage =
                  "Données invalides. Vérifiez les informations du sondage.";
              } else if (response.status >= 500) {
                errorMessage =
                  "Erreur serveur. Veuillez réessayer dans quelques instants.";
              } else {
                errorMessage = `Erreur ${response.status}: ${errorData}`;
              }

              throw new Error(errorMessage);
            }

            const result = await response.json();
            poll = Array.isArray(result) ? result[0] : result;
          }
        } catch (fetchError) {
          console.error("Erreur création sondage:", fetchError);
          throw fetchError;
        }

        // 2. Créer les options de dates
        console.log(" Étape 2: Création des options de dates...");

        const pollOptions = pollData.selectedDates.map((date, index) => {
          const timeSlots = pollData.timeSlotsByDate[date] || [];

          // Transformer les créneaux au format attendu par la DB
          const formattedTimeSlots = timeSlots
            .filter((slot) => slot.enabled)
            .map((slot, slotIndex) => {
              // Calculer l'heure de fin correctement
              const totalMinutes =
                slot.hour * 60 +
                slot.minute +
                pollData.settings.timeGranularity;
              const endHour = Math.floor(totalMinutes / 60);
              const endMinute = totalMinutes % 60;

              return {
                id: `slot-${slotIndex + 1}`,
                start_hour: slot.hour,
                start_minute: slot.minute,
                end_hour: endHour,
                end_minute: endMinute,
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

        console.log(" Options à créer:", pollOptions);

        // Utiliser fetch() direct pour les options (comme pour le sondage principal)
        try {
          console.log(" Début insertion des options...");
          console.log(
            " Détail des options à insérer:",
            JSON.stringify(pollOptions, null, 2),
          );

          // Pour les sondages anonymes, pas besoin de token JWT
          if (!user) {
            console.log(" Création sondage anonyme - pas de token requis");

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
              console.error(
                " Erreur HTTP options:",
                optionsResponse.status,
                errorText,
              );
              throw new Error(
                `Erreur HTTP ${optionsResponse.status}: ${errorText}`,
              );
            }

            const optionsData = await optionsResponse.json();
            console.log(" Options créées avec succès:", optionsData);
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
              throw new Error(
                "Token d'authentification non trouvé pour utilisateur connecté",
              );
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
              console.error(
                " Erreur HTTP options:",
                optionsResponse.status,
                errorText,
              );
              throw new Error(
                `Erreur HTTP ${optionsResponse.status}: ${errorText}`,
              );
            }

            const optionsData = await optionsResponse.json();
            console.log(" Options créées avec succès:", optionsData);
          }
        } catch (optionsError) {
          console.error(
            " Exception lors de la création des options:",
            optionsError,
          );
          console.error(" Stack trace:", optionsError?.stack);

          // Nettoyer le sondage créé en cas d'erreur
          console.log(" Nettoyage du sondage suite à l'erreur...");
          try {
            await supabase.from("polls").delete().eq("id", poll.id);
          } catch (cleanupError) {
            console.error("Erreur nettoyage:", cleanupError);
          }

          throw optionsError;
        }

        // 3. Envoyer les emails aux participants si demandé
        console.log("Debug email:", {
          sendNotifications: pollData.settings.sendNotifications,
          emailsCount: pollData.participantEmails.length,
          emails: pollData.participantEmails,
        });

        if (
          pollData.settings.sendNotifications &&
          pollData.participantEmails.length > 0
        ) {
          console.log(" Étape 3: Envoi des notifications email...");
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
              console.log(" Emails envoyés avec succès");
            } else {
              console.warn("Erreur envoi emails:", emailResult.error);
              // Ne pas faire échouer la création du sondage si l'email échoue
            }
          } catch (emailError) {
            console.warn("Erreur lors de l'envoi des emails:", emailError);
            // Ne pas faire échouer la création du sondage si l'email échoue
          }
        } else {
          console.log(" Pas d'envoi d'emails:", {
            notifications: pollData.settings.sendNotifications,
            emailCount: pollData.participantEmails.length,
          });
        }

        // 4. Analytics (optionnel - ne doit pas bloquer la création)
        // Désactivé temporairement car le client Supabase se bloque
        // console.log("Analytics désactivées temporairement pour éviter les blocages");

        console.log(" Sondage créé avec succès:", poll.slug);
        return { poll };
      } catch (err: any) {
        const errorMessage =
          err.message || "Erreur lors de la création du sondage";
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [user, generateSlug],
  );

  const getUserPolls = useCallback(async (): Promise<{
    polls?: Poll[];
    error?: string;
  }> => {
    setLoading(true);
    setError(null);

    try {
      // Mode développement local - récupération depuis localStorage
      console.log("🔍 getUserPolls: Récupération depuis localStorage");
      const localPolls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
      console.log("🔍 localStorage raw data:", localPolls);

      // En mode développement local, récupérer TOUS les sondages (pas de filtrage par utilisateur)
      // car les sondages peuvent être créés de manière anonyme
      const userPolls = localPolls;

      console.log("🔍 Tous les sondages récupérés:", userPolls);
      console.log("🔍 User connecté:", user ? user.email : "Aucun");

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
    ): Promise<{ poll?: Poll; options?: PollOption[]; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        // Mode développement local - récupération depuis localStorage
        console.log("🔍 getPollBySlug: Recherche du sondage:", slug);
        const localPolls = JSON.parse(
          localStorage.getItem("dev-polls") || "[]",
        );

        const poll = localPolls.find((p: Poll) => p.slug === slug);

        if (!poll) {
          throw new Error(`Sondage avec slug "${slug}" non trouvé`);
        }

        console.log("🔍 Sondage trouvé:", poll);

        // Pour le mode développement, créer des options basiques à partir des settings
        const mockOptions: PollOption[] =
          poll.settings?.selectedDates?.map((date: string, index: number) => ({
            id: `option-${index}`,
            poll_id: poll.id,
            option_date: date,
            time_slots: poll.settings?.timeSlotsByDate?.[date] || null,
            created_at: poll.created_at,
          })) || [];

        return { poll, options: mockOptions };
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
      status: Poll["status"],
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
      setLoading(true);
      setError(null);

      try {
        console.log("🗑️ Suppression du sondage:", pollId);

        // En mode développement local, supprimer du localStorage
        const existingPolls = JSON.parse(
          localStorage.getItem("dev-polls") || "[]",
        );
        const filteredPolls = existingPolls.filter(
          (poll: any) => poll.id !== pollId,
        );
        localStorage.setItem("dev-polls", JSON.stringify(filteredPolls));

        // Supprimer aussi les votes associés
        const existingVotes = JSON.parse(
          localStorage.getItem("dev-votes") || "[]",
        );
        const filteredVotes = existingVotes.filter(
          (vote: any) => vote.poll_id !== pollId,
        );
        localStorage.setItem("dev-votes", JSON.stringify(filteredVotes));

        console.log("✅ Sondage supprimé avec succès");

        // Rafraîchir la liste des sondages
        await getUserPolls();

        return {};
      } catch (err: any) {
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
