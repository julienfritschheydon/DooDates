/**
 * Supabase API Utilities
 * Centralized functions for making authenticated requests to Supabase REST API
 */
/**
 * Get JWT token from localStorage
 * Compatible with Supabase auth storage
 */
export declare function getSupabaseToken(): string | null;
/**
 * Make authenticated request to Supabase REST API
 * Uses fetch directly with JWT token from localStorage
 *
 * @param table - Table name (e.g., "conversations", "polls")
 * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param options - Request options
 * @returns Response data or throws error
 */
export declare function supabaseRestApi<T = any>(table: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", options?: {
    body?: any;
    query?: Record<string, string>;
    timeout?: number;
    requireAuth?: boolean;
}): Promise<T>;
/**
 * Insert data into Supabase table
 */
export declare function supabaseInsert<T = any>(table: string, data: any, options?: {
    timeout?: number;
}): Promise<T>;
/**
 * Update data in Supabase table
 */
export declare function supabaseUpdate<T = any>(table: string, data: any, query: Record<string, string>, options?: {
    timeout?: number;
}): Promise<T>;
/**
 * Delete data from Supabase table
 */
export declare function supabaseDelete(table: string, query: Record<string, string>, options?: {
    timeout?: number;
}): Promise<void>;
/**
 * Get data from Supabase table
 */
export declare function supabaseSelect<T = any>(table: string, query: Record<string, string>, options?: {
    timeout?: number;
}): Promise<T[]>;
