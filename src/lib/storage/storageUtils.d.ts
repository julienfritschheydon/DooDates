/**
 * Common localStorage utilities for polls and conversations
 * DooDates - Shared Storage Pattern
 */
export declare function hasWindow(): boolean;
/**
 * Generic localStorage read with memory cache
 */
export declare function readFromStorage<T>(
  key: string,
  cache: Map<string, T>,
  defaultValue?: T[],
): T[];
/**
 * Generic localStorage write with memory cache
 */
export declare function writeToStorage<T>(key: string, items: T[], cache: Map<string, T>): void;
/**
 * Generic add item to storage
 */
export declare function addToStorage<T>(key: string, item: T, cache: Map<string, T>): void;
/**
 * Generic find item by ID
 */
export declare function findById<T>(id: string, key: string, cache: Map<string, T>): T | null;
/**
 * Generic update item in storage
 */
export declare function updateInStorage<T>(
  key: string,
  updatedItem: T,
  cache: Map<string, T>,
): void;
/**
 * Generic delete item from storage
 */
export declare function deleteFromStorage<T>(key: string, id: string, cache: Map<string, T>): void;
/**
 * Generic clear all data
 */
export declare function clearStorage(keys: string[], caches: Map<string, any>[]): void;
/**
 * Generic record-based storage (for messages, responses, etc.)
 */
export declare function readRecordStorage<T>(
  key: string,
  cache: Map<string, T[]>,
  recordId: string,
): T[];
/**
 * Generic record-based write
 */
export declare function writeRecordStorage<T>(
  key: string,
  cache: Map<string, T[]>,
  recordId: string,
  records: T[],
): void;
/**
 * Generic add records (append)
 */
export declare function addRecords<T>(
  key: string,
  cache: Map<string, T[]>,
  recordId: string,
  newRecords: T[],
): void;
/**
 * Generic delete records
 */
export declare function deleteRecords<T>(
  key: string,
  cache: Map<string, T[]>,
  recordId: string,
): void;
