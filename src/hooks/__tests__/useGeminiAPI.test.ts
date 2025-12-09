/**
 * Tests unitaires pour useGeminiAPI hook
 *
 * Teste la logique de gestion des appels API Gemini :
 * - Génération de polls à partir de messages utilisateur
 * - Gestion des erreurs (quota, réseau, parsing)
 * - États du hook (loading, error)
 * - Callbacks optionnels
 * - Validation des inputs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useGeminiAPI, GeminiAPIResponse } from "../useGeminiAPI";
import { geminiService, type PollSuggestion } from "../../lib/ai/gemini";
import { handleError, logError } from "../../lib/error-handling";

// Mocks
vi.mock("../../lib/ai/gemini", () => ({
  geminiService: {
    generatePollFromText: vi.fn(),
  },
}));

vi.mock("../../lib/error-handling", () => ({
  handleError: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useGeminiAPI", () => {
  const mockGeminiService = vi.mocked(geminiService);
  const mockHandleError = vi.mocked(handleError);
  const mockLogError = vi.mocked(logError);

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto.randomUUID pour la reproductibilité
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "test-uuid-123" as `${string}-${string}-${string}-${string}-${string}`,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useGeminiAPI());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.generatePoll).toBe("function");
      expect(typeof result.current.clearError).toBe("function");
    });

    it("should accept optional callbacks", () => {
      const onQuotaExceeded = vi.fn();
      const onNetworkError = vi.fn();

      const { result } = renderHook(() =>
        useGeminiAPI({
          onQuotaExceeded,
          onNetworkError,
          debug: true,
        }),
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("generatePoll", () => {
    it("should return success response when Gemini service succeeds", async () => {
      const mockPollData = {
        title: "Test Poll",
        description: "A test poll",
        dates: ["2025-01-15", "2025-01-16"],
        type: "date" as const,
      };

      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: true,
        data: mockPollData,
        message: "Success",
      });

      const { result } = renderHook(() => useGeminiAPI());

      let response;
      await act(async () => {
        response = await result.current.generatePoll("Organise une réunion demain");
      });

      expect(response).toEqual({
        success: true,
        data: mockPollData,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle empty message", async () => {
      const { result } = renderHook(() => useGeminiAPI());

      let response;
      await act(async () => {
        response = await result.current.generatePoll("");
      });

      expect(response).toEqual({
        success: false,
        error: "Message vide",
        errorType: "unknown",
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle whitespace-only message", async () => {
      const { result } = renderHook(() => useGeminiAPI());

      let response;
      await act(async () => {
        response = await result.current.generatePoll("   \n\t   ");
      });

      expect(response).toEqual({
        success: false,
        error: "Message vide",
        errorType: "unknown",
      });
    });

    it("should trim message before processing", async () => {
      const mockPollData = {
        title: "Test Poll",
        description: "A test poll",
        dates: ["2025-01-15"],
        type: "date" as const,
      };

      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: true,
        data: mockPollData,
        message: "Success",
      });

      const { result } = renderHook(() => useGeminiAPI());

      let response: GeminiAPIResponse | undefined;
      await act(async () => {
        response = await result.current.generatePoll("  Organise une réunion demain  ");
      });

      expect(mockGeminiService.generatePollFromText).toHaveBeenCalledTimes(1);
      const firstCall = mockGeminiService.generatePollFromText.mock.calls[0];
      expect(firstCall[0]).toBe("Organise une réunion demain");
      expect(response?.success).toBe(true);
    });

    it("should set loading state during request", async () => {
      let resolvePromise: (value: {
        success: boolean;
        data?: any;
        message: string;
        error?: string;
      }) => void;
      const promise = new Promise<{
        success: boolean;
        data?: any;
        message: string;
        error?: string;
      }>((resolve) => {
        resolvePromise = resolve;
      });

      mockGeminiService.generatePollFromText.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useGeminiAPI());

      // Start the async operation
      act(() => {
        result.current.generatePoll("Test message");
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise({
          success: true,
          data: { title: "Test", dates: ["2025-01-01"], type: "date" },
          message: "Success",
        });
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle quota exceeded error", async () => {
      const onQuotaExceeded = vi.fn();

      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: false,
        error: "Quota exceeded",
        message: "Quota exceeded",
      });

      const { result } = renderHook(() => useGeminiAPI({ onQuotaExceeded }));

      let response: GeminiAPIResponse | undefined;
      await act(async () => {
        response = await result.current.generatePoll("Test message");
      });

      expect(response).toEqual({
        success: false,
        error:
          "Limite de quota atteinte. Veuillez réessayer plus tard ou vous connecter pour plus de requêtes.",
        errorType: "quota",
      });
      expect(result.current.error).toBe(
        "Limite de quota atteinte. Veuillez réessayer plus tard ou vous connecter pour plus de requêtes.",
      );
      expect(onQuotaExceeded).toHaveBeenCalledTimes(1);
    });

    it("should handle network error", async () => {
      const onNetworkError = vi.fn();

      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: false,
        error: "Network error",
        message: "Network error",
      });

      const { result } = renderHook(() => useGeminiAPI({ onNetworkError }));

      let response: GeminiAPIResponse | undefined;
      await act(async () => {
        response = await result.current.generatePoll("Test message");
      });

      expect(response).toEqual({
        success: false,
        error: "Problème de connexion réseau. Vérifiez votre connexion internet.",
        errorType: "network",
      });
      expect(result.current.error).toBe(
        "Problème de connexion réseau. Vérifiez votre connexion internet.",
      );
      expect(onNetworkError).toHaveBeenCalledTimes(1);
    });

    it("should handle parsing error", async () => {
      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: false,
        error: "JSON parsing failed",
        message: "JSON parsing failed",
      });

      const { result } = renderHook(() => useGeminiAPI());

      let response: GeminiAPIResponse | undefined;
      await act(async () => {
        response = await result.current.generatePoll("Test message");
      });

      expect(response).toEqual({
        success: false,
        error: "Erreur lors de l'analyse de la réponse. Veuillez reformuler votre demande.",
        errorType: "parsing",
      });
      expect(result.current.error).toBe(
        "Erreur lors de l'analyse de la réponse. Veuillez reformuler votre demande.",
      );
    });

    it("should handle unknown error", async () => {
      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: false,
        error: "Some unknown error",
        message: "Some unknown error",
      });

      const { result } = renderHook(() => useGeminiAPI());

      let response: GeminiAPIResponse | undefined;
      await act(async () => {
        response = await result.current.generatePoll("Test message");
      });

      expect(response).toEqual({
        success: false,
        error:
          "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
        errorType: "unknown",
      });
      expect(result.current.error).toBe(
        "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
      );
    });

    it("should handle service exception", async () => {
      const testError = new Error("Service unavailable");

      mockGeminiService.generatePollFromText.mockRejectedValueOnce(testError);
      mockHandleError.mockReturnValue({
        message: "Service unavailable",
        name: "DooDatesError",
        severity: "medium" as any,
        category: "system" as any,
        context: {},
        timestamp: new Date().toISOString(),
        userMessage: "Service unavailable",
      });

      const { result } = renderHook(() => useGeminiAPI());

      let response: GeminiAPIResponse | undefined;
      await act(async () => {
        response = await result.current.generatePoll("Test message");
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        testError,
        { component: "useGeminiAPI", operation: "generatePoll" },
        "Erreur lors de l'appel API Gemini",
      );

      expect(mockLogError).toHaveBeenCalledTimes(1);
      expect(response).toEqual({
        success: false,
        error:
          "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
        errorType: "unknown",
      });
      expect(result.current.error).toBe(
        "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
      );
    });

    it("should handle service exception with network error type", async () => {
      const onNetworkError = vi.fn();

      mockGeminiService.generatePollFromText.mockRejectedValueOnce(new Error("fetch failed"));
      mockHandleError.mockReturnValue({
        message: "Network connection failed",
        name: "DooDatesError",
        severity: "high" as any,
        category: "network" as any,
        context: {},
        timestamp: new Date().toISOString(),
        userMessage: "Network connection failed",
      });

      const { result } = renderHook(() => useGeminiAPI({ onNetworkError }));

      let response: GeminiAPIResponse | undefined;
      await act(async () => {
        response = await result.current.generatePoll("Test message");
      });

      expect(onNetworkError).toHaveBeenCalledTimes(1);
      expect(response?.errorType).toBe("network");
    });

    it("should enable debug logging when debug option is true", async () => {
      const mockPollData = {
        title: "Test Poll",
        dates: ["2025-01-15"],
        type: "date" as const,
      };

      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: true,
        data: mockPollData,
        message: "Success",
      });

      const { result } = renderHook(() => useGeminiAPI({ debug: true }));

      await act(async () => {
        await result.current.generatePoll("Test message");
      });

      // The logger calls would happen in the actual implementation
      // We can't easily test them without exposing them, so we just ensure the function works
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: false,
        error: "Some error",
        message: "Some error",
      });

      const { result } = renderHook(() => useGeminiAPI());

      // Generate an error
      await act(async () => {
        await result.current.generatePoll("Test message");
      });

      expect(result.current.error).not.toBeNull();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Callback updates", () => {
    it("should update callbacks when they change", async () => {
      const onQuotaExceeded1 = vi.fn();
      const onQuotaExceeded2 = vi.fn();

      let currentOptions = { onQuotaExceeded: onQuotaExceeded1 };

      const { result, rerender } = renderHook(() => useGeminiAPI(currentOptions));

      // Update callbacks
      currentOptions = { onQuotaExceeded: onQuotaExceeded2 };
      rerender(currentOptions);

      // Trigger quota error
      mockGeminiService.generatePollFromText.mockResolvedValueOnce({
        success: false,
        error: "Quota exceeded",
        message: "Quota exceeded",
      });

      await act(async () => {
        await result.current.generatePoll("Test message");
      });

      expect(onQuotaExceeded1).not.toHaveBeenCalled();
      expect(onQuotaExceeded2).toHaveBeenCalledTimes(1);
    });
  });
});
