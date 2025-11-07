/**
 * Mock for InfiniteLoopProtection service
 */
export declare const infiniteLoopProtection: {
  canExecute: jest.Mock<boolean, [], any>;
  resetOperation: jest.Mock<any, any, any>;
  getStats: jest.Mock<any, [], any>;
  clearAll: jest.Mock<any, any, any>;
};
export declare function protectFromInfiniteLoop(
  operationKey: string,
): <T extends (...args: any[]) => any>(
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T>;
export declare function useInfiniteLoopProtection(operationKey: string): {
  canExecute: jest.Mock<boolean, [], any>;
  resetOperation: jest.Mock<any, any, any>;
  getStats: jest.Mock<any, [], any>;
};
