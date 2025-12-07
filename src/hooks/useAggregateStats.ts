// src/hooks/useAggregateStats.ts
// Hook for aggregate statistics across working set parts
// AC 3.5.3: Auto-update on working set change

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  calculateAggregateStats,
  type AggregateStatistics,
} from '@/lib/analysis/statistics'

export interface UseAggregateStatsResult {
  stats: AggregateStatistics | null
  isLoading: boolean
  isEmpty: boolean
}

/**
 * Hook that calculates aggregate statistics for parts in the working set.
 * Automatically recalculates when working set changes (AC 3.5.3).
 *
 * @returns Object with stats, isLoading, and isEmpty flags
 */
export function useAggregateStats(): UseAggregateStatsResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  const stats = useMemo(() => {
    if (!allParts || partIds.size === 0) return null

    const selectedParts = allParts.filter((p) => partIds.has(p.PartCallout))
    if (selectedParts.length === 0) return null

    return calculateAggregateStats(selectedParts)
  }, [allParts, partIds])

  return {
    stats,
    isLoading,
    isEmpty: partIds.size === 0,
  }
}
