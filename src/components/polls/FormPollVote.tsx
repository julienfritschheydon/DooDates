import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { getPollBySlugOrId, Poll, addFormResponse } from "@/lib/pollStorage";

type AnswerValue = string | string[];

interface Props {
  idOrSlug: string;
}

export default function FormPollVote({ idOrSlug }: Props) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voterName, setVoterName] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const p = getPollBySlugOrId(idOrSlug);
    setPoll(p);
    setLoading(false);
  }, [idOrSlug]);

  const questions = useMemo(() => (poll?.questions ?? []) as any[], [poll]);

  const updateAnswer = (qid: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const toggleMulti = (
    qid: string,
    optionId: string,
    checked: boolean,
    maxChoices?: number,
  ) => {
    const prev = (answers[qid] as string[]) || [];
    // Empêcher le dépassement en temps réel si une limite est définie
    if (checked && maxChoices && prev.length >= maxChoices) {
      return;
    }
    let next = prev;
    if (checked) {
      next = Array.from(new Set([...prev, optionId]));
    } else {
      next = prev.filter((v) => v !== optionId);
    }
    updateAnswer(qid, next);
  };

  const validate = (): string | null => {
    if (!poll) return "Sondage introuvable";
    if (!voterName.trim()) return "Votre nom est requis";

    for (const q of questions) {
      const qid: string = q.id;
      const required: boolean = !!q.required;
      const kind: string = q.kind || q.type || "single";
      const val = answers[qid];

      if (required) {
        if (kind === "text") {
          if (typeof val !== "string" || !val.trim()) {
            return `Réponse requise pour: ${q.title || "Question"}`;
          }
        } else if (kind === "single") {
          if (typeof val !== "string" || !val) {
            return `Choix requis pour: ${q.title || "Question"}`;
          }
        } else if (kind === "multiple") {
          const arr = Array.isArray(val) ? (val as string[]) : [];
          if (arr.length === 0) {
            return `Au moins un choix requis pour: ${q.title || "Question"}`;
          }
        }
      }

      if (kind === "multiple" && Array.isArray(val)) {
        const maxChoices: number | undefined = q.maxChoices;
        if (maxChoices && val.length > maxChoices) {
          return `Maximum ${maxChoices} choix pour: ${q.title || "Question"}`;
        }
      }

      if (kind === "text" && typeof val === "string") {
        const maxLength: number | undefined = q.maxLength;
        if (maxLength && val.length > maxLength) {
          return `Texte trop long (${val.length}/${maxLength}) pour: ${q.title || "Question"}`;
        }
      }
    }

    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!poll) return;

    // Map answers object to items array expected by addFormResponse
    const items = Object.keys(answers).map((qid) => ({
      questionId: qid,
      value: answers[qid],
    }));
    try {
      addFormResponse({
        pollId: poll.id,
        respondentName: voterName.trim(),
        items,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!poll || poll.type !== "form") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center text-gray-600">
          Sondage formulaire introuvable.
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-2">
            Merci pour votre participation !
          </h1>
          <p className="text-gray-600">Votre réponse a été enregistrée.</p>
          <div className="mt-6">
            <Link
              to={`/poll/${poll.slug || poll.id}/results`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Voir les résultats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <form
        onSubmit={onSubmit}
        className="max-w-2xl mx-auto p-6 space-y-6"
        aria-describedby="form-live-region"
      >
        {/* Live region for announcing validation errors or status to assistive tech */}
        <div id="form-live-region" className="sr-only" aria-live="polite">
          {error ? String(error) : ""}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600 mt-1">{poll.description}</p>
          )}
        </div>

        <div>
          <label
            className="block text-sm text-gray-700 mb-1"
            htmlFor="voter-name-input"
          >
            Votre nom
          </label>
          <input
            id="voter-name-input"
            type="text"
            className="w-full border rounded px-3 py-2"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Entrez votre nom"
            aria-required="true"
            required
            aria-describedby="voter-name-desc"
          />
          <p id="voter-name-desc" className="sr-only">
            Ce champ est requis pour soumettre vos réponses.
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q: any) => {
            const kind: string = q.kind || q.type || "single";
            const qid: string = q.id;
            const val = answers[qid];
            return (
              <div
                key={qid}
                className="bg-white rounded-md border p-4"
                role="group"
                aria-labelledby={`q-${qid}-label`}
                aria-required={q.required ? true : undefined}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div id={`q-${qid}-label`} className="font-medium">
                      {q.title || "(Sans titre)"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {kind === "text"
                        ? "Réponse libre"
                        : kind === "single"
                          ? "Choix unique"
                          : "Choix multiples"}
                      {q.required ? " • obligatoire" : ""}
                    </div>
                  </div>
                  {kind === "multiple" && q.maxChoices ? (
                    <div className="text-xs text-gray-500">
                      {Array.isArray(val) ? (val as string[]).length : 0}/{q.maxChoices} sélectionné(s)
                    </div>
                  ) : null}
                </div>

                {kind === "text" && (
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    placeholder={q.placeholder || "Votre réponse"}
                    maxLength={q.maxLength || undefined}
                    value={typeof val === "string" ? val : ""}
                    onChange={(e) => updateAnswer(qid, e.target.value)}
                    aria-labelledby={`q-${qid}-label`}
                    aria-required={q.required ? true : undefined}
                  />
                )}

                {kind === "single" && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt: any) => (
                      <label key={opt.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={qid}
                          checked={val === opt.id}
                          onChange={() => updateAnswer(qid, opt.id)}
                          aria-labelledby={`q-${qid}-label`}
                          aria-required={q.required ? true : undefined}
                        />
                        <span>{opt.label || "Option"}</span>
                      </label>
                    ))}
                  </div>
                )}

                {kind === "multiple" && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt: any) => {
                      const checked = Array.isArray(val)
                        ? (val as string[]).includes(opt.id)
                        : false;
                      const selectedCount = Array.isArray(val)
                        ? (val as string[]).length
                        : 0;
                      const disableExtra =
                        !checked && q.maxChoices && selectedCount >= q.maxChoices;
                      return (
                        <label key={opt.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              toggleMulti(
                                qid,
                                opt.id,
                                e.currentTarget.checked,
                                q.maxChoices,
                              )
                            }
                            aria-labelledby={`q-${qid}-label`}
                            aria-required={q.required ? true : undefined}
                            disabled={!!disableExtra}
                            data-testid="multi-option"
                          />
                          <span>{opt.label || "Option"}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="text-sm text-red-600" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            data-testid="form-submit"
          >
            Envoyer mes réponses
          </button>
        </div>
      </form>
    </div>
  );
}
