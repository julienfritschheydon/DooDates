import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPollBySlugOrId,
  addFormResponse,
  getCurrentUserId,
  getFormResponses,
} from "../../lib/pollStorage";
import { sendVoteConfirmationEmail } from "../../services/EmailService";
import { shouldShowQuestion } from "../../lib/conditionalEvaluator";
import type {
  Poll,
  FormQuestionShape,
  FormQuestionOption,
  DateVoteValue,
  FormResponseItem,
} from "../../lib/pollStorage";
import { getPollClosureReason } from "../../lib/pollEnforcement";
import { Clock, Lock, AlertTriangle } from "lucide-react";
import { StructuredInput } from "./StructuredInput";
import type { ValidationType } from "../../lib/validation";
import { RatingInput } from "./RatingInput";
import { NPSInput } from "./NPSInput";
import DateQuestionVote from "./DateQuestionVote";
import { getThemeById, applyTheme, resetTheme } from "../../lib/themes";
import { useThemeColor } from "../../hooks/useThemeColor";
import MultiStepFormVote from "./MultiStepFormVote";
import VoteCompletionScreen from "../voting/VoteCompletionScreen";
import { Button } from "@/components/ui/button";
import "./themed-inputs.css";

type AnswerValue = string | string[] | Record<string, string | string[]> | number | DateVoteValue;

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
  const [voterEmail, setVoterEmail] = useState("");
  const [wantsEmailCopy, setWantsEmailCopy] = useState(false);
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [closureReason, setClosureReason] = useState<
    "expired" | "capped" | "closed" | "archived" | null
  >(null);

  // Vérifier si l'utilisateur a le droit de voir les résultats (toujours appelé)
  const canSeeResults = useMemo(() => {
    if (!poll || !submitted) return false;

    const visibility = poll.resultsVisibility || "creator-only";

    // 1. Public : tout le monde peut voir
    if (visibility === "public") return true;

    // 2. Créateur : vérifier si c'est le créateur
    const currentUserId = getCurrentUserId();
    const isCreator = poll.creator_id === currentUserId;
    if (isCreator) return true;

    // 3. Voters : vérifier si l'utilisateur a voté (après soumission, il a voté)
    if (visibility === "voters") {
      return true; // Après soumission, l'utilisateur a voté
    }

    return false;
  }, [poll, submitted]);

  useEffect(() => {
    const p = getPollBySlugOrId(idOrSlug);
    setPoll(p);

    if (p) {
      // Compter les réponses existantes pour le quota
      const responses = getFormResponses(p.id);
      const reason = getPollClosureReason(p, responses.length);
      setClosureReason(reason);
    }

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
        if (kind === "text" || kind === "long-text") {
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
        } else if (kind === "date") {
          const dateVal = val as DateVoteValue | undefined;
          if (!dateVal || !Array.isArray(dateVal) || dateVal.length === 0) {
            return `Vote requis pour: ${q.title || "Question"}`;
          }
          // Vérifier qu'au moins une date a été votée
          const hasVote = dateVal.some((vote) => vote.vote && vote.date);
          if (!hasVote) {
            return `Au moins une date doit être votée pour: ${q.title || "Question"}`;
          }
        }
      }

      if (kind === "multiple" && Array.isArray(val)) {
        const maxChoices: number | undefined = q.maxChoices;
        if (maxChoices && val.length > maxChoices) {
          return `Maximum ${maxChoices} choix pour: ${q.title || "Question"}`;
        }
      }

      if ((kind === "text" || kind === "long-text") && typeof val === "string") {
        const maxLength: number | undefined = q.maxLength;
        if (maxLength && val.length > maxLength) {
          return `Texte trop long (${val.length}/${maxLength}) pour: ${q.title || "Question"}`;
        }
      }
    }

    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!poll) return;

    // Validation email si demandé
    if (wantsEmailCopy && !voterEmail.trim()) {
      setError("Veuillez entrer votre email pour recevoir une copie");
      return;
    }
    if (
      wantsEmailCopy &&
      voterEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voterEmail.trim())
    ) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    // Map answers object to items array expected by addFormResponse
    const items: FormResponseItem[] = Object.keys(answers).map((qid) => ({
      questionId: qid,
      value: answers[qid],
    }));
    try {
      const response = addFormResponse({
        pollId: poll.id,
        respondentName: voterName.trim(),
        respondentEmail: wantsEmailCopy ? voterEmail.trim() : undefined,
        items,
      });

      // Envoyer l'email si demandé
      if (wantsEmailCopy && voterEmail.trim()) {
        try {
          await sendVoteConfirmationEmail({
            poll,
            response,
            questions: allQuestions,
          });
        } catch (emailError) {
          // Ne pas bloquer la soumission si l'email échoue
          // L'erreur est déjà gérée par le service EmailService
        }
      }

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

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Sondage introuvable</p>
      </div>
    );
  }

  // 🛑 Écran de sondage fermé
  if (closureReason && !submitted) {
    const getClosureInfo = () => {
      switch (closureReason) {
        case "expired":
          return {
            title: "C'est fini !",
            message: "Désolé, la date limite de participation à ce sondage est dépassée.",
            icon: Clock,
            color: "text-amber-500",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-100",
          };
        case "capped":
          return {
            title: "Sondage complet",
            message: "Le nombre maximum de participations pour ce sondage a été atteint.",
            icon: Lock,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-100",
          };
        default:
          return {
            title: "Sondage clôturé",
            message: "Ce sondage n'accepte plus de nouvelles réponses pour le moment.",
            icon: Lock,
            color: "text-gray-500",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-100",
          };
      }
    };

    const info = getClosureInfo();
    const Icon = info.icon;

    return (
      <div className="min-h-screen bg-gray-50 pt-32 px-4">
        <div
          className={`max-w-md mx-auto rounded-3xl shadow-sm border ${info.borderColor} ${info.bgColor} p-10 text-center`}
        >
          <div className="inline-flex items-center justify-center p-5 rounded-full bg-white shadow-sm mb-8">
            <Icon className={`w-12 h-12 ${info.color}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{info.title}</h1>
          <p className="text-gray-600 text-lg mb-10 leading-relaxed">{info.message}</p>
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Router vers le bon composant selon displayMode
  if (poll.displayMode === "multi-step") {
    return <MultiStepFormVote poll={poll} />;
  }

  if (submitted) {
    return (
      <VoteCompletionScreen
        voterName={voterName}
        onBack={() => (window.location.href = "/form")}
        onViewResults={
          canSeeResults
            ? () => (window.location.href = `/poll/${poll.slug || poll.id}/results`)
            : undefined
        }
        title="Merci pour votre participation !"
        subtitle="Votre réponse a été enregistrée."
        color="violet"
      />
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

        {/* Informations sur l'utilisation des données avant envoi */}
        <div className="text-[11px] text-slate-500">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 hover:bg-slate-100 transition-colors text-left"
            onClick={() => setShowDataInfo((prev) => !prev)}
            data-testid="rgpd-formpoll-info-toggle"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-slate-700">
                Vos données pour ce questionnaire
              </span>
              {showDataInfo && (
                <span className="text-[10px] text-slate-500">
                  Nom, email et réponses sont utilisés pour analyser les résultats et permettre au
                  créateur de ce formulaire d'y répondre.
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">
              {showDataInfo ? "Masquer les détails" : "Voir les détails"}
            </span>
          </button>

          {showDataInfo && (
            <div
              className="mt-2 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-600"
              data-testid="rgpd-formpoll-info"
            >
              <p className="mb-1">
                Vos nom, email et réponses à ce formulaire sont stockés pour permettre au créateur
                de consulter et analyser les résultats.
              </p>
              <p className="mb-1">
                Vous pouvez demander la suppression de vos données en contactant le créateur de ce
                formulaire.
              </p>
              <p>
                Pour en savoir plus, consultez la{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-500 underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Politique de confidentialité complète
                </Link>
                .
              </p>
            </div>
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
          {questions.map((q: FormQuestionShape, index: number) => {
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
                      className="font-medium flex items-center gap-2"
                      style={{
                        color: "var(--theme-text-primary, #1E293B)",
                      }}
                    >
                      <span className="text-sm font-bold opacity-60">Q{index + 1}.</span>
                      <span>{q.title || "(Sans titre)"}</span>
                    </div>
                    <div
                      className="text-xs"
                      style={{
                        color: "var(--theme-text-secondary, #475569)",
                      }}
                    >
                      {kind === "text" || kind === "long-text"
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
                                  : kind === "date"
                                    ? "Date"
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
                      <input
                        type="text"
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

                {kind === "long-text" && (
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
                        rows={6}
                        className="w-full rounded px-3 py-2 resize-y"
                        style={{
                          backgroundColor: "var(--theme-bg-input, #F1F5F9)",
                          borderColor: "var(--theme-border, #E2E8F0)",
                          borderWidth: "1px",
                          color: "var(--theme-text-primary, #1E293B)",
                        }}
                        placeholder={q.placeholder || "Votre réponse détaillée..."}
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

                {kind === "date" && (
                  <DateQuestionVote
                    question={q}
                    value={Array.isArray(val) ? (val as DateVoteValue) : undefined}
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

        <div className="border-t pt-4" style={{ borderColor: "var(--theme-border, #E2E8F0)" }}>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsEmailCopy}
              onChange={(e) => setWantsEmailCopy(e.target.checked)}
              className="cursor-pointer"
              data-themed="true"
            />
            <span
              className="text-sm"
              style={{
                color: "var(--theme-text-primary, #1E293B)",
              }}
            >
              Recevoir une copie de mes réponses par email
            </span>
          </label>

          {wantsEmailCopy && (
            <div>
              <label
                className="block text-sm mb-1"
                htmlFor="voter-email"
                style={{
                  color: "var(--theme-text-secondary, #475569)",
                }}
              >
                Votre email
              </label>
              <input
                id="voter-email"
                type="email"
                className="w-full rounded px-3 py-2"
                style={{
                  backgroundColor: "var(--theme-bg-input, #F1F5F9)",
                  borderColor: "var(--theme-border, #E2E8F0)",
                  borderWidth: "1px",
                  color: "var(--theme-text-primary, #1E293B)",
                }}
                value={voterEmail}
                onChange={(e) => setVoterEmail(e.target.value)}
                placeholder="votremail@example.com"
                required={wantsEmailCopy}
                aria-required={wantsEmailCopy}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="text-white px-4 py-2 rounded transition-colors"
            style={{
              backgroundColor: "var(--theme-primary, #3B82F6)",
              borderColor: "var(--theme-primary, #3B82F6)",
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
          </Button>
        </div>
      </form>
    </div>
  );
}
