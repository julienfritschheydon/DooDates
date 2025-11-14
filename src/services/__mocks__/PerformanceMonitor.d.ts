/**
 * Mock for PerformanceMonitor service
 */
export declare const performanceMonitor: {
  trackApiCall: jest.Mock<void, [string, number], unknown>;
  trackConversationCreation: jest.Mock<void, [string], unknown>;
  trackError: jest.Mock<void, [Error], unknown>;
  isHealthy: jest.Mock<boolean, [], unknown>;
  getMetrics: jest.Mock<
    {
      apiCalls: number;
      conversationsCreated: number;
      memoryUsage: number;
      errorRate: number;
      lastReset: number;
      alerts: Array<{ type: string; message: string; timestamp: number }>;
      isHealthy: boolean;
    },
    [],
    unknown
  >;
  emergencyShutdown: jest.Mock<void, [], unknown>;
};
