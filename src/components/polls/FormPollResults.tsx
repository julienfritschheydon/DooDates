import React, { useState, useMemo, useEffect } from "react";
import CloseButton from "@/components/ui/CloseButton";
import { useNavigate } from "react-router-dom";
import PollActions from "@/components/polls/PollActions";
import ResultsLayout from "@/components/polls/ResultsLayout";
import { ResultsEmpty, ResultsLoading } from "@/components/polls/ResultsStates";
import PollAnalyticsPanel from "@/components/polls/PollAnalyticsPanel";
import { NPSResults } from "@/components/polls/NPSResults";
import DateResultsView from "@/components/polls/DateResultsView";
import {
  getPollBySlugOrId,
  getFormResults,
  getFormResponses,
  getRespondentId,
  getCurrentUserId,
  checkIfUserHasVoted,
} from "@/lib/pollStorage";
import { useAuth } from "@/contexts/AuthContext";
import type { Poll, FormQuestionShape, FormQuestionOption, FormResponse } from "@/lib/pollStorage";
import { getComparisonByPollId } from "@/lib/simulation/SimulationComparison";
import { Target, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface Props {
  idOrSlug: string;
}

export default function FormPollResults({ idOrSlug }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth(); // Récupérer l'utilisateur authentifié
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [countsByQuestion, setCountsByQuestion] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [textAnswers, setTextAnswers] = useState<Record<string, string[]>>({});
  const [dateResults, setDateResults] = useState<
    Record<string, import("@/lib/pollStorage").DateQuestionResults>
  >({});
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({});
  const [showComparisonDetails, setShowComparisonDetails] = useState(false);

  useEffect(() => {
    const p = getPollBySlugOrId(idOrSlug);
    setPoll(p);
    if (p && p.type === "form") {
      const res = getFormResults(p.id);
      setCountsByQuestion(res.countsByQuestion);
      setTextAnswers(res.textAnswers);
      setDateResults(res.dateResults || {});
      setTotal(res.totalResponses);
      setResponses(getFormResponses(p.id));
    }
    setLoading(false);
  }, [idOrSlug]);

  const questions = useMemo(() => (poll?.questions ?? []) as FormQuestionShape[], [poll]);

  // Vérifier si l'utilisateur a le droit de voir les résultats
  const canViewResults = useMemo(() => {
    if (!poll) return false;
    const visibility = poll.resultsVisibility || "creator-only";

    // 1. Public : tout le monde peut voir
    if (visibility === "public") return true;

    // 2. Créateur : vérifier si c'est le créateur (via localStorage ou auth)
    const currentUserId = getCurrentUserId(user?.id); // Passer user.id si authentifié
    const isCreator = poll.creator_id === currentUserId;
    if (isCreator) return true;

    // 3. Voters : vérifier si l'utilisateur a voté
    if (visibility === "voters") {
      const hasVoted = checkIfUserHasVoted(poll.id);
      return hasVoted;
    }

    return false;
  }, [poll, user?.id]);

  // Deduplicate responses by stable respondent id
  const uniqueResponses = useMemo(() => {
    const map = new Map<string, FormResponse>();
    for (const r of responses) {
      const id = getRespondentId(r);
      if (!map.has(id)) map.set(id, r);
    }
    return Array.from(map.values());
  }, [responses]);

  const computed = useMemo(() => {
    const map: Record<
      string,
      {
        kind: string;
        counts?: Record<string, number>;
        samples?: string[];
        count?: number;
      }
    > = {};
    for (const q of questions) {
      const qid: string = q.id;
      const kind: string = q.kind || q.type || "single";
      if (kind === "text" || kind === "long-text") {
        const samples = (textAnswers[qid] || []).slice(0, 10);
        map[qid] = { kind, count: (textAnswers[qid] || []).length, samples };
      } else {
        map[qid] = { kind, counts: countsByQuestion[qid] || {} };
      }
    }
    return map;
  }, [questions, countsByQuestion, textAnswers]);

  // Récupérer la comparaison simulation si le poll est terminé
  const comparison = useMemo(() => {
    if (poll?.status === "closed") {
      return getComparisonByPollId(poll.id);
    }
    return null;
  }, [poll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <ResultsLoading label="Chargement des résultats..." />
      </div>
    );
  }

  if (!poll || poll.type !== "form") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ResultsEmpty message={<>Sondage formulaire introuvable.</>} />
        </div>
      </div>
    );
  }

  if (!canViewResults) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
            <h2 className="font-semibold text-lg mb-2 dark:text-yellow-200">Accès restreint</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Le créateur de ce sondage a choisi de ne pas partager les résultats publiquement.
            </p>
            {poll.resultsVisibility === "voters" && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                💡 Votez pour voir les résultats !
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalRespondents = uniqueResponses.length;

  const getAccuracyColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAccuracyIcon = (score: number) => {
    if (score >= 80) return <Target className="w-5 h-5" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <ResultsLayout
      title={`Résultats : ${poll.title}`}
      subtitle={
        <>
          {totalRespondents} participant{totalRespondents > 1 ? "s" : ""} • {questions.length}{" "}
          question{questions.length > 1 ? "s" : ""}
        </>
      }
      actions={
        <div className="w-full flex items-center gap-2 justify-end">
          <PollActions poll={poll} showVoteButton onAfterDelete={() => navigate("/dashboard")} />
        </div>
      }
      onClose={() => navigate("/dashboard")}
      kpis={[
        { label: "Participants", value: totalRespondents },
        { label: "Questions", value: questions.length },
        {
          label: "Questions à choix",
          value: Object.keys(countsByQuestion).length,
        },
      ]}
    >
      <p className="sr-only" aria-live="polite">
        {totalRespondents} réponses uniques. {questions.length} questions.
      </p>
      {/* Empty states inside content */}
      {questions.length === 0 ? (
        <ResultsEmpty message={<>Ce sondage n'a pas de questions.</>} />
      ) : totalRespondents === 0 ? (
        <ResultsEmpty message={<>Aucune réponse pour le moment.</>} />
      ) : (
        <div className="space-y-6">
          {/* Comparaison Simulation vs Réalité */}
          {comparison && (
            <div
              className={`rounded-lg border-2 p-6 ${getAccuracyColor(comparison.accuracy.overall)}`}
              data-testid="simulation-comparison"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getAccuracyIcon(comparison.accuracy.overall)}
                  <div>
                    <h3 className="font-semibold text-lg">Simulation vs Réalité</h3>
                    <p className="text-sm opacity-80">
                      Comparaison avec la simulation effectuée avant terminaison
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{comparison.accuracy.overall}%</div>
                  <div className="text-xs opacity-80">Précision globale</div>
                </div>
              </div>

              <button
                onClick={() => setShowComparisonDetails(!showComparisonDetails)}
                className="text-sm font-medium underline hover:no-underline mb-3"
              >
                {showComparisonDetails ? "Masquer les détails" : "Voir les détails"}
              </button>

              {showComparisonDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-current/20">
                  {/* Taux de complétion */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span className="font-medium text-sm">Taux de complétion</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        Prédit:{" "}
                        <span className="font-semibold">
                          {Math.round(comparison.predicted.avgCompletionRate * 100)}%
                        </span>
                      </div>
                      <div>
                        Réel:{" "}
                        <span className="font-semibold">
                          {Math.round(comparison.actual.avgCompletionRate * 100)}%
                        </span>
                      </div>
                      <div className="pt-1 border-t border-current/20">
                        Précision:{" "}
                        <span className="font-bold">{comparison.accuracy.completionRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Temps moyen */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium text-sm">Temps moyen</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        Prédit:{" "}
                        <span className="font-semibold">
                          {Math.round(comparison.predicted.avgTotalTime)}s
                        </span>
                      </div>
                      <div>
                        Réel:{" "}
                        <span className="font-semibold">
                          {Math.round(comparison.actual.avgTotalTime)}s
                        </span>
                      </div>
                      <div className="pt-1 border-t border-current/20">
                        Précision:{" "}
                        <span className="font-bold">{comparison.accuracy.totalTime}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Taux d'abandon */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium text-sm">Taux d'abandon</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        Prédit:{" "}
                        <span className="font-semibold">
                          {Math.round(comparison.predicted.dropoffRate * 100)}%
                        </span>
                      </div>
                      <div>
                        Réel:{" "}
                        <span className="font-semibold">
                          {Math.round(comparison.actual.dropoffRate * 100)}%
                        </span>
                      </div>
                      <div className="pt-1 border-t border-current/20">
                        Précision:{" "}
                        <span className="font-bold">{comparison.accuracy.dropoffRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics IA Panel */}
          {totalRespondents > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 p-6">
              <PollAnalyticsPanel pollId={poll.id} pollTitle={poll.title} />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 p-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Analytics IA
                </h2>
              </div>
            </div>
          )}

          {questions.map((q: FormQuestionShape) => {
            const qid: string = q.id;
            const kind: string = q.kind || q.type || "single";
            const stats = computed[qid];
            return (
              <div
                key={qid}
                className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 p-4"
                data-testid={`form-question-result-${qid}`}
              >
                <div className="mb-3">
                  <div className="font-medium dark:text-gray-100">{q.title || "(Sans titre)"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {kind === "text" || kind === "long-text"
                      ? "Réponses libres"
                      : kind === "single"
                        ? "Choix unique"
                        : kind === "multiple"
                          ? "Choix multiples"
                          : kind === "matrix"
                            ? "Matrice"
                            : kind === "date"
                              ? "Date"
                              : kind === "rating"
                                ? "Échelle de notation"
                                : kind === "nps"
                                  ? "Net Promoter Score"
                                  : "Question"}
                  </div>
                </div>

                {kind === "date" && (
                  <DateResultsView
                    question={q}
                    results={
                      dateResults[qid] || {
                        votesByDate: {},
                        votesByTimeSlot: {},
                        totalResponses: 0,
                      }
                    }
                    totalRespondents={totalRespondents}
                  />
                )}

                {kind !== "text" &&
                  kind !== "long-text" &&
                  kind !== "matrix" &&
                  kind !== "date" && (
                    <div className="space-y-2" data-testid="question-options-results">
                      {(q.options || []).map((opt: FormQuestionOption) => {
                        const count = stats?.counts?.[opt.id] || 0;
                        const pct = totalRespondents
                          ? Math.round((count / totalRespondents) * 100)
                          : 0;
                        return (
                          <div key={opt.id} className="flex items-center gap-3">
                            <div className="w-48 text-sm text-gray-700 dark:text-gray-300">
                              {opt.label || "Option"}
                            </div>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded">
                              <div
                                className="h-2 bg-blue-500 rounded"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="w-24 text-right text-sm text-gray-700 dark:text-gray-300">
                              {count} ({pct}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {kind === "matrix" && (
                  <div className="overflow-x-auto" data-testid="matrix-results">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {totalRespondents} réponse
                      {totalRespondents > 1 ? "s" : ""}
                    </div>
                    {!q.matrixRows || !q.matrixColumns ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Configuration de matrice invalide
                      </div>
                    ) : (
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700 text-left"></th>
                            {(q.matrixColumns || []).map((col: FormQuestionOption) => (
                              <th
                                key={col.id}
                                className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700 text-center font-medium dark:text-gray-200"
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(q.matrixRows || []).map((row: FormQuestionOption) => (
                            <tr key={row.id}>
                              <td className="border dark:border-gray-600 p-2 font-medium bg-gray-50 dark:bg-gray-700 dark:text-gray-200">
                                {row.label}
                              </td>
                              {(q.matrixColumns || []).map((col: FormQuestionOption) => {
                                const rowColKey = `${row.id}_${col.id}`;
                                const count = stats?.counts?.[rowColKey] || 0;
                                const pct = totalRespondents
                                  ? Math.round((count / totalRespondents) * 100)
                                  : 0;
                                return (
                                  <td
                                    key={col.id}
                                    className="border dark:border-gray-600 p-2 text-center"
                                  >
                                    <div className="text-gray-700 dark:text-gray-300">
                                      {count} ({pct}%)
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {(kind === "text" || kind === "long-text") && (
                  <div className="space-y-2" data-testid="text-answers">
                    {(() => {
                      const all = textAnswers[qid] || [];
                      const isExpanded = !!expandedText[qid];
                      const list = isExpanded ? all : stats?.samples || [];
                      return list.length ? (
                        <>
                          {list.map((txt: string, i: number) => (
                            <div
                              key={i}
                              className="text-sm text-gray-800 dark:text-gray-200 border dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700"
                            >
                              {txt}
                            </div>
                          ))}
                          {all.length > (stats?.samples?.length || 0) && (
                            <div>
                              <button
                                type="button"
                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                aria-expanded={isExpanded}
                                aria-controls={`text-q-${qid}`}
                                onClick={() =>
                                  setExpandedText((prev) => ({
                                    ...prev,
                                    [qid]: !isExpanded,
                                  }))
                                }
                                data-testid="expand-text-answers-button"
                              >
                                {isExpanded ? "Voir moins" : `Voir tout (${all.length})`}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Aucune réponse textuelle.
                        </div>
                      );
                    })()}
                    <div id={`text-q-${qid}`} className="sr-only" aria-live="polite">
                      {textAnswers[qid]?.length || 0} réponses textuelles.
                    </div>
                  </div>
                )}

                {kind === "rating" && (
                  <div className="space-y-4" data-testid="rating-results">
                    {(() => {
                      const ratingValues = responses
                        .map((r) => r.items.find((item) => item.questionId === qid)?.value)
                        .filter((v): v is number => typeof v === "number");

                      if (ratingValues.length === 0) {
                        return (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Aucune réponse pour le moment
                          </div>
                        );
                      }

                      const scale = q.ratingScale || 5;
                      const avg = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;
                      const distribution = Array.from({ length: scale }, (_, i) => {
                        const value = i + 1;
                        const count = ratingValues.filter((v) => v === value).length;
                        const percent = Math.round((count / ratingValues.length) * 100);
                        return { value, count, percent };
                      });

                      return (
                        <>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {avg.toFixed(1)} / {scale}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Moyenne ({ratingValues.length} réponse
                                {ratingValues.length > 1 ? "s" : ""})
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {distribution.map((d) => (
                              <div key={d.value} className="flex items-center gap-3">
                                <span className="w-8 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {d.value}
                                </span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                                  <div
                                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end px-2 transition-all"
                                    style={{ width: `${d.percent}%` }}
                                  >
                                    {d.percent > 10 && (
                                      <span className="text-xs font-semibold text-white">
                                        {d.percent}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="w-16 text-sm text-gray-600 dark:text-gray-400">
                                  {d.count} vote{d.count > 1 ? "s" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {kind === "nps" && (
                  <div data-testid="nps-results">
                    {(() => {
                      const npsValues = responses
                        .map((r) => r.items.find((item) => item.questionId === qid)?.value)
                        .filter((v): v is number => typeof v === "number");

                      if (npsValues.length === 0) {
                        return (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Aucune réponse pour le moment
                          </div>
                        );
                      }

                      return <NPSResults responses={npsValues} />;
                    })()}
                  </div>
                )}
              </div>
            );
          })}
          {/* Votes par participant */}
          <div
            className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 p-4"
            data-testid="individual-responses"
          >
            <div className="mb-3">
              <div className="font-medium dark:text-gray-100">Votes par participant</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Détail des réponses individuelles
              </div>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {uniqueResponses.map((r) => (
                <div key={getRespondentId(r)} className="py-3" data-testid="respondent-response">
                  <div className="flex items-center justify-between">
                    <div className="font-medium dark:text-gray-200">
                      {r.respondentName && r.respondentName.trim()
                        ? r.respondentName.trim()
                        : "Anonyme"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {r.items.map((it) => {
                      const q = questions.find((qq: FormQuestionShape) => qq.id === it.questionId);
                      if (!q) return null;
                      const kind = q.kind || q.type || "single";
                      let answerDisplay: string = "";
                      if (kind === "text" || kind === "long-text") {
                        answerDisplay = typeof it.value === "string" ? it.value : "";
                      } else if (kind === "date") {
                        // Afficher les votes sur dates
                        const dateValue = it.value as
                          | import("@/lib/pollStorage").DateVoteValue
                          | undefined;
                        if (dateValue && Array.isArray(dateValue)) {
                          const voteStrings = dateValue.map((vote) => {
                            // Parser la date YYYY-MM-DD correctement
                            const [year, month, day] = vote.date.split("-").map(Number);
                            const dateObj = new Date(year, month - 1, day);
                            const dateStr = dateObj.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            });
                            const timeStr =
                              vote.timeSlots.length > 0
                                ? vote.timeSlots
                                    .map(
                                      (slot) =>
                                        `${slot.hour.toString().padStart(2, "0")}:${slot.minute.toString().padStart(2, "0")}`,
                                    )
                                    .join(", ")
                                : "";
                            const voteEmoji =
                              vote.vote === "yes" ? "✓" : vote.vote === "no" ? "✗" : "?";
                            return `${voteEmoji} ${dateStr}${timeStr ? ` (${timeStr})` : ""}`;
                          });
                          answerDisplay = voteStrings.join(" • ");
                        } else {
                          answerDisplay = "—";
                        }
                      } else if (kind === "matrix") {
                        // Pour matrices, afficher un résumé
                        const matrixVal = it.value as Record<string, string | string[]>;
                        if (
                          matrixVal &&
                          typeof matrixVal === "object" &&
                          !Array.isArray(matrixVal) &&
                          q.matrixRows &&
                          q.matrixColumns
                        ) {
                          const rowLabels = (q.matrixRows || [])
                            .map((row: FormQuestionOption) => {
                              const rowAnswer = matrixVal[row?.id];
                              if (!rowAnswer || !row) return null;
                              const colIds = Array.isArray(rowAnswer) ? rowAnswer : [rowAnswer];
                              const colLabels = colIds.map((cid: string) => {
                                const col = (q.matrixColumns || []).find(
                                  (c: FormQuestionOption) => c?.id === cid,
                                );
                                return col ? col.label : cid;
                              });
                              return `${row.label}: ${colLabels.join(", ")}`;
                            })
                            .filter(Boolean);
                          answerDisplay = rowLabels.join(" • ");
                        } else {
                          answerDisplay = "—";
                        }
                      } else if (kind === "single") {
                        const opt = (q?.options || []).find(
                          (o: FormQuestionOption) => o.id === it.value,
                        );
                        answerDisplay = opt ? opt.label : String(it.value || "");
                      } else {
                        const ids = Array.isArray(it.value) ? it.value : [];
                        const labels = ids.map((id: string) => {
                          const o = (q?.options || []).find(
                            (oo: FormQuestionOption) => oo.id === id,
                          );
                          return o ? o.label : id;
                        });
                        answerDisplay = labels.join(", ");
                      }
                      return (
                        <div key={it.questionId} className="text-sm">
                          <div className="text-gray-600 dark:text-gray-400">
                            {q.title || "Question"}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100">
                            {answerDisplay || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ResultsLayout>
  );
}
