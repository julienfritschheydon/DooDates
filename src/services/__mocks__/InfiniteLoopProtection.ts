/**
 * Mock for InfiniteLoopProtection service
 */

export const infiniteLoopProtection = {
  canExecute: jest.fn(() => true),
  resetOperation: jest.fn(),
  getStats: jest.fn(() => null),
  clearAll: jest.fn()
};

export function protectFromInfiniteLoop(operationKey: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    return descriptor;
  };
}

export function useInfiniteLoopProtection(operationKey: string) {
  return {
    canExecute: jest.fn(() => true),
    resetOperation: jest.fn(),
    getStats: jest.fn(() => null)
  };
}
