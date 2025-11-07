interface ErrorMessageProps {
  /** Type de message */
  variant?: "error" | "warning" | "info" | "success";
  /** Titre du message */
  title?: string;
  /** Description détaillée */
  message: string;
  /** Classe CSS additionnelle */
  className?: string;
  /** Action optionnelle (bouton retry, etc.) */
  action?: React.ReactNode;
}
/**
 * Composant de message d'erreur cohérent
 * Supporte différents variants (error, warning, info, success)
 */
export declare function ErrorMessage({
  variant,
  title,
  message,
  className,
  action,
}: ErrorMessageProps): import("react/jsx-runtime").JSX.Element;
/**
 * Message d'erreur inline (plus compact)
 */
export declare function InlineError({
  message,
}: {
  message: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Message d'erreur pour les champs de formulaire
 */
export declare function FieldError({
  message,
}: {
  message?: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
