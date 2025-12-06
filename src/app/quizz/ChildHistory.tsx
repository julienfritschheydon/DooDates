import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Calendar,
  Star,
  Flame,
  Target,
  Award,
  ChevronDown,
  ChevronRight,
  User,
  Search,
} from "lucide-react";
import {
  getChildHistory,
  getAllChildren,
  getQuizzBySlugOrId,
  type ChildHistory as ChildHistoryType,
  type Badge,
  BADGE_DEFINITIONS,
} from "@/lib/products/quizz/quizz-service";
import { cn } from "@/lib/utils";

// Composant Badge
const BadgeCard: React.FC<{ badge: Badge; size?: "sm" | "md" | "lg" }> = ({
  badge,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-amber-500/50 transition-colors group">
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center group-hover:scale-110 transition-transform",
          sizeClasses[size],
        )}
      >
        <span>{badge.emoji}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">{badge.name}</p>
        <p className="text-xs text-gray-400">{badge.description}</p>
        {badge.count && badge.count > 1 && (
          <p className="text-xs text-amber-400 mt-1">×{badge.count}</p>
        )}
      </div>
    </div>
  );
};

// Composant pour un quiz dans l'historique
const QuizHistoryItem: React.FC<{
  response: ChildHistoryType["responses"][0];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ response, isExpanded, onToggle }) => {
  const quiz = getQuizzBySlugOrId(response.pollId);
  const date = new Date(response.created_at);

  return (
    <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        <button className="text-gray-400">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{quiz?.title || "Quiz supprimé"}</p>
          <p className="text-xs text-gray-400">
            {date.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-sm font-bold",
              response.percentage >= 80
                ? "bg-green-900/50 text-green-400"
                : response.percentage >= 60
                  ? "bg-amber-900/50 text-amber-400"
                  : "bg-red-900/50 text-red-400",
            )}
          >
            {Math.round(response.percentage)}%
          </div>
          {response.percentage === 100 && <span className="text-xl">🏆</span>}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">
                {response.totalPoints}/{response.maxPoints}
              </p>
              <p className="text-xs text-gray-400">Points</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {response.answers.filter((a) => a.isCorrect).length}
              </p>
              <p className="text-xs text-gray-400">Bonnes réponses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{response.answers.length}</p>
              <p className="text-xs text-gray-400">Questions</p>
            </div>
          </div>
          {quiz && (
            <Link
              to={`/quizz/${quiz.slug || quiz.id}/vote`}
              className="mt-4 block w-full text-center py-2 bg-amber-600/20 text-amber-400 rounded-lg hover:bg-amber-600/30 transition-colors text-sm"
            >
              Refaire ce quiz
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

// Page principale
const ChildHistory: React.FC = () => {
  const { childName } = useParams<{ childName: string }>();
  const navigate = useNavigate();
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Si pas de nom, afficher la liste des enfants
  const allChildren = useMemo(() => getAllChildren(), []);

  const history = useMemo(() => {
    if (!childName) return null;
    return getChildHistory(decodeURIComponent(childName));
  }, [childName]);

  // Vue liste des enfants
  if (!childName) {
    const filteredChildren = allChildren.filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/quizz/dashboard")}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Historique des enfants</h1>
              <p className="text-gray-400">Suivez les progrès de chaque enfant</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un enfant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Liste */}
          {filteredChildren.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700">
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? "Aucun résultat" : "Aucun historique"}
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? "Essayez avec un autre nom"
                  : "Les enfants apparaîtront ici après avoir complété un quiz"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChildren.map((name) => {
                const childHistory = getChildHistory(name);
                if (!childHistory) return null;

                return (
                  <Link
                    key={name}
                    to={`/quizz/history/${encodeURIComponent(name)}`}
                    className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-amber-500/50 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl font-bold text-white">
                      {childHistory.childName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium capitalize group-hover:text-amber-400 transition-colors">
                        {childHistory.childName}
                      </p>
                      <p className="text-sm text-gray-400">
                        {childHistory.totalQuizzes} quiz • Score moyen:{" "}
                        {Math.round(childHistory.averageScore)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {childHistory.badges.slice(0, 3).map((badge, i) => (
                        <span key={i} className="text-lg" title={badge.name}>
                          {badge.emoji}
                        </span>
                      ))}
                      {childHistory.badges.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{childHistory.badges.length - 3}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue détail d'un enfant
  if (!history) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Enfant non trouvé</h2>
          <p className="text-gray-400 mb-6">Aucun historique pour "{childName}"</p>
          <button
            onClick={() => navigate("/quizz/history")}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Voir tous les enfants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quizz/history")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl font-bold text-white">
              {history.childName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">{history.childName}</h1>
              <p className="text-gray-400">
                {history.lastActivity &&
                  `Dernière activité: ${new Date(history.lastActivity).toLocaleDateString("fr-FR")}`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{history.totalQuizzes}</p>
            <p className="text-xs text-gray-400">Quiz complétés</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{Math.round(history.averageScore)}%</p>
            <p className="text-xs text-gray-400">Score moyen</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{Math.round(history.bestScore)}%</p>
            <p className="text-xs text-gray-400">Meilleur score</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{history.currentStreak}</p>
            <p className="text-xs text-gray-400">Série actuelle</p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Badges ({history.badges.length})
          </h2>
          {history.badges.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              Continue les quiz pour débloquer des badges !
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {history.badges.map((badge, i) => (
                <BadgeCard key={i} badge={badge} size="sm" />
              ))}
            </div>
          )}
        </div>

        {/* Historique des quiz */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Historique des quiz
          </h2>
          <div className="space-y-3">
            {history.responses
              .slice()
              .reverse()
              .map((response) => (
                <QuizHistoryItem
                  key={response.id}
                  response={response}
                  isExpanded={expandedQuiz === response.id}
                  onToggle={() =>
                    setExpandedQuiz(expandedQuiz === response.id ? null : response.id)
                  }
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildHistory;
