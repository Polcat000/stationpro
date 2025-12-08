// src/hooks/useDimensionalDistribution.ts
// Hook for dimensional distribution data across working set parts
// AC 3.7.1: Charts rendered, AC 3.7.2: Series grouping

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  detectOutliers,
  type Dimension,
} from '@/lib/analysis/outliers'
import type { Part } from '@/types/domain'

// =============================================================================
// Constants
// =============================================================================

/**
 * Threshold for switching from individual bars to histogram binning.
 * Per AC 3.7.2: If ≤20 parts, show individual bars per part.
 */
const HISTOGRAM_THRESHOLD = 20

/**
 * Number of bins for histogram mode.
 * Balances granularity with readability.
 */
const HISTOGRAM_BIN_COUNT = 10

// =============================================================================
// Types
// =============================================================================

/**
 * Data point for a single bar in the distribution chart.
 * Per tech spec: docs/sprint-artifacts/tech-spec-epic-3.md#Chart-Data-Structures
 */
export interface ChartDataPoint {
  /** Dimension value (individual) or bin center (histogram) */
  value: number
  /** Number of parts with this value/in this bin */
  count: number
  /** Series name for color mapping */
  series: string
  /** Part callouts represented by this bar (for click → highlight) */
  partIds: string[]
  /** Flag for outlier styling per AC 3.7.3 */
  isOutlier: boolean
}

/**
 * Return type for useDimensionalDistribution hook.
 * Per tech spec: docs/sprint-artifacts/tech-spec-epic-3.md#Chart-Data-Structures
 */
