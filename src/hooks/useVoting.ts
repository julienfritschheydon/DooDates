import { useState, useEffect, useCallback } from "react";
import { pollsApi, pollOptionsApi, votesApi, Poll, PollOption, Vote } from "@/lib/supabase-fetch";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";
import { logger } from "@/lib/logger";
import { groupConsecutiveDates, type DateGroup } from "@/lib/date-utils";

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
  const [currentVote, setCurrentVote] = useState<Record<string, "yes" | "no" | "maybe">>({});
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
      logger.debug("Recherche du sondage", "vote", { pollSlug });
      const localPolls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");

      const pollData = localPolls.find((p: Poll) => p.slug === pollSlug);

      if (!pollData) {
        const notFoundError = ErrorFactory.validation(`Sondage avec slug "${pollSlug}" non trouvé`);

        logError(notFoundError, {
          component: "useVoting",
          operation: "loadPoll",
        });

        throw notFoundError;
      }

      logger.info("Sondage trouvé", "vote", {
        pollId: pollData.id,
        pollTitle: pollData.title,
        settings: pollData.settings,
      });
      setPoll(pollData);
      setRealPollId(pollData.id);

      // Créer les options à partir des settings (invariant: au moins 1 date requise)
      if (!pollData.settings?.selectedDates || pollData.settings.selectedDates.length === 0) {
        const configError = ErrorFactory.validation("Ce sondage n'a pas de dates configurées");

        logError(configError, {
          component: "useVoting",
          operation: "loadPoll",
        });

        throw configError;
      }

      // Grouper les dates consécutives (week-ends, semaines, quinzaines)
      const dateGroups = groupConsecutiveDates(pollData.settings.selectedDates);

      logger.debug("Groupement des dates", "vote", {
        originalDates: pollData.settings.selectedDates.length,
        groups: dateGroups.length,
        groupDetails: dateGroups.map((g) => ({
          type: g.type,
          label: g.label,
          datesCount: g.dates.length,
        })),
      });

      const mockOptions: PollOption[] = dateGroups.map((group: DateGroup, index: number) => {
        // Pour les groupes multi-dates, utiliser la première date comme référence
        // et stocker toutes les dates du groupe dans un champ custom
        const primaryDate = group.dates[0];

        // Récupérer les time slots de toutes les dates du groupe
        const groupTimeSlots =
          group.dates.length > 1
            ? null // Pour les groupes, pas de time slots (vote sur la période entière)
            : pollData.settings?.timeSlotsByDate?.[primaryDate] || null;

        return {
          id: `option-${index}`,
          poll_id: pollData.id,
          option_date: primaryDate, // Date principale pour compatibilité
          time_slots: groupTimeSlots,
          display_order: index,
          // Champs custom pour les groupes
          date_group: group.dates.length > 1 ? group.dates : undefined,
          date_group_label: group.dates.length > 1 ? group.label : undefined,
          date_group_type: group.dates.length > 1 ? group.type : undefined,
        };
      });

      logger.debug("Options créées", "vote", {
        optionsCount: mockOptions.length,
      });
      setOptions(mockOptions);

      // Initialiser les votes par défaut
      initializeDefaultVotes(mockOptions);

      // Charger les votes existants depuis localStorage (mode dev)
      const localVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");
      const pollVotes = localVotes.filter((v: any) => v.poll_id === pollData.id);
      const mappedVotes = pollVotes.map((v: any) => ({
        id: v.id,
        poll_id: v.poll_id,
        voter_email: v.voter_email,
        voter_name: v.voter_name,
        selections: v.vote_data || {},
        created_at: v.created_at,
      }));
      setVotes(mappedVotes);
    } catch (err: any) {
      const processedError = handleError(
        err,
        {
          component: "useVoting",
          operation: "loadPoll",
        },
        "Erreur lors du chargement du sondage",
      );

      logError(processedError, {
        component: "useVoting",
        operation: "loadPoll",
      });

      setError(processedError.message || "Erreur lors du chargement du sondage");
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
          logger.info('Vote mis à jour', 'vote', { payload });
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
      const processedError = handleError(
        err,
        {
          component: "useVoting",
          operation: "loadVotes",
        },
        "Erreur lors du chargement des votes",
      );

      logError(processedError, {
        component: "useVoting",
        operation: "loadVotes",
      });
    }
  }, [realPollId]);

  // Mettre à jour un vote (marquer comme explicite)
  const updateVote = useCallback((optionId: string, value: "yes" | "no" | "maybe") => {
    setCurrentVote((prev) => ({
      ...prev,
      [optionId]: value,
    }));

    // Marquer comme vote explicite
    setUserHasVoted((prev) => ({
      ...prev,
      [optionId]: true,
    }));
  }, []);

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
      setError("Veuillez remplir vos informations et sélectionner au moins une option");
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
      logger.debug("Soumission du vote en mode local", "vote", {
        pollId: realPollId,
        voterName: voterInfo.name,
        votesCount: Object.keys(currentVote).length,
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
      const existingVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");

      // Vérifier si un vote existe déjà pour cet utilisateur sur ce sondage
      // Pour les revotes, on utilise l'email existant s'il y en a un
      const currentVoterEmail = voterInfo.email ? voterInfo.email.toLowerCase() : null;

      // Chercher d'abord par email s'il est fourni
      let existingVoteIndex = -1;
      if (currentVoterEmail) {
        existingVoteIndex = existingVotes.findIndex(
          (vote: any) =>
            vote.poll_id === realPollId && vote.voter_email.toLowerCase() === currentVoterEmail,
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
        logger.info("Vote mis à jour", "vote", { voterEmail: originalEmail });
      } else {
        // Ajouter un nouveau vote
        existingVotes.push(voteData);
        logger.info("Nouveau vote ajouté", "vote", {
          voterEmail: voteData.voter_email,
        });
      }

      // Sauvegarder dans localStorage
      localStorage.setItem("dev-votes", JSON.stringify(existingVotes));

      // Recharger l'état votes depuis localStorage pour mettre à jour l'UI
      const updatedPollVotes = existingVotes.filter((v: any) => v.poll_id === realPollId);
      const updatedMapped = updatedPollVotes.map((v: any) => ({
        id: v.id,
        poll_id: v.poll_id,
        voter_email: v.voter_email,
        voter_name: v.voter_name,
        selections: v.vote_data || {},
        created_at: v.created_at,
      }));
      setVotes(updatedMapped);

      // Réinitialiser après succès
      setCurrentVote({});
      return true;
    } catch (err) {
      const processedError = handleError(
        err,
        {
          component: "useVoting",
          operation: "submitVote",
        },
        "Erreur lors de l'enregistrement du vote",
      );

      logError(processedError, {
        component: "useVoting",
        operation: "submitVote",
      });

      setError(processedError.message || "Erreur lors de l'enregistrement du vote");
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
      const pollVotes = localVotes.filter((vote: any) => vote.poll_id === realPollId);

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
      const score = stats.counts.yes * 2 + stats.counts.maybe * 1 - stats.counts.no * 1;
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
