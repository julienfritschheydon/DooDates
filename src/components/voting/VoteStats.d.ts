import React from "react";
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
export declare const VoteStats: React.FC<VoteStatsProps>;
export default VoteStats;
