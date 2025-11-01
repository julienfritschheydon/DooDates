import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPollBySlugOrId, addFormResponse } from "../../lib/pollStorage";
import { shouldShowQuestion } from "../../lib/conditionalEvaluator";
import type { Poll, FormQuestionShape, FormQuestionOption } from "../../lib/pollStorage";
import { StructuredInput } from "./StructuredInput";
import type { ValidationType } from "../../lib/validation";
import { RatingInput } from "./RatingInput";
import { NPSInput } from "./NPSInput";
import { getThemeById, applyTheme, resetTheme } from "../../lib/themes";
import { useThemeColor } from "../../hooks/useThemeColor";
import "./themed-inputs.css";

type AnswerValue = string | string[] | Record<string, string | string[]> | number;

interface Props {
  idOrSlug: string;
}

export default function FormPollVote({ idOrSlug }: Props) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voterName, setVoterName] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({}); // Pour stocker les textes "Autre"
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const p = getPollBySlugOrId(idOrSlug);
    setPoll(p);
    setLoading(false);
  }, [idOrSlug]);

  // Appliquer le thème visuel
  useEffect(() => {
    if (poll?.themeId) {
      const theme = getThemeById(poll.themeId);
      applyTheme(theme);
    }

    // Cleanup : réinitialiser le thème au démontage
    return () => {
      resetTheme();
    };
  }, [poll?.themeId]);

  // Lire la couleur primaire du thème pour les checkboxes/radios
  const primaryColor = useThemeColor("--theme-primary", "#3B82F6");

  // Appliquer la couleur via CSS variable pour les inputs custom
  useEffect(() => {
    document.documentElement.style.setProperty("--input-accent-color", primaryColor);
  }, [primaryColor]);

  const allQuestions = useMemo(() => (poll?.questions ?? []) as FormQuestionShape[], [poll]);

  // Convertir les réponses pour l'évaluation conditionnelle (convertir IDs en labels)
  const simplifiedAnswers = useMemo(() => {
    const simplified: Record<string, string | string[]> = {};
    for (const [qid, val] of Object.entries(answers)) {
      const question = allQuestions.find((q) => q.id === qid);

      if (typeof val === "number") {
        // Pour rating/nps, convertir en string pour l'évaluation conditionnelle
        simplified[qid] = val.toString();
      } else if (typeof val === "object" && !Array.isArray(val)) {
        // Pour les matrices, on considère qu'une réponse existe si au moins une ligne est remplie
        const hasAnswer = Object.values(val).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
        simplified[qid] = hasAnswer ? "answered" : "";
      } else if (Array.isArray(val)) {
        // Pour choix multiples, convertir les IDs en labels
        simplified[qid] = val.map((optId) => {
          const option = question?.options?.find((o) => o.id === optId);
          return option?.label || optId;
        });
      } else if (typeof val === "string") {
        // Pour choix unique, convertir l'ID en label
        const option = question?.options?.find((o) => o.id === val);
        simplified[qid] = option?.label || val;
      } else {
        simplified[qid] = "";
      }
    }
    return simplified;
  }, [answers, allQuestions]);

  // Filtrer les questions visibles selon les règles conditionnelles
  const questions = useMemo(() => {
    const rules = poll?.conditionalRules ?? [];
    return allQuestions.filter((q) => shouldShowQuestion(q.id, rules, simplifiedAnswers));
  }, [allQuestions, poll?.conditionalRules, simplifiedAnswers]);

  const updateAnswer = (qid: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const toggleMulti = (qid: string, optionId: string, checked: boolean, maxChoices?: number) => {
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
        } else if (kind === "matrix") {
          const matrixVal = val as Record<string, string | string[]> | undefined;
          if (!matrixVal || Object.keys(matrixVal).length === 0) {
            return `Réponse requise pour: ${q.title || "Question"}`;
          }
          // Vérifier que toutes les lignes ont une réponse
          const allRowsAnswered = (q.matrixRows || []).every((row) => {
            const rowAnswer = matrixVal[row.id];
            if (Array.isArray(rowAnswer)) {
              return rowAnswer.length > 0;
            }
            return !!rowAnswer;
          });
          if (!allRowsAnswered) {
            return `Toutes les lignes doivent être remplies pour: ${q.title || "Question"}`;
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setError(errorMessage);
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
        <div className="text-center text-gray-600">Sondage formulaire introuvable.</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-6 pt-20">
          <h1 className="text-2xl font-bold mb-2">Merci pour votre participation !</h1>
          <p className="text-gray-600">Votre réponse a été enregistrée.</p>
          <div className="mt-6">
            <Link
              to={`/poll/${poll.slug || poll.id}/results`}
              className="inline-block text-white px-4 py-2 rounded transition-colors"
              style={{
                backgroundColor: "var(--theme-primary, #3B82F6)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-primary-hover, #2563EB)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-primary, #3B82F6)";
              }}
            >
              Voir les résultats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--theme-bg-main, #F8FAFC)",
      }}
    >
      <form
        onSubmit={onSubmit}
        className="max-w-2xl mx-auto p-6 pt-20 space-y-6"
        aria-describedby="form-live-region"
      >
        {/* Live region for announcing validation errors or status to assistive tech */}
        <div id="form-live-region" className="sr-only" aria-live="polite">
          {error ? String(error) : ""}
        </div>
        <div>
          <h1
            className="text-3xl font-bold"
            style={{
              color: "var(--theme-text-primary, #1E293B)",
            }}
          >
            {poll.title}
          </h1>
          {poll.description && (
            <p
              className="mt-1"
              style={{
                color: "var(--theme-text-secondary, #475569)",
              }}
            >
              {poll.description}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm mb-1"
            htmlFor="voter-name-input"
            style={{
              color: "var(--theme-text-secondary, #475569)",
            }}
          >
            Votre nom
          </label>
          <input
            id="voter-name-input"
            type="text"
            className="w-full rounded px-3 py-2"
            style={{
              backgroundColor: "var(--theme-bg-input, #F1F5F9)",
              borderColor: "var(--theme-border, #E2E8F0)",
              borderWidth: "1px",
              color: "var(--theme-text-primary, #1E293B)",
            }}
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
          {questions.map((q: FormQuestionShape) => {
            const kind: string = q.kind || q.type || "single";
            const qid: string = q.id;
            const val = answers[qid];
            return (
              <div
                key={qid}
                className="rounded-md p-4"
                style={{
                  backgroundColor: "var(--theme-bg-card, #FFFFFF)",
                  borderColor: "var(--theme-border, #E2E8F0)",
                  borderWidth: "1px",
                }}
                role="group"
                aria-labelledby={`q-${qid}-label`}
                aria-required={q.required ? true : undefined}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div
                      id={`q-${qid}-label`}
                      className="font-medium"
                      style={{
                        color: "var(--theme-text-primary, #1E293B)",
                      }}
                    >
                      {q.title || "(Sans titre)"}
                    </div>
                    <div
                      className="text-xs"
                      style={{
                        color: "var(--theme-text-secondary, #475569)",
                      }}
                    >
                      {kind === "text"
                        ? "Réponse libre"
                        : kind === "single"
                          ? "Choix unique"
                          : kind === "multiple"
                            ? "Choix multiples"
                            : kind === "matrix"
                              ? "Matrice"
                              : kind === "rating"
                                ? "Échelle de notation"
                                : kind === "nps"
                                  ? "Net Promoter Score"
                                  : "Question"}
                      {q.required ? " • obligatoire" : ""}
                    </div>
                  </div>
                  {kind === "multiple" && q.maxChoices ? (
                    <div
                      className="text-xs"
                      style={{
                        color: "var(--theme-text-secondary, #475569)",
                      }}
                    >
                      {Array.isArray(val) ? (val as string[]).length : 0}/{q.maxChoices}{" "}
                      sélectionné(s)
                    </div>
                  ) : null}
                </div>

                {kind === "text" && (
                  <>
                    {q.validationType ? (
                      <StructuredInput
                        value={typeof val === "string" ? val : ""}
                        onChange={(newVal) => updateAnswer(qid, newVal)}
                        validationType={q.validationType as ValidationType}
                        required={q.required}
                        placeholder={q.placeholder}
                      />
                    ) : (
                      <textarea
                        className="w-full rounded px-3 py-2"
                        style={{
                          backgroundColor: "var(--theme-bg-input, #F1F5F9)",
                          borderColor: "var(--theme-border, #E2E8F0)",
                          borderWidth: "1px",
                          color: "var(--theme-text-primary, #1E293B)",
                        }}
                        placeholder={q.placeholder || "Votre réponse"}
                        maxLength={q.maxLength || undefined}
                        value={typeof val === "string" ? val : ""}
                        onChange={(e) => updateAnswer(qid, e.target.value)}
                        aria-labelledby={`q-${qid}-label`}
                        aria-required={q.required ? true : undefined}
                      />
                    )}
                  </>
                )}

                {kind === "single" && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt: FormQuestionOption) => (
                      <div key={opt.id} className="space-y-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={qid}
                            checked={val === opt.id}
                            onChange={() => updateAnswer(qid, opt.id)}
                            aria-labelledby={`q-${qid}-label`}
                            aria-required={q.required ? true : undefined}
                            data-themed="true"
                          />
                          <span
                            style={{
                              color: "var(--theme-text-primary, #1E293B)",
                            }}
                          >
                            {opt.label || "Option"}
                          </span>
                          {opt.isOther && (
                            <span
                              className="text-xs"
                              style={{
                                color: "var(--theme-primary, #3B82F6)",
                              }}
                            >
                              + Texte libre
                            </span>
                          )}
                        </label>
                        {opt.isOther && val === opt.id && (
                          <input
                            type="text"
                            className="w-full ml-6 rounded px-3 py-2 text-sm"
                            style={{
                              backgroundColor: "var(--theme-bg-input, #F1F5F9)",
                              borderColor: "var(--theme-border, #E2E8F0)",
                              borderWidth: "1px",
                              color: "var(--theme-text-primary, #1E293B)",
                            }}
                            placeholder="Précisez votre réponse..."
                            value={otherTexts[qid] || ""}
                            onChange={(e) =>
                              setOtherTexts((prev) => ({
                                ...prev,
                                [qid]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {kind === "multiple" && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt: FormQuestionOption) => {
                      const checked = Array.isArray(val)
                        ? (val as string[]).includes(opt.id)
                        : false;
                      const selectedCount = Array.isArray(val) ? (val as string[]).length : 0;
                      const disableExtra =
                        !checked && q.maxChoices && selectedCount >= q.maxChoices;
                      return (
                        <div key={opt.id} className="space-y-1">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                toggleMulti(qid, opt.id, e.currentTarget.checked, q.maxChoices)
                              }
                              aria-labelledby={`q-${qid}-label`}
                              aria-required={q.required ? true : undefined}
                              disabled={!!disableExtra}
                              data-testid="multi-option"
                              data-themed="true"
                            />
                            <span
                              style={{
                                color: "var(--theme-text-primary, #1E293B)",
                              }}
                            >
                              {opt.label || "Option"}
                            </span>
                            {opt.isOther && (
                              <span
                                className="text-xs"
                                style={{
                                  color: "var(--theme-primary, #3B82F6)",
                                }}
                              >
                                + Texte libre
                              </span>
                            )}
                          </label>
                          {opt.isOther && checked && (
                            <input
                              type="text"
                              className="w-full ml-6 rounded px-3 py-2 text-sm"
                              style={{
                                backgroundColor: "var(--theme-bg-input, #F1F5F9)",
                                borderColor: "var(--theme-border, #E2E8F0)",
                                borderWidth: "1px",
                                color: "var(--theme-text-primary, #1E293B)",
                              }}
                              placeholder="Précisez votre réponse..."
                              value={otherTexts[`${qid}_${opt.id}`] || ""}
                              onChange={(e) =>
                                setOtherTexts((prev) => ({
                                  ...prev,
                                  [`${qid}_${opt.id}`]: e.target.value,
                                }))
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {kind === "matrix" && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th
                            className="p-2 text-left text-sm"
                            style={{
                              backgroundColor: "var(--theme-bg-input, #F1F5F9)",
                              borderColor: "var(--theme-border, #E2E8F0)",
                              borderWidth: "1px",
                            }}
                          >
                            {/* Empty corner cell */}
                          </th>
                          {(q.matrixColumns || []).map((col: FormQuestionOption) => (
                            <th
                              key={col.id}
                              className="p-2 text-center text-sm font-medium"
                              style={{
                                backgroundColor: "var(--theme-bg-input, #F1F5F9)",
                                borderColor: "var(--theme-border, #E2E8F0)",
                                borderWidth: "1px",
                                color: "var(--theme-text-primary, #1E293B)",
                              }}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(q.matrixRows || []).map((row: FormQuestionOption) => {
                          const rowValue = (val as Record<string, string | string[]>)?.[row.id];
                          return (
                            <tr key={row.id}>
                              <td
                                className="p-2 text-sm font-medium"
                                style={{
                                  borderColor: "var(--theme-border, #E2E8F0)",
                                  borderWidth: "1px",
                                  color: "var(--theme-text-primary, #1E293B)",
                                }}
                              >
                                {row.label}
                              </td>
                              {(q.matrixColumns || []).map((col: FormQuestionOption) => {
                                const isChecked =
                                  q.matrixType === "multiple"
                                    ? Array.isArray(rowValue) && rowValue.includes(col.id)
                                    : rowValue === col.id;
                                return (
                                  <td
                                    key={col.id}
                                    className="p-2 text-center"
                                    style={{
                                      borderColor: "var(--theme-border, #E2E8F0)",
                                      borderWidth: "1px",
                                    }}
                                  >
                                    <input
                                      type={q.matrixType === "multiple" ? "checkbox" : "radio"}
                                      name={`${qid}-${row.id}`}
                                      checked={isChecked}
                                      data-themed="true"
                                      onChange={(e) => {
                                        const currentVal =
                                          (answers[qid] as Record<string, string | string[]>) || {};
                                        if (q.matrixType === "multiple") {
                                          const currentRowVal =
                                            (currentVal[row.id] as string[]) || [];
                                          const newRowVal = e.target.checked
                                            ? [...currentRowVal, col.id]
                                            : currentRowVal.filter((id) => id !== col.id);
                                          updateAnswer(qid, {
                                            ...currentVal,
                                            [row.id]: newRowVal,
                                          });
                                        } else {
                                          updateAnswer(qid, {
                                            ...currentVal,
                                            [row.id]: col.id,
                                          });
                                        }
                                      }}
                                      aria-labelledby={`q-${qid}-label`}
                                      aria-required={q.required ? true : undefined}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {kind === "rating" && (
                  <RatingInput
                    value={typeof val === "number" ? val : null}
                    onChange={(newVal) => updateAnswer(qid, newVal)}
                    scale={q.ratingScale ?? 5}
                    style={q.ratingStyle ?? "numbers"}
                    minLabel={q.ratingMinLabel}
                    maxLabel={q.ratingMaxLabel}
                    required={q.required}
                  />
                )}

                {kind === "nps" && (
                  <NPSInput
                    value={typeof val === "number" ? val : null}
                    onChange={(newVal) => updateAnswer(qid, newVal)}
                    required={q.required}
                  />
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
            className="text-white px-4 py-2 rounded transition-colors"
            style={{
              backgroundColor: "var(--theme-primary, #3B82F6)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-primary-hover, #2563EB)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-primary, #3B82F6)";
            }}
            data-testid="form-submit"
          >
            Envoyer mes réponses
          </button>
        </div>
      </form>
    </div>
  );
}
