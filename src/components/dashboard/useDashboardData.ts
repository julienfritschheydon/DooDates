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
      const localVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");

      // Calculer les statistiques pour chaque sondage
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

        const pollVotes = localVotes.filter((vote: any) => vote.poll_id === poll.id);
        const uniqueVoters = new Set(pollVotes.map((vote: any) => getVoterId(vote))).size;

        // Calculer les meilleures dates
        let topDates: { date: string; score: number }[] = [];
        const selectedDates = poll.settings?.selectedDates || poll.options;

        if (
          selectedDates &&
          Array.isArray(selectedDates) &&
          pollVotes.length > 0 &&
          poll.type !== "form"
        ) {
          const dateScores = selectedDates.map((dateStr: any, index: number) => {
            const dateLabel =
              typeof dateStr === "string" ? dateStr : dateStr.label || dateStr.title;
            const optionId = `option-${index}`;

            let score = 0;
            pollVotes.forEach((vote: any) => {
              const selection = vote.vote_data?.[optionId] || vote.selections?.[optionId];
              if (selection === "yes") score += 3;
              else if (selection === "maybe") score += 1;
            });
            return { date: dateLabel, score };
          });

          topDates = dateScores
            .filter((d) => d.score > 0)
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

        // Chercher le poll associé via pollId
        const relatedPoll = metadata?.pollId
          ? pollsWithStats.find((p) => p.id === metadata.pollId)
          : undefined;

        return {
          id: conv.id,
          conversationTitle: conv.title || "Conversation sans titre",
          conversationDate: new Date(conv.updatedAt || conv.createdAt || Date.now()),
          poll: relatedPoll,
          hasAI: !!metadata?.pollGenerated,
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
