import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Undo2, Save, Check, X } from "lucide-react";
import FormEditor from "./FormEditor";
import type { Question as EditorQuestion } from "./QuestionCard";
import { getAllPolls, savePolls, type Poll } from "../../lib/pollStorage";
import { logger } from "@/lib/logger";
import type { ConditionalRule } from "../../types/conditionalRules";
import { validateConditionalRules } from "../../lib/conditionalValidator";
import { linkPollToConversation } from "../../lib/conversationPollLink";
import { useUIState } from "../prototype/UIStateProvider";
import { ThemeSelector } from "./ThemeSelector";
import { DEFAULT_THEME } from "../../lib/themes";

// Types locaux au spike (pas encore partagés avec un modèle global)
export type FormQuestionType = "single" | "multiple" | "text" | "matrix" | "rating" | "nps";

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
}

interface FormPollCreatorProps {
  initialDraft?: FormPollDraft;
  onCancel?: () => void;
  onSave?: (draft: FormPollDraft) => void; // pour le spike: retour du draft, stockage géré ailleurs
  onFinalize?: (draft: FormPollDraft, savedPoll?: any) => void; // finaliser le brouillon
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
  const { modifiedQuestionId, modifiedField } = useUIState();

  const [title, setTitle] = useState(initialDraft?.title || "");
  const [questions, setQuestions] = useState<AnyFormQuestion[]>(initialDraft?.questions || []);
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>(
    initialDraft?.conditionalRules || [],
  );
  const [themeId, setThemeId] = useState<string>(initialDraft?.themeId || DEFAULT_THEME.id);
  const [draftId] = useState<string>(initialDraft?.id || "draft-" + uid());
  const autosaveTimer = useRef<number | null>(null);

  // Si le brouillon change (montée en props), synchroniser l'état
  useEffect(() => {
    if (initialDraft) {
      setTitle(initialDraft.title || "");
      setQuestions(initialDraft.questions || []);
      setConditionalRules(initialDraft.conditionalRules || []);
    }
  }, [initialDraft?.id]);

  const currentDraft: FormPollDraft = useMemo(
    () => ({
      id: draftId,
      type: "form",
      title,
      questions,
      conditionalRules,
      themeId,
    }),
    [draftId, title, questions, conditionalRules, themeId],
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
      ratingScale: (q as any).ratingScale,
      ratingStyle: (q as any).ratingStyle,
      ratingMinLabel: (q as any).ratingMinLabel,
      ratingMaxLabel: (q as any).ratingMaxLabel,
      validationType: (q as any).validationType,
      placeholder: (q as any).placeholder,
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
      creator_id: "",
      dates: [],
      questions: draft.questions.map((q) => {
        const base: any = { ...q, kind: q.type };
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
  }, [currentDraft.title, currentDraft.questions]);

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

  const handleFinalize = () => {
    const draft: FormPollDraft = { ...currentDraft, title: title.trim() };
    const result = validateDraft(draft);
    if (!result.ok) {
      alert("Veuillez corriger: \n- " + result.errors.join("\n- "));
      return;
    }

    // Créer/mettre à jour le poll actif (upsertFormPoll gère déjà la logique de mise à jour)
    const saved = upsertFormPoll(draft, "active");

    // Supprimer les anciens brouillons avec le même ID (mais garder le poll actif qu'on vient de créer)
    const all = getAllPolls();
    const withoutOldDrafts = all.filter((p) => !(p.id === draft.id && p.status === "draft"));
    savePolls(withoutOldDrafts);

    // Lier le formulaire à la conversation pour persister l'état "Voir"
    linkPollToConversation(saved.title, saved.id);

    // Passer le poll sauvegardé complet (avec slug) au callback
    if (onFinalize) onFinalize(draft, saved);
    logger.info("FormPoll finalisé", "poll", { pollId: saved.id });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-form-container>
      {/* Header sticky avec bouton fermer - Style identique aux sondages */}
      {onCancel && (
        <div className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <button
              onClick={onCancel}
              className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 pt-6">
        <div className="max-w-6xl mx-auto">
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
