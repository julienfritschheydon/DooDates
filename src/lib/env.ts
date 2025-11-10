/**
 * Environment variable utilities
 * Provides safe access to environment variables in both browser (import.meta) and Node.js (process.env) contexts
 */

/**
 * Get an environment variable safely, working in both browser and Node.js contexts
 * @param key The environment variable key (e.g., 'VITE_SUPABASE_URL')
 * @param defaultValue Optional default value if the variable is not found
 * @returns The environment variable value or defaultValue
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  // Try import.meta.env first (Vite/browser context)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = import.meta.env[key];
    if (value !== undefined) return value;
  }

  // Fallback to process.env (Node.js context, e.g., Playwright tests)
  if (typeof process !== "undefined" && process.env) {
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
    return import.meta.env.DEV === true;
  }

  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV === "development";
  }

  return false;
}

/**
 * Get the current mode (development, production, test)
 */
export function getMode(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.MODE) {
    return import.meta.env.MODE;
  }

  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  return "production";
}
