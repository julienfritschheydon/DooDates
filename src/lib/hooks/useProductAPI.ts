import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { ErrorFactory } from "@/lib/error-handling";

interface APIResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

interface UseProductAPIOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

export const useProductAPI = (options: UseProductAPIOptions = {}) => {
  const { baseUrl = "/api/products", defaultHeaders = {} } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { user, session } = useAuth();
  const { toast } = useToast();

  const makeRequest = useCallback(
    async <T>(endpoint: string, fetchOptions: RequestInit = {}): Promise<T> => {
      if (!user) {
        throw ErrorFactory.auth("Utilisateur non authentifié", "Vous devez être connecté pour effectuer cette action");
      }

      setLoading(true);
      setError(null);

      try {
        const url = `${baseUrl}${endpoint}`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          ...defaultHeaders,
          ...fetchOptions.headers,
        };

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw ErrorFactory.api(`Erreur HTTP ${response.status}: ${errorText}`, "Erreur du serveur", { status: response.status });
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erreur réseau");
        setError(error);

        toast({
          title: "Erreur API",
          description: error.message,
          variant: "destructive",
        });

        logger.error("Erreur lors de la requête API", "api", { endpoint, error });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, baseUrl, defaultHeaders, toast],
  );

  const get = useCallback(
    <T>(endpoint: string) => {
      return makeRequest<T>(endpoint, { method: "GET" });
    },
    [makeRequest],
  );

  const post = useCallback(
    <T>(endpoint: string, data?: any) => {
      return makeRequest<T>(endpoint, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [makeRequest],
  );

  const put = useCallback(
    <T>(endpoint: string, data?: any) => {
      return makeRequest<T>(endpoint, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [makeRequest],
  );

  const patch = useCallback(
    <T>(endpoint: string, data?: any) => {
      return makeRequest<T>(endpoint, {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    [makeRequest],
  );

  const del = useCallback(
    <T>(endpoint: string) => {
      return makeRequest<T>(endpoint, { method: "DELETE" });
    },
    [makeRequest],
  );

  return {
    loading,
    error,
    get,
    post,
    put,
    patch,
    delete: del,
    clearError: () => setError(null),
  };
};
