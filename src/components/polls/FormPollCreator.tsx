import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Undo2, Save, Check, X, List, ArrowRight, Lightbulb } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import FormEditor from "./FormEditor";
import type { Question as EditorQuestion } from "./QuestionCard";
import {
  getAllPolls,
  savePolls,
  type Poll,
  getCurrentUserId,
  type FormQuestionShape,
} from "../../lib/pollStorage";
import { useAuth } from "../../contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { ConditionalRule } from "../../types/conditionalRules";
import { validateConditionalRules } from "../../lib/conditionalValidator";
import {
  linkPollToConversationBidirectional,
  createConversationForPoll,
} from "../../lib/ConversationPollLink";
import { useUIState } from "../prototype/UIStateProvider";
import { ThemeSelector } from "./ThemeSelector";
import { DEFAULT_THEME } from "../../lib/themes";
import { FormSimulationIntegration } from "../simulation/FormSimulationIntegration";
import { useFormPollCreation } from "../../hooks/useFormPollCreation";

// Types locaux au spike (pas encore partagés avec un modèle global)
export type FormQuestionType =
  | "single"
  | "multiple"
  | "text"
  | "long-text"
  | "matrix"
  | "rating"
  | "nps";

export interface FormOption {
  id: string;
  label: string;
  isOther?: boolean; // Option "Autre" avec champ texte libre
}

export interface FormQuestionBase {
  id: string;
  title: string;
  required: boolean;
  type: FormQuestionType;
}

export interface SingleOrMultipleQuestion extends FormQuestionBase {
  type: "single" | "multiple";
  options: FormOption[];
  maxChoices?: number; // applicable uniquement si multiple
}

export interface TextQuestion extends FormQuestionBase {
  type: "text";
  placeholder?: string;
  maxLength?: number;
  validationType?: "email" | "phone" | "url" | "number" | "date";
}

export interface LongTextQuestion extends FormQuestionBase {
  type: "long-text";
  placeholder?: string;
  maxLength?: number;
  validationType?: "email" | "phone" | "url" | "number" | "date";
}

export interface MatrixQuestion extends FormQuestionBase {
  type: "matrix";
  matrixRows: FormOption[]; // Lignes
  matrixColumns: FormOption[]; // Colonnes
  matrixType: "single" | "multiple"; // Type de réponse
  matrixColumnsNumeric?: boolean; // Colonnes numériques
}

export interface RatingQuestion extends FormQuestionBase {
  type: "rating";
  ratingScale?: number; // 5 ou 10
  ratingStyle?: "numbers" | "stars" | "emojis";
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
}

export interface NPSQuestion extends FormQuestionBase {
  type: "nps";
}

export type AnyFormQuestion =
  | SingleOrMultipleQuestion
  | TextQuestion
  | LongTextQuestion
  | MatrixQuestion
  | RatingQuestion
  | NPSQuestion;

export interface FormPollDraft {
  id: string; // draft id (temporaire pour le spike)
  type: "form";
  title: string;
  questions: AnyFormQuestion[];
  conditionalRules?: ConditionalRule[]; // Règles pour questions conditionnelles
  themeId?: string; // Thème visuel (Quick Win #3)
  displayMode?: "all-at-once" | "multi-step"; // Mode d'affichage du formulaire
  resultsVisibility?: "creator-only" | "voters" | "public"; // Visibilité des résultats
}

