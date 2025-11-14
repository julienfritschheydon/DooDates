/**
 * Infinite Loop Protection Service
 * Prevents cascading operations and resource exhaustion
 */
interface OperationTracker {
  count: number;
  lastReset: number;
  isBlocked: boolean;
}
declare class InfiniteLoopProtectionService {
  private operations;
  private readonly MAX_OPERATIONS_PER_MINUTE;
  private readonly RESET_INTERVAL;
  private readonly BLOCK_DURATION;
  /**
   * Check if an operation should be allowed
   */
  canExecute(operationKey: string): boolean;
  /**
   * Manually reset an operation counter
   */
  resetOperation(operationKey: string): void;
  /**
   * Get operation statistics
   */
  getStats(operationKey: string): OperationTracker | null;
  /**
   * Clear all operations (for testing)
   */
  clearAll(): void;
}
export declare const infiniteLoopProtection: InfiniteLoopProtectionService;
/**
 * Decorator to protect functions from infinite loops
 */
export declare function protectFromInfiniteLoop(
  operationKey: string,
): <T extends (...args: unknown[]) => unknown>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>,
) => void;
/**
 * Hook to protect React operations
 */
export declare function useInfiniteLoopProtection(operationKey: string): {
  canExecute: () => boolean;
  resetOperation: () => void;
  getStats: () => OperationTracker;
};
export {};
