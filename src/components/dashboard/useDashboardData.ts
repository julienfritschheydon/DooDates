import { useState, useEffect } from "react";
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

export function useDashboardData(refreshKey: number) {
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { getUserPolls } = usePolls();

  const isE2ETestMode =
    typeof window !== "undefined" &&
    (isE2ETestingEnvironment() || (window as any).__IS_E2E_TESTING__ === true);

  useEffect(() => {
    loadData();
  }, [refreshKey, user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les polls depuis Supabase (si utilisateur connecté et hors E2E)
      if (user?.id && !isE2ETestMode) {
        await getUserPolls();
      }

      // Récupérer les conversations depuis Supabase + localStorage (avec merge)
      let allConversations: Conversation[] = [];

      if (user?.id && !isE2ETestMode) {
        // Utilisateur connecté : Supabase est la SEULE source de vérité
        try {
          const { getConversations: getSupabaseConversations } = await import(
            "@/lib/storage/ConversationStorageSupabase"
          );
          const supabaseConversations = await getSupabaseConversations(user.id);
          logger.info("📥 Dashboard - Conversations depuis Supabase", "dashboard", {
            count: supabaseConversations.length,
            userId: user.id,
          });

          // Utiliser UNIQUEMENT les données de Supabase (pas de merge)
          allConversations = supabaseConversations;

          // Mettre à jour le localStorage pour cache (écrase l'ancien cache)
          const { saveConversations } = await import("@/lib/storage/ConversationStorageSimple");
          saveConversations(supabaseConversations);

          logger.info("✅ Dashboard - Conversations synchronisées depuis Supabase", "dashboard", {
            count: allConversations.length,
          });
        } catch (supabaseError) {
          logger.error(
            "❌ Dashboard - Erreur Supabase, fallback sur localStorage",
            "dashboard",
            supabaseError,
          );
          // Fallback sur localStorage en cas d'erreur Supabase
          allConversations = getLocalConversations();
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
          pollId: (c as any).pollId || (c as any).metadata?.pollId,
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
      const conversations = allConversations.filter((conv) => {
        if (user?.id) {
          // Mode connecté : garder seulement les conversations de l'utilisateur
          const matches = conv.userId === user.id;
          if (!matches) {
            logger.debug("🔍 Dashboard - Conversation exclue (mode connecté)", "dashboard", {
              convId: conv.id,
              convUserId: conv.userId,
              userAuthId: user.id,
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
          pollId: (c as any).pollId || (c as any).metadata?.pollId,
        })),
      });

      // Parser les votes une seule fois et créer un index par poll_id pour éviter les filtres répétés
      const votesRaw = localStorage.getItem("dev-votes");
      const localVotes: any[] = votesRaw ? JSON.parse(votesRaw) : [];

      // Indexer les votes par poll_id pour accès O(1) au lieu de O(n)
      const votesByPollId = new Map<string, any[]>();
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
      const pollsWithStats: DashboardPoll[] = localPolls.map((poll: any) => {
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
        const uniqueVoters = new Set(pollVotes.map((vote: any) => getVoterId(vote))).size;

        // Calculer les meilleures dates (optimisé)
        let topDates: { date: string; score: number }[] = [];
        const selectedDates = poll.settings?.selectedDates || poll.options;

        if (
          selectedDates &&
          Array.isArray(selectedDates) &&
          pollVotes.length > 0 &&
          poll.type !== "form"
        ) {
          // Pré-calculer les scores dans une seule passe
          const dateScoresMap = new Map<string, number>();

          for (let index = 0; index < selectedDates.length; index++) {
            const dateStr = selectedDates[index];
            const dateLabel =
              typeof dateStr === "string" ? dateStr : dateStr.label || dateStr.title;
            const optionId = `option-${index}`;

            let score = 0;
            // Parcourir les votes une seule fois
            for (const vote of pollVotes) {
              const selection = vote.vote_data?.[optionId] || vote.selections?.[optionId];
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
          const metadata = conv.metadata as any;

          // Chercher le poll associé via pollId (directement sur conv ou dans metadata)
          const pollId = (conv as any).pollId || metadata?.pollId;
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

      logger.info("🔍 Dashboard - Items finaux", "dashboard", {
        count: items.length,
        items: items.map((i) => ({
          id: i.id,
          title: i.conversationTitle,
          hasPoll: !!i.poll,
          pollId: i.poll?.id,
          pollTitle: i.poll?.title,
        })),
      });

      // Trier par date (plus récent en premier)
      items.sort((a, b) => b.conversationDate.getTime() - a.conversationDate.getTime());

      setConversationItems(items);
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
  };

  return { conversationItems, loading, reload: loadData };
}
