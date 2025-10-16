/**
 * Performance Monitor - Detects and prevents resource exhaustion
 */

import { handleError, ErrorFactory, logError } from "../lib/error-handling";

interface PerformanceMetrics {
  apiCalls: number;
  conversationsCreated: number;
  memoryUsage: number;
  errorRate: number;
  lastReset: number;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    conversationsCreated: 0,
    memoryUsage: 0,
    errorRate: 0,
    lastReset: Date.now(),
  };

  private readonly THRESHOLDS = {
    MAX_API_CALLS_PER_MINUTE: 50,
    MAX_CONVERSATIONS_PER_SESSION: 5,
    MAX_ERROR_RATE: 0.3, // 30%
    RESET_INTERVAL: 60000, // 1 minute
  };

  private alerts: Array<string | Error> = [];

  /**
   * Track API call
   */
  trackApiCall(): void {
    this.resetIfNeeded();
    this.metrics.apiCalls++;

    if (this.metrics.apiCalls > this.THRESHOLDS.MAX_API_CALLS_PER_MINUTE) {
      this.addAlert(
        ErrorFactory.critical(
          "EXCESSIVE API CALLS DETECTED - Possible infinite loop",
          "Trop d'appels API détectés. Le système va se protéger.",
        ),
      );
    }
  }

  /**
   * Track conversation creation
   */
  trackConversationCreation(): void {
    this.resetIfNeeded();
    this.metrics.conversationsCreated++;

    if (
      this.metrics.conversationsCreated >
      this.THRESHOLDS.MAX_CONVERSATIONS_PER_SESSION
    ) {
      this.addAlert(
        ErrorFactory.critical(
          "EXCESSIVE CONVERSATION CREATION - Infinite loop detected",
          "Trop de conversations créées. Boucle infinie détectée.",
        ),
      );
    }
  }

  /**
   * Track error
   */
  trackError(): void {
    this.resetIfNeeded();
    const totalOperations =
      this.metrics.apiCalls + this.metrics.conversationsCreated;
    if (totalOperations > 0) {
      this.metrics.errorRate = this.alerts.length / totalOperations;

      if (this.metrics.errorRate > this.THRESHOLDS.MAX_ERROR_RATE) {
        this.addAlert(
          ErrorFactory.critical(
            "HIGH ERROR RATE - System instability detected",
            "Taux d'erreur élevé détecté. Instabilité du système.",
          ),
        );
      }
    }
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    this.resetIfNeeded();
    return (
      this.metrics.apiCalls <= this.THRESHOLDS.MAX_API_CALLS_PER_MINUTE &&
      this.metrics.conversationsCreated <=
        this.THRESHOLDS.MAX_CONVERSATIONS_PER_SESSION &&
      this.metrics.errorRate <= this.THRESHOLDS.MAX_ERROR_RATE
    );
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics & {
    alerts: Array<string | Error>;
    isHealthy: boolean;
  } {
    this.resetIfNeeded();
    return {
      ...this.metrics,
      alerts: [...this.alerts],
      isHealthy: this.isHealthy(),
    };
  }

  /**
   * Add alert
   */
  private addAlert(message: string | Error): void {
    const alertKey = message instanceof Error ? message.message : message;
    const existingAlert = this.alerts.find(
      (alert) => (alert instanceof Error ? alert.message : alert) === alertKey,
    );

    if (!existingAlert) {
      this.alerts.push(message);

      if (message instanceof Error) {
        logError(message, { component: "PerformanceMonitor" });
      } else {
        // Use centralized error logging for non-Error messages
        logError(
          ErrorFactory.critical(
            message,
            "Performance alert triggered"
          ),
          { component: "PerformanceMonitor" }
        );
      }

      // Send to external monitoring if available
      this.sendToMonitoring(alertKey);
    }
  }

  /**
   * Reset metrics if interval passed
   */
  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.metrics.lastReset > this.THRESHOLDS.RESET_INTERVAL) {
      this.metrics = {
        apiCalls: 0,
        conversationsCreated: 0,
        memoryUsage: 0,
        errorRate: 0,
        lastReset: now,
      };
      this.alerts = [];
    }
  }

  /**
   * Send alert to external monitoring
   */
  private sendToMonitoring(message: string): void {
    // Could integrate with Sentry, LogRocket, etc.
    if (typeof window !== "undefined" && "navigator" in window) {
      // Browser environment - could send to analytics
      console.warn("Performance alert:", message);
    }
  }

  /**
   * Emergency shutdown if system is critically unhealthy
   */
  emergencyShutdown(): void {
    const shutdownError = ErrorFactory.critical(
      "EMERGENCY SHUTDOWN - System critically unhealthy",
      "Arrêt d'urgence du système pour éviter des dommages.",
    );

    logError(shutdownError, {
      component: "PerformanceMonitor",
      operation: "emergencyShutdown",
    });
    this.addAlert(shutdownError);

    // Disable all operations
    window.location.reload();
  }
}

export const performanceMonitor = new PerformanceMonitorService();
