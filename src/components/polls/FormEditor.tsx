import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "./QuestionCard";
import type { Question } from "./QuestionCard";
import QuestionListNav from "./QuestionListNav";

// Types for a minimal Form Poll draft used by the editor
export type FormPollDraft = {
  id: string;
  title: string;
  questions: Question[];
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
};

/**
 * FormEditor: single-focus editor for form polls.
 * - Only one question is editable at a time
 * - Navigation via a small Q1..Qn list
 * - Exposes change events upward so persistence can be centralized
 */
export default function FormEditor({ value, onChange, onCancel, onAddQuestion, onSaveDraft, onFinalize }: FormEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(value.questions[0]?.id ?? null);
  const [isTitleEditing, setIsTitleEditing] = useState<boolean>(!value.title);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const activeIndex = useMemo(() => value.questions.findIndex(q => q.id === activeId), [value.questions, activeId]);
  const activeQuestion = activeIndex >= 0 ? value.questions[activeIndex] : null;

  const setTitle = useCallback(
    (title: string) => onChange({ ...value, title }),
    [value, onChange]
  );

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
          const el = document.querySelector<HTMLInputElement>('input[placeholder="Intitulé de la question"]');
          el?.focus();
        });
      }
    }
    prevCountRef.current = next;
  }, [value.questions]);

  const updateQuestion = useCallback(
    (qId: string, patch: Partial<Question>) => {
      const next = value.questions.map(q => (q.id === qId ? { ...q, ...patch } : q));
      onChange({ ...value, questions: next });
    },
    [value, onChange]
  );

  const reorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= value.questions.length || to >= value.questions.length) return;
      const next = value.questions.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange({ ...value, questions: next });
      setActiveId(moved.id);
    },
    [value, onChange]
  );

  const duplicate = useCallback(
    (qId: string) => {
      const idx = value.questions.findIndex(q => q.id === qId);
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
    [value, onChange]
  );

  const remove = useCallback(
    (qId: string) => {
      const idx = value.questions.findIndex(q => q.id === qId);
      if (idx === -1) return;
      const next = value.questions.filter(q => q.id !== qId);
      onChange({ ...value, questions: next });
      const fallback = next[Math.max(0, idx - 1)]?.id ?? next[0]?.id ?? null;
      setActiveId(fallback);
    },
    [value, onChange]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {isTitleEditing ? (
          <input
            ref={titleInputRef}
            value={value.title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (value.title.trim().length > 0) setIsTitleEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
            className="min-w-[220px] flex-1 rounded-md border px-3 py-2 text-sm sm:text-base"
            placeholder="Titre du formulaire"
          />
        ) : (
          <div className="flex-1 min-w-[220px] flex items-center gap-2">
            <h2 className="font-medium text-base sm:text-lg truncate" title={value.title}>{value.title}</h2>
            <button
              type="button"
              onClick={() => {
                setIsTitleEditing(true);
                requestAnimationFrame(() => titleInputRef.current?.focus());
              }}
              className="rounded-md border h-9 px-2 text-sm"
              aria-label="Éditer le titre"
              title="Éditer le titre"
            >
              Éditer
            </button>
          </div>
        )}
      </div>

      <QuestionListNav
        questions={value.questions}
        activeId={activeId}
        onSelect={setActiveId}
      />

      <div className="flex flex-col gap-3">
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
            onMoveDown={() => reorder(activeIndex, Math.min(value.questions.length - 1, activeIndex + 1))}
          />
        )}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onAddQuestion}
          className="w-full rounded-md border px-3 py-2"
        >
          Ajouter une question
        </button>
      </div>
    </div>
  );
}
