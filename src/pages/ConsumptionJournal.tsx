/**
 * Page de journal de consommation des crédits
 * Affiche l'historique détaillé de toutes les consommations de crédits
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getConsumptionJournal, type CreditJournalEntry } from "@/lib/quotaTracking";
import {
  getGuestQuotaJournal,
  type GuestQuotaJournalEntry,
} from "@/lib/guestQuotaService";
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

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  conversation_created: {
    label: "Conversation créée",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-blue-400",
  },
  poll_created: {
    label: "Poll créé",
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
  const { user } = useAuth();
  const [journal, setJournal] = useState<CreditJournalEntry[]>([]);
  const [filteredJournal, setFilteredJournal] = useState<CreditJournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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
          // Authenticated: Utiliser localStorage
          entries = getConsumptionJournal(user.id, 500);
        }

        setJournal(entries);
        setFilteredJournal(entries);
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

  // Filtrer le journal selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredJournal(journal);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = journal.filter((entry) => {
      const actionLabel = ACTION_LABELS[entry.action]?.label.toLowerCase() || "";
      const metadataStr = JSON.stringify(entry.metadata || {}).toLowerCase();
      return actionLabel.includes(query) || metadataStr.includes(query);
    });

    setFilteredJournal(filtered);
  }, [searchQuery, journal]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <CreditCard className="w-8 h-8" />
                Journal de consommation
              </h1>
              <p className="text-gray-400">
                Historique détaillé de toutes vos consommations de crédits
              </p>
            </div>

            {/* Statistiques globales */}
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{totalCredits}</div>
              <div className="text-sm text-gray-400">Crédits totaux consommés</div>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par action, poll, conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-gray-700 text-white"
            />
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
                      ({entries.length} {entries.length === 1 ? "action" : "actions"})
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
                          className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={actionInfo.color}>{actionInfo.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{actionInfo.label}</span>
                                <span className="text-gray-500 text-sm">{timeStr}</span>
                              </div>
                              {entry.metadata && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {entry.metadata.conversationId && (
                                    <span>
                                      Conversation: {entry.metadata.conversationId.slice(0, 8)}...
                                    </span>
                                  )}
                                  {entry.metadata.pollId && (
                                    <span className="ml-2">
                                      Poll: {entry.metadata.pollId.slice(0, 8)}...
                                    </span>
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
