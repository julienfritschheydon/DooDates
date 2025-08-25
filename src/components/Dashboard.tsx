import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Users,
  BarChart3,
  Eye,
  Copy,
  Trash2,
  AlertCircle,
  Edit,
  Search,
  Filter,
  Share2,
  Vote,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePolls } from "../hooks/usePolls";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import TopNav from "./TopNav";
import { Poll } from "@/types/poll";

// Interface pour les sondages du dashboard (basée sur Poll)
interface DashboardPoll extends Poll {
  votes_count?: number;
  participants_count?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "draft" | "active" | "closed">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [copySuccessSlug, setCopySuccessSlug] = useState<string | null>(null);

  // États locaux pour gérer les sondages avec statistiques
  const [polls, setPolls] = useState<DashboardPoll[]>([]);
  const [loading, setLoading] = useState(false);
  const { deletePoll } = usePolls();

  const getUserPolls = async () => {
    setLoading(true);
    try {
      // En mode développement local, récupérer depuis localStorage
      const localPolls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
      const localVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");

      // Calculer les statistiques pour chaque sondage
      const pollsWithStats = localPolls.map((poll: any) => {
        const pollVotes = localVotes.filter(
          (vote: any) => vote.poll_id === poll.id,
        );
        const uniqueVoters = new Set(
          pollVotes.map((vote: any) => vote.voter_email),
        ).size;

        return {
          ...poll,
          participants_count: uniqueVoters,
          votes_count: pollVotes.length,
        };
      });

      setPolls(pollsWithStats);
    } catch (error) {
      console.error("Erreur lors du chargement des sondages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserPolls();
  }, []);

  // Debug: afficher l'état des polls
  useEffect(() => {
    console.log("🔍 Dashboard: État des polls mis à jour:", polls);
    console.log("🔍 Dashboard: Loading:", loading);
  }, [polls, loading]);

  const filteredPolls = polls.filter((poll) => {
    const matchesFilter = filter === "all" || poll.status === filter;
    const matchesSearch = poll.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: DashboardPoll["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "active":
        return "bg-green-100 text-green-800";
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

  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/poll/${slug}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Lien copié",
          description: "Le lien du sondage a été copié dans le presse-papiers.",
        });
        setCopySuccessSlug(slug);
        setTimeout(() => setCopySuccessSlug(null), 1500);
      } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API clipboard
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast({
          title: "Lien copié",
          description: "Le lien du sondage a été copié dans le presse-papiers.",
        });
        setCopySuccessSlug(slug);
        setTimeout(() => setCopySuccessSlug(null), 1500);
      }
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de copier le lien. Veuillez le copier manuellement.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce sondage ?")) {
      try {
        await deletePoll(pollId);
        toast({
          title: "Sondage supprimé",
          description: "Le sondage a été supprimé avec succès.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le sondage.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicatePoll = async (poll: DashboardPoll) => {
    try {
      // Créer une copie du sondage avec un nouveau titre
      const duplicatedPoll = {
        ...poll,
        title: `${poll.title} (Copie)`,
        slug: `${poll.slug}-copy-${Date.now()}`,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Sauvegarder dans localStorage
      const existingPolls = JSON.parse(
        localStorage.getItem("dev-polls") || "[]",
      );
      existingPolls.push(duplicatedPoll);
      localStorage.setItem("dev-polls", JSON.stringify(existingPolls));

      // Rafraîchir la liste
      getUserPolls();

      toast({
        title: "Sondage copié",
        description: "Le sondage a été copié avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le sondage.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNav />

      {/* Indicateur Mode Développement Local */}
      <div className="bg-amber-100 dark:bg-amber-900 border-l-4 border-amber-500 p-3 mb-4">
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
            <p className="text-sm text-amber-700 dark:text-amber-200">
              🚧 <strong>Mode Développement Local</strong> - Les sondages sont
              stockés localement (localStorage)
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec titre et compteur */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Mes Sondages</h1>
            <span className="text-sm text-gray-500">
              {filteredPolls.length} sondage
              {filteredPolls.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau sondage</span>
          </button>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un sondage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="search-polls"
              />
            </div>
            <div className="flex gap-2">
              {["all", "draft", "active", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  {status === "all"
                    ? "Tous"
                    : getStatusLabel(status as DashboardPoll["status"])}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grille des sondages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              data-testid="poll-item"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
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
                      {poll.status === "active" ? "Actif" : "Fermé"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span data-testid="participants-count">
                        {poll.participants_count || 0} participants
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Vote className="w-4 h-4" />
                      <span data-testid="votes-count">
                        {poll.votes_count || 0} votes
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(poll.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/poll/${poll.slug}/results`)}
                    className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1 min-w-0"
                    data-testid="results-button"
                  >
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline">Résultats</span>
                  </button>
                  <button
                    onClick={() => navigate(`/poll/${poll.slug}`)}
                    className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1 min-w-0"
                    data-testid="vote-button"
                  >
                    <Vote className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline">Voter</span>
                  </button>
                  <button
                    onClick={() => navigate(`/create?edit=${poll.id}`)}
                    className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1 min-w-0"
                    data-testid="view-poll-button"
                  >
                    <Edit className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline">Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDuplicatePoll(poll as DashboardPoll)}
                    className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1 min-w-0"
                    data-testid="duplicate-poll-button"
                  >
                    <Copy className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline">Copier</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(poll.slug);
                    }}
                    className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1 min-w-0"
                    title="Copier le lien"
                    data-testid="copy-link-button"
                  >
                    <Share2 className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline">Lien</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Supprimer le sondage du localStorage
                      const existingPolls = JSON.parse(
                        localStorage.getItem("dev-polls") || "[]",
                      );
                      const updatedPolls = existingPolls.filter(
                        (p: any) => p.id !== poll.id,
                      );
                      localStorage.setItem(
                        "dev-polls",
                        JSON.stringify(updatedPolls),
                      );
                      getUserPolls(); // Recharger la liste
                      toast({
                        title: "Sondage supprimé",
                        description: "Le sondage a été supprimé avec succès.",
                      });
                    }}
                    className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1 min-w-0"
                    title="Supprimer"
                    data-testid="delete-poll-button"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline">Supprimer</span>
                  </button>
                  {copySuccessSlug === poll.slug && (
                    <span data-testid="copy-success" className="sr-only">
                      Copied
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPolls.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "Aucun sondage trouvé" : "Aucun sondage"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Essayez avec d'autres mots-clés"
                : "Créez votre premier sondage pour commencer"}
            </p>

            {!searchQuery && (
              <button
                onClick={() => navigate("/create")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un sondage
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
