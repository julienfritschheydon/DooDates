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
  | "general";

interface LogEntry {
  id: string;
  startTime: number;
  category: string;
}

interface LogConfig {
  enableProduction: boolean;
  minLevel: LogLevel;
  silentCategories: LogCategory[];
  enableMonitoring: boolean;
}

class Logger {
  private activeTimers = new Map<string, LogEntry>();
  private isDev = import.meta.env.DEV;
  private config: LogConfig = {
    enableProduction: false,
    minLevel: "debug",
    silentCategories: ["calendar", "performance"], // Désactiver les logs calendar et performance par défaut
    enableMonitoring: false,
  };

  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  time(message: string, category: string = "general"): string {
    if (!this.isDev) return "";

    const id = this.generateUniqueId();
    const emoji = this.getCategoryEmoji(category);

    this.activeTimers.set(id, {
      id,
      startTime: performance.now(),
      category,
    });

    // Désactiver complètement les logs Calendar pour éviter le spam
    if (category === "calendar") {
      return id; // Retourner l'ID mais pas de log
    }

    console.time(`${emoji} ${message}`);
    return id;
  }

  timeEnd(timerId: string, message?: string): number {
    if (!this.isDev) return 0;

    const entry = this.activeTimers.get(timerId);
    if (!entry) return 0;

    const duration = performance.now() - entry.startTime;
    const emoji = this.getCategoryEmoji(entry.category);
    const finalMessage = message || `${entry.category} operation`;

    // Désactiver complètement les logs Calendar
    if (entry.category === "calendar") {
      this.activeTimers.delete(timerId);
      return duration; // Pas de console.timeEnd
    }

    console.timeEnd(`${emoji} ${finalMessage}`);
    this.activeTimers.delete(timerId);
    return duration;
  }

  // Méthodes principales pour remplacer console.log
  debug(message: string, category: LogCategory = "general", data?: any): void {
    this.logWithLevel("debug", message, category, data);
  }

  info(message: string, category: LogCategory = "general", data?: any): void {
    this.logWithLevel("info", message, category, data);
  }

  warn(message: string, category: LogCategory = "general", data?: any): void {
    this.logWithLevel("warn", message, category, data);
  }

  error(message: string, category: LogCategory = "general", error?: any): void {
    this.logWithLevel("error", message, category, error);

    // En production, envoyer au service de monitoring
    if (!this.isDev && this.config.enableMonitoring) {
      this.sendToMonitoring("error", message, category, error);
    }
  }

  // Méthode legacy pour compatibilité
  log(message: string, category: LogCategory = "general", data?: any): void {
    this.info(message, category, data);
  }

  private logWithLevel(level: LogLevel, message: string, category: LogCategory, data?: any): void {
    // En production, ne logger que si explicitement activé
    if (!this.isDev && !this.config.enableProduction) return;

    // Catégories silencieuses
    if (this.config.silentCategories.includes(category)) return;

    // Filtrage par niveau
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    if (currentLevelIndex < minLevelIndex) return;

    const emoji = this.getCategoryEmoji(category);
    const levelEmoji = this.getLevelEmoji(level);
    const prefix = `${levelEmoji} ${emoji}`;

    switch (level) {
      case "debug":
        console.debug(prefix, message, data || "");
        break;
      case "info":
        console.info(prefix, message, data || "");
        break;
      case "warn":
        console.warn(prefix, message, data || "");
        break;
      case "error":
        console.error(prefix, message, data || "");
        break;
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: "🐛",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    };
    return emojis[level];
  }

  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      calendar: "📅",
      performance: "⚡",
      auth: "🔐",
      api: "🌐",
      analytics: "📊",
      quota: "💳",
      error: "❌",
      success: "✅",
      general: "ℹ️",
    };
    return emojis[category] || "ℹ️";
  }

  // Configuration du logger
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Activer/désactiver une catégorie
  silenceCategory(category: LogCategory, silent = true): void {
    if (silent && !this.config.silentCategories.includes(category)) {
      this.config.silentCategories.push(category);
    } else if (!silent) {
      this.config.silentCategories = this.config.silentCategories.filter((c) => c !== category);
    }
  }

  // Envoyer les erreurs critiques au service de monitoring (production)
  private sendToMonitoring(level: LogLevel, message: string, category: string, data?: any): void {
    // TODO: Intégrer avec Sentry, LogRocket, ou autre service
    // Exemple: Sentry.captureException(new Error(message));

    // Pour l'instant, stocker localement pour debug
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        category,
        data: data ? JSON.stringify(data) : undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const logs = JSON.parse(localStorage.getItem("doodates-error-logs") || "[]");
      logs.push(logEntry);

      // Garder seulement les 50 dernières erreurs
      if (logs.length > 50) {
        logs.shift();
      }

      localStorage.setItem("doodates-error-logs", JSON.stringify(logs));
    } catch (e) {
      // Ignorer les erreurs de stockage
    }
  }

  // Récupérer les logs pour debug
  getStoredLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem("doodates-error-logs") || "[]");
    } catch {
      return [];
    }
  }

  // Nettoyer les timers orphelins (utile pour le HMR)
  cleanup(): void {
    this.activeTimers.clear();
  }

  // Nettoyer les logs stockés
  clearStoredLogs(): void {
    localStorage.removeItem("doodates-error-logs");
  }
}

export const logger = new Logger();

// Exposition globale pour débogage
if (typeof window !== "undefined") {
  (window as any).dooLogger = logger;
}
