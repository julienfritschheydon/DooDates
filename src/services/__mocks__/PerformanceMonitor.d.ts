/**
 * Mock for PerformanceMonitor service
 */
export declare const performanceMonitor: {
  trackApiCall: jest.Mock<any, any, any>;
  trackConversationCreation: jest.Mock<any, any, any>;
  trackError: jest.Mock<any, any, any>;
  isHealthy: jest.Mock<boolean, [], any>;
  getMetrics: jest.Mock<
    {
      apiCalls: number;
      conversationsCreated: number;
      memoryUsage: number;
      errorRate: number;
      lastReset: number;
      alerts: any[];
      isHealthy: boolean;
    },
    [],
    any
  >;
  emergencyShutdown: jest.Mock<any, any, any>;
};
