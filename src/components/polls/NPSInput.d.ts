interface NPSInputProps {
  value: number | null;
  onChange: (value: number) => void;
  required?: boolean;
}
/**
 * Composant NPSInput
 * Net Promoter Score : échelle 0-10
 * 0-6 = Détracteurs (rouge)
 * 7-8 = Passifs (jaune)
 * 9-10 = Promoteurs (vert)
 */
export declare function NPSInput({
  value,
  onChange,
  required,
}: NPSInputProps): import("react/jsx-runtime").JSX.Element;
export {};
