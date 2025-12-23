import React from "react";
import { Plus } from "lucide-react";
import type { Question } from "./QuestionCard";

export type QuestionListNavProps = {
  questions: Question[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  modifiedQuestionId?: string | null;
};

export default function QuestionListNav({
  questions,
  activeId,
  onSelect,
  onAdd,
  modifiedQuestionId,
}: QuestionListNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          title="Ajouter une question"
          data-testid="nav-add-question"
        >
          <Plus size={18} />
        </button>
      )}
      {questions.map((q, idx) => (
        <button
          key={q.id}
          type="button"
          aria-current={activeId === q.id}
          onClick={() => onSelect(q.id)}
          className={
            "rounded-full px-3 py-1 text-sm transition-all duration-300 " +
            (modifiedQuestionId === q.id
              ? "bg-green-500 text-white animate-pulse"
              : activeId === q.id
                ? "bg-purple-600 text-white"
                : "bg-[#3c4043] text-gray-300 hover:bg-gray-700")
          }
          title={q.title || `Q${idx + 1}`}
          data-testid="question-nav"
          data-qid={q.id}
          data-index={idx + 1}
        >
          {`Q${idx + 1}`}
        </button>
      ))}
    </div>
  );
}
