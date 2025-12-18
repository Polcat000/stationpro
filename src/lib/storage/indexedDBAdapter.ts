// src/lib/storage/indexedDBAdapter.ts
// IndexedDB storage adapter implementation using idb library
// Canonical reference: docs/active/arch/data-layer.md

import { openDB, type IDBPDatabase } from 'idb'
import { logger } from '@/lib/logger'
import type { StorageAdapter } from './types'

const DB_NAME = 'stationpro-db'
const DB_VERSION = 1
const STORE_NAME = 'keyval'

let dbPromise: Promise<IDBPDatabase> | null = null

/**
 * Get or create the IndexedDB database connection.
 * Lazily initialized on first use.
 */
function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    logger.debug('Opening IndexedDB database', { component: 'indexedDBAdapter' })
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        logger.info('Creating IndexedDB object store', { component: 'indexedDBAdapter' })
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    }).catch((error) => {
      logger.error('Failed to open IndexedDB database', error as Error, { component: 'indexedDBAdapter' })
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}

/**
 * IndexedDB storage adapter implementing StorageAdapter interface.
 * Uses a simple key-value store pattern for flexibility.
 */
export const indexedDBAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await getDB()
      const value = await db.get(STORE_NAME, key)
      logger.debug(`IndexedDB get: ${key}`, { component: 'indexedDBAdapter', found: value !== undefined })
      return (value as T) ?? null
    } catch (error) {
      logger.error(`IndexedDB get failed: ${key}`, error as Error, { component: 'indexedDBAdapter' })
      throw error
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const db = await getDB()
      await db.put(STORE_NAME, value, key)
      logger.debug(`IndexedDB set: ${key}`, { component: 'indexedDBAdapter' })
    } catch (error) {
      logger.error(`IndexedDB set failed: ${key}`, error as Error, { component: 'indexedDBAdapter' })
      throw error
    }
  },

  async delete(key: string): Promise<void> {
    try {
      const db = await getDB()
      await db.delete(STORE_NAME, key)
      logger.debug(`IndexedDB delete: ${key}`, { component: 'indexedDBAdapter' })
    } catch (error) {
      logger.error(`IndexedDB delete failed: ${key}`, error as Error, { component: 'indexedDBAdapter' })
      throw error
    }
  },

  async keys(): Promise<string[]> {
    try {
      const db = await getDB()
      const allKeys = await db.getAllKeys(STORE_NAME)
      logger.debug(`IndexedDB keys: ${allKeys.length} found`, { component: 'indexedDBAdapter' })
      return allKeys as string[]
    } catch (error) {
      logger.error('IndexedDB keys failed', error as Error, { component: 'indexedDBAdapter' })
      throw error
    }
  },
}

/**
 * Reset the database connection (for testing purposes).
 * @internal
 */
export function _resetDBConnection(): void {
  dbPromise = null
}
