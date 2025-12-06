/**
 * Supabase API Utilities
 * Centralized functions for making authenticated requests to Supabase REST API
 */

import { logger } from "./logger";
import { ErrorFactory } from "./error-handling";
import type { Session } from "@supabase/supabase-js";

/**
 * Get Supabase session from localStorage
 * Checks both modern and legacy storage formats
 * @returns Session object or null if not found
 */
export function getSupabaseSessionFromLocalStorage(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Try modern Supabase auth storage
    const stored = localStorage.getItem("supabase.auth.token");
    if (stored) {
      const parsed = JSON.parse(stored);
      const candidate = (parsed.currentSession ?? parsed.session ?? parsed) as Session | undefined;
      if (candidate?.user && candidate.access_token) {
        return candidate;
      }
    }
  } catch (error) {
    logger.debug("Failed to parse supabase.auth.token", "api", error);
  }

  try {
    // Try legacy storage format (all sb-*-auth-token keys)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const value = localStorage.getItem(key);
        if (!value) continue;
        const candidate = JSON.parse(value) as Session;
        if (candidate?.user && candidate.access_token) {
          return candidate;
        }
      }
    }
  } catch (error) {
    logger.debug("Failed to parse legacy Supabase session", "api", error);
  }

  return null;
}

/**
 * Get JWT token from localStorage
 * Compatible with Supabase auth storage
 * @returns JWT token string or null if not found
 */
export function getSupabaseToken(): string | null {
  const session = getSupabaseSessionFromLocalStorage();
  return session?.access_token ?? null;
}

/**
 * Get Supabase session with timeout fallback
 * First tries localStorage (fast, non-blocking), then falls back to getSession() with timeout
 * @param timeoutMs - Timeout for getSession() call (default: 500ms)
 * @returns Session object or null if not found
 */
export async function getSupabaseSessionWithTimeout(
  timeoutMs: number = 500,
): Promise<Session | null> {
  // First try localStorage (fast, non-blocking)
  const localSession = getSupabaseSessionFromLocalStorage();
  if (localSession) {
    return localSession;
  }

  // Fallback to getSession() with timeout
  try {
    const { supabase } = await import("./supabase");

    const sessionTimeoutPromise = new Promise<{ data: { session: null } }>((resolve) => {
      setTimeout(() => {
        logger.debug(`getSession() timeout after ${timeoutMs}ms`, "api");
        resolve({ data: { session: null } });
      }, timeoutMs);
    });

    const sessionPromise = supabase.auth.getSession();
    const sessionResult = await Promise.race([sessionPromise, sessionTimeoutPromise]);
    return sessionResult.data?.session ?? null;
  } catch (error) {
    logger.warn("Error getting Supabase session", "api", error);
    return null;
  }
}

/**
 * Make authenticated request to Supabase REST API
 * Uses fetch directly with JWT token from localStorage
 *
 * @param table - Table name (e.g., "conversations", "polls")
 * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param options - Request options
 * @returns Response data or throws error
 */
export async function supabaseRestApi<T = Record<string, unknown>>(
  table: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  options: {
    body?: unknown;
    query?: Record<string, string>;
    timeout?: number;
    requireAuth?: boolean;
  } = {},
): Promise<T> {
  const { body, query, timeout = 10000, requireAuth = true } = options;

  // Helper function to perform the fetch
  const performFetch = async (token: string | null) => {
    // Build URL
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!baseUrl || !anonKey) {
      throw ErrorFactory.validation("Supabase configuration missing", "System configuration error");
    }

    let url = `${baseUrl}/rest/v1/${table}`;
    if (query) {
      const queryString = new URLSearchParams(query).toString();
      url += `?${queryString}`;
    }

    // Build headers
    const headers: Record<string, string> = {
      apikey: anonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Create fetch promise
    const fetchPromise = fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Add timeout
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  };

  // Initial attempt
  let token = getSupabaseToken();
  if (requireAuth && !token) {
    // Try to get a fresh session if no token found but auth required
    // This handles cases where localStorage might be empty but the SDK has a session in memory/cookie
    const session = await getSupabaseSessionWithTimeout(1000);
    token = session?.access_token ?? null;

    if (!token) {
      throw ErrorFactory.auth("No authentication token found", "Please sign in to continue");
    }
  }

  let response = await performFetch(token);

  // Handle 401 (Unauthorized) - Try to refresh session
  if (response.status === 401 && requireAuth) {
    logger.warn("Supabase API 401 - Attempting session refresh", "api");

    try {
      // Force refresh session
      const { supabase } = await import("./supabase");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        logger.error("Failed to refresh session", "api", error);
        throw ErrorFactory.auth(
          "Session expired",
          "Votre session a expiré. Veuillez vous reconnecter.",
        );
      }

      // Retry with new token
      token = session.access_token;
      response = await performFetch(token);

      if (response.ok) {
        logger.info("Session refresh successful, request retried", "api");
      }
    } catch (refreshError) {
      // If refresh fails, throw original 401 or auth error
      logger.error("Session refresh failed", "api", refreshError);
      // Fall through to error handling below
    }
  }

  // Handle response
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    logger.error(`Supabase API error (${method} ${table})`, "api", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });

    if (response.status === 401) {
      throw ErrorFactory.auth(
        `Supabase API error: ${response.status} ${errorData?.message || response.statusText}`,
        "Votre session a expiré. Veuillez vous reconnecter.",
      );
    }

    throw ErrorFactory.network(
      `Supabase API error: ${response.status} ${errorData?.message || response.statusText}`,
      "Unable to complete the operation. Please try again.",
    );
  }

  // Parse response
  const data = await response.json();
  return data as T;
}

