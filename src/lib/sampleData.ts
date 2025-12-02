// src/lib/sampleData.ts
// Sample data loader - fetches JSON files and persists to localStorage + query cache

import type { QueryClient } from '@tanstack/react-query'
import type { Part } from '@/types/domain'
import type { Component } from '@/lib/schemas/component'
import { partsRepository } from '@/lib/repositories/partsRepository'
import { componentsRepository } from '@/lib/repositories/componentsRepository'

/**
 * Loads sample parts and components data into localStorage and query cache.
 *
 * Fetches:
 * - /data/sample-parts.json → persists to localStorage, updates query cache
 * - /data/sample-components.json → persists to localStorage, updates query cache
 *
 * @param queryClient - TanStack Query client instance
 * @throws Error if fetch fails
 */
export async function loadSampleData(queryClient: QueryClient): Promise<void> {
  const [partsResponse, componentsResponse] = await Promise.all([
    fetch('/data/sample-parts.json'),
    fetch('/data/sample-components.json'),
  ])

  if (!partsResponse.ok) {
    throw new Error(`Failed to load sample parts: ${partsResponse.status}`)
  }

  if (!componentsResponse.ok) {
    throw new Error(`Failed to load sample components: ${componentsResponse.status}`)
  }

  const parts: Part[] = await partsResponse.json()
  const components: Component[] = await componentsResponse.json()

  // Persist to localStorage via repositories
  await partsRepository.upsertMany(parts)
  await componentsRepository.upsertMany(components)

  // Update query cache
  queryClient.setQueryData(['parts'], parts)
  queryClient.setQueryData(['components'], components)
}
