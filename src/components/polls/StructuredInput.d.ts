import { type ValidationType } from "../../lib/validation";
interface StructuredInputProps {
  value: string;
  onChange: (value: string) => void;
  validationType: ValidationType;
  required?: boolean;
  placeholder?: string;
}
/**
 * Composant StructuredInput
 * Champ de saisie avec validation HTML5 pour email, phone, url, number, date
 */
export declare function StructuredInput({
  value,
  onChange,
  validationType,
  required,
  placeholder,
}: StructuredInputProps): import("react/jsx-runtime").JSX.Element;
export {};
