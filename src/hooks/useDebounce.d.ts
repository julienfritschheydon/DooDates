/**
 * Hook for debouncing values
 * DooDates - Conversation History System
 */
/**
 * Debounces a value by delaying updates until after a specified delay
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export declare function useDebounce<T>(value: T, delay: number): T;
