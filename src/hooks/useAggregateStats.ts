// src/hooks/useAggregateStats.ts
// Hook for aggregate statistics across working set parts
// AC 3.5.3: Auto-update on working set change
// Story 3.14 AC2, AC3: Worker integration with loading state pattern

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  calculateAggregateStats,
  type AggregateStatistics,
} from '@/lib/analysis/statistics'
import { useWorkerCalculation } from './useWorkerCalculation'
import type { Part } from '@/types/domain'
import type { AnalysisResponsePayload } from '@/lib/workers/analysis.worker'

// =============================================================================
// Constants
// =============================================================================

/**
 * Threshold for using Web Worker vs synchronous calculation.
 * Below this threshold, useMemo is sufficient. Above it, offload to worker.
 * Story 3.14: Default 500 parts based on threshold strategy.
 */
const WORKER_THRESHOLD = 500

// =============================================================================
// Types
// =============================================================================

export interface UseAggregateStatsResult {
  stats: AggregateStatistics | null
  isLoading: boolean
  isCalculating: boolean
  isEmpty: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extracts stats result from worker response.
 */
function extractStatsResult(response: AnalysisResponsePayload): AggregateStatistics {
  if (response.type === 'stats') {
    return response.result
  }
  throw new Error(`Unexpected response type: ${response.type}`)
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook that calculates aggregate statistics for parts in the working set.
 * Automatically recalculates when working set changes (AC 3.5.3).
 *
 * Uses Web Worker for large datasets (>= 500 parts) to keep UI responsive.
 * Falls back to synchronous calculation for small datasets or when workers unavailable.
 *
 * Story 3.14 Integration:
 * - AC2: POC integration with worker infrastructure
 * - AC3: Loading state pattern (isCalculating)
 * - AC4: TanStack Query integration (cache invalidation triggers re-run)
 * - AC5: Fallback to sync when workers unavailable
 *
 * @returns Object with stats, isLoading, isCalculating, and isEmpty flags
 */
export function useAggregateStats(): UseAggregateStatsResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  // Filter parts by working set
  const selectedParts = useMemo(() => {
    if (!allParts || partIds.size === 0) return null

    const filtered = allParts.filter((p) => partIds.has(p.PartCallout))
    return filtered.length > 0 ? filtered : null
  }, [allParts, partIds])

  // Use worker calculation with threshold-based routing
  const { result: stats, isCalculating, error } = useWorkerCalculation<Part[], AggregateStatistics>({
    input: selectedParts,
    getInputSize: (parts) => parts.length,
    threshold: WORKER_THRESHOLD,
    syncFallback: calculateAggregateStats,
    toWorkerPayload: (parts) => ({ type: 'stats', parts }),
    fromWorkerResponse: extractStatsResult,
    debounceMs: 100,
    enabled: selectedParts !== null,
  })

  // Log error if present (for debugging)
  if (error) {
    console.error('[useAggregateStats] Calculation error:', error)
  }

  return {
    stats,
    isLoading,
    isCalculating,
    isEmpty: partIds.size === 0,
  }
}
