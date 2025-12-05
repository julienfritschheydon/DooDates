import { useState, useEffect, useCallback } from "react";
import { DashboardPoll, ConversationItem } from "./types";
import {
  getAllPolls,
  getFormResponses,
  getRespondentId,
  getVoterId,
  getCurrentUserId,
} from "@/lib/pollStorage";
import { getConversations as getLocalConversations } from "@/lib/storage/ConversationStorageSimple";
import { logError, ErrorFactory } from "@/lib/error-handling";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { usePolls } from "@/hooks/usePolls";
import { isE2ETestingEnvironment } from "@/lib/e2e-detection";
import type { Conversation } from "@/types/conversation";
import type { Vote } from "@/lib/pollStorage";

type VoteWithData = Vote & {
  vote_data?: Record<string, "yes" | "no" | "maybe">;
  selections?: Record<string, "yes" | "no" | "maybe">;
};

export function useDashboardData(refreshKey: number) {
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { getUserPolls } = usePolls();

  // Log détaillé pour comprendre pourquoi user n'est pas disponible
  logger.debug("🔍 Dashboard - useDashboardData - user depuis useAuth()", "dashboard", {
    hasUser: !!user,
    userId: user?.id || null,
    userEmail: user?.email || null,
    userObject: user ? { id: user.id, email: user.email } : null,
  });

  // Vérifier si la détection E2E est désactivée explicitement
  const isE2EDetectionDisabled =
    typeof window !== "undefined" &&
    (window as Window & { __DISABLE_E2E_DETECTION__?: boolean }).__DISABLE_E2E_DETECTION__ === true;

  const isE2ETestMode =
    typeof window !== "undefined" &&
    !isE2EDetectionDisabled && // Si désactivé explicitement, ne pas considérer comme E2E
    (isE2ETestingEnvironment() ||
      (window as Window & { __IS_E2E_TESTING__?: boolean }).__IS_E2E_TESTING__ === true);

  logger.debug("🔍 Dashboard - isE2ETestMode calculé", "dashboard", {
    isE2ETestMode,
    isE2EDetectionDisabled,
    isE2ETestingEnvironment: isE2ETestingEnvironment(),
    hasUser: !!user,
    userId: user?.id || null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    logger.debug("🔍 Dashboard - loadData DÉBUT", "dashboard", {
      hasUser: !!user,
      userId: user?.id || null,
      isE2ETestMode,
      willLoadFromSupabase: !!(user?.id && !isE2ETestMode),
    });

    try {
      // Charger les polls depuis Supabase (si utilisateur connecté et hors E2E)
      if (user?.id && !isE2ETestMode) {
        logger.debug("🔍 Dashboard - Chargement polls depuis Supabase", "dashboard", {
          userId: user.id,
        });
        await getUserPolls();
      }

      // Récupérer les conversations depuis Supabase + localStorage (avec merge)
      let allConversations: Conversation[] = [];

      if (user?.id && !isE2ETestMode) {
        logger.debug("🔍 Dashboard - Chargement conversations depuis Supabase", "dashboard", {
          userId: user.id,
        });
        // Utilisateur connecté : charger depuis Supabase et merger avec localStorage
        // pour inclure les conversations incomplètes pas encore synchronisées
        try {
          const { getConversations: getSupabaseConversations } = await import(
            "@/lib/storage/ConversationStorageSupabase"
          );
          const supabaseConversations = await getSupabaseConversations(user.id);
          logger.info("📥 Dashboard - Conversations depuis Supabase", "dashboard", {
            count: supabaseConversations.length,
            userId: user.id,
          });

          // Charger aussi les conversations depuis localStorage pour merger
          const localConversations = getLocalConversations();
          logger.info("📥 Dashboard - Conversations depuis localStorage", "dashboard", {
            count: localConversations.length,
          });

          // Merger : Supabase est la source de vérité, mais inclure les conversations locales
          // qui ne sont pas encore dans Supabase (conversations incomplètes en cours de synchronisation)
          const mergedMap = new Map<string, Conversation>();

          // Ajouter d'abord les conversations de Supabase
          supabaseConversations.forEach((conv) => {
            if (conv.userId === user.id) {
              mergedMap.set(conv.id, conv);
            }
          });

          // Ajouter les conversations locales qui ne sont pas encore dans Supabase
          localConversations.forEach((localConv) => {
            if (localConv.userId === user.id && !mergedMap.has(localConv.id)) {
              // Conversation locale pas encore synchronisée avec Supabase
              logger.info(
                "📥 Dashboard - Conversation locale ajoutée (pas encore dans Supabase)",
                "dashboard",
                {
                  convId: localConv.id,
                  convTitle: localConv.title,
                  userId: localConv.userId,
                  hasPoll: !!(localConv.pollId || localConv.metadata?.pollId),
                  messageCount: localConv.messageCount,
                },
              );
              mergedMap.set(localConv.id, localConv);
            } else if (localConv.userId !== user.id) {
              logger.debug(
                "📥 Dashboard - Conversation locale exclue (userId différent)",
                "dashboard",
                {
                  convId: localConv.id,
                  convUserId: localConv.userId,
                  currentUserId: user.id,
                },
              );
            }
          });

          allConversations = Array.from(mergedMap.values());

          // Mettre à jour le localStorage pour cache (écrase l'ancien cache)
          const { saveConversations } = await import("@/lib/storage/ConversationStorageSimple");
          saveConversations(allConversations);

          logger.info(
            "✅ Dashboard - Conversations synchronisées (Supabase + localStorage)",
            "dashboard",
            {
              count: allConversations.length,
              fromSupabase: supabaseConversations.length,
              fromLocal: localConversations.length,
              merged: allConversations.length,
            },
          );
        } catch (supabaseError) {
          logger.error(
            "❌ Dashboard - Erreur Supabase, fallback sur localStorage",
            "dashboard",
            supabaseError,
          );
          // Fallback sur localStorage en cas d'erreur Supabase
          allConversations = getLocalConversations();
          logger.info("⚠️ Dashboard - Fallback localStorage actif", "dashboard", {
            count: allConversations.length,
            reason: "Supabase error"
          });
        }
      } else {
        // Mode invité ou E2E : utiliser seulement localStorage
        allConversations = getLocalConversations();
      }
      logger.info("🔍 Dashboard - Conversations brutes", "dashboard", {
        count: allConversations.length,
        conversations: allConversations.map((c) => ({
          id: c.id,
          title: c.title,
          userId: c.userId,
          pollId: c.pollId || c.metadata?.pollId,
        })),
      });

      // Récupérer les polls avec statistiques
      const allPolls = getAllPolls();
      logger.info("🔍 Dashboard - Polls bruts", "dashboard", {
        count: allPolls.length,
        polls: allPolls.map((p) => ({
          id: p.id,
          title: p.title,
          creator_id: p.creator_id,
        })),
      });

      // Filtrer les polls pour ne garder que ceux du créateur actuel
      const currentUserId = getCurrentUserId(user?.id);
      logger.info("🔍 Dashboard - User ID pour filtrage", "dashboard", {
        userAuthId: user?.id,
        currentUserId,
        isGuest: !user?.id,
      });

      // Filtrer strictement par creator_id pour éviter qu'un utilisateur non loggé voie les sondages d'un autre
      const localPolls = allPolls.filter((poll) => {
        if (user?.id) {
          // Mode connecté : seulement les polls du créateur authentifié
          return poll.creator_id === user.id;
        } else {
          // Mode invité : SEULEMENT les polls avec le device ID actuel
          // Ne pas accepter "anonymous", undefined ou null pour éviter les fuites de données
          return poll.creator_id === currentUserId;
        }
      });
      logger.info("🔍 Dashboard - Polls filtrés", "dashboard", {
        count: localPolls.length,
        polls: localPolls.map((p) => ({
          id: p.id,
          title: p.title,
          creator_id: p.creator_id,
        })),
      });

      // Filtrer les conversations pour ne garder que celles du créateur actuel
      // Si connecté : garder celles avec userId === user.id
      // Si invité : garder celles avec userId === "guest" ou undefined (rétrocompatibilité)
      logger.debug("🔍 Dashboard - Filtrage conversations", "dashboard", {
        totalConversations: allConversations.length,
        userAuthId: user?.id || null,
        hasUser: !!user?.id,
        conversationsPreview: allConversations.slice(0, 3).map((c) => ({
          id: c.id,
          userId: c.userId,
          title: c.title?.substring(0, 50),
        })),
      });

      const conversations = allConversations.filter((conv) => {
        if (user?.id) {
          // Mode connecté : garder seulement les conversations de l'utilisateur
          const matches = conv.userId === user.id;
          if (!matches) {
            logger.debug("🔍 Dashboard - Conversation exclue (mode connecté)", "dashboard", {
              convId: conv.id,
              convUserId: conv.userId,
              userAuthId: user.id,
              match: matches,
            });
          }
          return matches;
        } else {
          // Mode invité : garder seulement les conversations invitées
          const matches = conv.userId === "guest" || conv.userId === undefined;
          if (!matches) {
            logger.debug("🔍 Dashboard - Conversation exclue (mode invité)", "dashboard", {
              convId: conv.id,
              convUserId: conv.userId,
              match: matches,
            });
          }
          return matches;
        }
      });

      logger.info("🔍 Dashboard - Conversations filtrées", "dashboard", {
        count: conversations.length,
        conversations: conversations.map((c) => ({
          id: c.id,
          title: c.title,
          userId: c.userId,
          pollId: c.pollId || c.metadata?.pollId,
        })),
      });

      // Parser les votes une seule fois et créer un index par poll_id pour éviter les filtres répétés
      const votesRaw = localStorage.getItem("dev-votes");
      const localVotes: Vote[] = votesRaw ? JSON.parse(votesRaw) : [];

      // Indexer les votes par poll_id pour accès O(1) au lieu de O(n)
      const votesByPollId = new Map<string, Vote[]>();
      for (const vote of localVotes) {
        const pollId = vote.poll_id;
        if (pollId) {
          if (!votesByPollId.has(pollId)) {
            votesByPollId.set(pollId, []);
          }
          votesByPollId.get(pollId)!.push(vote);
        }
      }

      // Calculer les statistiques pour chaque sondage (optimisé)
      const pollsWithStats: DashboardPoll[] = localPolls.map((poll) => {
        if (poll?.type === "form") {
          const resps = getFormResponses(poll.id);
          const unique = new Set(resps.map((r) => getRespondentId(r))).size;
          return {
            ...poll,
            participants_count: unique,
            votes_count: resps.length,
          };
        }

        // Utiliser l'index au lieu de filter pour éviter O(n) par poll
        const pollVotes = votesByPollId.get(poll.id) || [];
        const uniqueVoters = new Set(pollVotes.map((vote) => getVoterId(vote))).size;

        // Calculer les meilleures dates (optimisé)
        let topDates: { date: string; score: number }[] = [];
        const selectedDates = poll.settings?.selectedDates || poll.dates;

        if (
          selectedDates &&
          Array.isArray(selectedDates) &&
          pollVotes.length > 0 &&
          poll.type === "date"
        ) {
          // Pré-calculer les scores dans une seule passe
          const dateScoresMap = new Map<string, number>();

          for (let index = 0; index < selectedDates.length; index++) {
            const dateStr = selectedDates[index];
            const dateLabel =
              typeof dateStr === "string"
                ? dateStr
                : typeof dateStr === "object" &&
                  dateStr !== null &&
                  ("label" in dateStr || "title" in dateStr)
                  ? (dateStr as { label?: string; title?: string }).label ||
                  (dateStr as { label?: string; title?: string }).title ||
                  String(dateStr)
                  : String(dateStr);
            const optionId = `option-${index}`;

            let score = 0;
            // Parcourir les votes une seule fois
            for (const vote of pollVotes) {
              const voteData =
                (vote as VoteWithData).vote_data || (vote as VoteWithData).selections;
              const selection = voteData?.[optionId];
              if (selection === "yes") score += 3;
              else if (selection === "maybe") score += 1;
            }

            if (score > 0) {
              dateScoresMap.set(dateLabel, score);
            }
          }

          // Convertir en array et trier
          topDates = Array.from(dateScoresMap.entries())
            .map(([date, score]) => ({ date, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);
        }

        return {
          ...poll,
          participants_count: uniqueVoters,
          votes_count: pollVotes.length,
          topDates,
        };
      });

      // Créer les items unifiés
      // Filtrer aussi les conversations liées à des polls qui ne sont pas du créateur actuel
      const items: ConversationItem[] = conversations
        .map((conv) => {
          const metadata = conv.metadata;

          // Chercher le poll associé via pollId (directement sur conv ou dans metadata)
          const pollId = conv.pollId || metadata?.pollId;
          const relatedPoll = pollId ? pollsWithStats.find((p) => p.id === pollId) : undefined;

          logger.debug("🔍 Dashboard - Mapping conversation", "dashboard", {
            convId: conv.id,
            convTitle: conv.title,
            pollId,
            hasRelatedPoll: !!relatedPoll,
            relatedPollId: relatedPoll?.id,
            relatedPollTitle: relatedPoll?.title,
          });

          // Si la conversation est liée à un poll, vérifier que le poll appartient au créateur actuel
          if (pollId && !relatedPoll) {
            // La conversation est liée à un poll qui n'appartient pas au créateur actuel
            logger.debug("🔍 Dashboard - Conversation exclue (poll non trouvé)", "dashboard", {
              convId: conv.id,
              pollId,
              availablePollIds: pollsWithStats.map((p) => p.id),
            });
            return null;
          }

          return {
            id: conv.id,
            conversationTitle: conv.title || "Conversation sans titre",
            conversationDate: new Date(conv.updatedAt || conv.createdAt || Date.now()),
            poll: relatedPoll,
            hasAI: !!metadata?.pollGenerated,
            tags: conv.tags || [],
            folderId: metadata?.folderId,
          } as ConversationItem;
        })
        .filter((item): item is ConversationItem => item !== null); // Filtrer les null

      // Ajouter les polls sans conversation associée (notamment les sondages disponibilités créés directement)
      const pollIdsWithConversation = new Set(
        conversations
          .map((conv) => conv.pollId || conv.metadata?.pollId)
          .filter((id): id is string => !!id),
      );

      const orphanPolls = pollsWithStats.filter((poll) => !pollIdsWithConversation.has(poll.id));

      logger.info("🔍 Dashboard - Polls orphelins (sans conversation)", "dashboard", {
        count: orphanPolls.length,
        polls: orphanPolls.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
        })),
      });

      // Créer des items pour les polls orphelins
      const orphanItems: ConversationItem[] = orphanPolls.map((poll) => ({
        id: `poll-${poll.id}`, // ID unique pour l'item dashboard
        conversationTitle: poll.title || "Sondage sans titre",
        conversationDate: new Date(poll.updated_at || poll.created_at),
        poll: poll,
        hasAI: false,
        tags: [],
      }));

      // Combiner les items de conversations et les polls orphelins
      const allItems = [...items, ...orphanItems];

      logger.info("🔍 Dashboard - Items finaux", "dashboard", {
        count: allItems.length,
        itemsFromConversations: items.length,
        itemsFromOrphanPolls: orphanItems.length,
        items: allItems.map((i) => ({
          id: i.id,
          title: i.conversationTitle,
          hasPoll: !!i.poll,
          pollId: i.poll?.id,
          pollTitle: i.poll?.title,
          pollType: i.poll?.type,
        })),
      });

      // Trier par date (plus récent en premier)
      allItems.sort((a, b) => b.conversationDate.getTime() - a.conversationDate.getTime());

      setConversationItems(allItems);
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to load dashboard data",
          "Erreur lors du chargement des données",
        ),
        { component: "useDashboardData", metadata: { originalError: error } },
      );
    } finally {
      setLoading(false);
    }
  }, [getUserPolls, user, user?.id, isE2ETestMode]);

  useEffect(() => {
    loadData();
  }, [refreshKey, user?.id, loadData]);

  return { conversationItems, loading, reload: loadData };
}