/**
 * Insert data into Supabase table
 */
export async function supabaseInsert<T = Record<string, unknown>>(
  table: string,
  data: unknown,
  options: { timeout?: number; requireAuth?: boolean } = {},
): Promise<T> {
  const result = await supabaseRestApi<T[]>(table, "POST", {
    body: data,
    timeout: options.timeout,
    requireAuth: options.requireAuth,
  });

  // Supabase returns array with single item
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Update data in Supabase table
 */
export async function supabaseUpdate<T = Record<string, unknown>>(
  table: string,
  data: unknown,
  query: Record<string, string>,
  options: { timeout?: number; requireAuth?: boolean } = {},
): Promise<T> {
  const result = await supabaseRestApi<T[]>(table, "PATCH", {
    body: data,
    query,
    timeout: options.timeout,
    requireAuth: options.requireAuth,
  });

  return Array.isArray(result) ? result[0] : result;
}

/**
 * Delete data from Supabase table
 */
export async function supabaseDelete(
  table: string,
  query: Record<string, string>,
  options: { timeout?: number; requireAuth?: boolean } = {},
): Promise<void> {
  await supabaseRestApi(table, "DELETE", {
    query,
    timeout: options.timeout,
    requireAuth: options.requireAuth,
  });
}

/**
 * Get data from Supabase table
 *
 * @example
 * // Get all conversations for a user
 * supabaseSelect("conversations", {
 *   user_id: `eq.${userId}`,
 *   order: "updated_at.desc",
 *   select: "*"
 * })
 */
export async function supabaseSelect<T = Record<string, unknown>>(
  table: string,
  query: Record<string, string>,
  options: { timeout?: number; requireAuth?: boolean } = {},
): Promise<T[]> {
  return await supabaseRestApi<T[]>(table, "GET", {
    query,
    timeout: options.timeout,
    requireAuth: options.requireAuth,
  });
}

/**
 * Get single row from Supabase table (equivalent to .single())
 * Throws error if not found or multiple rows
 */
export async function supabaseSelectSingle<T = Record<string, unknown>>(
  table: string,
  query: Record<string, string>,
  options: { timeout?: number; requireAuth?: boolean } = {},
): Promise<T> {
  const queryWithSingle = {
    ...query,
    limit: "1",
  };
  const results = await supabaseRestApi<T[]>(table, "GET", {
    query: queryWithSingle,
    timeout: options.timeout,
    requireAuth: options.requireAuth,
  });

  if (!results || results.length === 0) {
    throw ErrorFactory.validation("No row found", "Aucune ligne trouvée");
  }
  if (results.length > 1) {
    throw ErrorFactory.validation("Multiple rows found", "Plusieurs lignes trouvées");
  }
  return results[0];
}

/**
 * Get single row from Supabase table (equivalent to .maybeSingle())
 * Returns null if not found, throws error if multiple rows
 */
export async function supabaseSelectMaybeSingle<T = Record<string, unknown>>(
  table: string,
  query: Record<string, string>,
  options: { timeout?: number; requireAuth?: boolean } = {},
): Promise<T | null> {
  const queryWithSingle = {
    ...query,
    limit: "1",
  };
  const results = await supabaseRestApi<T[]>(table, "GET", {
    query: queryWithSingle,
    timeout: options.timeout,
    requireAuth: options.requireAuth,
  });

  if (!results || results.length === 0) {
    return null;
  }
  if (results.length > 1) {
    throw ErrorFactory.validation("Multiple rows found", "Plusieurs lignes trouvées");
  }
  return results[0];
}

/**
 * Call Supabase Edge Function
 * Uses session from localStorage or getSession() with timeout
 *
 * @param functionName - Name of the Edge Function (e.g., "quota-tracking")
 * @param body - Request body to send to the Edge Function
 * @param options - Request options
 * @returns Response data from Edge Function
 */
export async function callSupabaseEdgeFunction<T = Record<string, unknown>>(
  functionName: string,
  body: unknown,
  options: {
    timeout?: number;
    requireAuth?: boolean;
  } = {},
): Promise<T> {
  const { timeout = 2000, requireAuth = true } = options;

  // Get session (with timeout fallback)
  const session = await getSupabaseSessionWithTimeout(500);
  if (requireAuth && !session?.access_token) {
    throw ErrorFactory.auth("No authentication token found", "Please sign in to continue");
  }

  // Build URL
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw ErrorFactory.validation("Supabase configuration missing", "System configuration error");
  }

  const edgeFunctionUrl = `${baseUrl}/functions/v1/${functionName}`;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  // Create fetch promise
  const fetchPromise = fetch(edgeFunctionUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).then(async (res) => {
    let data: T;
    try {
      const text = await res.text();
      data = JSON.parse(text) as T;
    } catch (parseError) {
      logger.error("Failed to parse Edge Function response", "api", parseError);
      throw ErrorFactory.validation(
        "Invalid response from Edge Function",
        "Réponse invalide de l'Edge Function",
      );
    }

    if (!res.ok) {
      logger.error(`Edge Function error (${functionName})`, "api", {
        status: res.status,
        statusText: res.statusText,
        error: data,
      });

      const errorMessage = (data as { error?: string })?.error || res.statusText;
      throw ErrorFactory.network(
        `Edge Function error: ${res.status} ${errorMessage}`,
        errorMessage || "Unable to complete the operation. Please try again.",
      );
    }

    return data;
  });

  // Add timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Edge Function timeout after ${timeout}ms`));
    }, timeout);
  });

  // Execute with timeout
  return await Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Call Supabase RPC function
 * Uses session from localStorage or getSession() with timeout
 *
 * @param functionName - Name of the RPC function (e.g., "generate_beta_key")
 * @param params - Parameters to pass to the RPC function
 * @param options - Request options
 * @returns Response data from RPC function
 */
