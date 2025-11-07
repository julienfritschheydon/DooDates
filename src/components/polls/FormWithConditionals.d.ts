import type { ConditionalRule } from "../../types/conditionalRules";
interface FormQuestion {
  id: string;
  title: string;
  type: "single" | "multiple" | "text" | "long-text";
  required?: boolean;
  options?: Array<{
    id: string;
    label: string;
  }>;
  maxChoices?: number;
  placeholder?: string;
}
interface FormWithConditionalsProps {
  title: string;
  questions: FormQuestion[];
  conditionalRules?: ConditionalRule[];
  onSubmit: (answers: Record<string, string | string[]>) => void;
  respondentName?: string;
}
/**
 * Formulaire avec support des questions conditionnelles
 * Affiche/masque dynamiquement les questions selon les réponses
 */
export default function FormWithConditionals({
  title,
  questions,
  conditionalRules,
  onSubmit,
  respondentName,
}: FormWithConditionalsProps): import("react/jsx-runtime").JSX.Element;
export {};
