/**
 * SimulationReport - Rapport de simulation avec métriques et problèmes
 *
 * Affiche les résultats de la simulation : métriques globales,
 * problèmes détectés, et recommandations.
 */

import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Download,
  TrendingUp,
  Clock,
  Users,
  TrendingDown,
  Target,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SimulationResult, DetectedIssue, IssueSeverity } from "../../types/simulation";

interface SimulationReportProps {
  /** Résultat de la simulation */
  result: SimulationResult;

  /** Questions du poll (pour afficher les titres) */
  questions?: Array<{ id: string; title: string }>;

  /** Callback fermeture */
  onClose: () => void;

  /** Callback export PDF (Pro) */
  onExportPdf?: () => void;

  /** Utilisateur Pro */
  isPro?: boolean;

  /** ID du poll (pour navigation vers chat IA) */
  pollId?: string;
}

const SEVERITY_CONFIG: Record<
  IssueSeverity,
  {
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    color: "text-red-300",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-700/50",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-300",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-700/50",
  },
  info: {
    icon: Info,
    color: "text-blue-300",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-700/50",
  },
};

function IssueCard({
  issue,
  questions,
}: {
  issue: DetectedIssue;
  questions?: Array<{ id: string; title: string }>;
}) {
  const config = SEVERITY_CONFIG[issue.severity];
  const Icon = config.icon;

  // Trouver le titre et le numéro de la question concernée
  const questionIndex =
    issue.questionId && questions ? questions.findIndex((q) => q.id === issue.questionId) : -1;
  const questionTitle = questionIndex >= 0 && questions ? questions[questionIndex].title : null;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${config.color} mb-1`}>{issue.title}</h4>
          {questionTitle && (
            <p className="text-xs font-medium text-gray-400 mb-2">
              Question {questionIndex + 1} : "{questionTitle}"
            </p>
          )}
          <p className="text-sm text-gray-300 mb-3">{issue.description}</p>
          {issue.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Recommandations :</p>
              <ul className="space-y-1">
                {issue.recommendations.map((rec, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SimulationReport({
  result,
  questions,
  onClose,
  onExportPdf,
  isPro = false,
  pollId,
}: SimulationReportProps) {
  const { metrics, issues, objectiveValidation } = result;
  const navigate = useNavigate();

  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const warningIssues = issues.filter((i) => i.severity === "warning");
  const infoIssues = issues.filter((i) => i.severity === "info");

  const hasIssues = issues.length > 0;
  const hasCriticalIssues = criticalIssues.length > 0;

  // Formater le temps avec secondes si < 1min
  const formatTimeWithSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    return `${minutes}min`;
  };

  // Handler pour appliquer une suggestion via le chat IA
  const handleApplySuggestion = (suggestion: string) => {
    if (!pollId) {
      console.warn("pollId manquant, impossible d'appliquer la suggestion");
      return;
    }

    // Fermer le rapport
    onClose();

    // Naviguer vers le workspace (/) avec un nouveau chat
    // Le message sera envoyé automatiquement via location.state
    navigate(`/?new=${Date.now()}`, {
      state: {
        initialMessage: `Améliore mon questionnaire : ${suggestion}`,
        pollId: pollId,
        context: "simulation-suggestion",
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1e1e1e] rounded-lg shadow-xl max-w-2xl w-full my-8 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Rapport de Simulation</h2>
            <p className="text-sm text-gray-400 mt-1">
              {metrics.totalResponses} réponses simulées •{" "}
              {formatTimeWithSeconds(metrics.avgTotalTime)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Vue d'ensemble */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Vue d'ensemble</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Completion */}
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-300">
                    {Math.round(metrics.avgCompletionRate * 100)}%
                  </div>
                </div>
                <p className="text-sm text-green-400">Taux de complétion</p>
              </div>

              {/* Time */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-300">
                    {formatTimeWithSeconds(metrics.avgTotalTime)}
                  </div>
                </div>
                <p className="text-sm text-blue-400">Temps moyen</p>
              </div>

              {/* Dropoff */}
              <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-orange-300">
                    {Math.round(metrics.dropoffRate * 100)}%
                  </div>
                </div>
                <p className="text-sm text-orange-400">Taux d'abandon</p>
              </div>
            </div>
          </div>

          {/* Validation d'objectif */}
          {objectiveValidation && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Validation d'objectif
              </h3>
              <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-5">
                {/* Objectif */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Objectif défini :</p>
                  <p className="text-white font-medium">"{objectiveValidation.objective}"</p>
                </div>

                {/* Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Score d'alignement</span>
                    <span
                      className={`text-2xl font-bold ${
                        objectiveValidation.alignmentScore >= 70
                          ? "text-green-400"
                          : objectiveValidation.alignmentScore >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {objectiveValidation.alignmentScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        objectiveValidation.alignmentScore >= 70
                          ? "bg-green-500"
                          : objectiveValidation.alignmentScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${objectiveValidation.alignmentScore}%` }}
                    />
                  </div>
                </div>

                {/* Points forts */}
                {objectiveValidation.strengths.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-green-400" />
                      <p className="text-sm font-medium text-green-400">Points forts</p>
                    </div>
                    <ul className="space-y-1">
                      {objectiveValidation.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Points faibles */}
                {objectiveValidation.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsDown className="w-4 h-4 text-red-400" />
                      <p className="text-sm font-medium text-red-400">Points faibles</p>
                    </div>
                    <ul className="space-y-1">
                      {objectiveValidation.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-red-500">✗</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {objectiveValidation.suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <p className="text-sm font-medium text-yellow-400">
                        Suggestions d'amélioration
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {objectiveValidation.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-300 flex items-start gap-2 group"
                        >
                          <span className="text-yellow-500 mt-0.5">💡</span>
                          <span className="flex-1">{suggestion}</span>
                          {pollId && (
                            <button
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="ml-2 px-3 py-1 text-xs bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600/30 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
                            >
                              Appliquer
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Problèmes détectés */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Problèmes détectés</h3>
              {hasIssues && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    hasCriticalIssues
                      ? "bg-red-900/30 text-red-300 border border-red-700/50"
                      : "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50"
                  }`}
                >
                  {issues.length} problème{issues.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {!hasIssues ? (
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-green-300 mb-2">
                  Aucun problème détecté !
                </h4>
                <p className="text-sm text-green-400">
                  Votre questionnaire semble bien conçu. Vous pouvez l'envoyer en toute confiance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Critical */}
                {criticalIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} questions={questions} />
                ))}

                {/* Warning */}
                {warningIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} questions={questions} />
                ))}

                {/* Info */}
                {infoIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} questions={questions} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-[#1a1a1a]">
          {isPro && onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 border border-gray-700"
            >
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
