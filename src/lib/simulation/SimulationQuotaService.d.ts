/**
 * SimulationQuotaService - Gestion des quotas de simulation par tier
 */
import type { UserTier, SimulationQuota, SimulationUsage } from "../../types/simulation";
/**
 * Récupère les quotas pour un tier
 */
export declare function getQuotaForTier(tier: UserTier): SimulationQuota;
/**
 * Récupère l'usage actuel depuis localStorage
 */
export declare function getCurrentUsage(tier: UserTier): SimulationUsage;
/**
 * Incrémente le compteur de simulations
 */
export declare function incrementUsage(tier: UserTier): SimulationUsage;
/**
 * Vérifie si l'utilisateur peut lancer une simulation
 */
export declare function canSimulate(tier: UserTier): boolean;
/**
 * Récupère les simulations restantes
 */
export declare function getRemainingSimulations(tier: UserTier): number;
