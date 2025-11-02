/**
 * Hook pour gérer les quotas d'analytics conversationnels
 * 
 * Limites freemium :
 * - Utilisateurs anonymes : 5 queries par jour
 * - Utilisateurs authentifiés : 50 queries par jour
 * 
 * Les insights automatiques ne comptent pas dans le quota
 * (1 seul appel par poll, mis en cache)
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

interface AnalyticsQuota {
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  canQuery: boolean;
}

const STORAGE_KEY = "doodates-analytics-quota";

interface QuotaData {
  count: number;
  date: string; // YYYY-MM-DD
}

export function useAnalyticsQuota() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<AnalyticsQuota>({
    used: 0,
    limit: user ? 50 : 5,
    remaining: user ? 50 : 5,
    resetAt: getNextMidnight(),
    canQuery: true,
  });

  // Charger le quota depuis localStorage
  useEffect(() => {
    loadQuota();
  }, [user]);

  const loadQuota = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        resetQuota();
        return;
      }

      const data: QuotaData = JSON.parse(stored);
      const today = getTodayString();

      // Si la date est différente, reset le quota
      if (data.date !== today) {
        resetQuota();
        return;
      }

      const limit = user ? 50 : 5;
      const used = data.count;
      const remaining = Math.max(0, limit - used);

      setQuota({
        used,
        limit,
        remaining,
        resetAt: getNextMidnight(),
        canQuery: remaining > 0,
      });

      logger.debug("Analytics quota loaded", "analytics", { used, limit, remaining });
    } catch (error) {
      logger.error("Failed to load analytics quota", "analytics", { error });
      resetQuota();
    }
  }, [user]);

  const resetQuota = useCallback(() => {
    const limit = user ? 50 : 5;
    const data: QuotaData = {
      count: 0,
      date: getTodayString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    setQuota({
      used: 0,
      limit,
      remaining: limit,
      resetAt: getNextMidnight(),
      canQuery: true,
    });

    logger.info("Analytics quota reset", "analytics", { limit });
  }, [user]);

  const incrementQuota = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data: QuotaData = stored
        ? JSON.parse(stored)
        : { count: 0, date: getTodayString() };

      // Vérifier si on doit reset (changement de jour)
      const today = getTodayString();
      if (data.date !== today) {
        data.count = 0;
        data.date = today;
      }

      data.count += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const limit = user ? 50 : 5;
      const used = data.count;
      const remaining = Math.max(0, limit - used);

      setQuota((prev) => ({
        ...prev,
        used,
        limit,
        remaining,
        resetAt: getNextMidnight(),
        canQuery: remaining > 0,
      }));

      logger.info("Analytics quota incremented", "analytics", { used, limit, remaining });

      return remaining > 0;
    } catch (error) {
      logger.error("Failed to increment analytics quota", "analytics", { error });
      return false;
    }
  }, [user]);

  const checkQuota = useCallback((): boolean => {
    return quota.canQuery;
  }, [quota.canQuery]);

  const getQuotaMessage = useCallback((): string => {
    if (quota.canQuery) {
      return `${quota.remaining} requête${quota.remaining > 1 ? "s" : ""} restante${quota.remaining > 1 ? "s" : ""} aujourd'hui`;
    } else {
      const hours = Math.ceil(
        (quota.resetAt.getTime() - Date.now()) / (1000 * 60 * 60),
      );
      return `Quota épuisé. Réinitialisation dans ${hours}h`;
    }
  }, [quota]);

  return {
    quota,
    incrementQuota,
    checkQuota,
    resetQuota,
    getQuotaMessage,
  };
}

// Helpers
function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getNextMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
