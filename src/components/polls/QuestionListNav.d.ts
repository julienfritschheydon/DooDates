import type { Question } from "./QuestionCard";
export type QuestionListNavProps = {
    questions: Question[];
    activeId: string | null;
    onSelect: (id: string) => void;
    modifiedQuestionId?: string | null;
};
export default function QuestionListNav({ questions, activeId, onSelect, modifiedQuestionId, }: QuestionListNavProps): import("react/jsx-runtime").JSX.Element;
