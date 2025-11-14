/**
 * Système de logs optimisé pour DooDates
 * - Logging conditionnel (dev only)
 * - Niveaux de log (debug, info, warn, error)
 * - Intégration monitoring production
 * - Remplacement des console.log
 */
type LogLevel = "debug" | "info" | "warn" | "error";
type LogCategory =
  | "calendar"
  | "performance"
  | "auth"
  | "api"
  | "conversation"
  | "poll"
  | "vote"
  | "analytics"
  | "quota"
  | "dashboard"
  | "general";
interface LogConfig {
  enableProduction: boolean;
  minLevel: LogLevel;
  silentCategories: LogCategory[];
  enableMonitoring: boolean;
}
declare class Logger {
  private activeTimers;
  private isDev;
  private config;
  private generateUniqueId;
  time(message: string, category?: string): string;
  timeEnd(timerId: string, message?: string): number;
  debug(message: string, category?: LogCategory, data?: unknown): void;
  info(message: string, category?: LogCategory, data?: unknown): void;
  warn(message: string, category?: LogCategory, data?: unknown): void;
  error(message: string, category?: LogCategory, error?: unknown): void;
  log(message: string, category?: LogCategory, data?: unknown): void;
  private logWithLevel;
  private getLevelEmoji;
  private getCategoryEmoji;
  configure(config: Partial<LogConfig>): void;
  silenceCategory(category: LogCategory, silent?: boolean): void;
  private sendToMonitoring;
  getStoredLogs(): Array<{
    id: string;
    message: string;
    category: string;
    level: LogLevel;
    timestamp: string;
    data?: unknown;
  }>;
  cleanup(): void;
  clearStoredLogs(): void;
}
export declare const logger: Logger;
export {};
