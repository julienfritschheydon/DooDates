import { useState, useEffect, useCallback } from "react";
import { pollsApi, pollOptionsApi, votesApi, Poll, PollOption, Vote } from "@/lib/supabase-fetch";

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

    try {
      setLoading(true);
      setError(null);

      // Charger le sondage par slug avec la nouvelle API
      const pollData = await pollsApi.getBySlug(pollSlug);

      if (!pollData) {
        setError("Sondage introuvable");
        return;
      }

      setPoll(pollData);
      setRealPollId(pollData.id); // Sauvegarder l'ID réel

      // Charger les options
      const optionsData = await pollOptionsApi.getByPollId(pollData.id);
      setOptions(optionsData || []);

      // Initialiser les votes par défaut
      if (optionsData) {
        initializeDefaultVotes(optionsData);
      }

      // Charger les votes existants
      const votesData = await votesApi.getByPollId(pollData.id);
      setVotes(votesData || []);
    } catch (err) {
      console.error("❌ useVoting - Erreur:", err);
      setError(`Erreur de chargement: ${err}`);
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
    if (
      !voterInfo.name.trim() ||
      !voterInfo.email.trim() ||
      Object.keys(currentVote).length === 0
    ) {
      setError(
        "Veuillez remplir vos informations et sélectionner au moins une option",
      );
      return false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(voterInfo.email)) {
      setError("Adresse email invalide");
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Vérifier si un vote existe déjà pour cet utilisateur
      const existingVotes = await votesApi.getByPollId(realPollId!);
      const existingVote = existingVotes.find(
        vote => vote.voter_email.toLowerCase() === voterInfo.email.toLowerCase()
      );

      if (existingVote) {
        // Mettre à jour le vote existant
        await votesApi.update(existingVote.id, {
          voter_name: voterInfo.name.trim(),
          selections: currentVote,
        });
      } else {
        // Créer un nouveau vote
        await votesApi.create({
          poll_id: realPollId!,
          voter_email: voterInfo.email.toLowerCase(),
          voter_name: voterInfo.name.trim(),
          selections: currentVote,
        });
      }

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

      votes.forEach((vote) => {
        const selection = vote.selections[optionId];
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
    [votes],
  );

  // Trouver la meilleure option
  const getBestOption = useCallback(() => {
    if (options.length === 0) return null;

    const optionsWithScores = options.map((option) => {
      const stats = getVoteStats(option.id);
      const score = stats.counts.yes - stats.counts.no * 0.5;
      return {
        option,
        score,
        stats,
      };
    });

    return optionsWithScores.reduce((best, current) =>
      current.score > best.score ? current : best,
    );
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
