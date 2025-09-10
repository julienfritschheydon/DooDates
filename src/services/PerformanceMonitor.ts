/**
 * Performance Monitor - Detects and prevents resource exhaustion
 */

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
    lastReset: Date.now()
  };

  private readonly THRESHOLDS = {
    MAX_API_CALLS_PER_MINUTE: 50,
    MAX_CONVERSATIONS_PER_SESSION: 5,
    MAX_ERROR_RATE: 0.3, // 30%
    RESET_INTERVAL: 60000 // 1 minute
  };

  private alerts: string[] = [];

  /**
   * Track API call
   */
  trackApiCall(): void {
    this.resetIfNeeded();
    this.metrics.apiCalls++;
    
    if (this.metrics.apiCalls > this.THRESHOLDS.MAX_API_CALLS_PER_MINUTE) {
      this.addAlert('🚨 EXCESSIVE API CALLS DETECTED - Possible infinite loop');
    }
  }

  /**
   * Track conversation creation
   */
  trackConversationCreation(): void {
    this.resetIfNeeded();
    this.metrics.conversationsCreated++;
    
    if (this.metrics.conversationsCreated > this.THRESHOLDS.MAX_CONVERSATIONS_PER_SESSION) {
      this.addAlert('🚨 EXCESSIVE CONVERSATION CREATION - Infinite loop detected');
    }
  }

  /**
   * Track error
   */
  trackError(): void {
    this.resetIfNeeded();
    const totalOperations = this.metrics.apiCalls + this.metrics.conversationsCreated;
    if (totalOperations > 0) {
      this.metrics.errorRate = this.alerts.length / totalOperations;
      
      if (this.metrics.errorRate > this.THRESHOLDS.MAX_ERROR_RATE) {
        this.addAlert('🚨 HIGH ERROR RATE - System instability detected');
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
      this.metrics.conversationsCreated <= this.THRESHOLDS.MAX_CONVERSATIONS_PER_SESSION &&
      this.metrics.errorRate <= this.THRESHOLDS.MAX_ERROR_RATE
    );
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics & { alerts: string[]; isHealthy: boolean } {
    this.resetIfNeeded();
    return {
      ...this.metrics,
      alerts: [...this.alerts],
      isHealthy: this.isHealthy()
    };
  }

  /**
   * Add alert
   */
  private addAlert(message: string): void {
    if (!this.alerts.includes(message)) {
      this.alerts.push(message);
      console.error(message);
      
      // Send to external monitoring if available
      this.sendToMonitoring(message);
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
        lastReset: now
      };
      this.alerts = [];
    }
  }

  /**
   * Send alert to external monitoring
   */
  private sendToMonitoring(message: string): void {
    // Could integrate with Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Browser environment - could send to analytics
      console.warn('Performance alert:', message);
    }
  }

  /**
   * Emergency shutdown if system is critically unhealthy
   */
  emergencyShutdown(): void {
    console.error('🚨 EMERGENCY SHUTDOWN - System critically unhealthy');
    this.addAlert('EMERGENCY SHUTDOWN ACTIVATED');
    
    // Disable all operations
    window.location.reload();
  }
}

export const performanceMonitor = new PerformanceMonitorService();
