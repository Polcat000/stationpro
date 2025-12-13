// src/hooks/useZoneAggregation.ts
// Hook for zone aggregation calculation across working set parts
// AC-3.9.1 through AC-3.9.5: Zone aggregation with auto-update on working set change

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  aggregateZones,
  type ZoneAggregation,
} from '@/lib/analysis/zoneAggregation'
import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

export interface UseZoneAggregationResult {
  /** Zone aggregation result, null if no zones or empty working set */
  aggregation: ZoneAggregation | null
  /** Selected parts from working set (for face-specific calculations) */
  parts: Part[]
  /** True while parts data is loading */
  isLoading: boolean
  /** True when working set is empty (no parts selected) */
  isEmpty: boolean
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that calculates zone aggregation for parts in the working set.
 * Automatically recalculates when working set changes.
 *
 * Per Architecture (data-layer.md):
 * - Zone aggregation is derived state (never persisted)
 * - Uses useMemo with [partIds] dependency
 * - Subscribes to working set via Zustand hook
 *
 * @returns Object with aggregation, isLoading, and isEmpty flags
 *
 * @example
 * function ZoneAggregationPanel() {
 *   const { aggregation, isLoading, isEmpty } = useZoneAggregation()
 *
 *   if (isLoading) return <Loading />
 *   if (isEmpty || !aggregation) return <EmptyState />
 *
 *   return (
 *     <div>
 *       <p>Total zones: {aggregation.totalZones}</p>
 *       <p>Depth range: {aggregation.depthRange.min} - {aggregation.depthRange.max} mm</p>
 *     </div>
 *   )
 * }
 */
export function useZoneAggregation(): UseZoneAggregationResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  // Memoize selected parts array
  const selectedParts = useMemo(() => {
    if (!allParts || partIds.size === 0) return []
    return allParts.filter((p) => partIds.has(p.PartCallout))
  }, [allParts, partIds])

  const aggregation = useMemo(() => {
    if (selectedParts.length === 0) return null
    return aggregateZones(selectedParts)
  }, [selectedParts])

  return {
    aggregation,
    parts: selectedParts,
    isLoading,
    isEmpty: partIds.size === 0,
  }
}
