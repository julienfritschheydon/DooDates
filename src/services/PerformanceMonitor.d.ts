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
declare class PerformanceMonitorService {
    private metrics;
    private readonly THRESHOLDS;
    private alerts;
    /**
     * Track API call
     */
    trackApiCall(): void;
    /**
     * Track conversation creation
     */
    trackConversationCreation(): void;
    /**
     * Track error
     */
    trackError(): void;
    /**
     * Check if system is healthy
     */
    isHealthy(): boolean;
    /**
     * Get current metrics
     */
    getMetrics(): PerformanceMetrics & {
        alerts: Array<string | Error>;
        isHealthy: boolean;
    };
    /**
     * Add alert
     */
    private addAlert;
    /**
     * Reset metrics if interval passed
     */
    private resetIfNeeded;
    /**
     * Send alert to external monitoring
     */
    private sendToMonitoring;
    /**
     * Emergency shutdown if system is critically unhealthy
     */
    emergencyShutdown(): void;
}
export declare const performanceMonitor: PerformanceMonitorService;
export {};
