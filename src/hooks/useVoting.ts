import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Poll {
  id: string;
  title: string;
  description?: string;
  status: string;
  creator_id: string;
  created_at: string;
}

interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: Array<{
    hour: number;
    minute: number;
    duration?: number;
  }>;
  display_order: number;
}

interface Vote {
  id: string;
  poll_id: string;
  voter_email: string;
  voter_name: string;
  selections: Record<string, "yes" | "no" | "maybe">;
  created_at: string;
}

interface VoterInfo {
  name: string;
  email: string;
}

export const useVoting = (pollId: string) => {
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
    if (!pollId) return;

    try {
      setLoading(true);
      setError(null);

      // Charger le sondage
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .select("*")
        .eq("id", pollId)
        .eq("status", "active")
        .single();

      if (pollError) {
        setError("Sondage introuvable ou inactif");
        return;
      }

      setPoll(pollData);

      // Charger les options
      const { data: optionsData, error: optionsError } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", pollId)
        .order("display_order");

      if (optionsError) throw optionsError;
      setOptions(optionsData || []);

      // Initialiser les votes par défaut
      if (optionsData) {
        initializeDefaultVotes(optionsData);
      }

      // Charger les votes existants
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", pollId);

      if (votesError) throw votesError;
      setVotes(votesData || []);
    } catch (err) {
      console.error("Erreur chargement sondage:", err);
      setError("Erreur de chargement du sondage");
    } finally {
      setLoading(false);
    }
  }, [pollId, initializeDefaultVotes]);

  // Configuration du temps réel
  useEffect(() => {
    if (!pollId) return;

    loadPollData();

    // Subscription aux changements en temps réel
    const channel = supabase
      .channel(`poll-votes-${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `poll_id=eq.${pollId}`,
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
  }, [pollId, loadPollData]);

  // Charger seulement les votes (pour optimiser les updates temps réel)
  const loadVotes = useCallback(async () => {
    if (!pollId) return;

    try {
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", pollId);

      if (votesError) throw votesError;
      setVotes(votesData || []);
    } catch (err) {
      console.error("Erreur chargement votes:", err);
    }
  }, [pollId]);

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
      const { error: submitError } = await supabase.from("votes").upsert(
        {
          poll_id: pollId,
          voter_email: voterInfo.email.toLowerCase(),
          voter_name: voterInfo.name.trim(),
          selections: currentVote,
        },
        {
          onConflict: "poll_id,voter_email",
        },
      );

      if (submitError) throw submitError;

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
  }, [pollId, voterInfo, currentVote]);

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
