// src/lib/repositories/componentsRepository.ts
// Repository for Component CRUD operations using localStorage
// Canonical reference: docs/active/arch/data-layer.md

import type { Component } from '@/lib/schemas/component'
import { logger } from '@/lib/logger'

const STORAGE_KEY = 'stationpro-components'

/**
 * Type-safe localStorage operations for Components.
 * Uses synchronous localStorage under the hood but returns Promises
 * for consistency with potential future async storage adapters.
 */
export const componentsRepository = {
  /**
   * Get all components from storage.
   * @returns Promise<Component[]> - All stored components, or empty array if none
   */
  async getAll(): Promise<Component[]> {
    try {
      const json = localStorage.getItem(STORAGE_KEY)
      if (!json) {
        return []
      }
      const components = JSON.parse(json) as Component[]
      logger.debug(`Loaded ${components.length} components from storage`, { component: 'componentsRepository' })
      return components
    } catch (error) {
      logger.error('Failed to load components from storage', error as Error, { component: 'componentsRepository' })
      return []
    }
  },

  /**
   * Get a component by its componentId value.
   * @param id - The componentId to search for
   * @returns Promise<Component | null> - The matching component or null
   */
  async getById(id: string): Promise<Component | null> {
    const components = await this.getAll()
    return components.find((c) => c.componentId === id) ?? null
  },

  /**
   * Get multiple components by their componentId values.
   * @param ids - Array of componentId values to search for
   * @returns Promise<Component[]> - Array of matching components (may be shorter than input if some not found)
   */
  async getByIds(ids: string[]): Promise<Component[]> {
    const components = await this.getAll()
    const idSet = new Set(ids)
    return components.filter((c) => idSet.has(c.componentId))
  },

  /**
   * Save a single component. Overwrites if componentId already exists.
   * @param component - The component to save
   * @returns Promise<Component> - The saved component
   */
  async save(component: Component): Promise<Component> {
    const components = await this.getAll()
    const index = components.findIndex((c) => c.componentId === component.componentId)

    if (index >= 0) {
      components[index] = component
    } else {
      components.push(component)
    }

    this._persist(components)
    logger.info(`Saved component ${component.componentId}`, { component: 'componentsRepository' })
    return component
  },

  /**
   * Save multiple components. Adds new components without touching existing ones.
   * Use upsertMany if you want to overwrite existing components.
   * @param newComponents - Array of components to save
   * @returns Promise<Component[]> - The saved components (only new ones that were added)
   */
  async saveMany(newComponents: Component[]): Promise<Component[]> {
    if (newComponents.length === 0) return []

    const existingComponents = await this.getAll()
    const existingIds = new Set(existingComponents.map((c) => c.componentId))

    // Filter to only components that don't already exist
    const componentsToAdd = newComponents.filter((c) => !existingIds.has(c.componentId))

    if (componentsToAdd.length === 0) {
      logger.info('No new components to save (all already exist)', { component: 'componentsRepository' })
      return []
    }

    const allComponents = [...existingComponents, ...componentsToAdd]
    this._persist(allComponents)

    logger.info(`Saved ${componentsToAdd.length} new components`, { component: 'componentsRepository' })
    return componentsToAdd
  },

  /**
   * Save or update multiple components. Creates new components and overwrites existing ones.
   * @param components - Array of components to upsert
   * @returns Promise<{ created: Component[], updated: Component[] }> - Components organized by operation
   */
  async upsertMany(components: Component[]): Promise<{ created: Component[]; updated: Component[] }> {
    if (components.length === 0) return { created: [], updated: [] }

    const existingComponents = await this.getAll()
    const existingMap = new Map(existingComponents.map((c) => [c.componentId, c]))

    const created: Component[] = []
    const updated: Component[] = []

    for (const component of components) {
      if (existingMap.has(component.componentId)) {
        existingMap.set(component.componentId, component)
        updated.push(component)
      } else {
        existingMap.set(component.componentId, component)
        created.push(component)
      }
    }

    const allComponents = Array.from(existingMap.values())
    this._persist(allComponents)

    logger.info(`Upserted components: ${created.length} created, ${updated.length} updated`, {
      component: 'componentsRepository',
    })

    return { created, updated }
  },

  /**
   * Delete a component by its componentId.
   * @param id - The componentId of the component to delete
   * @returns Promise<boolean> - True if component was found and deleted
   */
  async delete(id: string): Promise<boolean> {
    const components = await this.getAll()
    const index = components.findIndex((c) => c.componentId === id)

    if (index < 0) {
      return false
    }

    components.splice(index, 1)
    this._persist(components)

    logger.info(`Deleted component ${id}`, { component: 'componentsRepository' })
    return true
  },

  /**
   * Delete all components from storage.
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
    logger.info('Cleared all components from storage', { component: 'componentsRepository' })
  },

  /**
   * Check which componentIds already exist in storage.
   * Useful for duplicate detection before import.
   * @param ids - Array of componentIds to check
   * @returns Promise<string[]> - Array of componentIds that exist
   */
  async findExistingIds(ids: string[]): Promise<string[]> {
    const components = await this.getAll()
    const existingIds = new Set(components.map((c) => c.componentId))
    return ids.filter((id) => existingIds.has(id))
  },

  /**
   * Internal method to persist components to localStorage.
   * @private
   */
  _persist(components: Component[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(components))
    } catch (error) {
      logger.error('Failed to persist components to storage', error as Error, { component: 'componentsRepository' })
      throw error
    }
  },
}
