import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Users,
  BarChart3,
  Search,
  Vote,
  MessageSquare,
  X,
} from "lucide-react";
import { logError, ErrorFactory } from "../lib/error-handling";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { enableFormPoll } from "@/config/flags";
import {
  Poll as StoragePoll,
  getAllPolls,
  getFormResponses,
  getRespondentId,
  getVoterId,
} from "@/lib/pollStorage";
import PollActions from "@/components/polls/PollActions";
import { ConversationHistory } from "./conversations/ConversationHistory";
import { getConversations } from "@/lib/storage/ConversationStorageSimple";

// Interface pour les sondages du dashboard (basée sur Poll)
interface DashboardPoll extends StoragePoll {
  votes_count?: number;
  participants_count?: number;
  topDates?: { date: string; score: number }[];
  relatedConversationId?: string;
}

// Fonction pour trouver la conversation liée à un sondage (rétrocompatibilité)
function findRelatedConversation(poll: DashboardPoll): string | undefined {
  // Si déjà défini, le retourner
  if (poll.relatedConversationId) return poll.relatedConversationId;

  // Sinon, chercher une conversation avec le même titre de sondage
  try {
    const conversations = getConversations();
    const match = conversations.find((conv) => {
      // Chercher dans les métadonnées si un sondage a été créé avec ce titre
      const metadata = conv.metadata as any;
      return (
        metadata?.pollGenerated &&
        metadata?.pollTitle?.toLowerCase() === poll.title.toLowerCase()
      );
    });
    return match?.id;
  } catch {
    return undefined;
  }
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<
    "all" | "draft" | "active" | "closed" | "archived"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"polls" | "conversations">(
    "polls",
  );

  // États locaux pour gérer les sondages avec statistiques
  const [polls, setPolls] = useState<DashboardPoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh after delete
  // Les formulaires sont désormais intégrés au stockage unifié via getAllPolls()

  const getUserPolls = async () => {
    setLoading(true);
    try {
      // En mode développement local, récupérer depuis le stockage unifié
      const localPolls = getAllPolls();
      const localVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");

      // Calculer les statistiques pour chaque sondage
      const pollsWithStats = localPolls.map((poll: any) => {
        if (poll?.type === "form") {
          const resps = getFormResponses(poll.id);
          const unique = new Set(resps.map((r) => getRespondentId(r))).size;
          return {
            ...poll,
            participants_count: unique,
            votes_count: resps.length,
          };
        }

        const pollVotes = localVotes.filter(
          (vote: any) => vote.poll_id === poll.id,
        );
        const uniqueVoters = new Set(
          pollVotes.map((vote: any) => getVoterId(vote)),
        ).size;

        // Calculer les meilleures dates pour les sondages de type date
        let topDates: { date: string; score: number }[] = [];

        // Pour les sondages de dates, utiliser settings.selectedDates au lieu de options
        const selectedDates = poll.settings?.selectedDates || poll.options;

        if (
          selectedDates &&
          Array.isArray(selectedDates) &&
          pollVotes.length > 0 &&
          poll.type !== "form"
        ) {
          const dateScores = selectedDates.map(
            (dateStr: any, index: number) => {
              // Si c'est une string (selectedDates), sinon c'est un option object
              const dateLabel =
                typeof dateStr === "string"
                  ? dateStr
                  : dateStr.label || dateStr.title;
              const optionId = `option-${index}`;

              let score = 0;
              pollVotes.forEach((vote: any) => {
                // Chercher la sélection par ID d'option
                const selection =
                  vote.vote_data?.[optionId] || vote.selections?.[optionId];
                if (selection === "yes") score += 3;
                else if (selection === "maybe") score += 1;
              });
              return { date: dateLabel, score };
            },
          );

          // Trier par score et prendre les 2 meilleures
          topDates = dateScores
            .filter((d) => d.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);
        }

        return {
          ...poll,
          participants_count: uniqueVoters,
          votes_count: pollVotes.length,
          topDates,
        };
      });

      setPolls(pollsWithStats);
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to load polls",
          "Erreur lors du chargement des sondages",
        ),
        { component: "Dashboard", metadata: { originalError: error } },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserPolls();

    // Listen for poll creation events
    const handlePollCreated = () => {
      console.log("📢 Event pollCreated received, refreshing polls...");
      getUserPolls(); // Refresh the list when a new poll is created
    };

    window.addEventListener("pollCreated", handlePollCreated);

    // Check for resume parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resumeConversationId = urlParams.get("conversationId");

    if (resumeConversationId) {
      // Clear the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("conversationId");
      window.history.replaceState({}, "", newUrl.toString());

      // Navigate to conversation
      navigate(`/?conversationId=${resumeConversationId}`);
    }

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("pollCreated", handlePollCreated);
    };
  }, [navigate]);

  // Force refresh when refreshKey changes (after delete)
  useEffect(() => {
    if (refreshKey > 0) {
      console.log(`🔄 RefreshKey changed to ${refreshKey}, forcing refresh...`);
      getUserPolls();
    }
  }, [refreshKey]);

  const filteredPolls = polls.filter((poll) => {
    const matchesFilter = filter === "all" || poll.status === filter;
    const matchesSearch = poll.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Debug logs pour comprendre le filtrage
    if (filter !== "all") {
      console.log(
        `🔍 Filter: ${filter}, Poll: ${poll.title}, Status: ${poll.status}, Matches: ${matchesFilter}`,
      );
    }

    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: DashboardPoll["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: DashboardPoll["status"]) => {
    switch (status) {
      case "draft":
        return "Brouillon";
      case "active":
        return "Actif";
      case "closed":
        return "Terminé";
      case "archived":
        return "Archivé";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pt-20">
        {/* Indicateur Mode Développement Local */}
        <div className="bg-amber-900/20 border-l-4 border-amber-500 p-3 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-200">
                🚧 <strong>Mode Développement Local</strong> - Les sondages sont
                stockés localement (localStorage)
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Onglets de navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-8">
              <div className="flex space-x-1 bg-[#1e1e1e] p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("polls")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "polls"
                      ? "bg-[#3c4043] text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Mes Sondages
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("conversations")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "conversations"
                      ? "bg-[#3c4043] text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Mes Conversations
                  </div>
                </button>
              </div>
            </div>

            {/* Bouton fermer pour revenir à l'accueil */}
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
              title="Retour à l'accueil"
              data-testid="close-dashboard"
              aria-label="Retour"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenu conditionnel selon l'onglet actif */}
          {activeTab === "polls" && (
            <>
              {/* Filtres et recherche */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un sondage..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#1e1e1e] border border-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="search-polls"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["all", "draft", "active", "closed", "archived"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setFilter(status as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === status
                              ? "bg-blue-500 text-white"
                              : "bg-[#1e1e1e] text-gray-300 hover:bg-[#3c4043] border border-gray-700"
                          }`}
                        >
                          {status === "all"
                            ? "Tous"
                            : getStatusLabel(status as DashboardPoll["status"])}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Grille des sondages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPolls.map((poll) => (
                  <div
                    key={poll.id}
                    className="bg-[#3c4043] rounded-lg shadow-sm border border-gray-700 hover:shadow-md transition-shadow"
                    data-testid="poll-item"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                            {poll.title}
                          </h3>
                          {poll.description && (
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                              {poll.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              poll.status,
                            )}`}
                            data-testid="poll-status"
                          >
                            {getStatusLabel(poll.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span data-testid="participants-count">
                              {poll.participants_count || 0} participant
                              {(poll.participants_count || 0) > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Vote className="w-4 h-4" />
                            <span data-testid="votes-count">
                              {poll.votes_count || 0} vote
                              {(poll.votes_count || 0) > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(poll.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Meilleures dates */}
                      {poll.topDates && poll.topDates.length > 0 ? (
                        <div className="mb-4">
                          <div className="text-xs text-gray-400 mb-2 font-medium">
                            🏆 Dates populaires :
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {poll.topDates.map((dateInfo, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  index === 0
                                    ? "bg-blue-900/30 text-blue-400"
                                    : "bg-purple-900/30 text-purple-400"
                                }`}
                              >
                                {index === 0 && "⭐ "}
                                {dateInfo.date}
                                <span className="ml-1 text-xs opacity-75">
                                  ({dateInfo.score} pts)
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        poll.votes_count > 0 &&
                        poll.type !== "form" && (
                          <div className="mb-4 text-xs text-gray-400">
                            Aucune date n'a reçu de vote favorable
                          </div>
                        )
                      )}

                      {/* Badge conversation IA si le sondage a été créé par IA */}
                      {(() => {
                        const conversationId = findRelatedConversation(poll);
                        return conversationId ? (
                          <div className="mb-3 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              💬 Créé par IA
                            </span>
                            <button
                              onClick={() =>
                                navigate(`/?conversation=${conversationId}`)
                              }
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Reprendre la conversation →
                            </button>
                          </div>
                        ) : null;
                      })()}

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/poll/${poll.slug}/results`)}
                          className="bg-[#1e1e1e] text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-1 min-w-0"
                          data-testid="results-button"
                        >
                          <BarChart3 className="w-4 h-4 flex-shrink-0" />
                          <span className="hidden lg:inline">Résultats</span>
                        </button>
                        <button
                          onClick={() => navigate(`/poll/${poll.slug}`)}
                          className="bg-[#1e1e1e] text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-1 min-w-0"
                          data-testid="vote-button"
                        >
                          <Vote className="w-4 h-4 flex-shrink-0" />
                          <span className="hidden lg:inline">Voter</span>
                        </button>
                        <PollActions
                          poll={poll as any}
                          showVoteButton={false}
                          variant="compact"
                          onAfterDuplicate={() => {
                            console.log("🔄 After duplicate, refreshing...");
                            getUserPolls();
                          }}
                          onAfterDelete={() => {
                            console.log("🗑️ After delete, refreshing...");
                            setRefreshKey((prev) => prev + 1);
                            getUserPolls();
                          }}
                          onAfterArchive={() => {
                            console.log("📦 After archive, refreshing...");
                            getUserPolls();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPolls.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {searchQuery ? "Aucun sondage trouvé" : "Aucun sondage"}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery
                      ? "Essayez avec d'autres mots-clés"
                      : "Créez votre premier sondage pour commencer"}
                  </p>

                  {!searchQuery && (
                    <button
                      onClick={() => {
                        // Nettoyer le localStorage avant de naviguer vers un nouveau sondage
                        localStorage.removeItem("doodates-draft");
                        navigate("/create");
                      }}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Créer un sondage
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Section Conversations */}
          {activeTab === "conversations" && (
            <div className="mt-6">
              <ConversationHistory
                onResumeConversation={(conversationId) => {
                  console.log(
                    "🔄 Dashboard: Resuming conversation",
                    conversationId,
                  );
                  navigate(`/chat?resume=${conversationId}`);
                  console.log(
                    "✅ Dashboard: Navigated to /chat?resume=" + conversationId,
                  );
                }}
                onCreateConversation={() => {
                  console.log("➕ Dashboard: Creating new conversation");
                  navigate("/chat");
                }}
                language="fr"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
