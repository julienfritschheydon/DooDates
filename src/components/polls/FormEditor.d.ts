import React from "react";
import type { Question } from "./QuestionCard";
import type { ConditionalRule } from "../../types/conditionalRules";
export type FormPollDraft = {
  id: string;
  title: string;
  questions: Question[];
  conditionalRules?: ConditionalRule[];
  themeId?: string;
};
export type FormEditorProps = {
  value: FormPollDraft;
  onChange: (next: FormPollDraft) => void;
  onCancel?: () => void;
  onAddQuestion?: () => void;
  onSaveDraft?: () => void;
  onFinalize?: () => void;
  modifiedQuestionId?: string | null;
  modifiedField?: "title" | "type" | "options" | "required" | null;
  themeId?: string;
  onThemeChange?: (themeId: string) => void;
  simulationButton?: React.ReactNode;
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
}: FormEditorProps): import("react/jsx-runtime").JSX.Element;
