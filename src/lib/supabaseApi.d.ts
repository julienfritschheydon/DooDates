/**
 * Supabase API Utilities
 * Centralized functions for making authenticated requests to Supabase REST API
 */
import type { Session } from "@supabase/supabase-js";
/**
 * Get Supabase session from localStorage
 * Checks both modern and legacy storage formats
 */
export declare function getSupabaseSessionFromLocalStorage(): Session | null;
/**
 * Get JWT token from localStorage
 * Compatible with Supabase auth storage
 */
export declare function getSupabaseToken(): string | null;
/**
 * Get Supabase session with timeout fallback
 * First tries localStorage (fast, non-blocking), then falls back to getSession() with timeout
 */
export declare function getSupabaseSessionWithTimeout(timeoutMs?: number): Promise<Session | null>;
/**
 * Make authenticated request to Supabase REST API
 * Uses fetch directly with JWT token from localStorage
 *
 * @param table - Table name (e.g., "conversations", "polls")
 * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param options - Request options
 * @returns Response data or throws error
 */
export declare function supabaseRestApi<T = Record<string, unknown>>(
  table: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  options?: {
    body?: unknown;
    query?: Record<string, string>;
    timeout?: number;
    requireAuth?: boolean;
  },
): Promise<T>;
/**
 * Insert data into Supabase table
 */
export declare function supabaseInsert<T = Record<string, unknown>>(
  table: string,
  data: Record<string, unknown>,
  options?: {
    timeout?: number;
  },
): Promise<T>;
/**
 * Update data in Supabase table
 */
export declare function supabaseUpdate<T = Record<string, unknown>>(
  table: string,
  data: Record<string, unknown>,
  query: Record<string, string>,
  options?: {
    timeout?: number;
  },
): Promise<T>;
/**
 * Delete data from Supabase table
 */
export declare function supabaseDelete(
  table: string,
  query: Record<string, string>,
  options?: {
    timeout?: number;
  },
): Promise<void>;
/**
 * Get data from Supabase table
 */
export declare function supabaseSelect<T = Record<string, unknown>>(
  table: string,
  query: Record<string, string>,
  options?: {
    timeout?: number;
  },
): Promise<T[]>;
/**
 * Call Supabase Edge Function
 * Uses session from localStorage or getSession() with timeout
 */
export declare function callSupabaseEdgeFunction<T = Record<string, unknown>>(
  functionName: string,
  body: unknown,
  options?: {
    timeout?: number;
    requireAuth?: boolean;
  },
): Promise<T>;
