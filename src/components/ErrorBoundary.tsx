import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary pour capturer les erreurs React et éviter un crash complet de l'app
 * Gère les erreurs de rendu, de chargement de modules, etc.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l'erreur pour le débogage
    logger.error("ErrorBoundary caught an error", "general", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Sinon, afficher l'UI d'erreur par défaut
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Composant de fallback pour afficher les erreurs
 */
function ErrorFallback({
  error,
  onReset,
  onGoHome,
}: {
  error: Error | null;
  onReset: () => void;
  onGoHome: () => void;
}) {
  const isModuleError = error?.message?.includes("Failed to fetch dynamically imported module");
  const isNetworkError =
    error?.message?.includes("ERR_CONNECTION_REFUSED") ||
    error?.message?.includes("Failed to fetch");

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e1e1e] border border-red-500/50 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <h2 className="text-xl font-semibold text-white">Erreur de chargement</h2>
        </div>

        {isModuleError || isNetworkError ? (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Impossible de charger un module de l'application. Cela peut être dû à :
            </p>
            <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 ml-2">
              <li>Un problème de connexion réseau</li>
              <li>Le serveur de développement qui ne répond pas</li>
              <li>Un problème de cache du navigateur</li>
            </ul>
            <div className="pt-4 space-y-2">
              <button
                onClick={onReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
              <button
                onClick={onGoHome}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Une erreur inattendue s'est produite. L'application a été réinitialisée.
            </p>
            {error && (
              <details className="bg-[#0a0a0a] rounded p-3 text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-300 mb-2">
                  Détails techniques
                </summary>
                <pre className="whitespace-pre-wrap break-words">{error.message}</pre>
                {error.stack && (
                  <pre className="whitespace-pre-wrap break-words mt-2 text-xs opacity-75">
                    {error.stack}
                  </pre>
                )}
              </details>
            )}
            <div className="pt-4">
              <button
                onClick={onReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

