import { logError, ErrorFactory } from "../error-handling";

/**
 * Common localStorage utilities for polls and conversations
 * DooDates - Shared Storage Pattern
 */

// Safe window check
export function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Generic localStorage read with memory cache
 */
export function readFromStorage<T>(
  key: string,
  cache: Map<string, T>,
  defaultValue: T[] = [],
): T[] {
  try {
    // Try memory cache first
    if (cache.size > 0) {
      const cachedItems = Array.from(cache.values());
      // Debug: vérifier les questions de type date dans le cache
      if (key === "doodates_polls") {
        cachedItems.forEach((item: any) => {
          if (item?.type === "form" && item?.questions) {
            item.questions.forEach((q: any) => {
              if (q?.kind === "date" || q?.type === "date") {
                console.log("🔍 readFromStorage (cache) - Question date:", {
                  pollId: item.id,
                  questionId: q.id,
                  selectedDates: q.selectedDates,
                  timeSlotsByDate: q.timeSlotsByDate,
                });
              }
            });
          }
        });
      }
      return cachedItems;
    }

    // Read from localStorage
    const raw = hasWindow() ? window.localStorage.getItem(key) : null;
    const items = raw ? (JSON.parse(raw) as T[]) : defaultValue;

    // Debug: vérifier les questions de type date dans localStorage
    if (key === "doodates_polls" && Array.isArray(items)) {
      items.forEach((item: any) => {
        if (item?.type === "form" && item?.questions) {
          item.questions.forEach((q: any) => {
            if (q?.kind === "date" || q?.type === "date") {
              console.log("🔍 readFromStorage (localStorage) - Question date:", {
                pollId: item.id,
                questionId: q.id,
                selectedDates: q.selectedDates,
                timeSlotsByDate: q.timeSlotsByDate,
                rawQuestion: q,
              });
            }
          });
        }
      });
    }

    // Update memory cache if items have id property
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item && typeof item === "object" && "id" in item) {
          cache.set((item as { id: string }).id, item);
        }
      });
    }

    return items;
  } catch (error) {
    logError(ErrorFactory.storage(`Failed to read from ${key}`, `Échec de lecture depuis ${key}`), {
      component: "storageUtils",
      operation: "readFromStorage",
      metadata: { key, originalError: error },
    });
    return defaultValue;
  }
}

/**
 * Generic localStorage write with memory cache
 */
export function writeToStorage<T>(key: string, items: T[], cache: Map<string, T>): void {
  if (!hasWindow()) return;

  try {
    // Update memory cache
    cache.clear();
    items.forEach((item) => {
      if (item && typeof item === "object" && "id" in item) {
        cache.set((item as { id: string }).id, item);
      }
    });

    // Save to localStorage
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    logError(ErrorFactory.storage(`Failed to write to ${key}`, `Échec d'écriture vers ${key}`), {
      component: "storageUtils",
      operation: "writeToStorage",
      metadata: { key, originalError: error },
    });
  }
}

/**
 * Generic add item to storage
 */
export function addToStorage<T>(key: string, item: T, cache: Map<string, T>): void {
  const items = readFromStorage(key, cache);
  items.push(item);
  writeToStorage(key, items, cache);
}

/**
 * Generic find item by ID
 */
export function findById<T extends { id: string }>(
  id: string,
  key: string,
  cache: Map<string, T>,
): T | null {
  // Try memory cache first
  const cached = cache.get(id);
  if (cached) return cached;

  // Search in all items
  const items = readFromStorage(key, cache);
  return items.find((item) => item.id === id) || null;
}

/**
 * Generic update item in storage
 */
export function updateInStorage<T extends { id: string }>(
  key: string,
  updatedItem: T,
  cache: Map<string, T>,
): void {
  const items = readFromStorage(key, cache);
  const index = items.findIndex((item) => item.id === updatedItem.id);

  if (index >= 0) {
    items[index] = updatedItem;
    writeToStorage(key, items, cache);
  }
}

