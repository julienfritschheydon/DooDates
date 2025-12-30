import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  Share2,
  Copy,
  CheckCircle,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  getQuizzBySlugOrId,
  getQuizzResults,
  deleteQuizzResponsesByPollId,
  deleteQuizzResponsesForChild,
  type Quizz,
  type QuizzResults as QuizzResultsType,
} from "../../lib/products/quizz/quizz-service";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { useResultsAccess } from "@/hooks/useResultsAccess";
import { ResultsAccessDenied } from "@/components/polls/ResultsAccessDenied";
import { useAuth } from "@/contexts/AuthContext";

// Composant QR Code simple (génération via API externe)
function QRCodeDisplay({ url, size = 150 }: { url: string; size?: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={qrUrl}
        alt="QR Code du quiz"
        width={size}
        height={size}
        className="rounded-lg border border-gray-200"
      />
      <p className="text-xs text-gray-500">Scannez pour accéder au quiz</p>
    </div>
  );
}

export default function QuizzResults() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quizz, setQuizz] = useState<Quizz | null>(null);
  const [results, setResults] = useState<QuizzResultsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>("");

  // Vérifier si l'utilisateur a répondu au quizz (pour contrôle d'accès)
  const hasVoted = useMemo(() => {
    if (!quizz || !results) return false;
    // Si l'utilisateur est connecté, vérifier s'il a des réponses
    if (user) {
      return results.totalResponses > 0; // Simplification: si des réponses existent
    }
    return false;
  }, [quizz, results, user]);

  // Vérifier l'accès aux résultats
  const accessStatus = useResultsAccess(quizz as any, hasVoted);

  // Charger le quiz et les résultats
  useEffect(() => {
    if (slug) {
      const q = getQuizzBySlugOrId(slug);
      setQuizz(q);
      if (q) {
        const r = getQuizzResults(q.id);
        setResults(r);
      }
      setLoading(false);
    }
  }, [slug]);

  // URL du quiz pour partage
  const quizUrl = useMemo(() => {
    return `${window.location.origin}/DooDates/quizz/${slug}/vote`;
  }, [slug]);

  // Copier le lien
  const copyQuizLink = () => {
    navigator.clipboard.writeText(quizUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Rafraîchir les résultats
  const refreshResults = () => {
    if (quizz) {
      const r = getQuizzResults(quizz.id);
      setResults(r);
    }
  };

  // Participants uniques (noms) pour reset ciblé
  const participantNames = useMemo(() => {
    if (!results) return [] as string[];
    const names = new Set<string>();
    for (const r of results.responses) {
      const name = r.respondentName?.trim();
      if (name) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [results]);

  const handleResetAllScores = () => {
    if (!quizz) return;

    const confirmed = window.confirm(
      "Réinitialiser tous les scores de ce quiz ?\n\n" +
        "Toutes les réponses enregistrées seront supprimées (scores, historiques, badges). Cette opération est irréversible.",
    );
    if (!confirmed) return;

    try {
      deleteQuizzResponsesByPollId(quizz.id);
      refreshResults();
    } catch (error) {
      // Fallback simple : alerte utilisateur
      // (les erreurs sont déjà loguées côté service)
      alert("Impossible de réinitialiser les scores du quiz. Veuillez réessayer.");
    }
  };

  const handleResetChildScores = () => {
    if (!quizz || !selectedChild) return;

    const confirmed = window.confirm(
      `Réinitialiser les scores de ${selectedChild} pour ce quiz ?\n\n` +
        "Toutes ses réponses enregistrées pour ce quiz seront supprimées, mais les autres participants ne seront pas affectés.",
    );
    if (!confirmed) return;

    try {
      deleteQuizzResponsesForChild(selectedChild, quizz.id);
      refreshResults();
      setSelectedChild("");
    } catch (error) {
      alert("Impossible de réinitialiser les scores de cet enfant. Veuillez réessayer.");
    }
  };

  // Stats calculées
  const stats = useMemo(() => {
    if (!results || !quizz) return null;

    const responses = results.responses;
    if (responses.length === 0) return null;

    // Score moyen, min, max
    const scores = responses.map((r) => r.percentage);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Questions les plus difficiles
    const questionDifficulty = Object.entries(results.questionStats)
      .map(([id, stat]) => ({
        id,
        question: quizz.questions.find((q) => q.id === id)?.question || "",
        successRate: stat.percentage,
        wrongAnswer: stat.mostCommonWrongAnswer,
      }))
      .sort((a, b) => a.successRate - b.successRate);

    const hardestQuestions = questionDifficulty.slice(0, 3);
    const easiestQuestions = questionDifficulty.slice(-3).reverse();

    // Répartition des scores
    const scoreDistribution = {
      excellent: responses.filter((r) => r.percentage >= 90).length,
      good: responses.filter((r) => r.percentage >= 75 && r.percentage < 90).length,
      average: responses.filter((r) => r.percentage >= 50 && r.percentage < 75).length,
      needsWork: responses.filter((r) => r.percentage < 50).length,
    };

    return {
      avgScore,
      minScore,
      maxScore,
      hardestQuestions,
      easiestQuestions,
      scoreDistribution,
      totalResponses: responses.length,
    };
  }, [results, quizz]);

  const hasResponses = !!results && results.responses.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!quizz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz introuvable</h1>
          <p className="text-gray-600 mb-4">Ce quiz n'existe pas ou a été supprimé.</p>
          <Link to="/quizz" className="text-amber-600 hover:text-amber-700 font-medium">
            ← Retour aux quiz
          </Link>
        </div>
      </div>
    );
  }

  // Vérifier l'accès aux résultats
  if (!accessStatus.allowed) {
    return (
      <ResultsAccessDenied
        message={accessStatus.message}
        pollSlug={quizz.slug}
        showVoteButton={accessStatus.reason === "not-voted"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/quizz")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">{quizz.title}</h1>
              <p className="text-sm text-gray-500">Résultats du quiz</p>
            </div>
          </div>
          <Button
            onClick={refreshResults}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Rafraîchir les résultats"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Carte de partage */}
        <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Partager ce quiz</h2>
              <p className="text-white/80 text-sm mb-4">
                Envoyez ce lien à vos élèves pour qu'ils puissent répondre au quiz.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={copyQuizLink}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier le lien
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {showQRCode ? "Masquer QR" : "QR Code"}
                </Button>
              </div>
            </div>
            {showQRCode && (
              <div className="bg-white p-3 rounded-xl">
                <QRCodeDisplay url={quizUrl} size={120} />
              </div>
            )}
          </div>
        </div>

        {/* Stats générales */}
        {stats ? (
          <>
            {/* Cartes de stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Participants</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalResponses}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Score moyen</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{Math.round(stats.avgScore)}%</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Meilleur</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{Math.round(stats.maxScore)}%</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">Plus faible</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{Math.round(stats.minScore)}%</p>
              </div>
            </div>

            {/* Répartition des scores */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Répartition des scores
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "🏆 Excellent (90%+)",
                    count: stats.scoreDistribution.excellent,
                    color: "bg-green-500",
                  },
                  {
                    label: "🌟 Bon (75-89%)",
                    count: stats.scoreDistribution.good,
                    color: "bg-blue-500",
                  },
                  {
                    label: "👍 Moyen (50-74%)",
                    count: stats.scoreDistribution.average,
                    color: "bg-amber-500",
                  },
                  {
                    label: "📚 À retravailler (<50%)",
                    count: stats.scoreDistribution.needsWork,
                    color: "bg-red-500",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-40">{item.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-500", item.color)}
                        style={{
                          width: `${stats.totalResponses > 0 ? (item.count / stats.totalResponses) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions difficiles */}
            {stats.hardestQuestions.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Questions les plus difficiles
                </h3>
                <div className="space-y-4">
                  {stats.hardestQuestions.map((q, idx) => (
                    <div key={q.id} className="border-l-4 border-red-400 pl-4">
                      <p className="text-gray-800 font-medium">{q.question}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span
                          className={cn(
                            "font-semibold",
                            q.successRate >= 50 ? "text-green-600" : "text-red-600",
                          )}
                        >
                          {Math.round(q.successRate)}% de réussite
                        </span>
                        {q.wrongAnswer && (
                          <span className="text-gray-500">
                            Erreur fréquente : "{q.wrongAnswer}"
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions faciles */}
            {stats.easiestQuestions.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Questions les mieux maîtrisées
                </h3>
                <div className="space-y-4">
                  {stats.easiestQuestions.map((q) => (
                    <div key={q.id} className="border-l-4 border-green-400 pl-4">
                      <p className="text-gray-800 font-medium">{q.question}</p>
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        {Math.round(q.successRate)}% de réussite
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des réponses */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Détail des réponses
              </h3>
              {results && results.responses.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {results.responses.map((response, idx) => (
                    <div key={response.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {response.respondentName || "Anonyme"}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(response.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            response.percentage >= 75
                              ? "text-green-600"
                              : response.percentage >= 50
                                ? "text-amber-600"
                                : "text-red-600",
                          )}
                        >
                          {Math.round(response.percentage)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {response.totalPoints}/{response.maxPoints} pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune réponse pour le moment</p>
              )}
            </div>
          </>
        ) : (
          /* Aucun participant */
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Aucun participant pour l'instant
            </h3>
            <p className="text-gray-500 mb-6">
              Partagez le lien du quiz pour recevoir des réponses.
            </p>
            <Button
              onClick={copyQuizLink}
              className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors"
            >
              Copier le lien du quiz
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
