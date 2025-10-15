/**
 * Infinite Loop Protection Service
 * Prevents cascading operations and resource exhaustion
 */

import { handleError, ErrorFactory, logError } from '../lib/error-handling';

interface OperationTracker {
  count: number;
  lastReset: number;
  isBlocked: boolean;
}

class InfiniteLoopProtectionService {
  private operations = new Map<string, OperationTracker>();
  private readonly MAX_OPERATIONS_PER_MINUTE = 10;
  private readonly RESET_INTERVAL = 60000; // 1 minute
  private readonly BLOCK_DURATION = 300000; // 5 minutes

  /**
   * Check if an operation should be allowed
   */
  canExecute(operationKey: string): boolean {
    const now = Date.now();
    const tracker = this.operations.get(operationKey);

    if (!tracker) {
      this.operations.set(operationKey, {
        count: 1,
        lastReset: now,
        isBlocked: false
      });
      return true;
    }

    // Reset counter if enough time has passed
    if (now - tracker.lastReset > this.RESET_INTERVAL) {
      tracker.count = 1;
      tracker.lastReset = now;
      tracker.isBlocked = false;
      return true;
    }

    // Check if operation is blocked
    if (tracker.isBlocked) {
      logError(
        ErrorFactory.rateLimit(
          `Operation "${operationKey}" is blocked due to excessive calls`,
          'Trop de tentatives. Veuillez patienter avant de réessayer.'
        ),
        { component: 'InfiniteLoopProtection', operation: operationKey }
      );
      return false;
    }

    // Increment counter
    tracker.count++;

    // Block if threshold exceeded
    if (tracker.count > this.MAX_OPERATIONS_PER_MINUTE) {
      tracker.isBlocked = true;
      logError(
        ErrorFactory.critical(
          `INFINITE LOOP DETECTED: Operation "${operationKey}" blocked for ${this.BLOCK_DURATION/1000}s`,
          'Système temporairement bloqué pour éviter une surcharge.'
        ),
        { component: 'InfiniteLoopProtection', operation: operationKey }
      );
      
      // Auto-unblock after duration
      setTimeout(() => {
        tracker.isBlocked = false;
        tracker.count = 0;
        tracker.lastReset = Date.now();
      }, this.BLOCK_DURATION);

      return false;
    }

    return true;
  }

  /**
   * Manually reset an operation counter
   */
  resetOperation(operationKey: string): void {
    this.operations.delete(operationKey);
  }

  /**
   * Get operation statistics
   */
  getStats(operationKey: string): OperationTracker | null {
    return this.operations.get(operationKey) || null;
  }

  /**
   * Clear all operations (for testing)
   */
  clearAll(): void {
    this.operations.clear();
  }
}

export const infiniteLoopProtection = new InfiniteLoopProtectionService();

/**
 * Decorator to protect functions from infinite loops
 */
export function protectFromInfiniteLoop(operationKey: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = ((...args: any[]) => {
      if (!infiniteLoopProtection.canExecute(operationKey)) {
        logError(
          ErrorFactory.rateLimit(
            `Operation ${operationKey} blocked by infinite loop protection`,
            'Opération bloquée temporairement.'
          ),
          { component: 'InfiniteLoopProtection', operation: operationKey }
        );
        return Promise.resolve();
      }
      return method.apply(target, args);
    }) as T;
  };
}

/**
 * Hook to protect React operations
 */
export function useInfiniteLoopProtection(operationKey: string) {
  return {
    canExecute: () => infiniteLoopProtection.canExecute(operationKey),
    resetOperation: () => infiniteLoopProtection.resetOperation(operationKey),
    getStats: () => infiniteLoopProtection.getStats(operationKey)
  };
}
