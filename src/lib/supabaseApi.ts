/**
 * Supabase API Utilities
 * Centralized functions for making authenticated requests to Supabase REST API
 */

import { logger } from "./logger";
import { ErrorFactory } from "./error-handling";

/**
 * Get JWT token from localStorage
 * Compatible with Supabase auth storage
 */
export function getSupabaseToken(): string | null {
  // Try modern Supabase auth storage
  const supabaseSession = localStorage.getItem("supabase.auth.token");
  if (supabaseSession) {
    try {
      const sessionData = JSON.parse(supabaseSession);
      const token = sessionData?.access_token || sessionData?.currentSession?.access_token;
      if (token) return token;
    } catch (e) {
      logger.warn("Failed to parse supabase.auth.token", "api");
    }
  }

  // Try legacy storage format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0];
    const authData = localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.access_token) return parsed.access_token;
      } catch (e) {
        logger.warn("Failed to parse legacy auth token", "api");
      }
    }
  }

  return null;
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
export async function supabaseRestApi<T = any>(
  table: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  options: {
    body?: any;
    query?: Record<string, string>;
    timeout?: number;
    requireAuth?: boolean;
  } = {},
): Promise<T> {
  const { body, query, timeout = 10000, requireAuth = true } = options;

  // Get token
  const token = getSupabaseToken();
  if (requireAuth && !token) {
    throw ErrorFactory.auth("No authentication token found", "Please sign in to continue");
  }

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
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });

  // Execute with timeout
  const response = await Promise.race([fetchPromise, timeoutPromise]);

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
export async function supabaseInsert<T = any>(
  table: string,
  data: any,
  options: { timeout?: number } = {},
): Promise<T> {
  const result = await supabaseRestApi<T[]>(table, "POST", {
    body: data,
    timeout: options.timeout,
  });

  // Supabase returns array with single item
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Update data in Supabase table
 */
export async function supabaseUpdate<T = any>(
  table: string,
  data: any,
  query: Record<string, string>,
  options: { timeout?: number } = {},
): Promise<T> {
  const result = await supabaseRestApi<T[]>(table, "PATCH", {
    body: data,
    query,
    timeout: options.timeout,
  });

  return Array.isArray(result) ? result[0] : result;
}

/**
 * Delete data from Supabase table
 */
export async function supabaseDelete(
  table: string,
  query: Record<string, string>,
  options: { timeout?: number } = {},
): Promise<void> {
  await supabaseRestApi(table, "DELETE", {
    query,
    timeout: options.timeout,
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
export async function supabaseSelect<T = any>(
  table: string,
  query: Record<string, string>,
  options: { timeout?: number } = {},
): Promise<T[]> {
  return await supabaseRestApi<T[]>(table, "GET", {
    query,
    timeout: options.timeout,
  });
}
