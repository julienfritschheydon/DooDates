/**
 * Utility functions for voting calculations and interactions
 */
import { SwipeOption, SwipeVote, VoteType } from './types';

// Calculer les stats pour l'option actuelle (SANS le vote utilisateur pour les barres de fond)
export const getExistingStats = (
  optionId: string,
  votes: SwipeVote[]
) => {
  const stats = { yes: 0, no: 0, maybe: 0 };
  
  votes.forEach((vote) => {
    const selection = vote.selections[optionId];
    if (selection) {
      stats[selection]++;
    }
  });
  
  return stats;
};

// Calculer les stats AVEC le vote utilisateur (pour l'affichage des chiffres)
export const getStatsWithUser = (
  optionId: string,
  votes: SwipeVote[],
  userVotes: Record<string, VoteType>
) => {
  const stats = getExistingStats(optionId, votes);
  
  // Ajouter le vote utilisateur s'il existe
  if (userVotes[optionId]) {
    stats[userVotes[optionId]]++;
  }
  
  return stats;
};

// Calculer le score pour chaque option (pour le classement)
export const calculateOptionScore = (
  optionId: string,
  votes: SwipeVote[],
  userVotes: Record<string, VoteType>
) => {
  const stats = getStatsWithUser(optionId, votes, userVotes);
  // Formule de score: (yes * 2) + (maybe * 1) - (no * 1)
  return stats.yes * 2 + stats.maybe - stats.no;
};

// Obtenir le classement des options
export const getRanking = (
  options: SwipeOption[],
  votes: SwipeVote[],
  userVotes: Record<string, VoteType>
) => {
  // Calculer les scores pour chaque option
  const optionsWithScores = options.map((option) => ({
    id: option.id,
    score: calculateOptionScore(option.id, votes, userVotes),
  }));

  // Trier par score décroissant
  optionsWithScores.sort((a, b) => b.score - a.score);

  // Assigner les rangs (gérer les égalités)
  const ranking: Record<string, number> = {};
  let currentRank = 1;

  optionsWithScores.forEach((option, index) => {
    if (index > 0 && option.score < optionsWithScores[index - 1].score) {
      currentRank = index + 1;
    }
    ranking[option.id] = currentRank;
  });

  return ranking;
};

// Haptic feedback pour mobile
export const triggerHaptic = (type: "light" | "medium" | "heavy" = "light") => {
  if (navigator.vibrate) {
    const patterns = { light: [10], medium: [30], heavy: [50] };
    navigator.vibrate(patterns[type]);
  }
};
