import { useState, useEffect } from "react";
import { DashboardPoll, ConversationItem } from "./types";
import { getAllPolls, getFormResponses, getRespondentId, getVoterId } from "@/lib/pollStorage";
import { getConversations } from "@/lib/storage/ConversationStorageSimple";
import { logError, ErrorFactory } from "@/lib/error-handling";

export function useDashboardData(refreshKey: number) {
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Récupérer les conversations
      const conversations = getConversations();

      // Récupérer les polls avec statistiques
      const localPolls = getAllPolls();

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
      const items: ConversationItem[] = conversations.map((conv) => {
        const metadata = conv.metadata as any;

        // Chercher le poll associé via pollId (directement sur conv ou dans metadata)
        const pollId = (conv as any).pollId || metadata?.pollId;
        const relatedPoll = pollId ? pollsWithStats.find((p) => p.id === pollId) : undefined;

        return {
          id: conv.id,
          conversationTitle: conv.title || "Conversation sans titre",
          conversationDate: new Date(conv.updatedAt || conv.createdAt || Date.now()),
          poll: relatedPoll,
          hasAI: !!metadata?.pollGenerated,
          tags: conv.tags || [],
          folderId: metadata?.folderId,
        };
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