interface FormPollCreatorProps {
  initialDraft?: FormPollDraft;
  onCancel?: () => void;
  onSave?: (draft: FormPollDraft) => void; // pour le spike: retour du draft, stockage géré ailleurs
  onFinalize?: (draft: FormPollDraft, savedPoll?: Poll) => void; // finaliser le brouillon
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultOptions = (): FormOption[] => [
  { id: uid(), label: "Option 1" },
  { id: uid(), label: "Option 2" },
];

export default function FormPollCreator({
  initialDraft,
  onCancel,
  onSave,
  onFinalize,
}: FormPollCreatorProps) {
  const { user } = useAuth();
  const { createFormPoll } = useFormPollCreation();
  const { modifiedQuestionId, modifiedField } = useUIState();

  const [title, setTitle] = useState(initialDraft?.title || "");
  const [questions, setQuestions] = useState<AnyFormQuestion[]>(initialDraft?.questions || []);
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>(
    initialDraft?.conditionalRules || [],
  );
  const [themeId, setThemeId] = useState<string>(initialDraft?.themeId || DEFAULT_THEME.id);
  const [draftId] = useState<string>(initialDraft?.id || "draft-" + uid());
  const autosaveTimer = useRef<number | null>(null);
  const isFinalizingRef = useRef(false);

  // Suggestion IA intelligente pour displayMode
  const suggestedDisplayMode = useMemo(() => {
    // Si >5 questions → multi-step recommandé
    if (questions.length > 5) return "multi-step";
    // Si beaucoup de questions texte longues → multi-step
    const longTextQuestions = questions.filter(
      (q) => (q.type === "text" && (q as TextQuestion).maxLength > 100) || q.type === "long-text",
    );
    if (longTextQuestions.length > 2) return "multi-step";
    // Sinon → classique
    return "all-at-once";
  }, [questions]);

  const [displayMode, setDisplayMode] = useState<"all-at-once" | "multi-step">(
    initialDraft?.displayMode || suggestedDisplayMode,
  );
  const [resultsVisibility, setResultsVisibility] = useState<"creator-only" | "voters" | "public">(
    initialDraft?.resultsVisibility || "creator-only",
  );

  // Si le brouillon change (montée en props), synchroniser l'état
  useEffect(() => {
    if (initialDraft) {
      setTitle(initialDraft.title || "");
      setQuestions(initialDraft.questions || []);
      setConditionalRules(initialDraft.conditionalRules || []);
      setDisplayMode(initialDraft.displayMode || suggestedDisplayMode);
      setResultsVisibility(initialDraft.resultsVisibility || "creator-only");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft?.id]); // Intentionnel : on veut seulement initialiser au montage, pas tracker initialDraft entier

  const currentDraft: FormPollDraft = useMemo(
    () => ({
      id: draftId,
      type: "form",
      title,
      questions,
      conditionalRules,
      themeId,
      displayMode,
      resultsVisibility,
    }),
    [draftId, title, questions, conditionalRules, themeId, displayMode, resultsVisibility],
  );

  const canSave = useMemo(() => validateDraft(currentDraft).ok, [currentDraft]);

  // --- Mapping helpers between local AnyFormQuestion and EditorQuestion ---
  const toEditorQuestions = (qs: AnyFormQuestion[]): EditorQuestion[] =>
    qs.map((q) => ({
      id: q.id,
      title: q.title,
      kind: q.type as EditorQuestion["kind"],
      required: q.required,
      options: (q as SingleOrMultipleQuestion).options,
      maxChoices: (q as SingleOrMultipleQuestion).maxChoices,
      matrixRows: (q as MatrixQuestion).matrixRows,
      matrixColumns: (q as MatrixQuestion).matrixColumns,
      matrixType: (q as MatrixQuestion).matrixType,
      matrixColumnsNumeric: (q as MatrixQuestion).matrixColumnsNumeric,
      ratingScale: (q as FormQuestionShape).ratingScale,
      ratingStyle: (q as FormQuestionShape).ratingStyle,
      ratingMinLabel: (q as FormQuestionShape).ratingMinLabel,
      ratingMaxLabel: (q as FormQuestionShape).ratingMaxLabel,
      validationType: (q as FormQuestionShape).validationType,
      placeholder: (q as FormQuestionShape).placeholder,
    }));

  const fromEditorQuestions = (qs: EditorQuestion[]): AnyFormQuestion[] =>
    qs.map((q) => {
      if (q.kind === "text") {
        const base: TextQuestion = {
          id: q.id,
          type: "text",
          title: q.title,
          required: !!q.required,
          placeholder: q.placeholder || "",
          maxLength: 300,
          validationType: q.validationType,
        };
        return base;
      }
      if (q.kind === "long-text") {
        const base: LongTextQuestion = {
          id: q.id,
          type: "long-text",
          title: q.title,
          required: !!q.required,
          placeholder: q.placeholder || "",
          maxLength: 2000,
          validationType: q.validationType,
        };
        return base;
      }
      if (q.kind === "matrix") {
        const base: MatrixQuestion = {
          id: q.id,
          type: "matrix",
          title: q.title,
          required: !!q.required,
          matrixRows: q.matrixRows ?? [],
          matrixColumns: q.matrixColumns ?? [],
          matrixType: q.matrixType ?? "single",
          matrixColumnsNumeric: q.matrixColumnsNumeric,
        };
        return base;
      }
      if (q.kind === "rating") {
        const base: RatingQuestion = {
          id: q.id,
          type: "rating",
          title: q.title,
          required: !!q.required,
          ratingScale: q.ratingScale ?? 5,
          ratingStyle: q.ratingStyle ?? "numbers",
          ratingMinLabel: q.ratingMinLabel,
          ratingMaxLabel: q.ratingMaxLabel,
        };
        return base;
      }
      if (q.kind === "nps") {
        const base: NPSQuestion = {
          id: q.id,
          type: "nps",
          title: q.title,
          required: !!q.required,
        };
        return base;
      }
      const base: SingleOrMultipleQuestion = {
        id: q.id,
        type: q.kind === "multiple" ? "multiple" : "single",
        title: q.title,
        required: !!q.required,
        options: q.options ?? [],
        maxChoices: q.kind === "multiple" ? (q.maxChoices ?? 1) : undefined,
      };
      return base;
    });

  // --- Persistence helpers (unified local storage) ---
  function slugify(s: string): string {
    return (
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 60) || `form-${uid()}`
    );
  }

  function upsertFormPoll(draft: FormPollDraft, status: Poll["status"] = "draft") {
    const all = getAllPolls();
    const now = new Date().toISOString();
    const existingIdx = all.findIndex((p) => p.id === draft.id);

    // Debug: Vérifier si on trouve le poll existant
    logger.debug("upsertFormPoll", "poll", {
      draftId: draft.id,
      existingIdx,
      existingSlug: existingIdx >= 0 ? all[existingIdx].slug : "none",
      allPollIds: all.map((p) => p.id),
    });

    const base: Poll = {
      id: draft.id,
      title: draft.title.trim(),
      slug: existingIdx >= 0 ? all[existingIdx].slug : `${slugify(draft.title)}-${uid()}`,
      created_at: existingIdx >= 0 ? all[existingIdx].created_at : now,
      status,
      updated_at: now,
      type: "form",
      creator_id: getCurrentUserId(user?.id),
      dates: [],
      questions: draft.questions.map((q) => {
        const base: FormQuestionShape = { ...q, kind: q.type };
        // Assurer que tous les champs spécifiques sont présents
        if (q.type === "matrix") {
          const mq = q as MatrixQuestion;
          base.matrixRows = mq.matrixRows;
          base.matrixColumns = mq.matrixColumns;
          base.matrixType = mq.matrixType;
          base.matrixColumnsNumeric = mq.matrixColumnsNumeric;
        }
        return base;
      }),
      conditionalRules: draft.conditionalRules, // Persister les règles conditionnelles
      themeId: draft.themeId, // Persister le thème visuel
      displayMode: draft.displayMode, // Persister le mode d'affichage
      resultsVisibility: draft.resultsVisibility, // Persister la visibilité des résultats
    };
    if (existingIdx >= 0) {
      all[existingIdx] = base;
    } else {
      all.push(base);
    }
    savePolls(all);
    return base;
  }

  // Autosave on title/questions changes (debounced)
  useEffect(() => {
    if (!currentDraft.title.trim()) return; // avoid saving empty title drafts
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      try {
        upsertFormPoll(currentDraft, "draft");
      } catch (e) {
        logger.warn("Autosave form poll failed", "poll", e);
      }
    }, 800);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraft.title, currentDraft.questions, displayMode]); // Intentionnel : on veut sauvegarder seulement si title/questions/displayMode changent

  const addQuestion = (type: FormQuestionType) => {
    if (type === "text") {
      const q: TextQuestion = {
        id: uid(),
        type: "text",
        title: "Nouvelle question",
        required: false,
        placeholder: "",
        maxLength: 300,
      };
      setQuestions((prev) => [...prev, q]);
      return;
    }
    if (type === "long-text") {
      const q: LongTextQuestion = {
        id: uid(),
        type: "long-text",
        title: "Nouvelle question",
        required: false,
        placeholder: "",
        maxLength: 2000,
      };
      setQuestions((prev) => [...prev, q]);
      return;
    }
    if (type === "matrix") {
      const q: MatrixQuestion = {
        id: uid(),
        type: "matrix",
        title: "Nouvelle question matrice",
        required: false,
        matrixRows: [
          { id: uid(), label: "Ligne 1" },
          { id: uid(), label: "Ligne 2" },
        ],
        matrixColumns: [
          { id: uid(), label: "Colonne 1" },
          { id: uid(), label: "Colonne 2" },
        ],
        matrixType: "single",
      };
      setQuestions((prev) => [...prev, q]);
      return;
    }
    const q: SingleOrMultipleQuestion = {
      id: uid(),
      type: type === "multiple" ? "multiple" : "single",
      title: "Nouvelle question",
      required: false,
      options: defaultOptions(),
      maxChoices: type === "multiple" ? 2 : undefined,
    };
    setQuestions((prev) => [...prev, q]);
  };

  const updateQuestion = (id: string, updater: (q: AnyFormQuestion) => AnyFormQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? updater(q) : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = () => {
    const draft: FormPollDraft = { ...currentDraft, title: title.trim() };
    const result = validateDraft(draft);
    if (!result.ok) {
      alert("Veuillez corriger: \n- " + result.errors.join("\n- "));
      return;
    }
    const saved = upsertFormPoll(draft, "draft");
    if (onSave) onSave(draft);
    logger.info("FormPoll draft enregistré", "poll", { pollId: saved.id });
  };

  const handleFinalize = async () => {
    // Protection contre les appels multiples
    if (isFinalizingRef.current) {
      logger.warn("⚠️ handleFinalize déjà en cours, ignoré", "poll");
      return;
    }

    const draft: FormPollDraft = { ...currentDraft, title: title.trim() };
    const result = validateDraft(draft);
    if (!result.ok) {
      alert("Veuillez corriger: \n- " + result.errors.join("\n- "));
      return;
    }

    isFinalizingRef.current = true;

    try {
      // 🔍 Vérifier si le poll existe déjà (créé via "Utiliser")
      const existingPolls = getAllPolls();
      const existingPoll = existingPolls.find(
        (p) => p.id === initialDraft?.id && p.id.startsWith("local-") && p.type === "form",
      );

      let saved: Poll | undefined;

      if (existingPoll) {
        // ✅ Poll existe déjà → Mettre à jour au lieu de créer un nouveau
        logger.info("📝 Mise à jour poll existant", "poll", { pollId: existingPoll.id });

        const updatedPoll = {
          ...existingPoll,
          title: draft.title,
          questions: draft.questions,
          status: "active" as const,
          updated_at: new Date().toISOString(),
        };

        // Mettre à jour dans localStorage
        const updatedPolls = existingPolls.map((p) => (p.id === existingPoll.id ? updatedPoll : p));
        savePolls(updatedPolls);
        saved = updatedPoll;
      } else {
        // ✅ Nouveau poll → Créer via le hook centralisé
        const { poll, error } = await createFormPoll({
          title: draft.title,
          description: undefined,
          questions: draft.questions.map((q: FormQuestionShape) => ({
            id: q.id,
            kind: q.kind || q.type,
            title: q.title,
            required: q.required,
            options: q.options,
            maxChoices: q.maxChoices,
            placeholder: q.placeholder,
            maxLength: q.maxLength,
            matrixRows: q.matrixRows,
            matrixColumns: q.matrixColumns,
            matrixType: q.matrixType,
            matrixColumnsNumeric: q.matrixColumnsNumeric,
            ratingScale: q.ratingScale,
            ratingStyle: q.ratingStyle,
            ratingMinLabel: q.ratingMinLabel,
            ratingMaxLabel: q.ratingMaxLabel,
            validationType: q.validationType,
          })),
          settings: {
            allowAnonymousResponses: true,
            expiresAt: undefined,
          },
        });

        if (error || !poll) {
          alert(`Erreur: ${error || "Impossible de créer le formulaire"}`);
          return;
        }
        saved = poll;
      }

      // Supprimer les anciens brouillons avec le même ID
      const all = getAllPolls();
      const withoutOldDrafts = all.filter((p) => !(p.id === draft.id && p.status === "draft"));
      savePolls(withoutOldDrafts);

      // Passer le poll sauvegardé complet (avec slug) au callback
      if (onFinalize) onFinalize(draft, saved);
      logger.info("FormPoll finalisé", "poll", { pollId: saved.id });
    } finally {
      // Reset après un délai pour éviter les double-clics rapides
      setTimeout(() => {
        isFinalizingRef.current = false;
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-form-container>
      {/* Header sticky avec bouton fermer - Style identique aux sondages */}
      {onCancel && (
        <div className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-end">
            <CloseButton onClick={onCancel} ariaLabel="Fermer" iconSize={6} />
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 pt-6 pb-40">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0a0a0a]">
            {/* Toggle Mode d'affichage */}
            <div className="mb-6 p-4 bg-[#1e1e1e] rounded-lg border border-gray-800">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Mode d'affichage du formulaire
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1 : Classique */}
                <button
                  onClick={() => setDisplayMode("all-at-once")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    displayMode === "all-at-once"
                      ? "border-purple-500 bg-purple-900/20"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <List className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Classique</span>
                    {displayMode === "all-at-once" && (
                      <Check className="w-4 h-4 text-purple-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Toutes les questions visibles en même temps
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>✓ Rapide à remplir</p>
                    <p>✓ Vue d'ensemble</p>
                    <p>⚠ Peut intimider si &gt;5 questions</p>
                  </div>
                </button>

                {/* Option 2 : Multi-step */}
                <button
                  onClick={() => setDisplayMode("multi-step")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    displayMode === "multi-step"
                      ? "border-purple-500 bg-purple-900/20"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Une par une</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                      Style Typeform
                    </span>
                    {displayMode === "multi-step" && (
                      <Check className="w-4 h-4 text-purple-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Une question à la fois, plein écran</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>✓ +25% taux complétion</p>
                    <p>✓ Moins intimidant</p>
                    <p>✓ Parfait mobile</p>
                  </div>
                </button>
              </div>

              {/* Suggestion IA */}
              {suggestedDisplayMode !== displayMode && (
                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-200">
                    <p className="font-medium mb-1">💡 Suggestion IA</p>
                    <p>
                      {suggestedDisplayMode === "multi-step"
                        ? `Votre formulaire a ${questions.length} questions. Nous recommandons le mode "Une par une" pour maximiser le taux de complétion (+25%).`
                        : "Le mode Classique est recommandé pour les formulaires courts."}
                    </p>
                    <button
                      onClick={() => setDisplayMode(suggestedDisplayMode)}
                      className="mt-2 text-yellow-400 hover:text-yellow-300 underline"
                    >
                      Utiliser la suggestion
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Paramètres de visibilité des résultats */}
            <div className="mb-6 p-4 bg-[#1e1e1e] rounded-lg border border-gray-800">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Visibilité des résultats
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resultsVisibility"
                    value="creator-only"
                    checked={resultsVisibility === "creator-only"}
                    onChange={(e) => setResultsVisibility(e.target.value as "creator-only")}
                    className="cursor-pointer"
                  />
                  <span className="text-white">Moi uniquement</span>
                  <span className="text-xs text-gray-500">(par défaut)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resultsVisibility"
                    value="voters"
                    checked={resultsVisibility === "voters"}
                    onChange={(e) => setResultsVisibility(e.target.value as "voters")}
                    className="cursor-pointer"
                  />
                  <span className="text-white">Personnes ayant voté</span>
                  <span className="text-xs text-gray-500">(recommandé)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resultsVisibility"
                    value="public"
                    checked={resultsVisibility === "public"}
                    onChange={(e) => setResultsVisibility(e.target.value as "public")}
                    className="cursor-pointer"
                  />
                  <span className="text-white">Public (tout le monde)</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <FormEditor
                value={{
                  id: draftId,
                  title,
                  questions: toEditorQuestions(questions),
                  conditionalRules,
                  themeId,
                }}
                onChange={(next) => {
                  setTitle(next.title);
                  setQuestions(fromEditorQuestions(next.questions));
                  if (next.conditionalRules !== undefined) {
                    setConditionalRules(next.conditionalRules);
                  }
                }}
                onCancel={onCancel}
                modifiedQuestionId={modifiedQuestionId}
                modifiedField={modifiedField}
                themeId={themeId}
                onThemeChange={setThemeId}
                onAddQuestion={() => {
                  // default to single choice when adding via editor button
                  setQuestions((prev) => [
                    ...prev,
                    {
                      id: uid(),
                      type: "single",
                      title: "Nouvelle question",
                      required: false,
                      options: defaultOptions(),
                    } as SingleOrMultipleQuestion,
                  ]);
                }}
                onSaveDraft={handleSave}
                onFinalize={handleFinalize}
                simulationButton={
                  questions.length > 0 ? (
                    <FormSimulationIntegration
                      pollId={draftId}
                      pollTitle={title}
                      questions={questions.map((q) => ({
                        id: q.id,
                        title: q.title,
                        type: q.type === "rating" || q.type === "nps" ? "single" : q.type,
                        required: q.required,
                        options:
                          q.type === "single" || q.type === "multiple"
                            ? (q as SingleOrMultipleQuestion).options
                            : undefined,
                        matrixRows:
                          q.type === "matrix" ? (q as MatrixQuestion).matrixRows : undefined,
                        matrixColumns:
                          q.type === "matrix" ? (q as MatrixQuestion).matrixColumns : undefined,
                        matrixType:
                          q.type === "matrix" ? (q as MatrixQuestion).matrixType : undefined,
                      }))}
                      userTier="pro"
                      buttonVariant="secondary"
                    />
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function validateDraft(draft: FormPollDraft): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!draft.title?.trim()) errors.push("Titre requis");
  if (draft.questions.length === 0) errors.push("Au moins une question");
  draft.questions.forEach((q, idx) => {
    if (!q.title?.trim()) errors.push(`Question ${idx + 1}: intitulé requis`);

    if (q.type === "matrix") {
      const mq = q as MatrixQuestion;
      if (!mq.matrixRows || mq.matrixRows.length < 1)
        errors.push(`Question ${idx + 1}: minimum 1 ligne`);
      if (!mq.matrixColumns || mq.matrixColumns.length < 2)
        errors.push(`Question ${idx + 1}: minimum 2 colonnes`);
      const emptyRow = mq.matrixRows?.find((r) => !r || !r.label || !r.label.trim());
      if (emptyRow) errors.push(`Question ${idx + 1}: une ligne est vide`);
      const emptyCol = mq.matrixColumns?.find((c) => !c || !c.label || !c.label.trim());
      if (emptyCol) errors.push(`Question ${idx + 1}: une colonne est vide`);
    } else if (q.type === "single" || q.type === "multiple") {
      const sq = q as SingleOrMultipleQuestion;
      if (sq.options.length < 2) errors.push(`Question ${idx + 1}: minimum 2 options`);
      if (sq.options.length > 10) errors.push(`Question ${idx + 1}: maximum 10 options`);
      const empty = sq.options.find((o) => !o || !o.label || !o.label.trim());
      if (empty) errors.push(`Question ${idx + 1}: une option est vide`);
      if (sq.type === "multiple") {
        const maxChoices = sq.maxChoices ?? 1;
        if (maxChoices < 1) errors.push(`Question ${idx + 1}: maxChoices >= 1`);
        if (maxChoices > sq.options.length)
          errors.push(`Question ${idx + 1}: maxChoices <= nombre d'options`);
      }
    } else if (q.type === "text") {
      const tq = q as TextQuestion;
      if ((tq.maxLength ?? 300) < 50) errors.push(`Question ${idx + 1}: maxLength >= 50`);
      if ((tq.maxLength ?? 300) > 1000) errors.push(`Question ${idx + 1}: maxLength <= 1000`);
    } else if (q.type === "long-text") {
      const ltq = q as LongTextQuestion;
      if ((ltq.maxLength ?? 2000) < 100) errors.push(`Question ${idx + 1}: maxLength >= 100`);
      if ((ltq.maxLength ?? 2000) > 5000) errors.push(`Question ${idx + 1}: maxLength <= 5000`);
    } else if (q.type === "rating") {
      const rq = q as RatingQuestion;
      if (rq.ratingScale && rq.ratingScale !== 5 && rq.ratingScale !== 10) {
        errors.push(`Question ${idx + 1}: échelle doit être 5 ou 10`);
      }
      if (rq.ratingStyle && !["numbers", "stars", "emojis"].includes(rq.ratingStyle)) {
        errors.push(`Question ${idx + 1}: style invalide`);
      }
    }
    // NPS n'a pas de validation spécifique
  });

  // Valider les règles conditionnelles si présentes
  if (draft.conditionalRules && draft.conditionalRules.length > 0) {
    const ruleErrors = validateConditionalRules(draft.conditionalRules, draft.questions);
    errors.push(...ruleErrors);
  }

  return { ok: errors.length === 0, errors };
}
