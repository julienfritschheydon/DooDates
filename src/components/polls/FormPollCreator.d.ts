import type { ConditionalRule } from "../../types/conditionalRules";
export type FormQuestionType =
  | "single"
  | "multiple"
  | "text"
  | "long-text"
  | "matrix"
  | "rating"
  | "nps";
export interface FormOption {
  id: string;
  label: string;
  isOther?: boolean;
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
  maxChoices?: number;
}
export interface TextQuestion extends FormQuestionBase {
  type: "text";
  placeholder?: string;
  maxLength?: number;
  validationType?: "email" | "phone" | "url" | "number" | "date";
}
export interface LongTextQuestion extends FormQuestionBase {
  type: "long-text";
  placeholder?: string;
  maxLength?: number;
  validationType?: "email" | "phone" | "url" | "number" | "date";
}
export interface MatrixQuestion extends FormQuestionBase {
  type: "matrix";
  matrixRows: FormOption[];
  matrixColumns: FormOption[];
  matrixType: "single" | "multiple";
  matrixColumnsNumeric?: boolean;
}
export interface RatingQuestion extends FormQuestionBase {
  type: "rating";
  ratingScale?: number;
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
  | LongTextQuestion
  | MatrixQuestion
  | RatingQuestion
  | NPSQuestion;
export interface FormPollDraft {
  id: string;
  type: "form";
  title: string;
  questions: AnyFormQuestion[];
  conditionalRules?: ConditionalRule[];
  themeId?: string;
  displayMode?: "all-at-once" | "multi-step";
  resultsVisibility?: "creator-only" | "voters" | "public";
}
interface FormPollCreatorProps {
  initialDraft?: FormPollDraft;
  onCancel?: () => void;
  onSave?: (draft: FormPollDraft) => void;
  onFinalize?: (draft: FormPollDraft, savedPoll?: any) => void;
}
export default function FormPollCreator({
  initialDraft,
  onCancel,
  onSave,
  onFinalize,
}: FormPollCreatorProps): import("react/jsx-runtime").JSX.Element;
export {};
