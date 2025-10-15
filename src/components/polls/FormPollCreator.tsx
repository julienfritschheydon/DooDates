import React, { useEffect, useMemo, useRef, useState } from "react";
import { Undo2, Save, Check } from "lucide-react";
import FormEditor from "./FormEditor";
import type { Question as EditorQuestion } from "./QuestionCard";
import { getAllPolls, savePolls, type Poll } from "../../lib/pollStorage";
import { logger } from "@/lib/logger";

// Types locaux au spike (pas encore partagés avec un modèle global)
export type FormQuestionType = "single" | "multiple" | "text";

export interface FormOption {
  id: string;
  label: string;
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
}

export type AnyFormQuestion = SingleOrMultipleQuestion | TextQuestion;

export interface FormPollDraft {
  id: string; // draft id (temporaire pour le spike)
  type: "form";
  title: string;
  questions: AnyFormQuestion[];
}

interface FormPollCreatorProps {
  initialDraft?: FormPollDraft;
  onCancel?: () => void;
  onSave?: (draft: FormPollDraft) => void; // pour le spike: retour du draft, stockage géré ailleurs
  onFinalize?: (draft: FormPollDraft) => void; // finaliser le brouillon
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
  const [title, setTitle] = useState(initialDraft?.title || "");
  const [questions, setQuestions] = useState<AnyFormQuestion[]>(
    initialDraft?.questions || [],
  );
  const [draftId] = useState<string>(initialDraft?.id || "draft-" + uid());
  const autosaveTimer = useRef<number | null>(null);

  // Si le brouillon change (montée en props), synchroniser l'état
  useEffect(() => {
    if (initialDraft) {
      setTitle(initialDraft.title || "");
      setQuestions(initialDraft.questions || []);
    }
  }, [initialDraft?.id]);

  const currentDraft: FormPollDraft = useMemo(
    () => ({
      id: draftId,
      type: "form",
      title,
      questions,
    }),
    [draftId, title, questions],
  );

  const canSave = useMemo(() => validateDraft(currentDraft).ok, [currentDraft]);

  // --- Mapping helpers between local AnyFormQuestion and EditorQuestion ---
  const toEditorQuestions = (qs: AnyFormQuestion[]): EditorQuestion[] =>
    qs.map((q) => ({
      id: q.id,
      title: q.title,
      kind: (q.type === "text" ? "text" : q.type) as EditorQuestion["kind"],
      required: q.required,
      options: (q as SingleOrMultipleQuestion).options,
      maxChoices: (q as SingleOrMultipleQuestion).maxChoices,
    }));

  const fromEditorQuestions = (qs: EditorQuestion[]): AnyFormQuestion[] =>
    qs.map((q) => {
      if (q.kind === "text") {
        const base: TextQuestion = {
          id: q.id,
          type: "text",
          title: q.title,
          required: !!q.required,
          placeholder: "",
          maxLength: 300,
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

  function upsertFormPoll(
    draft: FormPollDraft,
    status: Poll["status"] = "draft",
  ) {
    const all = getAllPolls();
    const now = new Date().toISOString();
    const existingIdx = all.findIndex((p) => p.id === draft.id);
    const base: Poll = {
      id: draft.id,
      title: draft.title.trim(),
      slug:
        existingIdx >= 0
          ? all[existingIdx].slug
          : `${slugify(draft.title)}-${uid()}`,
      created_at: existingIdx >= 0 ? all[existingIdx].created_at : now,
      status,
      updated_at: now,
      type: "form",
      questions: draft.questions,
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
        logger.warn('Autosave form poll failed', 'poll', e);
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

  const updateQuestion = (
    id: string,
    updater: (q: AnyFormQuestion) => AnyFormQuestion,
  ) => {
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
    logger.info('FormPoll draft enregistré', 'poll', { pollId: saved.id });
  };

  const handleFinalize = () => {
    const draft: FormPollDraft = { ...currentDraft, title: title.trim() };
    const result = validateDraft(draft);
    if (!result.ok) {
      alert("Veuillez corriger: \n- " + result.errors.join("\n- "));
      return;
    }
    const saved = upsertFormPoll(draft, "active");
    if (onFinalize) onFinalize(draft);
    logger.info('FormPoll finalisé', 'poll', { pollId: saved.id });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-xl font-semibold">Nouveau formulaire</h2>
        <div className="flex flex-wrap gap-2 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border h-10 px-3 text-sm"
              title="Annuler la création"
              aria-label="Annuler la création"
              data-testid="form-cancel-button"
            >
              <span className="sm:hidden inline-flex">
                <Undo2 className="w-4 h-4" />
              </span>
              <span className="hidden sm:inline">Annuler</span>
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md border h-10 px-3 text-sm"
              title="Enregistrer le brouillon"
              aria-label="Enregistrer le brouillon"
              data-testid="form-save-draft-button"
            >
              <span className="sm:hidden inline-flex">
                <Save className="w-4 h-4" />
              </span>
              <span className="hidden sm:inline">Enregistrer</span>
            </button>
          )}
          {onFinalize && (
            <button
              type="button"
              onClick={handleFinalize}
              className="rounded-md bg-black text-white h-10 px-3 text-sm"
              title="Finaliser le formulaire"
              aria-label="Finaliser le formulaire"
              data-testid="form-finalize-button"
            >
              <span className="sm:hidden inline-flex">
                <Check className="w-4 h-4" />
              </span>
              <span className="hidden sm:inline">Finaliser</span>
            </button>
          )}
        </div>
      </div>

      <FormEditor
        value={{ id: draftId, title, questions: toEditorQuestions(questions) }}
        onChange={(next) => {
          setTitle(next.title);
          setQuestions(fromEditorQuestions(next.questions));
        }}
        onCancel={onCancel}
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
  if (!draft.title.trim()) errors.push("Titre requis");
  if (draft.questions.length === 0) errors.push("Au moins une question");
  draft.questions.forEach((q, idx) => {
    if (!q.title.trim()) errors.push(`Question ${idx + 1}: intitulé requis`);
    if (q.type !== "text") {
      const sq = q as SingleOrMultipleQuestion;
      if (sq.options.length < 2)
        errors.push(`Question ${idx + 1}: minimum 2 options`);
      if (sq.options.length > 10)
        errors.push(`Question ${idx + 1}: maximum 10 options`);
      const empty = sq.options.find((o) => !o.label.trim());
      if (empty) errors.push(`Question ${idx + 1}: une option est vide`);
      if (sq.type === "multiple") {
        const maxChoices = sq.maxChoices ?? 1;
        if (maxChoices < 1) errors.push(`Question ${idx + 1}: maxChoices >= 1`);
        if (maxChoices > sq.options.length)
          errors.push(`Question ${idx + 1}: maxChoices <= nombre d'options`);
      }
    } else {
      const tq = q as TextQuestion;
      if ((tq.maxLength ?? 300) < 50)
        errors.push(`Question ${idx + 1}: maxLength >= 50`);
      if ((tq.maxLength ?? 300) > 1000)
        errors.push(`Question ${idx + 1}: maxLength <= 1000`);
    }
  });
  return { ok: errors.length === 0, errors };
}
