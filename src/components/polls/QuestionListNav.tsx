import React from "react";
import type { Question } from "./QuestionCard";

export type QuestionListNavProps = {
  questions: Question[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export default function QuestionListNav({
  questions,
  activeId,
  onSelect,
}: QuestionListNavProps) {
  return (
    <div className="sticky top-20 z-10 -mx-2 px-2 py-1 bg-white/80 supports-[backdrop-filter]:backdrop-blur flex flex-wrap items-center gap-2">
      {questions.map((q, idx) => (
        <button
          key={q.id}
          type="button"
          aria-current={activeId === q.id}
          onClick={() => onSelect(q.id)}
          className={
            "rounded-full border px-3 py-1 text-sm transition-colors " +
            (activeId === q.id
              ? "bg-black text-white border-black"
              : "bg-white hover:bg-gray-50")
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