export async function supabaseRpc<T = Record<string, unknown>>(
  functionName: string,
  params: Record<string, unknown> = {},
  options: {
    timeout?: number;
    requireAuth?: boolean;
  } = {},
): Promise<T> {
  const { timeout = 10000, requireAuth = true } = options;

  // Get session (with timeout fallback)
  const session = await getSupabaseSessionWithTimeout(500);
  if (requireAuth && !session?.access_token) {
    throw ErrorFactory.auth("No authentication token found", "Please sign in to continue");
  }

  // Build URL
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw ErrorFactory.validation("Supabase configuration missing", "System configuration error");
  }

  const rpcUrl = `${baseUrl}/rest/v1/rpc/${functionName}`;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Prefer: "return=representation",
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  // Create fetch promise
  const fetchPromise = fetch(rpcUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  }).then(async (res) => {
    let data: T;
    try {
      const text = await res.text();
      if (!text) {
        return null as T;
      }
      data = JSON.parse(text) as T;
    } catch (parseError) {
      logger.error("Failed to parse RPC response", "api", parseError);
      throw ErrorFactory.validation(
        "Invalid response from RPC function",
        "Réponse invalide de la fonction RPC",
      );
    }

    if (!res.ok) {
      logger.error(`RPC error (${functionName})`, "api", {
        status: res.status,
        statusText: res.statusText,
        error: data,
      });

      const errorMessage =
        (data as { error?: string; message?: string })?.error ||
        (data as { error?: string; message?: string })?.message ||
        res.statusText;
      throw ErrorFactory.network(
        `RPC error: ${res.status} ${errorMessage}`,
        errorMessage || "Unable to complete the operation. Please try again.",
      );
    }

    return data;
  });

  // Add timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`RPC timeout after ${timeout}ms`));
    }, timeout);
  });

  // Execute with timeout
  return await Promise.race([fetchPromise, timeoutPromise]);
}
