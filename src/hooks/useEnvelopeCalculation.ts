// src/hooks/useEnvelopeCalculation.ts
// Hook for worst-case envelope calculation across working set parts
// AC 3.6.3: Auto-update on working set change

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  calculateEnvelope,
  type EnvelopeResult,
} from '@/lib/analysis/envelope'

export interface UseEnvelopeCalculationResult {
  envelope: EnvelopeResult | null
  isLoading: boolean
  isEmpty: boolean
}

/**
 * Hook that calculates worst-case envelope for parts in the working set.
 * Automatically recalculates when working set changes (AC 3.6.3).
 *
 * @returns Object with envelope, isLoading, and isEmpty flags
 */
export function useEnvelopeCalculation(): UseEnvelopeCalculationResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  const envelope = useMemo(() => {
    if (!allParts || partIds.size === 0) return null

    // Working set uses PartCallout as identifier (per project convention)
    const selectedParts = allParts.filter((p) => partIds.has(p.PartCallout))
    if (selectedParts.length === 0) return null

    return calculateEnvelope(selectedParts)
  }, [allParts, partIds])

  return {
    envelope,
    isLoading,
    isEmpty: partIds.size === 0,
  }
}
