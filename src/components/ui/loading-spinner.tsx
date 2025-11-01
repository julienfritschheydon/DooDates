import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  /** Taille du spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Texte à afficher sous le spinner */
  text?: string;
  /** Classe CSS additionnelle */
  className?: string;
  /** Centrer verticalement et horizontalement */
  centered?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

/**
 * Composant de loading spinner cohérent
 * Utilise Lucide React pour l'icône
 */
export function LoadingSpinner({
  size = "md",
  text,
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full">{content}</div>
    );
  }

  return content;
}

/**
 * Spinner inline pour les boutons
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

/**
 * Overlay de loading plein écran
 */
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  );
}
