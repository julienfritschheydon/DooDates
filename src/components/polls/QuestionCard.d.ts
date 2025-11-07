import type { ConditionalRule } from "../../types/conditionalRules";
export type QuestionKind =
  | "single"
  | "multiple"
  | "text"
  | "long-text"
  | "matrix"
  | "rating"
  | "nps";
export type QuestionOption = {
  id: string;
  label: string;
  isOther?: boolean;
};
export type Question = {
  id: string;
  title: string;
  kind: QuestionKind;
  required?: boolean;
  options?: QuestionOption[];
  maxChoices?: number;
  matrixRows?: QuestionOption[];
  matrixColumns?: QuestionOption[];
  matrixType?: "single" | "multiple";
  matrixColumnsNumeric?: boolean;
  ratingScale?: number;
  ratingStyle?: "numbers" | "stars" | "emojis";
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  validationType?: "email" | "phone" | "url" | "number" | "date";
  placeholder?: string;
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
  allQuestions?: Question[];
  conditionalRules?: ConditionalRule[];
  onConditionalRulesChange?: (rules: ConditionalRule[]) => void;
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
  allQuestions,
  conditionalRules,
  onConditionalRulesChange,
}: QuestionCardProps): import("react/jsx-runtime").JSX.Element;
