// src/hooks/useHistogramDistribution.ts
// Hook for histogram distribution data for single-series drill-down view
// AC-3.7a.2: Histogram drill-down with configurable bins
// AC-3.7a.3: Single-series working set auto-switch
// AC-3.7a.5: Part callouts per bin

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  calculateBoxPlotStats,
  type Dimension,
} from '@/lib/analysis/boxPlotStats'
import {
  createHistogramBins,
  DEFAULT_BIN_COUNT,
  type HistogramBin,
} from '@/components/charts/HistogramChart'
import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Histogram data for a single dimension.
 */
export interface HistogramDimensionData {
  /** Dimension identifier */
  dimension: Dimension
  /** Histogram bins with part data */
  bins: HistogramBin[]
  /** Min value in dataset */
  minValue: number
  /** Max value in dataset */
  maxValue: number
  /** Total part count */
  partCount: number
}

/**
 * Return type for useHistogramDistribution hook.
 */
export interface HistogramDistributionResult {
  /** Histogram data for width dimension */
  widthData: HistogramDimensionData
  /** Histogram data for height dimension */
  heightData: HistogramDimensionData
  /** Histogram data for length dimension */
  lengthData: HistogramDimensionData
  /** Series name being displayed */
  seriesName: string
  /** Total part count for this series */
  partCount: number
  /** Whether data is loading */
  isLoading: boolean
  /** Whether no parts match the series filter */
  isEmpty: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets dimension value from a part.
 */
function getDimensionValue(part: Part, dimension: Dimension): number {
  switch (dimension) {
    case 'width':
      return part.PartWidth_mm
    case 'height':
      return part.PartHeight_mm
    case 'length':
      return part.PartLength_mm
  }
}

/**
 * Creates histogram data for a single dimension.
 * Uses IQR-based outlier detection per AC-3.7a.4.
 */
function createDimensionHistogramData(
  parts: Part[],
  dimension: Dimension,
  binCount: number = DEFAULT_BIN_COUNT
): HistogramDimensionData {
  if (parts.length === 0) {
    return {
      dimension,
      bins: [],
      minValue: 0,
      maxValue: 0,
      partCount: 0,
    }
  }

  // Convert parts to value array with identification
  const values = parts.map((part) => ({
    value: getDimensionValue(part, dimension),
    partId: part.PartCallout,
    partCallout: part.PartCallout,
  }))

  // Calculate IQR-based stats to determine outliers
  const stats = calculateBoxPlotStats(values)
  const outlierCallouts = new Set(stats.outliers.map((o) => o.partCallout))

  // Transform to histogram input format
  const histogramInput = values.map((v) => ({
    value: v.value,
    partCallout: v.partCallout,
    isOutlier: outlierCallouts.has(v.partCallout),
  }))

  // Create histogram bins
  const bins = createHistogramBins(histogramInput, binCount)

  // Get range from stats
  const numericValues = values.map((v) => v.value)

  return {
    dimension,
    bins,
    minValue: Math.min(...numericValues),
    maxValue: Math.max(...numericValues),
    partCount: parts.length,
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that provides histogram distribution data for a single series.
 * Used for drill-down view when clicking a series in box plot.
 *
 * Per AC-3.7a.2: Histogram view for single-series drill-down.
 * Per AC-3.7a.3: Can be used directly when only one series in working set.
 * Per AC-3.7a.5: Includes part callouts per bin for tooltip display.
 *
 * @param seriesName - Series name to filter parts by. If null/undefined, uses all working set parts.
 * @param binCount - Number of histogram bins (default 10)
 * @returns Object with histogram data per dimension and state flags
 *
 * @example
 * // Drill-down from box plot
 * function HistogramDrilldown({ seriesName }: { seriesName: string }) {
 *   const { widthData, heightData, lengthData, isLoading, isEmpty } =
 *     useHistogramDistribution(seriesName)
 *
 *   if (isLoading) return <Loading />
 *   if (isEmpty) return <EmptyState />
 *
 *   return (
 *     <>
 *       <HistogramChart data={widthData.bins} dimension="width" seriesName={seriesName} />
 *       <HistogramChart data={heightData.bins} dimension="height" seriesName={seriesName} />
 *       <HistogramChart data={lengthData.bins} dimension="length" seriesName={seriesName} />
 *     </>
 *   )
 * }
 *
 * @example
 * // Single-series working set (AC-3.7a.3)
 * function SingleSeriesView() {
 *   const { seriesCount, seriesNames } = useBoxPlotDistribution()
 *   const { widthData } = useHistogramDistribution(seriesNames[0])
 *
 *   // seriesCount === 1, so show histogram directly
 *   return <HistogramChart data={widthData.bins} dimension="width" seriesName={seriesNames[0]} />
 * }
 */
export function useHistogramDistribution(
  seriesName: string | null = null,
  binCount: number = DEFAULT_BIN_COUNT
): HistogramDistributionResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  // Filter parts to working set and optionally by series
  const filteredParts = useMemo(() => {
    if (!allParts || partIds.size === 0) return []

    // First filter to working set
    let parts = allParts.filter((p) => partIds.has(p.PartCallout))

    // Then filter by series if specified
    if (seriesName !== null) {
      parts = parts.filter((p) => {
        const partSeries = p.PartSeries || 'Uncategorized'
        return partSeries === seriesName
      })
    }

    return parts
  }, [allParts, partIds, seriesName])

  // Determine effective series name
  const effectiveSeriesName = useMemo(() => {
    if (seriesName !== null) return seriesName
    if (filteredParts.length === 0) return 'No Series'

    // If no series specified, check if all parts are same series
    const seriesSet = new Set(filteredParts.map((p) => p.PartSeries || 'Uncategorized'))
    if (seriesSet.size === 1) {
      return [...seriesSet][0]
    }
    return 'Multiple Series'
  }, [seriesName, filteredParts])

  // Calculate histogram data for each dimension (memoized per architecture requirement)
  const widthData = useMemo(
    () => createDimensionHistogramData(filteredParts, 'width', binCount),
    [filteredParts, binCount]
  )

  const heightData = useMemo(
    () => createDimensionHistogramData(filteredParts, 'height', binCount),
    [filteredParts, binCount]
  )

  const lengthData = useMemo(
    () => createDimensionHistogramData(filteredParts, 'length', binCount),
    [filteredParts, binCount]
  )

  return {
    widthData,
    heightData,
    lengthData,
    seriesName: effectiveSeriesName,
    partCount: filteredParts.length,
    isLoading,
    isEmpty: filteredParts.length === 0,
  }
}
