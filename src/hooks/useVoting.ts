import { useState, useEffect, useCallback } from "react";
import {
  pollsApi,
  pollOptionsApi,
  votesApi,
  Poll,
  PollOption,
  Vote,
} from "@/lib/supabase-fetch";

interface VoterInfo {
  name: string;
  email: string;
}

export const useVoting = (pollSlug: string) => {
  // State pour l'ID réel du poll (récupéré depuis le slug)
  const [realPollId, setRealPollId] = useState<string | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentVote, setCurrentVote] = useState<
    Record<string, "yes" | "no" | "maybe">
  >({});
  const [userHasVoted, setUserHasVoted] = useState<Record<string, boolean>>({});
  const [voterInfo, setVoterInfo] = useState<VoterInfo>({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser les votes par défaut à "maybe"
  const initializeDefaultVotes = useCallback((optionsData: PollOption[]) => {
    const defaultVotes: Record<string, "yes" | "no" | "maybe"> = {};
    const defaultHasVoted: Record<string, boolean> = {};

    optionsData.forEach((option) => {
      defaultVotes[option.id] = "maybe";
      defaultHasVoted[option.id] = false;
    });

    setCurrentVote(defaultVotes);
    setUserHasVoted(defaultHasVoted);
  }, []);

  // Charger les données du sondage
  const loadPollData = useCallback(async () => {
    if (!pollSlug) return;

    setLoading(true);
    setError(null);

    try {
      // Mode développement local - récupération depuis localStorage
      console.log("🔍 useVoting: Recherche du sondage:", pollSlug);
      const localPolls = JSON.parse(localStorage.getItem("dev-polls") || "[]");

      const pollData = localPolls.find((p: Poll) => p.slug === pollSlug);

      if (!pollData) {
        throw new Error(`Sondage avec slug "${pollSlug}" non trouvé`);
      }

      console.log("🔍 useVoting: Sondage trouvé:", pollData);
      console.log("🔍 useVoting: Settings du sondage:", pollData.settings);
      setPoll(pollData);
      setRealPollId(pollData.id);

      // Créer des options basiques à partir des settings
      let mockOptions: PollOption[] = [];

      if (
        pollData.settings?.selectedDates &&
        pollData.settings.selectedDates.length > 0
      ) {
        mockOptions = pollData.settings.selectedDates.map(
          (date: string, index: number) => ({
            id: `option-${index}`,
            poll_id: pollData.id,
            option_date: date,
            time_slots: pollData.settings?.timeSlotsByDate?.[date] || null,
            display_order: index,
          }),
        );
      } else {
        // Fallback: créer des options par défaut si aucune date n'est trouvée
        console.warn(
          "🚧 Aucune date trouvée dans settings, création d'options par défaut",
        );
        mockOptions = [
          {
            id: `option-0`,
            poll_id: pollData.id,
            option_date: new Date().toISOString().split("T")[0],
            time_slots: null,
            display_order: 0,
          },
          {
            id: `option-1`,
            poll_id: pollData.id,
            option_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            time_slots: null,
            display_order: 1,
          },
        ];
      }

      console.log("🔍 useVoting: Options créées:", mockOptions);
      setOptions(mockOptions);

      // Initialiser les votes par défaut
      initializeDefaultVotes(mockOptions);

      // Pour le mode développement, pas de votes existants
      setVotes([]);
    } catch (err: any) {
      console.error("Erreur lors du chargement du sondage:", err);
      setError(err.message || "Erreur lors du chargement du sondage");
    } finally {
      setLoading(false);
    }
  }, [pollSlug, initializeDefaultVotes]);

  // Configuration du temps réel
  useEffect(() => {
    if (!pollSlug) return;

    loadPollData();

    // TEMPORAIRE : Désactiver le temps réel pour debug
    // TODO: Réactiver une fois le problème WebSocket résolu
    /*
    // Subscription aux changements en temps réel
    const channel = supabase
      .channel(`poll-votes-${realPollId || pollSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `poll_id=eq.${realPollId}`,
        },
        (payload) => {
          console.log("📡 Vote mis à jour:", payload);
          // Recharger seulement les votes pour optimiser
          loadVotes();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    */
  }, [pollSlug, loadPollData]);

  // Charger seulement les votes (pour optimiser les updates temps réel)
  const loadVotes = useCallback(async () => {
    if (!realPollId) return;

    try {
      const votesData = await votesApi.getByPollId(realPollId);
      setVotes(votesData || []);
    } catch (err) {
      console.error("Erreur chargement votes:", err);
    }
  }, [realPollId]);

  // Mettre à jour un vote (marquer comme explicite)
  const updateVote = useCallback(
    (optionId: string, value: "yes" | "no" | "maybe") => {
      setCurrentVote((prev) => ({
        ...prev,
        [optionId]: value,
      }));

      // Marquer comme vote explicite
      setUserHasVoted((prev) => ({
        ...prev,
        [optionId]: true,
      }));
    },
    [],
  );

  // Supprimer un vote (remettre à "maybe" par défaut)
  const removeVote = useCallback((optionId: string) => {
    setCurrentVote((prev) => ({
      ...prev,
      [optionId]: "maybe",
    }));

    // Marquer comme non voté explicitement
    setUserHasVoted((prev) => ({
      ...prev,
      [optionId]: false,
    }));
  }, []);

  // Soumettre le vote
  const submitVote = useCallback(async (): Promise<boolean> => {
    if (!voterInfo.name.trim() || Object.keys(currentVote).length === 0) {
      setError(
        "Veuillez remplir vos informations et sélectionner au moins une option",
      );
      return false;
    }

    // Validation email seulement si fourni
    if (voterInfo.email && voterInfo.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(voterInfo.email)) {
        setError("Adresse email invalide");
        return false;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log("🔍 submitUserVote - Mode développement local détecté");
      console.log("🔍 submitUserVote - Données du vote:", {
        pollId: realPollId,
        voterInfo,
        currentVote,
      });

      // En mode développement local, sauvegarder dans localStorage
      const voteData = {
        id: `vote-${Date.now()}`,
        poll_id: realPollId!,
        voter_email: voterInfo.email
          ? voterInfo.email.toLowerCase()
          : `anonymous-${Date.now()}@local.dev`,
        voter_name: voterInfo.name.trim(),
        vote_data: currentVote,
        created_at: new Date().toISOString(),
      };

      // Récupérer les votes existants
      const existingVotes = JSON.parse(
        localStorage.getItem("dev-votes") || "[]",
      );

      // Vérifier si un vote existe déjà pour cet utilisateur sur ce sondage
      // Pour les revotes, on utilise l'email existant s'il y en a un
      const currentVoterEmail = voterInfo.email
        ? voterInfo.email.toLowerCase()
        : null;

      // Chercher d'abord par email s'il est fourni
      let existingVoteIndex = -1;
      if (currentVoterEmail) {
        existingVoteIndex = existingVotes.findIndex(
          (vote: any) =>
            vote.poll_id === realPollId &&
            vote.voter_email.toLowerCase() === currentVoterEmail,
        );
      }

      // Si pas trouvé par email, chercher par nom pour les votes anonymes
      if (existingVoteIndex === -1) {
        existingVoteIndex = existingVotes.findIndex(
          (vote: any) =>
            vote.poll_id === realPollId &&
            vote.voter_name === voterInfo.name.trim() &&
            vote.voter_email.includes("anonymous"),
        );
      }

      if (existingVoteIndex >= 0) {
        // Mettre à jour le vote existant en conservant l'email original
        const originalEmail = existingVotes[existingVoteIndex].voter_email;
        existingVotes[existingVoteIndex] = {
          ...existingVotes[existingVoteIndex],
          ...voteData,
          voter_email: originalEmail, // Conserver l'email original pour éviter les doublons
        };
        console.log("🔄 Vote mis à jour pour:", originalEmail);
      } else {
        // Ajouter un nouveau vote
        existingVotes.push(voteData);
        console.log("✅ Nouveau vote ajouté pour:", voteData.voter_email);
      }

      // Sauvegarder dans localStorage
      localStorage.setItem("dev-votes", JSON.stringify(existingVotes));

      // Réinitialiser après succès
      setCurrentVote({});
      return true;
    } catch (err) {
      console.error("Erreur soumission vote:", err);
      setError("Erreur lors de l'enregistrement du vote");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [realPollId, voterInfo, currentVote]);

  // Calculer les statistiques de vote
  const getVoteStats = useCallback(
    (optionId: string) => {
      const counts = { yes: 0, no: 0, maybe: 0 };
      const voterNames: string[] = [];

      // Charger les votes depuis localStorage pour avoir les données à jour
      const localVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");
      const pollVotes = localVotes.filter(
        (vote: any) => vote.poll_id === realPollId,
      );

      pollVotes.forEach((vote: any) => {
        const selection = vote.vote_data?.[optionId];
        if (selection && counts.hasOwnProperty(selection)) {
          counts[selection]++;
          if (selection === "yes") {
            voterNames.push(vote.voter_name);
          }
        }
      });

      return {
        counts,
        voterNames,
        total: counts.yes + counts.no + counts.maybe,
      };
    },
    [realPollId],
  );

  // Trouver la meilleure option
  const getBestOption = useCallback(() => {
    if (options.length === 0) return null;

    const optionsWithScores = options.map((option) => {
      const stats = getVoteStats(option.id);
      const score =
        stats.counts.yes * 2 + stats.counts.maybe * 1 - stats.counts.no * 1;
      return {
        option,
        score,
        stats,
      };
    });

    // Trier par score décroissant, puis par nombre de "oui" en cas d'égalité
    optionsWithScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.stats.counts.yes - a.stats.counts.yes;
    });

    return optionsWithScores[0];
  }, [options, getVoteStats]);

  return {
    // État
    poll,
    options,
    votes,
    currentVote,
    userHasVoted,
    voterInfo,
    loading,
    submitting,
    error,

    // Actions
    setVoterInfo,
    updateVote,
    removeVote,
    submitVote,
    loadPollData,

    // Utilitaires
    getVoteStats,
    getBestOption,
    hasVotes: Object.keys(currentVote).length > 0,
    totalVotes: votes.length,
  };
};
