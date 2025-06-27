import { useState, useEffect } from "react";
import { SwipeOption, SwipeVote, VoterInfo, VoteType } from "../utils/types";
import { triggerHaptic } from "../utils/voteUtils";
import { fetchPoll, fetchPollOptions, fetchPollVotes, submitVote } from "../services/voteService";

interface UseVotingServiceProps {
  pollId: string;
  onVoteSubmitted?: () => void;
}

interface VotingServiceState {
  poll: any | null;
  realPollId: string | null; // Stocker l'UUID réel du sondage
  options: SwipeOption[];
  existingVotes: SwipeVote[];
  votes: Record<string, VoteType>;
  userHasVoted: Record<string, boolean>;
  currentSwipe: Record<string, VoteType | null>;
  isLoading: boolean;
  isSubmitting: boolean;
  showForm: boolean;
  voterInfo: VoterInfo | null;
  formErrors: Record<string, string>;
  isVoteComplete: boolean;
}

export const useVotingService = ({ pollId, onVoteSubmitted }: UseVotingServiceProps) => {
  // État global du service de vote
  const [state, setState] = useState<VotingServiceState>({
    poll: null,
    realPollId: null, // Initialiser l'UUID réel à null
    options: [],
    existingVotes: [],
    votes: {},
    userHasVoted: {},
    currentSwipe: {},
    isLoading: true,
    isSubmitting: false,
    showForm: false,
    voterInfo: null,
    formErrors: {},
    isVoteComplete: false,
  });

  // Destructurer l'état pour faciliter l'accès
  const {
    poll,
    realPollId,
    options,
    existingVotes,
    votes,
    userHasVoted,
    currentSwipe,
    isLoading,
    isSubmitting,
    showForm,
    voterInfo,
    formErrors,
    isVoteComplete,
  } = state;

  // Charger les données initiales
  useEffect(() => {
    loadPollData();
  }, [pollId]);

  // Fonction pour charger les données du sondage
  const loadPollData = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Charger le sondage
      const pollData = await fetchPoll(pollId);
      
      // Utiliser l'ID réel du sondage pour charger les options et les votes
      const realPollId = pollData.id;
      console.log("🔑 UUID réel du sondage:", realPollId, "(slug original:", pollId, ")");
      
      // Charger les options
      const optionsData = await fetchPollOptions(realPollId);
      
      // Charger les votes existants
      const votesData = await fetchPollVotes(realPollId);
      
      // Initialiser les votes de l'utilisateur à "maybe" par défaut
      // et les marquer comme votés par défaut
      const initialVotes: Record<string, VoteType> = {};
      const initialUserHasVoted: Record<string, boolean> = {};
      const initialCurrentSwipe: Record<string, VoteType | null> = {};
      
      optionsData.forEach((option: SwipeOption) => {
        initialVotes[option.id] = "maybe";
        initialUserHasVoted[option.id] = true; // Marquer comme voté par défaut
        initialCurrentSwipe[option.id] = null;
      });
      
      setState((prev) => ({
        ...prev,
        poll: pollData,
        realPollId: realPollId, // Stocker l'UUID réel
        options: optionsData,
        existingVotes: votesData,
        votes: initialVotes,
        userHasVoted: initialUserHasVoted,
        currentSwipe: initialCurrentSwipe,
        isLoading: false,
      }));
      
      console.log("💾 Données chargées:", {
        pollData,
        realPollId,
        optionsCount: optionsData.length,
        votesCount: votesData.length
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Fonction pour obtenir les statistiques existantes
  const getExistingStats = (optionId: string) => {
    const stats = { yes: 0, no: 0, maybe: 0 };

    existingVotes.forEach((vote) => {
      // Utiliser les selections de SwipeVote qui contient les votes par option
      if (vote.selections && vote.selections[optionId]) {
        const voteType = vote.selections[optionId];
        stats[voteType]++;
      }
    });

    return stats;
  };

  // Fonction pour obtenir les statistiques avec l'utilisateur actuel
  const getStatsWithUser = (optionId: string) => {
    const stats = getExistingStats(optionId);
    const userVote = votes[optionId];

    // Ajouter le vote de l'utilisateur actuel
    if (userHasVoted[optionId]) {
      stats[userVote]++;
    }

    return stats;
  };
  
  // Fonction pour obtenir le classement
  const getRanking = (optionId: string): Record<string, number> | number => {
    // Calculer le score pour chaque option
    const scores = options.map((option) => {
      const stats = getStatsWithUser(option.id);
      // Calculer le score manuellement
      const score = stats.yes * 2 + stats.maybe * 1 - stats.no * 1;
      return { optionId: option.id, score };
    });

    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);

    // Si on demande tous les rangs, retourner un objet avec tous les rangs
    if (optionId === "all") {
      const allRankings: Record<string, number> = {};
      let currentRank = 1;
      
      scores.forEach((item, index) => {
        if (index > 0 && item.score < scores[index - 1].score) {
          currentRank = index + 1;
        }
        allRankings[item.optionId] = currentRank;
      });
      
      return allRankings;
    }

    // Sinon, trouver le rang de l'option demandée
    const rank = scores.findIndex((item) => item.optionId === optionId) + 1;
    return rank;
  };

  // Fonction pour gérer le vote explicite via les boutons
  const handleVote = (optionId: string, vote: VoteType) => {
    // Feedback tactile unique pour chaque vote
    triggerHaptic("medium");

    setState((prev) => ({
      ...prev,
      votes: {
        ...prev.votes,
        [optionId]: vote,
      },
      userHasVoted: {
        ...prev.userHasVoted,
        [optionId]: true,
      }
    }));
  };

  // Fonction pour gérer le swipe
  const handleSwipe = (optionId: string, direction: number) => {
    let newVote: VoteType = "maybe";

    if (direction < 0) {
      newVote = "yes";
    } else if (direction > 0) {
      newVote = "no";
    }

    // Feedback tactile unique pour chaque vote
    triggerHaptic("medium");

    setState((prev) => ({
      ...prev,
      votes: {
        ...prev.votes,
        [optionId]: newVote,
      },
      userHasVoted: {
        ...prev.userHasVoted,
        [optionId]: true,
      }
    }));
  };

  // Fonction pour gérer la fin du drag d'une option
  const handleOptionDragEnd = (event: any, info: any, optionId: string) => {
    // Nettoyer l'état du swipe en cours
    setState((prev) => ({
      ...prev,
      currentSwipe: {
        ...prev.currentSwipe,
        [optionId]: null,
      }
    }));

    // Déterminer la direction du swipe
    const threshold = 100;
    const velocity = 0.5;

    if (info.offset.x < -threshold && info.velocity.x < -velocity) {
      // Swipe vers la gauche = Oui
      handleSwipe(optionId, -1);
    } else if (info.offset.x > threshold && info.velocity.x > velocity) {
      // Swipe vers la droite = Non
      handleSwipe(optionId, 1);
    }
  };

  // Fonction pour mettre à jour le swipe en cours
  const updateCurrentSwipe = (optionId: string, swipeType: VoteType | null) => {
    setState((prev) => ({
      ...prev,
      currentSwipe: {
        ...prev.currentSwipe,
        [optionId]: swipeType,
      }
    }));
  };

  // Fonction pour afficher le formulaire
  const showVoterForm = () => {
    setState((prev) => ({ ...prev, showForm: true }));
  };

  // Fonction pour masquer le formulaire
  const hideVoterForm = () => {
    setState((prev) => ({ ...prev, showForm: false }));
  };

  // Fonction pour mettre à jour les informations du votant
  const setVoterInfoData = (info: VoterInfo) => {
    setState((prev) => ({ ...prev, voterInfo: info }));
  };

  // Fonction pour soumettre les votes
  const handleSubmit = async () => {
    console.log("🚀 Début de la soumission des votes", { votes, voterInfo, pollIdOriginal: pollId, realPollId });
    
    if (!voterInfo) {
      console.warn("❌ Soumission annulée: informations du votant manquantes");
      setState((prev) => ({
        ...prev,
        formErrors: { ...prev.formErrors, general: "Veuillez remplir vos informations" }
      }));
      return;
    }

    // Vérifier qu'on a bien l'UUID réel du sondage
    if (!realPollId) {
      console.error("❌ Soumission annulée: UUID du sondage manquant");
      setState((prev) => ({
        ...prev,
        formErrors: { ...prev.formErrors, general: "Erreur technique. Veuillez réessayer." }
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, formErrors: {} }));
    
    try {
      // Préparer les données pour la soumission
      if (!voterInfo) {
        throw new Error("Informations du votant manquantes");
      }

      console.log("📤 Envoi des votes au serveur", { 
        pollId: realPollId, // Utiliser l'UUID réel, pas le slug
        voterInfo, 
        votes,
        totalVotes: Object.keys(votes).length
      });

      // Soumettre les votes avec les 3 arguments séparés, en utilisant l'UUID réel
      await submitVote(
        realPollId, // Utiliser l'UUID réel, pas le slug
        voterInfo,
        votes
      );
      
      console.log("✅ Soumission des votes réussie");
      
      // Feedback tactile pour la soumission réussie
      triggerHaptic("heavy");
      
      // Marquer comme terminé
      setState((prev) => ({ ...prev, isSubmitting: false, isVoteComplete: true }));
      
      // Appeler le callback si fourni
      if (onVoteSubmitted) {
        console.log("📣 Exécution du callback onVoteSubmitted");
        onVoteSubmitted();
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la soumission des votes:", error);
      
      // Feedback tactile pour l'erreur
      triggerHaptic("heavy");
      
      // Gérer spécifiquement l'erreur 409 (conflit - vote déjà existant)
      if (error.message && error.message.includes("409")) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          formErrors: { 
            ...prev.formErrors, 
            submit: "409: Vous avez déjà voté pour ce sondage avec cet email."
          }
        }));
      } else {
        // Gérer les autres erreurs
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          formErrors: { ...prev.formErrors, submit: "Erreur lors de la soumission. Veuillez réessayer." }
        }));
      }
    }
  };

  // Fonction pour obtenir le texte du vote
  const getVoteText = (voteType: VoteType): string => {
    switch (voteType) {
      case "yes":
        return "Oui";
      case "no":
        return "Non";
      case "maybe":
        return "Peut-être";
      default:
        return "Indécis";
    }
  };

  return {
    // État
    poll,
    options,
    existingVotes,
    votes,
    userHasVoted,
    currentSwipe,
    isLoading,
    isSubmitting,
    showForm,
    voterInfo,
    formErrors,
    isVoteComplete,
    
    // Fonctions de statistiques et classement
    getExistingStats,
    getStatsWithUser,
    getRanking,
    
    // Fonctions de gestion des votes
    handleVote,
    handleSwipe,
    handleOptionDragEnd,
    updateCurrentSwipe,
    
    // Fonctions de gestion du formulaire
    showVoterForm,
    hideVoterForm,
    setVoterInfoData,
    
    // Fonction de soumission
    handleSubmit,
    
    // Utilitaires
    getVoteText,
  };
};

export default useVotingService;
