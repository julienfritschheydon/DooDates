/**
 * Page de journal de consommation des crédits
 * Affiche l'historique détaillé de toutes les consommations de crédits
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getConsumptionJournal, type CreditJournalEntry } from "@/lib/quotaTracking";
import { getGuestQuotaJournal, type GuestQuotaJournalEntry } from "@/lib/guestQuotaService";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MessageSquare,
  BarChart3,
  Zap,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logError, ErrorFactory } from "@/lib/error-handling";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getThemeColors } from "@/components/dashboard/utils";
import { ContentTypeFilter } from "@/components/dashboard/types";
import { PollLink } from "@/components/journal/PollLink";

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  conversation_created: {
    label: "Conversation créée",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-blue-400",
  },
  poll_created: {
    label: "Sondage créé",
    icon: <FileText className="w-4 h-4" />,
    color: "text-green-400",
  },
  ai_message: {
    label: "Message IA",
    icon: <Zap className="w-4 h-4" />,
    color: "text-purple-400",
  },
  analytics_query: {
    label: "Query Analytics",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-orange-400",
  },
  simulation: {
    label: "Simulation",
    icon: <Zap className="w-4 h-4" />,
    color: "text-pink-400",
  },
  other: {
    label: "Autre",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-gray-400",
  },
};

export default function ConsumptionJournal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Déterminer le thème basé sur l'URL
  const theme = (() => {
    let type: ContentTypeFilter = "date"; // default
    if (location.pathname.includes("/form-polls/")) {
      type = "form";
    } else if (location.pathname.includes("/availability-polls/")) {
      type = "availability";
    }
    return getThemeColors(type);
  })();

  const handleBack = () => {
    if (location.pathname.includes("/form-polls/")) {
      navigate("/form-polls/dashboard");
    } else if (location.pathname.includes("/availability-polls/")) {
      navigate("/availability-polls/dashboard");
    } else if (location.pathname.includes("/date-polls/")) {
      navigate("/date-polls/dashboard");
    } else {
      navigate("/date-polls/dashboard"); // Redirection par défaut vers date-polls
    }
  };
  const [journal, setJournal] = useState<CreditJournalEntry[]>([]);
  const [filteredJournal, setFilteredJournal] = useState<CreditJournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "all" | string>("current");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    const loadJournal = async () => {
      try {
        let entries: CreditJournalEntry[];

        if (!user) {
          // Guest: Utiliser Supabase
          const guestEntries = await getGuestQuotaJournal(500);
          // Convertir GuestQuotaJournalEntry vers CreditJournalEntry
          entries = guestEntries.map((entry) => ({
            id: entry.id,
            action: entry.action,
            credits: entry.credits,
            timestamp: entry.createdAt,
            userId: entry.fingerprint,
            metadata: entry.metadata,
          }));
        } else {
          // Authenticated: Utiliser Edge Function (ou localStorage en fallback)
          entries = await getConsumptionJournal(user.id, 500);
        }

        // Filtrer les entrées selon le type de produit (basé sur l'URL)
        // Utiliser window.location.pathname car location.pathname ne contient pas le basename
        const fullPath = window.location.pathname;
        let filteredEntries = entries;
        if (fullPath.includes("/date-polls/")) {
          // Journal des date polls : afficher uniquement les sondages de dates
          filteredEntries = entries.filter((entry) => {
            // Garder toutes les entrées sauf poll_created avec un type différent de date
            if (entry.action === "poll_created" && entry.metadata?.pollType) {
              return entry.metadata.pollType === "date";
            }
            return true; // Garder les autres types d'actions (conversations, messages IA, etc.)
          });
        } else if (fullPath.includes("/form-polls/")) {
          // Journal des form polls : afficher uniquement les sondages de formulaires
          filteredEntries = entries.filter((entry) => {
            if (entry.action === "poll_created" && entry.metadata?.pollType) {
              return entry.metadata.pollType === "form";
            }
            return true;
          });
        } else if (fullPath.includes("/availability-polls/")) {
          // Journal des availability polls : afficher uniquement les sondages de disponibilité
          filteredEntries = entries.filter((entry) => {
            if (entry.action === "poll_created" && entry.metadata?.pollType) {
              return entry.metadata.pollType === "availability";
            }
            return true;
          });
        } else if (fullPath.includes("/quizz-polls/")) {
          // Journal des quizz polls : afficher uniquement les quiz
          filteredEntries = entries.filter((entry) => {
            if (entry.action === "poll_created" && entry.metadata?.pollType) {
              return entry.metadata.pollType === "quizz";
            }
            return true;
          });
        }

        setJournal(filteredEntries);
        setFilteredJournal(filteredEntries);
      } catch (error) {
        logError(
          ErrorFactory.storage(
            "Erreur lors du chargement du journal",
            "Impossible de charger l'historique",
          ),
          { component: "ConsumptionJournal", metadata: { userId: user?.id, error } },
        );
      } finally {
        setLoading(false);
      }
    };

    loadJournal();
  }, [user]);

  // Calculer les mois disponibles depuis le journal
  useEffect(() => {
    const months = new Set<string>();
    journal.forEach((entry) => {
      const month = entry.timestamp.substring(0, 7); // 'YYYY-MM'
      months.add(month);
    });
    const sortedMonths = Array.from(months).sort().reverse();
    setAvailableMonths(sortedMonths);
  }, [journal]);

  // Filtrer par période
  const filteredByPeriod = useMemo(() => {
    if (selectedPeriod === "all") return journal;

    if (selectedPeriod === "current") {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return journal.filter((entry) => {
        const entryMonth = entry.timestamp.substring(0, 7);
        return entryMonth === currentMonth;
      });
    }

    // Mois spécifique
    return journal.filter((entry) => {
      const entryMonth = entry.timestamp.substring(0, 7);
      return entryMonth === selectedPeriod;
    });
  }, [journal, selectedPeriod]);

  // Filtrer le journal selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredJournal(filteredByPeriod);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = filteredByPeriod.filter((entry) => {
      const actionLabel = ACTION_LABELS[entry.action]?.label.toLowerCase() || "";
      const metadataStr = JSON.stringify(entry.metadata || {}).toLowerCase();
      return actionLabel.includes(query) || metadataStr.includes(query);
    });

    setFilteredJournal(filtered);
  }, [searchQuery, filteredByPeriod]);

  // Calculer le label de période
  const periodLabel = useMemo(() => {
    if (selectedPeriod === "all") return "Tout l'historique";
    if (selectedPeriod === "current") return "Mois en cours";

    // Mois spécifique - formater en "Janvier 2025"
    const [year, month] = selectedPeriod.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, [selectedPeriod]);

  // Grouper par date
  const groupedByDate = filteredJournal.reduce(
    (acc, entry) => {
      const date = new Date(entry.timestamp);
      const dateKey = date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    },
    {} as Record<string, CreditJournalEntry[]>,
  );

  // Calculer les totaux
  const totalCredits = journal.reduce((sum, entry) => sum + entry.credits, 0);
  const totalByAction = journal.reduce(
    (acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + entry.credits;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.activeBorder.replace("border-", "border-")}`}
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <TooltipProvider>
          <div className="mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className={`mb-4 text-gray-400 hover:text-white hover:${theme.bg}`}
                  data-testid="journal-back-dashboard"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au dashboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Retourner au tableau de bord</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                  <CreditCard className={`w-8 h-8 ${theme.text}`} />
                  Journal de consommation
                </h1>
                <p className="text-gray-400">
                  Historique détaillé de toutes vos consommations de crédits
                </p>
                <p className="text-sm text-gray-500 mt-1">Période: {periodLabel}</p>
              </div>

              {/* Statistiques globales */}
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{totalCredits}</div>
                <div className="text-sm text-gray-400">Crédits consommés</div>
                {user && (
                  <div className="text-sm text-gray-500 mt-1">Reset mensuel automatique</div>
                )}
              </div>
            </div>
          </div>
        </TooltipProvider>

        {/* Barre de recherche */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par action, sondage, conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-gray-700 text-white"
            />
          </div>

          {/* Sélecteur de période */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              id="period-selector"
              aria-label="Sélectionner la période"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">Mois en cours</option>
              <option value="all">Tout l'historique</option>
              {availableMonths.length > 0 && (
                <optgroup label="Mois spécifiques">
                  {availableMonths.map((month) => {
                    const [year, monthNum] = month.split("-");
                    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                    const label = date.toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <option key={month} value={month}>
                        {label}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Statistiques par action */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(ACTION_LABELS).map(([action, { label, icon, color }]) => {
            const total = totalByAction[action] || 0;
            if (total === 0) return null;

            return (
              <div key={action} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
                <div className={`flex items-center gap-2 mb-2 ${color}`}>
                  {icon}
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{total}</div>
                <div className="text-xs text-gray-400">crédits</div>
              </div>
            );
          })}
        </div>

        {/* Liste du journal */}
        {filteredJournal.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              {searchQuery ? "Aucun résultat" : "Aucune consommation"}
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Essayez avec d'autres critères de recherche"
                : "Vos consommations de crédits apparaîtront ici"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate)
              .sort(([dateA], [dateB]) => {
                // Trier par date (plus récent en premier)
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              })
              .map(([dateKey, entries]) => (
                <div key={dateKey} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-white">{dateKey}</h2>
                    <span className="text-sm text-gray-400">
                      ({entries.length} {entries.length === 1 ? "crédit" : "crédits"})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {entries.map((entry) => {
                      const actionInfo = ACTION_LABELS[entry.action] || ACTION_LABELS.other;
                      const date = new Date(entry.timestamp);
                      const timeStr = date.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-gray-800"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={actionInfo.color}>{actionInfo.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{actionInfo.label}</span>
                                <span className="text-gray-500 text-sm">{timeStr}</span>
                              </div>
                              {entry.metadata && (
                                <div className="text-xs text-gray-400 mt-1 space-y-1">
                                  {entry.metadata.conversationId && (
                                    <span>
                                      Conversation: {entry.metadata.conversationId.slice(0, 8)}...
                                    </span>
                                  )}
                                  {entry.metadata.pollId && (
                                    <div className="flex items-center gap-2">
                                      <span>Sondage:</span>
                                      <PollLink
                                        pollId={entry.metadata.pollId}
                                        pollType={entry.metadata.pollType}
                                      />
                                      {entry.action === "poll_created" && (
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            entry.metadata.conversationId
                                              ? "bg-purple-900/30 text-purple-300"
                                              : "bg-blue-900/30 text-blue-300"
                                          }`}
                                        >
                                          {entry.metadata.conversationId ? "IA" : "Manuel"}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {entry.metadata.analyticsQuery && (
                                    <span className="ml-2">
                                      Query: {entry.metadata.analyticsQuery}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{entry.credits}</div>
                            <div className="text-xs text-gray-400">
                              {entry.credits === 1 ? "crédit" : "crédits"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
