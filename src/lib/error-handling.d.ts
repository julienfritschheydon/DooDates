/**
 * Centralized Error Handling System for DooDates
 *
 * This module provides consistent error handling patterns across the application.
 * It standardizes how errors are logged, reported, and handled.
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ErrorCategory {
    NETWORK = "network",
    VALIDATION = "validation",
    STORAGE = "storage",
    AUTH = "auth",
    API = "api",
    SYSTEM = "system"
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
export declare class DooDatesError extends Error {
    readonly severity: ErrorSeverity;
    readonly category: ErrorCategory;
    readonly context: ErrorContext;
    readonly timestamp: string;
    readonly userMessage: string;
    constructor(message: string, userMessage: string, severity?: ErrorSeverity, category?: ErrorCategory, context?: ErrorContext);
}
/**
 * Centralized error logging function
 */
export declare function logError(error: Error | DooDatesError, context?: ErrorContext): void;
/**
 * Handle and log errors consistently
 */
export declare function handleError(error: unknown, context?: ErrorContext, fallbackMessage?: string): DooDatesError;
/**
 * Create specific error types for common scenarios
 */
export declare const ErrorFactory: {
    network: (message: string, userMessage?: string) => DooDatesError;
    validation: (message: string, userMessage?: string, metadata?: Record<string, any>) => DooDatesError;
    storage: (message: string, userMessage?: string) => DooDatesError;
    auth: (message: string, userMessage?: string) => DooDatesError;
    api: (message: string, userMessage?: string, metadata?: Record<string, any>) => DooDatesError;
    rateLimit: (message: string, userMessage?: string) => DooDatesError;
    critical: (message: string, userMessage?: string) => DooDatesError;
};
/**
 * Wrapper for async operations with consistent error handling
 */
export declare function withErrorHandling<T>(operation: () => Promise<T>, context: ErrorContext, fallbackMessage?: string): Promise<T>;
/**
 * Error boundary helper for React components
 */
export declare function getErrorMessage(error: unknown): string;
