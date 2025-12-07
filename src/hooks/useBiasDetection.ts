// src/hooks/useBiasDetection.ts
// Hook for bias detection in working set
// Subscribes to workingSetStore and queries parts data

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import { detectBias, type CombinedBiasResult } from '@/lib/analysis/bias'

/**
 * Hook that detects bias in the current working set.
 * Combines workingSetStore partIds with parts query data to compute bias detection.
 *
 * @returns CombinedBiasResult with detected biases and hasBias flag
 */
export function useBiasDetection(): CombinedBiasResult {
  const { data: allParts } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  return useMemo(() => {
    if (!allParts) return { biases: [], hasBias: false }

    const selectedParts = allParts.filter((p) => partIds.has(p.PartCallout))
    return detectBias(selectedParts)
  }, [allParts, partIds])
}
