import React from "react";
import type { Question } from "./QuestionCard";

export type QuestionListNavProps = {
  questions: Question[];
  activeId: string | null;
  onSelect: (id: string) => void;
  modifiedQuestionId?: string | null;
};

export default function QuestionListNav({
  questions,
  activeId,
  onSelect,
  modifiedQuestionId,
}: QuestionListNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
                ? "bg-white text-black"
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
