// src/lib/sampleData.ts
// Sample data loader - fetches JSON files and populates TanStack Query cache

import type { QueryClient } from '@tanstack/react-query'
import type { Part, Component } from '@/types/domain'

/**
 * Loads sample parts and components data into the query cache.
 *
 * Fetches:
 * - /data/sample-parts.json → queryClient.setQueryData(['parts'], ...)
 * - /data/sample-components.json → queryClient.setQueryData(['components'], ...)
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

  queryClient.setQueryData(['parts'], parts)
  queryClient.setQueryData(['components'], components)
}
