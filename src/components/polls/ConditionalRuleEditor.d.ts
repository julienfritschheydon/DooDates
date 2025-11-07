import { ConditionalRule } from "../../types/conditionalRules";
interface Question {
  id: string;
  title: string;
  options?: Array<{
    id: string;
    label: string;
  }>;
}
interface ConditionalRuleEditorProps {
  questionId: string;
  questions: Question[];
  existingRules: ConditionalRule[];
  onChange: (rules: ConditionalRule[]) => void;
}
export default function ConditionalRuleEditor({
  questionId,
  questions,
  existingRules,
  onChange,
}: ConditionalRuleEditorProps): import("react/jsx-runtime").JSX.Element;
export {};
