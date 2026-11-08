/**
 * TAPTCH BROWSER STORAGE ENGINE
 *
 * Implements client storage access with authoritative 'taptch_' namespace.
 */

export const STORAGE_PREFIX = 'taptch_';

export interface StorageMigrationResult {
  migratedKeys: string[];
  preservedKeys: string[];
  errors: string[];
}

export function migrateBrowserStorage(): StorageMigrationResult {
  return {
    migratedKeys: [],
    preservedKeys: [],
    errors: [],
  };
}

/**
 * Namespaced getItem
 */
export function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const namespacedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
  return window.localStorage.getItem(namespacedKey);
}

/**
 * Namespaced setItem
 */
export function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const namespacedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
  window.localStorage.setItem(namespacedKey, value);
}
