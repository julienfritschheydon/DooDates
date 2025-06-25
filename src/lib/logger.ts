/**
 * Système de logs optimisé pour DooDates
 * Évite les conflits de timer et réduit le bruit dans la console
 */

interface LogEntry {
  id: string;
  startTime: number;
  category: string;
}

class Logger {
  private activeTimers = new Map<string, LogEntry>();
  private isDev = process.env.NODE_ENV === "development";

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

  log(message: string, category: string = "general"): void {
    if (!this.isDev) return;

    // Désactiver complètement les logs Calendar
    if (category === "calendar") {
      return;
    }

    const emoji = this.getCategoryEmoji(category);
    console.log(`${emoji} ${message}`);
  }

  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      calendar: "📅",
      performance: "⚡",
      auth: "🔐",
      api: "🌐",
      error: "❌",
      success: "✅",
      general: "ℹ️",
    };
    return emojis[category] || "ℹ️";
  }

  // Nettoyer les timers orphelins (utile pour le HMR)
  cleanup(): void {
    this.activeTimers.clear();
  }
}

export const logger = new Logger();

// Exposition globale pour débogage
if (typeof window !== "undefined") {
  (window as any).dooLogger = logger;
}
