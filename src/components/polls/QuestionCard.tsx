import React, { useCallback } from "react";
import { ArrowUp, ArrowDown, Copy, Trash2, Edit2, Plus } from "lucide-react";

export type QuestionKind = "single" | "multiple" | "text";

export type QuestionOption = {
  id: string;
  label: string;
};

export type Question = {
  id: string;
  title: string;
  kind: QuestionKind;
  required?: boolean;
  options?: QuestionOption[]; // for single/multiple
  maxChoices?: number; // for multiple
};

export type QuestionCardProps = {
  question: Question;
  isActive: boolean;
  onEdit: () => void;
  onChange: (patch: Partial<Question>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export default function QuestionCard({
  question,
  isActive,
  onEdit,
  onChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: QuestionCardProps) {
  const setTitle = useCallback(
    (title: string) => onChange({ title }),
    [onChange],
  );
  const setKind = useCallback(
    (kind: QuestionKind) => {
      // reset incompatible fields when switching kind
      if (kind === "text") {
        onChange({ kind, options: undefined, maxChoices: undefined });
      } else if (kind === "single") {
        onChange({
          kind,
          maxChoices: undefined,
          options: question.options ?? makeDefaultOptions(),
        });
      } else {
        onChange({
          kind,
          options: question.options ?? makeDefaultOptions(),
          maxChoices: question.maxChoices ?? 1,
        });
      }
    },
    [onChange, question.options, question.maxChoices],
  );
  const setRequired = useCallback(
    (required: boolean) => onChange({ required }),
    [onChange],
  );

  const addOption = useCallback(() => {
    const next = (question.options ?? []).concat({
      id: rid(),
      label: "Option",
    });
    onChange({ options: next });
  }, [onChange, question.options]);

  const updateOption = useCallback(
    (optId: string, label: string) => {
      const next = (question.options ?? []).map((o) =>
        o.id === optId ? { ...o, label } : o,
      );
      onChange({ options: next });
    },
    [onChange, question.options],
  );

  const removeOption = useCallback(
    (optId: string) => {
      const next = (question.options ?? []).filter((o) => o.id !== optId);
      onChange({ options: next });
    },
    [onChange, question.options],
  );

  const setMaxChoices = useCallback(
    (n: number) => {
      if (!Number.isFinite(n) || n < 1) n = 1;
      onChange({ maxChoices: Math.floor(n) });
    },
    [onChange],
  );

  if (!isActive) {
    return (
      <div className="rounded-md border p-2 sm:p-4 flex flex-col gap-2 sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <div className="font-medium break-words">
              {question.title || "(Sans titre)"}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 justify-end">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-black text-white"
              title="Éditer"
              aria-label="Éditer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voter-style preview for non-active cards */}
        {question.kind === "text" && (
          <textarea
            disabled
            placeholder="Votre réponse"
            className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-600"
          />
        )}
        {(question.kind === "single" || question.kind === "multiple") && (
          <div className="space-y-2">
            {(question.options ?? []).map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                {question.kind === "single" ? (
                  <input type="radio" disabled />
                ) : (
                  <input type="checkbox" disabled />
                )}
                <span>{opt.label || "Option"}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border p-2 sm:p-4 flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-md border px-2 py-1 text-sm sm:text-base"
            value={question.kind}
            onChange={(e) => setKind(e.target.value as QuestionKind)}
          >
            <option value="single">Choix unique</option>
            <option value="multiple">Choix multiples</option>
            <option value="text">Texte court</option>
          </select>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border"
            title="Monter"
            aria-label="Monter"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border"
            title="Descendre"
            aria-label="Descendre"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border"
            title="Dupliquer"
            aria-label="Dupliquer"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border"
            title="Supprimer"
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        className="w-full rounded-md border px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base"
        placeholder="Intitulé de la question"
        value={question.title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {(question.kind === "single" || question.kind === "multiple") && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-500">Options</div>
          <div className="flex flex-col gap-2">
            {(question.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-md border px-2 py-1 text-sm sm:text-base"
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md border"
                  title="Supprimer l'option"
                  aria-label="Supprimer l'option"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {question.kind === "multiple" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Max choix</label>
              <input
                type="number"
                min={1}
                className="w-20 rounded-md border px-2 py-1 text-sm sm:text-base"
                value={question.maxChoices ?? 1}
                onChange={(e) => setMaxChoices(parseInt(e.target.value, 10))}
              />
            </div>
          )}
        </div>
      )}
      {/* Footer row: Add option (if applicable) + Required toggle side-by-side */}
      <div className="pt-1 flex items-center gap-3 flex-wrap">
        {(question.kind === "single" || question.kind === "multiple") && (
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center rounded-md border h-8 sm:h-9 px-2 sm:px-3 text-sm"
            title="Ajouter une option"
            aria-label="Ajouter une option"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Ajouter une option</span>
          </button>
        )}
        <label className="flex items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            checked={!!question.required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Obligatoire
        </label>
      </div>
      {/* actions déplacées dans la barre d'entête pour gagner de l'espace vertical */}
    </div>
  );
}

function rid() {
  return Math.random().toString(36).slice(2, 8);
}

function makeDefaultOptions(): QuestionOption[] {
  return [
    { id: rid(), label: "Option 1" },
    { id: rid(), label: "Option 2" },
  ];
}

function labelForKind(kind: QuestionKind) {
  switch (kind) {
    case "single":
      return "Choix unique";
    case "multiple":
      return "Choix multiples";
    case "text":
      return "Texte court";
    default:
      return kind;
  }
}
