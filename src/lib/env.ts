/**
 * Environment variable utilities
 * Provides safe access to environment variables in both browser (import.meta) and Node.js (process.env) contexts
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

/**
 * Get an environment variable safely, working in both browser and Node.js contexts
 * @param key The environment variable key (e.g., 'VITE_SUPABASE_URL')
 * @param defaultValue Optional default value if the variable is not found
 * @returns The environment variable value or defaultValue
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  // En environnement de test Node.js, prioriser process.env (qui contient .env.local)
  // Cela permet aux tests d'utiliser les vraies valeurs depuis .env.local
  const isTestEnv = !isBrowser && typeof process !== "undefined" && process?.env && (
    process.env.NODE_ENV === "test" || process.env.VITEST === "true"
  );
  
  if (isTestEnv && process.env[key]) {
    return process.env[key];
  }

  // Try import.meta.env first (Vite/browser context)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = import.meta.env[key];
    if (value !== undefined) return String(value);
  }

  // Only check process.env in non-browser environments (Node.js/SSR)
  if (!isBrowser && typeof process !== "undefined" && process?.env) {
    const value = process.env[key];
    if (value !== undefined) return value;
  }

  return defaultValue;
}

/**
 * Check if we're in development mode
 */
export function isDev(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.DEV === true || import.meta.env.MODE === "development";
  }

  // Only check process.env in non-browser environments (Node.js/SSR)
  if (!isBrowser && typeof process !== "undefined" && process?.env) {
    return process.env.NODE_ENV === "development";
  }

  // Default to production in browser if we can't determine
  return false;
}

/**
 * Get the current mode (development, production, test)
 */
export function getMode(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.MODE) {
    return String(import.meta.env.MODE);
  }

  // Only check process.env in non-browser environments (Node.js/SSR)
  if (!isBrowser && typeof process !== "undefined" && process?.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // Default to production in browser if we can't determine
  return "production";
}
