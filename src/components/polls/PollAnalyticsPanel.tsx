/**
 * Poll Analytics Panel - Interface pour les analytics conversationnels
 * 
 * Permet d'interroger les résultats d'un sondage en langage naturel
 * et affiche les insights automatiques générés par l'IA.
 */

import React, { useState, useEffect } from "react";
import { Send, Sparkles, TrendingUp, AlertCircle, Info, Loader2, RefreshCw, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { pollAnalyticsService } from "@/services/PollAnalyticsService";
import type { AnalyticsResponse, AutoInsight } from "@/services/PollAnalyticsService";
import { useAnalyticsQuota } from "@/hooks/useAnalyticsQuota";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";

interface Props {
  pollId: string;
  pollTitle: string;
}

// Traduction des types d'insights
const translateInsightType = (type: string): string => {
  const translations: Record<string, string> = {
    'TREND': 'Tendance',
    'ANOMALY': 'Anomalie',
    'SUMMARY': 'Résumé',
    'RECOMMENDATION': 'Recommandation'
  };
  return translations[type.toUpperCase()] || type;
};

export default function PollAnalyticsPanel({ pollId, pollTitle }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AnalyticsResponse | null>(null);
  const [insights, setInsights] = useState<AutoInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false); // Repliés par défaut
  const { toast } = useToast();
  const { quota, incrementQuota, checkQuota, getQuotaMessage } = useAnalyticsQuota();

  // Charger les insights automatiques au montage
  useEffect(() => {
    loadAutoInsights();
  }, [pollId]);

  const loadAutoInsights = async () => {
    setLoadingInsights(true);
    try {
      const autoInsights = await pollAnalyticsService.generateAutoInsights(pollId);
      setInsights(autoInsights);
      logger.info("Auto insights loaded", "analytics", { count: autoInsights.length });
    } catch (error) {
      logger.error("Failed to load auto insights", "analytics", { error });
      // Ne pas afficher de toast d'erreur pour les insights auto (non-bloquant)
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    // Vérifier le quota AVANT d'envoyer la requête
    if (!checkQuota()) {
      toast({
        title: "Quota épuisé",
        description: getQuotaMessage(),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const result = await pollAnalyticsService.queryPoll({
        question: query,
        pollId,
        context: "summary",
      });

      // Incrémenter le quota UNIQUEMENT si ce n'est PAS du cache
      if (!result.cached) {
        const canContinue = incrementQuota();
        console.log("Quota incrémenté, peut continuer:", canContinue, "Quota actuel:", quota);
      } else {
        console.log("Réponse du cache - quota NON incrémenté");
      }

      setResponse(result);
      logger.info("Analytics query successful", "analytics", { query, cached: result.cached });

      if (result.cached) {
        toast({
          title: "✨ Réponse du cache",
          description: "Cette réponse a été récupérée du cache (gratuit, ne compte pas dans le quota).",
          duration: 2000,
        });
      }
    } catch (error) {
      logger.error("Analytics query failed", "analytics", { error });
      toast({
        title: "Erreur",
        description: "Impossible d'analyser les données. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
    // Auto-submit
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const quickQueries = [
    "Combien de personnes ont répondu ?",
    "Quelle est l'option la plus populaire ?",
    "Y a-t-il des tendances intéressantes ?",
    "Résume les résultats principaux",
  ];

  const getInsightIcon = (type: AutoInsight["type"]) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "anomaly":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "summary":
        return <Info className="w-5 h-5 text-purple-500" />;
      case "recommendation":
        return <Sparkles className="w-5 h-5 text-green-500" />;
    }
  };

  const getInsightColor = (type: AutoInsight["type"]) => {
    switch (type) {
      case "trend":
        return "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20";
      case "anomaly":
        return "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20";
      case "summary":
        return "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20";
      case "recommendation":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20";
    }
  };

  return (
    <div className="space-y-6" data-testid="analytics-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics IA</h2>
        </div>
        <button
          onClick={loadAutoInsights}
          disabled={loadingInsights}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Régénérer les insights"
        >
          <RefreshCw className={`w-4 h-4 ${loadingInsights ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Bouton pour afficher/masquer les insights */}
      <button
        onClick={() => setShowInsights(!showInsights)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-purple-900 dark:text-purple-100">
            Insights automatiques {insights.length > 0 && `(${insights.length})`}
          </span>
        </div>
        {showInsights ? (
          <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {/* Insights automatiques (repliables) */}
      {showInsights && (
        <div className="space-y-4">

          {loadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Génération des insights...</span>
            </div>
          ) : insights.length > 0 ? (
            <div className="grid gap-3">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  data-testid="insight-card"
                  className={`border-2 rounded-lg p-4 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{insight.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Confiance: {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{translateInsightType(insight.type)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Info className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p>Aucun insight automatique disponible pour le moment.</p>
              <p className="text-sm mt-1">Les insights seront générés une fois que vous aurez des réponses.</p>
            </div>
          )}
        </div>
      )}

      {!showInsights && (
        <button
          onClick={() => setShowInsights(true)}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
        >
          Afficher les insights automatiques
        </button>
      )}

      {/* Query interface */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Posez une question</h3>

        {/* Quick queries */}
        <div className="flex flex-wrap gap-2">
          {quickQueries.map((q, idx) => (
            <button
              key={idx}
              data-testid="quick-query-button"
              onClick={() => handleQuickQuery(q)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Query form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              data-testid="analytics-query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Combien ont voté ? Quelle option est la plus populaire ?"
              className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              data-testid="analytics-send-button"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Response */}
        {response && (
          <div data-testid="analytics-response" className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{response.answer}</p>

                {response.insights && response.insights.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
                      Insights additionnels :
                    </p>
                    <ul className="space-y-1">
                      {response.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-purple-800 dark:text-purple-300 flex items-start gap-2">
                          <span className="text-purple-400 dark:text-purple-500 mt-0.5">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Confiance: {Math.round(response.confidence * 100)}%</span>
                  {response.cached && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400">Réponse mise en cache</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-1">Comment ça marche ?</p>
            <p>
              L'IA analyse les résultats de votre sondage "{pollTitle}" et répond à vos questions en
              langage naturel. Les réponses sont mises en cache pendant 5 minutes pour optimiser les
              coûts.
            </p>
          </div>
        </div>
      </div>

      {/* Quota indicator */}
      <div data-testid="quota-indicator" className={`border-2 rounded-lg p-3 ${quota.canQuery ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {quota.canQuery ? (
              <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            )}
            <span className={`text-sm font-medium ${quota.canQuery ? "text-green-900 dark:text-green-200" : "text-orange-900 dark:text-orange-200"}`}>
              {getQuotaMessage()}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {quota.used}/{quota.limit} utilisées
          </div>
        </div>
        {!quota.canQuery && (
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
            Connectez-vous pour obtenir 50 requêtes par jour au lieu de 5.
          </p>
        )}
      </div>
    </div>
  );
}
