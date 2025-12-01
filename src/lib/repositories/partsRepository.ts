// src/lib/repositories/partsRepository.ts
// Repository for Part CRUD operations using localStorage
// Canonical reference: docs/active/arch/data-layer.md

import type { Part } from '@/lib/schemas/part'
import { logger } from '@/lib/logger'

const STORAGE_KEY = 'stationpro-parts'

/**
 * Type-safe localStorage operations for Parts.
 * Uses synchronous localStorage under the hood but returns Promises
 * for consistency with potential future async storage adapters.
 */
export const partsRepository = {
  /**
   * Get all parts from storage.
   * @returns Promise<Part[]> - All stored parts, or empty array if none
   */
  async getAll(): Promise<Part[]> {
    try {
      const json = localStorage.getItem(STORAGE_KEY)
      if (!json) {
        return []
      }
      const parts = JSON.parse(json) as Part[]
      logger.debug(`Loaded ${parts.length} parts from storage`, { component: 'partsRepository' })
      return parts
    } catch (error) {
      logger.error('Failed to load parts from storage', error as Error, { component: 'partsRepository' })
      return []
    }
  },

  /**
   * Get a part by its PartCallout value.
   * @param callout - The PartCallout to search for
   * @returns Promise<Part | null> - The matching part or null
   */
  async getByCallout(callout: string): Promise<Part | null> {
    const parts = await this.getAll()
    return parts.find((p) => p.PartCallout === callout) ?? null
  },

  /**
   * Get multiple parts by their PartCallout values.
   * @param callouts - Array of PartCallout values to search for
   * @returns Promise<Part[]> - Array of matching parts (may be shorter than input if some not found)
   */
  async getByCallouts(callouts: string[]): Promise<Part[]> {
    const parts = await this.getAll()
    const calloutSet = new Set(callouts)
    return parts.filter((p) => calloutSet.has(p.PartCallout))
  },

  /**
   * Save a single part. Overwrites if PartCallout already exists.
   * @param part - The part to save
   * @returns Promise<Part> - The saved part
   */
  async save(part: Part): Promise<Part> {
    const parts = await this.getAll()
    const index = parts.findIndex((p) => p.PartCallout === part.PartCallout)

    if (index >= 0) {
      parts[index] = part
    } else {
      parts.push(part)
    }

    this._persist(parts)
    logger.info(`Saved part ${part.PartCallout}`, { component: 'partsRepository' })
    return part
  },

  /**
   * Save multiple parts. Adds new parts without touching existing ones.
   * Use upsertMany if you want to overwrite existing parts.
   * @param newParts - Array of parts to save
   * @returns Promise<Part[]> - The saved parts (only new ones that were added)
   */
  async saveMany(newParts: Part[]): Promise<Part[]> {
    if (newParts.length === 0) return []

    const existingParts = await this.getAll()
    const existingCallouts = new Set(existingParts.map((p) => p.PartCallout))

    // Filter to only parts that don't already exist
    const partsToAdd = newParts.filter((p) => !existingCallouts.has(p.PartCallout))

    if (partsToAdd.length === 0) {
      logger.info('No new parts to save (all already exist)', { component: 'partsRepository' })
      return []
    }

    const allParts = [...existingParts, ...partsToAdd]
    this._persist(allParts)

    logger.info(`Saved ${partsToAdd.length} new parts`, { component: 'partsRepository' })
    return partsToAdd
  },

  /**
   * Save or update multiple parts. Creates new parts and overwrites existing ones.
   * @param parts - Array of parts to upsert
   * @returns Promise<{ created: Part[], updated: Part[] }> - Parts organized by operation
   */
  async upsertMany(parts: Part[]): Promise<{ created: Part[]; updated: Part[] }> {
    if (parts.length === 0) return { created: [], updated: [] }

    const existingParts = await this.getAll()
    const existingMap = new Map(existingParts.map((p) => [p.PartCallout, p]))

    const created: Part[] = []
    const updated: Part[] = []

    for (const part of parts) {
      if (existingMap.has(part.PartCallout)) {
        existingMap.set(part.PartCallout, part)
        updated.push(part)
      } else {
        existingMap.set(part.PartCallout, part)
        created.push(part)
      }
    }

    const allParts = Array.from(existingMap.values())
    this._persist(allParts)

    logger.info(`Upserted parts: ${created.length} created, ${updated.length} updated`, {
      component: 'partsRepository',
    })

    return { created, updated }
  },

  /**
   * Delete a part by its PartCallout.
   * @param callout - The PartCallout of the part to delete
   * @returns Promise<boolean> - True if part was found and deleted
   */
  async delete(callout: string): Promise<boolean> {
    const parts = await this.getAll()
    const index = parts.findIndex((p) => p.PartCallout === callout)

    if (index < 0) {
      return false
    }

    parts.splice(index, 1)
    this._persist(parts)

    logger.info(`Deleted part ${callout}`, { component: 'partsRepository' })
    return true
  },

  /**
   * Delete all parts from storage.
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
    logger.info('Cleared all parts from storage', { component: 'partsRepository' })
  },

  /**
   * Check which callouts already exist in storage.
   * Useful for duplicate detection before import.
   * @param callouts - Array of callouts to check
   * @returns Promise<string[]> - Array of callouts that exist
   */
  async findExistingCallouts(callouts: string[]): Promise<string[]> {
    const parts = await this.getAll()
    const existingCallouts = new Set(parts.map((p) => p.PartCallout))
    return callouts.filter((c) => existingCallouts.has(c))
  },

  /**
   * Internal method to persist parts to localStorage.
   * @private
   */
  _persist(parts: Part[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parts))
    } catch (error) {
      logger.error('Failed to persist parts to storage', error as Error, { component: 'partsRepository' })
      throw error
    }
  },
}