/**
 * Generic delete item from storage
 */
export function deleteFromStorage<T extends { id: string }>(
  key: string,
  id: string,
  cache: Map<string, T>,
): void {
  const items = readFromStorage(key, cache);
  const filtered = items.filter((item) => item.id !== id);
  writeToStorage(key, filtered, cache);
  cache.delete(id);
}

/**
 * Generic clear all data
 */
export function clearStorage(keys: string[], caches: Map<string, unknown>[]): void {
  if (!hasWindow()) return;

  try {
    keys.forEach((key) => window.localStorage.removeItem(key));
    caches.forEach((cache) => cache.clear());
  } catch (error) {
    logError(ErrorFactory.storage("Failed to clear storage", "Échec de nettoyage du stockage"), {
      component: "storageUtils",
      operation: "clearStorage",
      metadata: { keys, originalError: error },
    });
  }
}

/**
 * Generic record-based storage (for messages, responses, etc.)
 */
export function readRecordStorage<T>(key: string, cache: Map<string, T[]>, recordId: string): T[] {
  try {
    // Try memory cache first
    const cached = cache.get(recordId);
    if (cached) return cached;

    // Read from localStorage
    const raw = hasWindow() ? window.localStorage.getItem(key) : null;
    const allRecords = raw ? (JSON.parse(raw) as Record<string, T[]>) : {};

    const records = allRecords[recordId] || [];

    // Update memory cache
    cache.set(recordId, records);

    return records;
  } catch (error) {
    logError(
      ErrorFactory.storage(
        `Failed to read records from ${key}`,
        `Échec de lecture des enregistrements depuis ${key}`,
      ),
      {
        component: "storageUtils",
        operation: "readRecordStorage",
        metadata: { key, recordId, originalError: error },
      },
    );
    return [];
  }
}

/**
 * Generic record-based write
 */
export function writeRecordStorage<T>(
  key: string,
  cache: Map<string, T[]>,
  recordId: string,
  records: T[],
): void {
  if (!hasWindow()) return;

  try {
    // Read all records
    const raw = window.localStorage.getItem(key);
    const allRecords = raw ? (JSON.parse(raw) as Record<string, T[]>) : {};

    // Update records for this ID
    allRecords[recordId] = records;

    // Update memory cache
    cache.set(recordId, records);

    // Save back to localStorage
    window.localStorage.setItem(key, JSON.stringify(allRecords));
  } catch (error) {
    const existingRecords = readRecordStorage(key, cache, recordId);
    const allRecords = [...existingRecords, ...records];
    delete allRecords[recordId];
    cache.delete(recordId);
    window.localStorage.setItem(key, JSON.stringify(allRecords));
  }
}

/**
 * Generic add records (append)
 */
export function addRecords<T>(
  key: string,
  cache: Map<string, T[]>,
  recordId: string,
  newRecords: T[],
): void {
  const existingRecords = readRecordStorage(key, cache, recordId);
  const allRecords = [...existingRecords, ...newRecords];
  writeRecordStorage(key, cache, recordId, allRecords);
}

/**
 * Generic delete records
 */
export function deleteRecords<T>(key: string, cache: Map<string, T[]>, recordId: string): void {
  if (!hasWindow()) return;

  try {
    const raw = window.localStorage.getItem(key);
    const allRecords = raw ? (JSON.parse(raw) as Record<string, T[]>) : {};

    delete allRecords[recordId];
    cache.delete(recordId);

    window.localStorage.setItem(key, JSON.stringify(allRecords));
  } catch (error) {
    logError(
      ErrorFactory.storage(
        `Failed to delete records from ${key}`,
        `Échec de suppression des enregistrements depuis ${key}`,
      ),
      {
        component: "storageUtils",
        operation: "deleteRecordStorage",
        metadata: { key, recordId, originalError: error },
      },
    );
  }
}
