import React, { useState, useMemo, useEffect } from "react";
import TopNav from "@/components/TopNav";
import PollActions from "@/components/polls/PollActions";
import ResultsLayout from "@/components/polls/ResultsLayout";
import { ResultsEmpty, ResultsLoading } from "@/components/polls/ResultsStates";
import {
  getPollBySlugOrId,
  getFormResults,
  getFormResponses,
  getRespondentId,
} from "@/lib/pollStorage";
import type {
  Poll,
  FormQuestionShape,
  FormQuestionOption,
  FormResponse,
} from "@/lib/pollStorage";

interface Props {
  idOrSlug: string;
}

export default function FormPollResults({ idOrSlug }: Props) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [countsByQuestion, setCountsByQuestion] = useState<
    Record<string, Record<string, number>>
  >({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string[]>>({});
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const p = getPollBySlugOrId(idOrSlug);
    setPoll(p);
    if (p && p.type === "form") {
      const res = getFormResults(p.id);
      setCountsByQuestion(res.countsByQuestion);
      setTextAnswers(res.textAnswers);
      setTotal(res.totalResponses);
      setResponses(getFormResponses(p.id));
    }
    setLoading(false);
  }, [idOrSlug]);

  const questions = useMemo(
    () => (poll?.questions ?? []) as FormQuestionShape[],
    [poll],
  );

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
      if (kind === "text") {
        const samples = (textAnswers[qid] || []).slice(0, 10);
        map[qid] = { kind, count: (textAnswers[qid] || []).length, samples };
      } else {
        map[qid] = { kind, counts: countsByQuestion[qid] || {} };
      }
    }
    return map;
  }, [questions, countsByQuestion, textAnswers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopNav />
        <ResultsLoading label="Chargement des résultats..." />
      </div>
    );
  }

  if (!poll || poll.type !== "form") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopNav />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ResultsEmpty message={<>Sondage formulaire introuvable.</>} />
        </div>
      </div>
    );
  }

  const totalRespondents = uniqueResponses.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNav />
      <ResultsLayout
        title={`Résultats : ${poll.title}`}
        subtitle={
          <>
            {totalRespondents} participant{totalRespondents > 1 ? "s" : ""} •{" "}
            {questions.length} question{questions.length > 1 ? "s" : ""}
          </>
        }
        actions={<PollActions poll={poll} showVoteButton />}
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
            {questions.map((q: FormQuestionShape) => {
              const qid: string = q.id;
              const kind: string = q.kind || q.type || "single";
              const stats = computed[qid];
              return (
                <div key={qid} className="bg-white rounded-md border p-4">
                  <div className="mb-3">
                    <div className="font-medium">
                      {q.title || "(Sans titre)"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {kind === "text"
                        ? "Réponses libres"
                        : kind === "single"
                          ? "Choix unique"
                          : "Choix multiples"}
                    </div>
                  </div>

                  {kind !== "text" && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt: FormQuestionOption) => {
                        const count = stats?.counts?.[opt.id] || 0;
                        const pct = totalRespondents
                          ? Math.round((count / totalRespondents) * 100)
                          : 0;
                        return (
                          <div key={opt.id} className="flex items-center gap-3">
                            <div className="w-48 text-sm text-gray-700">
                              {opt.label || "Option"}
                            </div>
                            <div className="flex-1 h-2 bg-gray-100 rounded">
                              <div
                                className="h-2 bg-blue-500 rounded"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="w-24 text-right text-sm text-gray-700">
                              {count} ({pct}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {kind === "text" && (
                    <div className="space-y-2">
                      {(() => {
                        const all = textAnswers[qid] || [];
                        const isExpanded = !!expandedText[qid];
                        const list = isExpanded ? all : stats?.samples || [];
                        return list.length ? (
                          <>
                            {list.map((txt: string, i: number) => (
                              <div
                                key={i}
                                className="text-sm text-gray-800 border rounded px-3 py-2 bg-gray-50"
                              >
                                {txt}
                              </div>
                            ))}
                            {all.length > (stats?.samples?.length || 0) && (
                              <div>
                                <button
                                  type="button"
                                  className="mt-2 text-sm text-blue-600 hover:underline"
                                  aria-expanded={isExpanded}
                                  aria-controls={`text-q-${qid}`}
                                  onClick={() =>
                                    setExpandedText((prev) => ({
                                      ...prev,
                                      [qid]: !isExpanded,
                                    }))
                                  }
                                >
                                  {isExpanded
                                    ? "Voir moins"
                                    : `Voir tout (${all.length})`}
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Aucune réponse textuelle.
                          </div>
                        );
                      })()}
                      <div
                        id={`text-q-${qid}`}
                        className="sr-only"
                        aria-live="polite"
                      >
                        {textAnswers[qid]?.length || 0} réponses textuelles.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Votes par participant */}
            <div className="bg-white rounded-md border p-4">
              <div className="mb-3">
                <div className="font-medium">Votes par participant</div>
                <div className="text-xs text-gray-500">
                  Détail des réponses individuelles
                </div>
              </div>
              <div className="divide-y">
                {uniqueResponses.map((r) => (
                  <div key={getRespondentId(r)} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {r.respondentName && r.respondentName.trim()
                          ? r.respondentName.trim()
                          : "Anonyme"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {r.items.map((it) => {
                        const q = questions.find(
                          (qq: FormQuestionShape) => qq.id === it.questionId,
                        );
                        if (!q) return null;
                        const kind = q.kind || q.type || "single";
                        let answerDisplay: string = "";
                        if (kind === "text") {
                          answerDisplay =
                            typeof it.value === "string" ? it.value : "";
                        } else if (kind === "single") {
                          const opt = (q?.options || []).find(
                            (o: FormQuestionOption) => o.id === it.value,
                          );
                          answerDisplay = opt
                            ? opt.label
                            : String(it.value || "");
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
                            <div className="text-gray-600">
                              {q.title || "Question"}
                            </div>
                            <div className="text-gray-900">
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
    </div>
  );
}
