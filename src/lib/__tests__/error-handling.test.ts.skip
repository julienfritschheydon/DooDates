/**
 * Tests for error-handling.ts
 * DooDates - Centralized Error Handling System
 */

/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DooDatesError,
  ErrorSeverity,
  ErrorCategory,
  logError,
  handleError,
  ErrorFactory,
  withErrorHandling,
  getErrorMessage,
} from "../error-handling";

// Mock console methods
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("error-handling.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("DooDatesError", () => {
    it("should create error with default values", () => {
      const error = new DooDatesError("Test message", "User message");

      expect(error.message).toBe("Test message");
      expect(error.name).toBe("DooDatesError");
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.userMessage).toBe("User message");
      expect(error.timestamp).toBeDefined();
      expect(error.context).toEqual({});
    });

    it("should create error with custom severity and category", () => {
      const error = new DooDatesError(
        "Test message",
        "User message",
        ErrorSeverity.CRITICAL,
        ErrorCategory.NETWORK,
        { component: "TestComponent" }
      );

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.context).toEqual({ component: "TestComponent" });
    });

    it("should extend Error class", () => {
      const error = new DooDatesError("Test message", "User message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.stack).toBeDefined();
    });
  });

  describe("logError", () => {
    it("should log DooDatesError with full information", () => {
      const error = new DooDatesError(
        "Test error",
        "User message",
        ErrorSeverity.HIGH,
        ErrorCategory.API,
        { component: "TestComponent" }
      );

      logError(error, { operation: "testOperation" });

      expect(consoleErrorSpy).toHaveBeenCalledWith("🚨 DooDates Error:", {
        message: "Test error",
        name: "DooDatesError",
        stack: expect.any(String),
        timestamp: expect.any(String),
        context: { operation: "testOperation" },
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.API,
        userMessage: "User message",
      });
    });

    it("should log regular Error", () => {
      const error = new Error("Regular error");

      logError(error, { component: "TestComponent" });

      expect(consoleErrorSpy).toHaveBeenCalledWith("🚨 DooDates Error:", {
        message: "Regular error",
        name: "Error",
        stack: expect.any(String),
        timestamp: expect.any(String),
        context: { component: "TestComponent" },
      });
    });

    it("should handle empty context", () => {
      const error = new Error("Test error");

      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith("🚨 DooDates Error:", {
        message: "Test error",
        name: "Error",
        stack: expect.any(String),
        timestamp: expect.any(String),
        context: {},
      });
    });
  });

  describe("handleError", () => {
    it("should handle DooDatesError as-is", () => {
      const originalError = new DooDatesError(
        "Original message",
        "User message",
        ErrorSeverity.HIGH,
        ErrorCategory.STORAGE
      );

      const result = handleError(originalError, { component: "TestComponent" });

      expect(result).toBe(originalError);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should wrap regular Error in DooDatesError", () => {
      const originalError = new Error("Network error");

      const result = handleError(originalError, { component: "TestComponent" }, "Custom fallback");

      expect(result).toBeInstanceOf(DooDatesError);
      expect(result.message).toBe("Network error");
      expect(result.userMessage).toBe("Custom fallback");
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.category).toBe(ErrorCategory.SYSTEM);
      expect(result.context).toEqual({ component: "TestComponent" });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle non-Error values", () => {
      const result = handleError("String error", {}, "Fallback message");

      expect(result).toBeInstanceOf(DooDatesError);
      expect(result.message).toBe("String error");
      expect(result.userMessage).toBe("Fallback message");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should use default fallback message", () => {
      const result = handleError(new Error("Test error"));

      expect(result.userMessage).toBe("Une erreur inattendue s'est produite");
    });
  });

  describe("ErrorFactory", () => {
    it("should create network error", () => {
      const error = ErrorFactory.network("Connection failed", "Connexion perdue");

      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.message).toBe("Connection failed");
      expect(error.userMessage).toBe("Connexion perdue");
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.NETWORK);
    });

    it("should create validation error", () => {
      const error = ErrorFactory.validation("Invalid data", "Données incorrectes", { field: "email" });

      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.message).toBe("Invalid data");
      expect(error.userMessage).toBe("Données incorrectes");
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.context.metadata).toEqual({ field: "email" });
    });

    it("should create storage error", () => {
      const error = ErrorFactory.storage("Save failed", "Sauvegarde échouée");

      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.message).toBe("Save failed");
      expect(error.userMessage).toBe("Sauvegarde échouée");
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.STORAGE);
    });

    it("should create auth error", () => {
      const error = ErrorFactory.auth("Auth failed", "Authentification requise");

      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.message).toBe("Auth failed");
      expect(error.userMessage).toBe("Authentification requise");
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.AUTH);
    });

    it("should create API error", () => {
      const error = ErrorFactory.api("API error", "Service indisponible", { status: 500 });

      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.message).toBe("API error");
      expect(error.userMessage).toBe("Service indisponible");
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.API);
      expect(error.context.metadata).toEqual({ status: 500 });
    });

    it("should create rate limit error", () => {
      const error = ErrorFactory.rateLimit("Too many requests", "Trop de tentatives");

      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.message).toBe("Too many requests");
      expect(error.userMessage).toBe("Trop de tentatives");
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
    });

    it("should create critical error", () => {
      const error = ErrorFactory.critical("System crash", "Erreur système critique");

      expect(error).toBeInstanceOf(DooDatesError);
      expect(error.message).toBe("System crash");
      expect(error.userMessage).toBe("Erreur système critique");
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.category).toBe(ErrorCategory.SYSTEM);
    });

    it("should use default messages when not provided", () => {
      const networkError = ErrorFactory.network("Connection failed");
      const validationError = ErrorFactory.validation("Invalid data");
      const storageError = ErrorFactory.storage("Save failed");
      const authError = ErrorFactory.auth("Auth failed");
      const apiError = ErrorFactory.api("API error");

      expect(networkError.userMessage).toBe("Problème de connexion réseau");
      expect(validationError.userMessage).toBe("Données invalides");
      expect(storageError.userMessage).toBe("Erreur de sauvegarde");
      expect(authError.userMessage).toBe("Erreur d'authentification");
      expect(apiError.userMessage).toBe("Erreur du service");
    });
  });

  describe("withErrorHandling", () => {
    it("should return successful operation result", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      const result = await withErrorHandling(
        operation,
        { component: "TestComponent" },
        "Fallback message"
      );

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalled();
    });

    it("should handle operation errors", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Operation failed"));

      await expect(
        withErrorHandling(operation, { component: "TestComponent" }, "Custom fallback")
      ).rejects.toThrow(DooDatesError);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should use default fallback message", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Operation failed"));

      try {
        await withErrorHandling(operation, { component: "TestComponent" });
      } catch (error) {
        expect(error).toBeInstanceOf(DooDatesError);
        expect((error as DooDatesError).userMessage).toBe("Une erreur inattendue s'est produite");
      }
    });
  });

  describe("getErrorMessage", () => {
    it("should return userMessage for DooDatesError", () => {
      const error = new DooDatesError("Technical message", "User-friendly message");

      const message = getErrorMessage(error);

      expect(message).toBe("User-friendly message");
    });

    it("should return message for regular Error", () => {
      const error = new Error("Regular error message");

      const message = getErrorMessage(error);

      expect(message).toBe("Regular error message");
    });

    it("should return default message for unknown error", () => {
      const message = getErrorMessage("string error");

      expect(message).toBe("Une erreur inattendue s'est produite");
    });

    it("should return default message for null/undefined", () => {
      expect(getErrorMessage(null)).toBe("Une erreur inattendue s'est produite");
      expect(getErrorMessage(undefined)).toBe("Une erreur inattendue s'est produite");
    });
  });

  describe("ErrorSeverity enum", () => {
    it("should have correct values", () => {
      expect(ErrorSeverity.LOW).toBe("low");
      expect(ErrorSeverity.MEDIUM).toBe("medium");
      expect(ErrorSeverity.HIGH).toBe("high");
      expect(ErrorSeverity.CRITICAL).toBe("critical");
    });
  });

  describe("ErrorCategory enum", () => {
    it("should have correct values", () => {
      expect(ErrorCategory.NETWORK).toBe("network");
      expect(ErrorCategory.VALIDATION).toBe("validation");
      expect(ErrorCategory.STORAGE).toBe("storage");
      expect(ErrorCategory.AUTH).toBe("auth");
      expect(ErrorCategory.API).toBe("api");
      expect(ErrorCategory.SYSTEM).toBe("system");
    });
  });

  describe("ErrorContext interface", () => {
    it("should support various context properties", () => {
      const context = {
        component: "TestComponent",
        operation: "testOperation",
        conversationId: "conv-123",
        pollId: "poll-456",
        slug: "test-slug",
        status: 404,
        pollData: { type: "date" },
        questionId: "q1",
        maxChoices: 5,
        metadata: { custom: "value" },
      };

      const error = new DooDatesError("Test", "Test", ErrorSeverity.MEDIUM, ErrorCategory.SYSTEM, context);

      expect(error.context).toEqual(context);
    });
  });
});
