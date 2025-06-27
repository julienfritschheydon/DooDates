import React from "react";
import { motion } from "framer-motion";
import { VoteType } from "./utils/types";

interface VoteStatsProps {
  voteType: VoteType;
  isActive: boolean;
  existingVotes: number;
  totalVotes: number;
  userSwipe: VoteType | null;
  userHasVoted: boolean;
}

/**
 * Composant VoteStats - Affiche les statistiques de vote avec un système de double couche
 *
 * Système double couche :
 * - Barre fond : Votes existants / Total votants (toujours visible, couleur terne 30%)
 * - Barre surbrillance : +1 vote utilisateur / Total votants (conditionnelle, couleur vive 75%)
 */
export const VoteStats: React.FC<VoteStatsProps> = ({
  voteType,
  isActive,
  existingVotes,
  totalVotes,
  userSwipe,
  userHasVoted,
}) => {
  // Déterminer les couleurs en fonction du type de vote
  const getColors = () => {
    switch (voteType) {
      case "yes":
        return {
          bg: "bg-green-200/30",
          highlight: "bg-green-500/75",
        };
      case "maybe":
        return {
          bg: "bg-orange-200/30",
          highlight: "bg-orange-500/75",
        };
      case "no":
        return {
          bg: "bg-red-200/30",
          highlight: "bg-red-500/75",
        };
      default:
        return {
          bg: "bg-gray-200/30",
          highlight: "bg-gray-500/75",
        };
    }
  };

  const colors = getColors();
  const ajoutVoteUtilisateur = 1;

  // Déterminer si on doit afficher la barre de surbrillance
  const showHighlight = (userHasVoted && isActive) || userSwipe === voteType;

  return (
    <>
      {/* 
        COUCHE 1 : Barre de fond (toujours visible)
        - Montre les votes existants SANS le vote utilisateur
        - Couleur terne avec faible opacité (30%)
        - Animation lente (0.5s) pour la stabilité
      */}
      <motion.div
        className={`absolute inset-0 ${colors.bg}`}
        initial={{ scaleY: 0 }}
        animate={{
          scaleY: existingVotes / totalVotes, // Ex: 4/5 = 80% de hauteur
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "bottom" }} // Animation du bas vers le haut
      />

      {/* 
        COUCHE 2 : Barre de surbrillance (conditionnelle)
        - S'affiche SEULEMENT si l'utilisateur vote
        - Couleur vive avec forte opacité (75%)
        - Animation rapide (0.3s) pour la réactivité
        - Positionnée AU-DESSUS de la barre de fond
      */}
      {showHighlight && (
        <motion.div
          className={`absolute ${colors.highlight}`}
          initial={{ height: 0 }}
          animate={{
            height: `${(ajoutVoteUtilisateur / totalVotes) * 100}%`, // Ex: 1/5 = 20% de hauteur
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            left: 0,
            right: 0,
            bottom: `${(existingVotes / totalVotes) * 100}%`, // Ex: commence à 80% du bas
          }}
        />
      )}
    </>
  );
};

export default VoteStats;
