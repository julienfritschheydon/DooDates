/**
 * Mock for InfiniteLoopProtection service
 */
export declare const infiniteLoopProtection: {
  canExecute: jest.Mock<boolean, [string], unknown>;
  resetOperation: jest.Mock<void, [string], unknown>;
  getStats: jest.Mock<
    { count: number; lastReset: number; isBlocked: boolean } | null,
    [string],
    unknown
  >;
  clearAll: jest.Mock<void, [], unknown>;
};
export declare function protectFromInfiniteLoop(
  operationKey: string,
): <T extends (...args: unknown[]) => unknown>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T>;
export declare function useInfiniteLoopProtection(operationKey: string): {
  canExecute: jest.Mock<boolean, [], unknown>;
  resetOperation: jest.Mock<void, [], unknown>;
  getStats: jest.Mock<{ count: number; lastReset: number; isBlocked: boolean }, [], unknown>;
};
