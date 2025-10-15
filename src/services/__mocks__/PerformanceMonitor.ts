/**
 * Mock for PerformanceMonitor service
 */

export const performanceMonitor = {
  trackApiCall: jest.fn(),
  trackConversationCreation: jest.fn(),
  trackError: jest.fn(),
  isHealthy: jest.fn(() => true),
  getMetrics: jest.fn(() => ({
    apiCalls: 0,
    conversationsCreated: 0,
    memoryUsage: 0,
    errorRate: 0,
    lastReset: Date.now(),
    alerts: [],
    isHealthy: true,
  })),
  emergencyShutdown: jest.fn(),
};
