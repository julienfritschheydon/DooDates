interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  scale?: number;
  style?: "numbers" | "stars" | "emojis";
  minLabel?: string;
  maxLabel?: string;
  required?: boolean;
}
/**
 * Composant RatingInput
 * Échelle de notation avec 3 styles : chiffres, étoiles, emojis
 */
export declare function RatingInput({
  value,
  onChange,
  scale,
  style,
  minLabel,
  maxLabel,
  required,
}: RatingInputProps): import("react/jsx-runtime").JSX.Element;
export {};
