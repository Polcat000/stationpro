// src/lib/storage/migrateLegacyStorage.ts
// One-time migration from localStorage to IndexedDB
// Canonical reference: Story 3-13 IndexedDB Storage Migration

import { storage } from '.'
import { logger } from '@/lib/logger'

const MIGRATION_FLAG = 'stationpro:migration-v1'

/**
 * Legacy localStorage keys to migrate (hyphen separator)
 */
const LEGACY_KEYS = ['stationpro-parts', 'stationpro-components'] as const

/**
 * New IndexedDB keys (colon separator per data-layer.md pattern)
 */
const NEW_KEYS = ['stationpro:parts', 'stationpro:components'] as const

let migrationPromise: Promise<void> | null = null

/**
 * Migrate data from localStorage to IndexedDB.
 * This is a one-time migration that runs on first storage access.
 *
 * - Checks if migration already completed (via flag in IndexedDB)
 * - Reads each legacy localStorage key
 * - Writes data to IndexedDB with new key format
 * - Removes localStorage keys only after successful write
 * - Sets migration flag to prevent re-running
 *
 * Safe to call multiple times - will skip if already migrated.
 */
export async function migrateLegacyStorage(): Promise<void> {
  // Ensure migration only runs once even if called concurrently
  if (migrationPromise) {
    return migrationPromise
  }

  migrationPromise = performMigration()
  return migrationPromise
}

async function performMigration(): Promise<void> {
  try {
    // Check if already migrated
    const migrated = await storage.get<boolean>(MIGRATION_FLAG)
    if (migrated) {
      logger.debug('localStorage migration already complete', { component: 'migration' })
      return
    }

    // Check if there's any legacy data to migrate
    const hasLegacyData = LEGACY_KEYS.some((key) => localStorage.getItem(key) !== null)
    if (!hasLegacyData) {
      // No legacy data - just set the flag and return
      await storage.set(MIGRATION_FLAG, true)
      logger.debug('No legacy localStorage data to migrate', { component: 'migration' })
      return
    }

    logger.info('Starting localStorage to IndexedDB migration', { component: 'migration' })

    for (let i = 0; i < LEGACY_KEYS.length; i++) {
      const legacyKey = LEGACY_KEYS[i]
      const newKey = NEW_KEYS[i]

      const json = localStorage.getItem(legacyKey)
      if (!json) {
        continue
      }

      try {
        const data = JSON.parse(json)
        await storage.set(newKey, data)
        // Only remove localStorage after successful IndexedDB write
        localStorage.removeItem(legacyKey)
        logger.info(`Migrated ${legacyKey} to IndexedDB as ${newKey}`, {
          component: 'migration',
          recordCount: Array.isArray(data) ? data.length : 1,
        })
      } catch (error) {
        // Don't delete localStorage on failure - preserve user data
        logger.error(`Failed to migrate ${legacyKey}`, error as Error, { component: 'migration' })
        // Continue with other keys even if one fails
      }
    }

    // Set migration flag
    await storage.set(MIGRATION_FLAG, true)
    logger.info('localStorage migration complete', { component: 'migration' })
  } catch (error) {
    logger.error('Migration failed', error as Error, { component: 'migration' })
    // Reset promise so migration can be retried
    migrationPromise = null
    throw error
  }
}

/**
 * Reset migration state (for testing purposes).
 * @internal
 */
export function _resetMigrationState(): void {
  migrationPromise = null
}
