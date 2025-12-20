// src/hooks/useAggregateBoxPlot.ts
// Hook for aggregate box plot data across entire working set
// AC-3.17.4, AC-3.17.5, AC-3.17.6: Aggregate boxplot with dimension tabs

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  calculateBoxPlotStats,
  type BoxPlotStats,
} from '@/lib/analysis/boxPlotStats'
import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Extended dimension type for aggregate stats that includes feature dimensions.
 */
export type AggregateDimension = 'width' | 'height' | 'length' | 'lateral' | 'depth'

/**
 * Nivo BoxPlot datum format for aggregate chart.
 * Uses a single group since we're showing entire working set.
 */
export interface AggregateNivoBoxPlotDatum {
  /** Fixed group name for entire working set */
  group: string
  /** Dimension value */
  value: number
  /** Part callout for outlier identification */
  partCallout: string
}

/**
 * Aggregate box plot data for a single dimension, ready for Nivo consumption.
 */
export interface AggregateBoxPlotData {
  /** Dimension identifier */
  dimension: AggregateDimension
  /** Data formatted for Nivo BoxPlot component */
  data: AggregateNivoBoxPlotDatum[]
  /** Pre-computed stats for the aggregate (for custom outlier layer) */
  stats: BoxPlotStats
}

/**
 * Return type for useAggregateBoxPlot hook.
 */
export interface UseAggregateBoxPlotResult {
  /** Box plot data for the requested dimension, null for depth when no data */
  boxPlotData: AggregateBoxPlotData | null
  /** True while data is loading */
  isLoading: boolean
  /** True when working set is empty */
  isEmpty: boolean
  /** True when depth dimension has no data (only meaningful for depth) */
  hasNoDepthData: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets dimension value from a part. Returns undefined for depth if not present.
 */
function getDimensionValue(part: Part, dimension: AggregateDimension): number | undefined {
  switch (dimension) {
    case 'width':
      return part.PartWidth_mm
    case 'height':
      return part.PartHeight_mm
    case 'length':
      return part.PartLength_mm
    case 'lateral':
      return part.SmallestLateralFeature_um
    case 'depth':
      return part.SmallestDepthFeature_um
  }
}

/**
 * Creates aggregate box plot data for a specific dimension.
 * Returns null for depth dimension when no parts have depth data.
 */
function createAggregateBoxPlotData(
  parts: Part[],
  dimension: AggregateDimension
): AggregateBoxPlotData | null {
  // Filter parts to only those with valid dimension values
  const validParts = parts.filter((part) => {
    const value = getDimensionValue(part, dimension)
    return value !== undefined
  })

  // For depth dimension, return null if no parts have depth data
  if (dimension === 'depth' && validParts.length === 0) {
    return null
  }

  // Convert to values array for calculateBoxPlotStats
  const values = validParts.map((part) => ({
    value: getDimensionValue(part, dimension)!,
    partId: part.PartCallout,
    partCallout: part.PartCallout,
  }))

  const stats = calculateBoxPlotStats(values)

  // Transform to Nivo format with single group
  const data: AggregateNivoBoxPlotDatum[] = validParts.map((part) => ({
    group: 'Working Set',
    value: getDimensionValue(part, dimension)!,
    partCallout: part.PartCallout,
  }))

  return {
    dimension,
    data,
    stats,
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that provides aggregate box plot data for the entire working set.
 * Unlike useBoxPlotDistribution which groups by series, this creates a single
 * boxplot representing all parts together.
 *
 * AC-3.17.4: Single boxplot for entire working set
 * AC-3.17.5: Tab selector controls dimension
 * AC-3.17.6: Returns null for depth when no parts have depth data
 *
 * @param dimension - The dimension to calculate boxplot for
 * @returns Object with boxplot data, loading state, and empty/no-data flags
 *
 * @example
 * function AggregateBoxPlotChart() {
 *   const [dimension, setDimension] = useState<AggregateDimension>('width')
 *   const { boxPlotData, isLoading, isEmpty, hasNoDepthData } = useAggregateBoxPlot(dimension)
 *
 *   if (isLoading) return <Loading />
 *   if (isEmpty) return <EmptyState />
 *   if (dimension === 'depth' && hasNoDepthData) return <NoDepthDataMessage />
 *
 *   return <BoxPlot data={boxPlotData!.data} stats={boxPlotData!.stats} />
 * }
 */
export function useAggregateBoxPlot(dimension: AggregateDimension): UseAggregateBoxPlotResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  // Filter parts to only those in working set
  const selectedParts = useMemo(() => {
    if (!allParts || partIds.size === 0) return []
    return allParts.filter((p) => partIds.has(p.PartCallout))
  }, [allParts, partIds])

  // Check if any parts have depth data (for hasNoDepthData flag)
  const hasNoDepthData = useMemo(() => {
    return selectedParts.every((p) => p.SmallestDepthFeature_um === undefined)
  }, [selectedParts])

  // Calculate box plot data for the requested dimension
  const boxPlotData = useMemo(() => {
    if (selectedParts.length === 0) return null
    return createAggregateBoxPlotData(selectedParts, dimension)
  }, [selectedParts, dimension])

  return {
    boxPlotData,
    isLoading,
    isEmpty: partIds.size === 0,
    hasNoDepthData,
  }
}
