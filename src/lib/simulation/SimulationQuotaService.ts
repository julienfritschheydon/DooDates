/**
 * SimulationQuotaService - Gestion des quotas de simulation par tier
 */

import type { UserTier, SimulationQuota, SimulationUsage } from "../../types/simulation";

const QUOTAS: Record<UserTier, SimulationQuota> = {
  free: {
    tier: "free",
    simulationsPerMonth: 3,
    maxVolume: 10,
    hasGeminiAccess: true,
    hasPdfExport: false,
    canOverrideContext: false
  },
  pro: {
    tier: "pro",
    simulationsPerMonth: 20,
    maxVolume: 50,
    hasGeminiAccess: true,
    hasPdfExport: true,
    canOverrideContext: true
  },
  enterprise: {
    tier: "enterprise",
    simulationsPerMonth: 100,
    maxVolume: 100,
    hasGeminiAccess: true,
    hasPdfExport: true,
    canOverrideContext: true
  }
};

/**
 * Récupère les quotas pour un tier
 */
export function getQuotaForTier(tier: UserTier): SimulationQuota {
  return QUOTAS[tier];
}

/**
 * Récupère l'usage actuel depuis localStorage
 */
export function getCurrentUsage(tier: UserTier): SimulationUsage {
  const key = `simulation_usage_${tier}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    const usage = JSON.parse(stored);
    const resetDate = new Date(usage.quotaResetDate);
    
    // Vérifier si le quota doit être réinitialisé (nouveau mois)
    if (resetDate < new Date()) {
      return resetUsage(tier);
    }
    
    return {
      ...usage,
      quotaResetDate: resetDate
    };
  }
  
  return resetUsage(tier);
}

/**
 * Réinitialise l'usage pour un nouveau mois
 */
function resetUsage(tier: UserTier): SimulationUsage {
  const quota = getQuotaForTier(tier);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  
  const usage: SimulationUsage = {
    tier,
    simulationsThisMonth: 0,
    remainingSimulations: quota.simulationsPerMonth,
    quotaResetDate: nextMonth
  };
  
  saveUsage(usage);
  return usage;
}

/**
 * Sauvegarde l'usage dans localStorage
 */
function saveUsage(usage: SimulationUsage): void {
  const key = `simulation_usage_${usage.tier}`;
  localStorage.setItem(key, JSON.stringify(usage));
}

/**
 * Incrémente le compteur de simulations
 */
export function incrementUsage(tier: UserTier): SimulationUsage {
  const usage = getCurrentUsage(tier);
  
  if (usage.remainingSimulations > 0) {
    usage.simulationsThisMonth++;
    usage.remainingSimulations--;
    saveUsage(usage);
  }
  
  return usage;
}

/**
 * Vérifie si l'utilisateur peut lancer une simulation
 */
export function canSimulate(tier: UserTier): boolean {
  const usage = getCurrentUsage(tier);
  return usage.remainingSimulations > 0;
}

/**
 * Récupère les simulations restantes
 */
export function getRemainingSimulations(tier: UserTier): number {
  const usage = getCurrentUsage(tier);
  return usage.remainingSimulations;
}