export interface DimensionalDistributionResult {
  widthData: ChartDataPoint[]
  heightData: ChartDataPoint[]
  lengthData: ChartDataPoint[]
  outliers: {
    width: Part[]
    height: Part[]
    length: Part[]
  }
  seriesNames: string[]
  isLoading: boolean
  isEmpty: boolean
  useHistogram: boolean
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
 * Transforms parts data into chart-ready format for individual bars.
 * Groups by unique value + series combination.
 */
function transformToIndividualBars(
  parts: Part[],
  dimension: Dimension,
  outlierIds: Set<string>
): ChartDataPoint[] {
  // Group parts by (value, series) combination
  const groups = new Map<string, { parts: Part[]; value: number; series: string }>()

  for (const part of parts) {
    const value = getDimensionValue(part, dimension)
    const series = part.PartSeries || 'Uncategorized'
    const key = `${value}-${series}`

    if (!groups.has(key)) {
      groups.set(key, { parts: [], value, series })
    }
    groups.get(key)!.parts.push(part)
  }

  // Convert groups to ChartDataPoints
  const dataPoints: ChartDataPoint[] = []
  for (const group of groups.values()) {
    dataPoints.push({
      value: group.value,
      count: group.parts.length,
      series: group.series,
      partIds: group.parts.map((p) => p.PartCallout),
      isOutlier: group.parts.some((p) => outlierIds.has(p.PartCallout)),
    })
  }

  // Sort by value for consistent chart ordering
  return dataPoints.sort((a, b) => a.value - b.value)
}

/**
 * Transforms parts data into histogram bins.
 * Groups by bin range + series combination.
 */
function transformToHistogramBins(
  parts: Part[],
  dimension: Dimension,
  outlierIds: Set<string>
): ChartDataPoint[] {
  if (parts.length === 0) return []

  // Calculate bin boundaries
  const values = parts.map((p) => getDimensionValue(p, dimension))
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue

  // Handle case where all values are the same
  if (range === 0) {
    return transformToIndividualBars(parts, dimension, outlierIds)
  }

  const binWidth = range / HISTOGRAM_BIN_COUNT

  // Group parts by (bin, series) combination
  const groups = new Map<string, { parts: Part[]; binCenter: number; series: string }>()

  for (const part of parts) {
    const value = getDimensionValue(part, dimension)
    const series = part.PartSeries || 'Uncategorized'

    // Calculate which bin this value falls into
    let binIndex = Math.floor((value - minValue) / binWidth)
    // Handle edge case where value === maxValue
    if (binIndex >= HISTOGRAM_BIN_COUNT) {
      binIndex = HISTOGRAM_BIN_COUNT - 1
    }

    const binCenter = minValue + (binIndex + 0.5) * binWidth
    const key = `${binIndex}-${series}`

    if (!groups.has(key)) {
      groups.set(key, { parts: [], binCenter, series })
    }
    groups.get(key)!.parts.push(part)
  }

  // Convert groups to ChartDataPoints
  const dataPoints: ChartDataPoint[] = []
  for (const group of groups.values()) {
    dataPoints.push({
      value: group.binCenter,
      count: group.parts.length,
      series: group.series,
      partIds: group.parts.map((p) => p.PartCallout),
      isOutlier: group.parts.some((p) => outlierIds.has(p.PartCallout)),
    })
  }

  // Sort by value for consistent chart ordering
  return dataPoints.sort((a, b) => a.value - b.value)
}

/**
 * Transforms parts data into chart-ready format.
 * Uses individual bars for ≤20 parts, histogram for >20 parts.
 */
function transformDimensionData(
  parts: Part[],
  dimension: Dimension,
  useHistogram: boolean,
  outlierIds: Set<string>
): ChartDataPoint[] {
  if (parts.length === 0) return []

  if (useHistogram) {
    return transformToHistogramBins(parts, dimension, outlierIds)
  }

  return transformToIndividualBars(parts, dimension, outlierIds)
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that calculates dimensional distribution data for parts in the working set.
 * Automatically recalculates when working set changes (AC 3.7.3: outlier status recalculated).
 *
 * @returns Object with chart data, outliers, series names, and state flags
 *
 * @example
 * function DistributionCharts() {
 *   const { widthData, heightData, lengthData, seriesNames, isLoading, isEmpty } =
 *     useDimensionalDistribution()
 *
 *   if (isLoading) return <Loading />
 *   if (isEmpty) return <EmptyState />
 *
 *   return (
 *     <>
 *       <Chart data={widthData} seriesNames={seriesNames} />
 *       <Chart data={heightData} seriesNames={seriesNames} />
 *       <Chart data={lengthData} seriesNames={seriesNames} />
 *     </>
 *   )
 * }
 */
export function useDimensionalDistribution(): DimensionalDistributionResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  // Filter parts to only those in working set
  const selectedParts = useMemo(() => {
    if (!allParts || partIds.size === 0) return []
    // Working set uses PartCallout as identifier (per project convention)
    return allParts.filter((p) => partIds.has(p.PartCallout))
  }, [allParts, partIds])

  // Determine if we should use histogram mode
  const useHistogram = selectedParts.length > HISTOGRAM_THRESHOLD

  // Calculate outliers for each dimension (AC 3.7.3)
  const outliers = useMemo(
    () => ({
      width: detectOutliers(selectedParts, 'width'),
      height: detectOutliers(selectedParts, 'height'),
      length: detectOutliers(selectedParts, 'length'),
    }),
    [selectedParts]
  )

  // Create sets of outlier IDs for efficient lookup
  const outlierIds = useMemo(() => {
    const widthOutlierIds = new Set(outliers.width.map((p) => p.PartCallout))
    const heightOutlierIds = new Set(outliers.height.map((p) => p.PartCallout))
    const lengthOutlierIds = new Set(outliers.length.map((p) => p.PartCallout))
    return { width: widthOutlierIds, height: heightOutlierIds, length: lengthOutlierIds }
  }, [outliers])

  // Transform data for each dimension chart (memoized per AC requirement)
  const widthData = useMemo(
    () => transformDimensionData(selectedParts, 'width', useHistogram, outlierIds.width),
    [selectedParts, useHistogram, outlierIds.width]
  )

  const heightData = useMemo(
    () => transformDimensionData(selectedParts, 'height', useHistogram, outlierIds.height),
    [selectedParts, useHistogram, outlierIds.height]
  )

  const lengthData = useMemo(
    () => transformDimensionData(selectedParts, 'length', useHistogram, outlierIds.length),
    [selectedParts, useHistogram, outlierIds.length]
  )

  // Extract unique series names (AC 3.7.2)
  const seriesNames = useMemo(
    () =>
      [...new Set(selectedParts.map((p) => p.PartSeries || 'Uncategorized'))].sort(),
    [selectedParts]
  )

  return {
    widthData,
    heightData,
    lengthData,
    outliers,
    seriesNames,
    isLoading,
    isEmpty: partIds.size === 0,
    useHistogram,
  }
}
