// src/lib/storage/types.ts
// Storage adapter interface for persistence abstraction
// Canonical reference: docs/active/arch/data-layer.md

/**
 * Storage adapter interface for key-value persistence.
 * Implementations can use localStorage, IndexedDB, or other backends.
 */
export interface StorageAdapter {
  /**
   * Get a value by key.
   * @param key - Storage key
   * @returns The stored value or null if not found
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set a value by key.
   * @param key - Storage key
   * @param value - Value to store
   */
  set<T>(key: string, value: T): Promise<void>

  /**
   * Delete a value by key.
   * @param key - Storage key
   */
  delete(key: string): Promise<void>

  /**
   * Get all storage keys.
   * @returns Array of all keys in storage
   */
  keys(): Promise<string[]>
}
