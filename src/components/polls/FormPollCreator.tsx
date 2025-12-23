import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Undo2,
  Save,
  Check,
  X,
  List,
  ArrowRight,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
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
import { PollSettingsForm } from "./PollSettingsForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

// Types locaux au spike (pas encore partagés avec un modèle global)
export type FormQuestionType =
  | "single"
  | "multiple"
  | "text"
  | "long-text"
  | "matrix"
  | "rating"
  | "nps"
  | "date";

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

export interface DateQuestion extends FormQuestionBase {
  type: "date";
  selectedDates: string[]; // Dates au format ISO string (YYYY-MM-DD)
  timeSlotsByDate?: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>; // Créneaux horaires par date
  timeGranularity?: "15min" | "30min" | "1h"; // Granularité des créneaux horaires
  allowMaybeVotes?: boolean; // Permettre les votes "peut-être"
  allowAnonymousVotes?: boolean; // Permettre les votes anonymes
}

export type AnyFormQuestion =
  | SingleOrMultipleQuestion
  | TextQuestion
  | LongTextQuestion
  | MatrixQuestion
  | RatingQuestion
  | NPSQuestion
  | DateQuestion;

import type { FormPollSettings } from '@/lib/products/form-polls/form-polls-service';

export interface FormPollDraft {
  id: string; // draft id (temporaire pour le spike)
  type: "form";
  title: string;
  questions: AnyFormQuestion[];
  conditionalRules?: ConditionalRule[]; // Règles pour questions conditionnelles
  themeId?: string; // Thème visuel (Quick Win #3)
  displayMode?: "all-at-once" | "multi-step"; // Mode d'affichage du formulaire
  resultsVisibility?: "creator-only" | "voters" | "public"; // Visibilité des résultats
  settings?: FormPollSettings; // Paramètres du sondage
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
  const [questions, setQuestions] = useState<AnyFormQuestion[]>(
    initialDraft?.questions?.length > 0
      ? initialDraft.questions
      : [
        {
          id: uid(),
          type: "single",
          title: "Nouvelle question",
          required: false,
          options: defaultOptions(),
        } as SingleOrMultipleQuestion,
      ],
  );
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

  const [settings, setSettings] = useState<FormPollSettings>(
    initialDraft?.settings || {
      allowAnonymousResponses: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default: 1 year
    },
  );

