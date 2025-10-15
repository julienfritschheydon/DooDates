/**
 * Centralized Error Handling System for DooDates
 * 
 * This module provides consistent error handling patterns across the application.
 * It standardizes how errors are logged, reported, and handled.
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  STORAGE = 'storage',
  AUTH = 'auth',
  API = 'api',
  SYSTEM = 'system'
}

export interface ErrorContext {
  component?: string;
  operation?: string;
  conversationId?: string;
  pollId?: string;
  slug?: string;
  status?: number;
  pollData?: any;
  questionId?: string;
  maxChoices?: number;
  metadata?: Record<string, any>;
}

export class DooDatesError extends Error {
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly timestamp: string;
  public readonly userMessage: string;

  constructor(
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = 'DooDatesError';
    this.severity = severity;
    this.category = category;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.userMessage = userMessage;
  }
}

/**
 * Centralized error logging function
 */
export function logError(
  error: Error | DooDatesError,
  context: ErrorContext = {}
): void {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    ...(error instanceof DooDatesError && {
      severity: error.severity,
      category: error.category,
      userMessage: error.userMessage
    })
  };

  // Always log to console in development
  if (import.meta.env.DEV) {
    console.error('🚨 DooDates Error:', errorInfo);
  }

  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
    console.error('Error logged:', errorInfo);
  }
}

/**
 * Handle and log errors consistently
 */
export function handleError(
  error: unknown,
  context: ErrorContext = {},
  fallbackMessage: string = "Une erreur inattendue s'est produite"
): DooDatesError {
  let processedError: DooDatesError;

  if (error instanceof DooDatesError) {
    processedError = error;
  } else if (error instanceof Error) {
    processedError = new DooDatesError(
      error.message,
      fallbackMessage,
      ErrorSeverity.MEDIUM,
      ErrorCategory.SYSTEM,
      context
    );
  } else {
    processedError = new DooDatesError(
      String(error),
      fallbackMessage,
      ErrorSeverity.MEDIUM,
      ErrorCategory.SYSTEM,
      context
    );
  }

  logError(processedError, context);
  return processedError;
}

/**
 * Create specific error types for common scenarios
 */
export const ErrorFactory = {
  network: (message: string, userMessage: string = "Problème de connexion réseau") =>
    new DooDatesError(message, userMessage, ErrorSeverity.HIGH, ErrorCategory.NETWORK),

  validation: (message: string, userMessage: string = "Données invalides", metadata?: Record<string, any>) =>
    new DooDatesError(message, userMessage, ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION, { metadata }),

  storage: (message: string, userMessage: string = "Erreur de sauvegarde") =>
    new DooDatesError(message, userMessage, ErrorSeverity.HIGH, ErrorCategory.STORAGE),

  auth: (message: string, userMessage: string = "Erreur d'authentification") =>
    new DooDatesError(message, userMessage, ErrorSeverity.HIGH, ErrorCategory.AUTH),

  api: (message: string, userMessage: string = "Erreur du service", metadata?: Record<string, any>) =>
    new DooDatesError(message, userMessage, ErrorSeverity.HIGH, ErrorCategory.API, { metadata }),

  rateLimit: (message: string, userMessage: string = "Trop de tentatives") =>
    new DooDatesError(message, userMessage, ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION),

  critical: (message: string, userMessage: string = "Erreur critique du système") =>
    new DooDatesError(message, userMessage, ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM)
};

/**
 * Wrapper for async operations with consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallbackMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handleError(error, context, fallbackMessage);
  }
}

/**
 * Error boundary helper for React components
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof DooDatesError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur inattendue s'est produite";
}
