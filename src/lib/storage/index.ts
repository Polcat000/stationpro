// src/lib/storage/index.ts
// Storage factory - single entry point for storage operations
// Canonical reference: docs/active/arch/data-layer.md
//
// IMPORTANT: Always import from '@/lib/storage', never import adapters directly

import { indexedDBAdapter } from './indexedDBAdapter'
import type { StorageAdapter } from './types'

export type { StorageAdapter } from './types'

/**
 * Storage singleton using IndexedDB adapter.
 * All storage operations should go through this export.
 *
 * @example
 * import { storage } from '@/lib/storage'
 *
 * await storage.set('key', { data: 'value' })
 * const data = await storage.get<MyType>('key')
 */
export const storage: StorageAdapter = indexedDBAdapter
