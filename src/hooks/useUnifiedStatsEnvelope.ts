// src/hooks/useUnifiedStatsEnvelope.ts
// Hook that combines aggregate statistics and envelope calculation
// AC-3.17.1, AC-3.17.3: Unified stats table and envelope in single view

import { useAggregateStats } from './useAggregateStats'
import { useEnvelopeCalculation } from './useEnvelopeCalculation'
import type { AggregateStatistics } from '@/lib/analysis/statistics'
import type { EnvelopeResult } from '@/lib/analysis/envelope'

// =============================================================================
// Types
// =============================================================================

export interface UseUnifiedStatsEnvelopeResult {
  /** Aggregate statistics for all dimensions */
  stats: AggregateStatistics | null
  /** Worst-case envelope with driver identification */
  envelope: EnvelopeResult | null
  /** True while initial data is loading (TanStack Query) */
  isLoading: boolean
  /** True while worker calculation is in progress */
  isCalculating: boolean
  /** True when working set has no parts */
  isEmpty: boolean
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook that provides combined aggregate statistics and envelope data.
 * Consolidates loading and empty states from underlying hooks.
 *
 * AC-3.17.1: Stats table with 5 dimensions
 * AC-3.17.3: Envelope section with driver callouts
 * AC-3.17.6: Combined loading state
 *
 * @returns Unified stats, envelope, and state flags
 */
export function useUnifiedStatsEnvelope(): UseUnifiedStatsEnvelopeResult {
  const {
    stats,
    isLoading: statsLoading,
    isCalculating,
    isEmpty: statsEmpty,
  } = useAggregateStats()

  const {
    envelope,
    isLoading: envelopeLoading,
    isEmpty: envelopeEmpty,
  } = useEnvelopeCalculation()

  // Combined loading: either query is loading
  const isLoading = statsLoading || envelopeLoading

  // Combined empty: both agree working set is empty (they use same source)
  const isEmpty = statsEmpty || envelopeEmpty

  return {
    stats,
    envelope,
    isLoading,
    isCalculating,
    isEmpty,
  }
}
