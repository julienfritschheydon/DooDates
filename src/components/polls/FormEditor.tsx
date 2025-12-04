import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import QuestionCard from "./QuestionCard";
import type { Question } from "./QuestionCard";
import QuestionListNav from "./QuestionListNav";
import type { ConditionalRule } from "../../types/conditionalRules";

// Types for a minimal Form Poll draft used by the editor
export type FormPollDraft = {
  id: string;
  title: string;
  questions: Question[];
  conditionalRules?: ConditionalRule[];
  themeId?: string;
};

export type FormEditorProps = {
  // Current draft value
  value: FormPollDraft;
  // Called whenever the draft changes (title, questions, order)
  onChange: (next: FormPollDraft) => void;
  // Optional handlers
  onCancel?: () => void;
  onAddQuestion?: () => void;
  onSaveDraft?: () => void;
  onFinalize?: () => void;
  // Visual feedback for modifications
  modifiedQuestionId?: string | null;
  modifiedField?: "title" | "type" | "options" | "required" | null;
  // Theme selector
  themeId?: string;
  onThemeChange?: (themeId: string) => void;
  // Simulation button
  simulationButton?: React.ReactNode;
  // Configuration panel props
  configPanel?: React.ReactNode;
};

/**
 * FormEditor: single-focus editor for form polls.
 * - Only one question is editable at a time
 * - Navigation via a small Q1..Qn list
 * - Exposes change events upward so persistence can be centralized
 */
export default function FormEditor({
  value,
  onChange,
  onCancel,
  onAddQuestion,
  onSaveDraft,
  onFinalize,
  modifiedQuestionId,
  modifiedField,
  themeId,
  onThemeChange,
  simulationButton,
  configPanel,
}: FormEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(value.questions[0]?.id ?? null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // S'assurer qu'une question est toujours active quand il y en a
  useEffect(() => {
    if (!activeId && value.questions.length > 0) {
      setActiveId(value.questions[0].id);
    }
  }, [activeId, value.questions]);

  // Auto-ouvrir la question modifiée
  useEffect(() => {
    if (modifiedQuestionId && value.questions.some((q) => q.id === modifiedQuestionId)) {
      setActiveId(modifiedQuestionId);
    }
  }, [modifiedQuestionId, value.questions]);

  const activeIndex = useMemo(
    () => value.questions.findIndex((q) => q.id === activeId),
    [value.questions, activeId],
  );
  const activeQuestion = activeIndex >= 0 ? value.questions[activeIndex] : null;

  const setTitle = useCallback((title: string) => onChange({ ...value, title }), [value, onChange]);

  // When a new question is added externally (parent updates value.questions),
  // automatically activate the newly added question and focus its title input.
  const prevCountRef = useRef<number>(value.questions.length);
  useEffect(() => {
    const prev = prevCountRef.current;
    const next = value.questions.length;
    if (next > prev) {
      const last = value.questions[next - 1];
      if (last?.id) {
        setActiveId(last.id);
        // Best-effort focus on the question title input
        // to streamline keyboard input after adding a question.
        requestAnimationFrame(() => {
          const el = document.querySelector<HTMLInputElement>(
            'input[placeholder="Intitulé de la question"]',
          );
          el?.focus();
        });
      }
    }
    prevCountRef.current = next;
  }, [value.questions]);

  const updateQuestion = useCallback(
    (qId: string, patch: Partial<Question>) => {
      const next = value.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q));
      onChange({ ...value, questions: next });
    },
    [value, onChange],
  );

  const reorder = useCallback(
    (from: number, to: number) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= value.questions.length ||
        to >= value.questions.length
      )
        return;
      const next = value.questions.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange({ ...value, questions: next });
      setActiveId(moved.id);
    },
    [value, onChange],
  );

  const duplicate = useCallback(
    (qId: string) => {
      const idx = value.questions.findIndex((q) => q.id === qId);
      if (idx === -1) return;
      const source = value.questions[idx];
      const clone: Question = {
        ...source,
        id: `${source.id}-copy-${Math.random().toString(36).slice(2, 6)}`,
      };
      const next = value.questions.slice();
      next.splice(idx + 1, 0, clone);
      onChange({ ...value, questions: next });
      setActiveId(clone.id);
    },
    [value, onChange],
  );

  const remove = useCallback(
    (qId: string) => {
      const idx = value.questions.findIndex((q) => q.id === qId);
      if (idx === -1) return;
      const next = value.questions.filter((q) => q.id !== qId);
      onChange({ ...value, questions: next });
      const fallback = next[Math.max(0, idx - 1)]?.id ?? next[0]?.id ?? null;
      setActiveId(fallback);
    },
    [value, onChange],
  );

  const updateConditionalRules = useCallback(
    (rules: ConditionalRule[]) => {
      onChange({ ...value, conditionalRules: rules });
    },
    [value, onChange],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Section titre */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Titre du formulaire <span className="text-red-400 text-sm">*</span>
        </label>
        <input
          ref={titleInputRef}
          value={value.title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-white placeholder-gray-500"
          placeholder="Ex: Questionnaire de satisfaction client"
          data-testid="poll-title"
          required
        />
      </div>

      {/* Navigation des questions */}
      <QuestionListNav
        questions={value.questions}
        activeId={activeId}
        onSelect={setActiveId}
        modifiedQuestionId={modifiedQuestionId}
      />

      {/* Question active */}
      <div className="flex flex-col gap-4">
        {activeQuestion && (
          <QuestionCard
            key={activeQuestion.id}
            question={activeQuestion}
            isActive={true}
            onEdit={() => null}
            onChange={(patch) => updateQuestion(activeQuestion.id, patch)}
            onDuplicate={() => duplicate(activeQuestion.id)}
            onDelete={() => remove(activeQuestion.id)}
            onMoveUp={() => reorder(activeIndex, Math.max(0, activeIndex - 1))}
            onMoveDown={() =>
              reorder(activeIndex, Math.min(value.questions.length - 1, activeIndex + 1))
            }
            allQuestions={value.questions}
            conditionalRules={value.conditionalRules ?? []}
            onConditionalRulesChange={updateConditionalRules}
          />
        )}
      </div>

      {/* Bouton ajouter question */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onAddQuestion}
          className="w-full rounded-lg bg-[#3c4043] border border-gray-700 px-4 py-3 text-white hover:bg-gray-700 transition-colors font-medium"
          data-testid="form-add-question-button"
        >
          + Ajouter une question
        </button>
      </div>

      {/* Panneau de configuration - Après "Ajouter une question", avant les boutons */}
      {configPanel && <div className="pt-4">{configPanel}</div>}

      {/* Boutons d'action - MÊME STYLE QUE POLLCREATOR */}
      <div className="flex flex-wrap gap-3 justify-end pt-4">
        {simulationButton}
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={!value.title.trim() || value.questions.length === 0}
            className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="save-draft-button"
          >
            Enregistrer le brouillon
          </button>
        )}
        {onFinalize && (
          <button
            type="button"
            onClick={onFinalize}
            disabled={!value.title.trim() || value.questions.length === 0}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="publish-button"
          >
            Publier le formulaire
          </button>
        )}
      </div>
    </div>
  );
}