  // État pour contrôler l'ouverture du panneau de configuration (fermé par défaut)
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Si le brouillon change (montée en props), synchroniser l'état
  useEffect(() => {
    if (initialDraft) {
      setTitle(initialDraft.title || "");
      setQuestions(initialDraft.questions || []);
      setConditionalRules(initialDraft.conditionalRules || []);
      setDisplayMode(initialDraft.displayMode || suggestedDisplayMode);
      setResultsVisibility(initialDraft.resultsVisibility || "creator-only");
      setSettings(initialDraft.settings || {
        allowAnonymousResponses: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
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
      settings,
    }),
    [draftId, title, questions, conditionalRules, themeId, displayMode, resultsVisibility, settings],
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
      selectedDates: (q as DateQuestion).selectedDates,
      timeSlotsByDate: (q as DateQuestion).timeSlotsByDate,
      timeGranularity: (q as DateQuestion).timeGranularity,
      allowMaybeVotes: (q as DateQuestion).allowMaybeVotes,
      allowAnonymousVotes: (q as DateQuestion).allowAnonymousVotes,
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
      if (q.kind === "date") {
        const base: DateQuestion = {
          id: q.id,
          type: "date",
          title: q.title,
          required: !!q.required,
          selectedDates: q.selectedDates ?? [],
          timeSlotsByDate: q.timeSlotsByDate ?? {},
          timeGranularity: q.timeGranularity ?? "30min",
          allowMaybeVotes: q.allowMaybeVotes ?? false,
          allowAnonymousVotes: q.allowAnonymousVotes ?? false,
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
        } else if (q.type === "date") {
          const dq = q as DateQuestion;
          base.selectedDates = dq.selectedDates;
          base.timeSlotsByDate = dq.timeSlotsByDate;
          base.timeGranularity = dq.timeGranularity;
          base.allowMaybeVotes = dq.allowMaybeVotes;
          base.allowAnonymousVotes = dq.allowAnonymousVotes;
        }
        return base;
      }),
      conditionalRules: draft.conditionalRules, // Persister les règles conditionnelles
      themeId: draft.themeId, // Persister le thème visuel
      displayMode: draft.displayMode, // Persister le mode d'affichage
      resultsVisibility: draft.resultsVisibility, // Persister la visibilité des résultats
      settings: draft.settings, // Persister les paramètres du sondage
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
  }, [currentDraft.title, currentDraft.questions, displayMode, settings]); // Intentionnel : on veut sauvegarder seulement si title/questions/displayMode/settings changent

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
    if (type === "date") {
      const q: DateQuestion = {
        id: uid(),
        type: "date",
        title: "Nouvelle question de date",
        required: false,
        selectedDates: [],
        timeSlotsByDate: {},
        timeGranularity: "30min",
        allowMaybeVotes: false,
        allowAnonymousVotes: false,
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

        const updatedPoll: Poll = {
          ...existingPoll,
          title: draft.title,
          questions: draft.questions.map((q) => ({
            ...q,
            kind: q.type,
            // S'assurer que tous les champs de date sont bien copiés
            selectedDates: (q as DateQuestion).selectedDates,
            timeSlotsByDate: (q as DateQuestion).timeSlotsByDate,
            timeGranularity: (q as DateQuestion).timeGranularity,
            allowMaybeVotes: (q as DateQuestion).allowMaybeVotes,
            allowAnonymousVotes: (q as DateQuestion).allowAnonymousVotes,
          })) as FormQuestionShape[],
          status: "active" as const,
          updated_at: new Date().toISOString(),
        };

        // Mettre à jour dans localStorage
        const updatedPolls = existingPolls.map((p) => (p.id === existingPoll.id ? updatedPoll : p));
        savePolls(updatedPolls);
        saved = updatedPoll;
      } else {
        // ✅ Nouveau poll → Créer via le hook centralisé
        // Récupérer le slug du draft sauvegardé pour le conserver lors de la publication
        const draftPoll = getAllPolls().find((p) => p.id === draft.id);
        const draftSlug = draftPoll?.slug;

        const mappedQuestions = draft.questions.map((q) => {
          const mapped = {
            id: q.id,
            type: q.type,
            title: q.title,
            required: q.required,
            options: (q as SingleOrMultipleQuestion).options,
            maxChoices: (q as SingleOrMultipleQuestion).maxChoices,
            placeholder: (q as TextQuestion | LongTextQuestion).placeholder,
            maxLength: (q as TextQuestion | LongTextQuestion).maxLength,
            matrixRows: (q as MatrixQuestion).matrixRows,
            matrixColumns: (q as MatrixQuestion).matrixColumns,
            matrixType: (q as MatrixQuestion).matrixType,
            matrixColumnsNumeric: (q as MatrixQuestion).matrixColumnsNumeric,
            ratingScale: (q as RatingQuestion).ratingScale,
            ratingStyle: (q as RatingQuestion).ratingStyle,
            ratingMinLabel: (q as RatingQuestion).ratingMinLabel,
            ratingMaxLabel: (q as RatingQuestion).ratingMaxLabel,
            validationType: (q as TextQuestion | LongTextQuestion).validationType,
            selectedDates: (q as DateQuestion).selectedDates,
            timeSlotsByDate: (q as DateQuestion).timeSlotsByDate,
            timeGranularity: (q as DateQuestion).timeGranularity,
            allowMaybeVotes: (q as DateQuestion).allowMaybeVotes,
            allowAnonymousVotes: (q as DateQuestion).allowAnonymousVotes,
          };

          return mapped;
        });

        const { poll, error } = await createFormPoll({
          title: draft.title,
          description: undefined,
          questions: mappedQuestions,
          settings: draft.settings || {
            allowAnonymousResponses: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
          slug: draftSlug, // Conserver le slug du draft lors de la publication
        });

        if (error || !poll) {
          alert(`Erreur: ${error || "Impossible de créer le formulaire"}`);
          return;
        }
        saved = poll;
      }

      // Supprimer les anciens brouillons avec le même ID (même s'ils ont été mis à jour avec status "active")
      const all = getAllPolls();
      const withoutOldDrafts = all.filter((p) => {
        // Supprimer le draft s'il a le même ID que le draft actuel
        // Même s'il a été mis à jour avec status "active" (cas où le draft a été publié mais n'a pas été remplacé)
        if (p.id === draft.id && p.id.startsWith("draft-")) {
          return false; // Supprimer ce poll
        }
        return true; // Garder ce poll
      });
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
      <div className="px-4 md:px-6 pt-6 pb-40">
        <div className="max-w-none w-full">
          <div className="bg-[#0a0a0a]">
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
                        type:
                          q.type === "rating" || q.type === "nps" || q.type === "date"
                            ? "single"
                            : q.type,
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
                configPanel={
                  <Collapsible open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-[#1e1e1e] rounded-lg border border-gray-800 hover:bg-[#2a2a2a] transition-colors">
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-gray-300" />
                        <span className="text-sm font-medium text-gray-300">
                          Paramètres de configuration
                        </span>
                      </div>
                      {isConfigPanelOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-4">



                      {/* Paramètres du sondage */}
                      <div className="p-4 bg-[#1e1e1e] rounded-lg border border-gray-800">
                        <PollSettingsForm
                          settings={settings}
                          onSettingsChange={setSettings}
                          pollType="form"
                          themeId={themeId}
                          onThemeChange={setThemeId}
                          displayMode={displayMode}
                          onDisplayModeChange={setDisplayMode}
                          resultsVisibility={resultsVisibility}
                          onResultsVisibilityChange={setResultsVisibility}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
    } else if (q.type === "date") {
      const dq = q as DateQuestion;
      if (!dq.selectedDates || dq.selectedDates.length === 0) {
        errors.push(`Question ${idx + 1}: au moins une date doit être sélectionnée`);
      }
      if (dq.timeGranularity && !["15min", "30min", "1h"].includes(dq.timeGranularity)) {
        errors.push(`Question ${idx + 1}: granularité doit être 15min, 30min ou 1h`);
      }
      // Valider que les horaires sont valides pour chaque date
      if (dq.timeSlotsByDate) {
        for (const [dateStr, slots] of Object.entries(dq.timeSlotsByDate)) {
          if (!dq.selectedDates.includes(dateStr)) {
            errors.push(
              `Question ${idx + 1}: horaires configurés pour une date non sélectionnée (${dateStr})`,
            );
          }
          for (const slot of slots) {
            if (slot.hour < 0 || slot.hour > 23 || slot.minute < 0 || slot.minute > 59) {
              errors.push(`Question ${idx + 1}: horaire invalide (${slot.hour}:${slot.minute})`);
            }
          }
        }
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
