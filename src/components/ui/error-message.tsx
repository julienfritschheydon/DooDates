import { cn } from "@/lib/utils";
import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { borderRadius, padding } from "@/lib/design-tokens";

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

const variantStyles = {
  error: {
    container: "bg-red-50 border-red-200 text-red-900",
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    titleColor: "text-red-900",
  },
  warning: {
    container: "bg-orange-50 border-orange-200 text-orange-900",
    icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
    titleColor: "text-orange-900",
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-900",
    icon: <Info className="h-5 w-5 text-blue-600" />,
    titleColor: "text-blue-900",
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-900",
    icon: <AlertCircle className="h-5 w-5 text-green-600" />,
    titleColor: "text-green-900",
  },
};

/**
 * Composant de message d'erreur cohérent
 * Supporte différents variants (error, warning, info, success)
 */
export function ErrorMessage({
  variant = "error",
  title,
  message,
  className,
  action,
}: ErrorMessageProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn("border", borderRadius.lg, padding.md, styles.container, className)}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
        <div className="flex-1">
          {title && <h3 className={cn("font-semibold mb-1", styles.titleColor)}>{title}</h3>}
          <p className="text-sm">{message}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * Message d'erreur inline (plus compact)
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-red-600 text-sm">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Message d'erreur pour les champs de formulaire
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span>{message}</span>
    </p>
  );
}
