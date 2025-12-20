// src/hooks/useBoxPlotDistribution.ts
// Hook for box plot distribution data across working set parts
// AC-3.7a.1: Box plots for working set, AC-3.7a.3: Single-series detection

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  calculateAllSeriesBoxPlotStats,
  type BoxPlotSeriesStats,
  type Dimension,
} from '@/lib/analysis/boxPlotStats'
import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Nivo BoxPlot datum format.
 * Nivo expects one datum per individual value, grouped by `group` field.
 */
export interface NivoBoxPlotDatum {
  /** Series name for grouping */
  group: string
  /** Dimension value */
  value: number
  /** Part callout for identification */
  partCallout: string
}

/**
 * Box plot data for a single dimension, ready for Nivo consumption.
 */
export interface BoxPlotDimensionData {
  /** Dimension identifier */
  dimension: Dimension
  /** Data formatted for Nivo BoxPlot component */
  data: NivoBoxPlotDatum[]
  /** Pre-computed stats per series (for custom outlier layer) */
  seriesStats: BoxPlotSeriesStats[]
  /** List of series names in sorted order */
  seriesNames: string[]
}

/**
 * Return type for useBoxPlotDistribution hook.
 * Per AC-3.7a.1: Box plot data for each dimension.
 */
export interface BoxPlotDistributionResult {
  /** Box plot data for width dimension */
  widthData: BoxPlotDimensionData
  /** Box plot data for height dimension */
  heightData: BoxPlotDimensionData
  /** Box plot data for length dimension */
  lengthData: BoxPlotDimensionData
  /** List of unique series names */
  seriesNames: string[]
  /** Number of unique series in working set */
  seriesCount: number
  /** Total number of parts in working set */
  partCount: number
  /** Whether data is loading */
  isLoading: boolean
  /** Whether working set is empty */
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
 * Transforms parts to Nivo BoxPlot datum format for a specific dimension.
 * Creates one datum per part with group = series name.
 * Data is sorted by group name for consistent alphabetical ordering in chart.
 */
function transformToNivoData(parts: Part[], dimension: Dimension): NivoBoxPlotDatum[] {
  return parts
    .map((part) => ({
      group: part.PartSeries || 'Uncategorized',
      value: getDimensionValue(part, dimension),
      partCallout: part.PartCallout,
    }))
    .sort((a, b) => a.group.localeCompare(b.group))
}

/**
 * Creates BoxPlotDimensionData for a specific dimension.
 */
function createDimensionData(
  parts: Part[],
  dimension: Dimension
): BoxPlotDimensionData {
  const data = transformToNivoData(parts, dimension)
  const seriesStats = calculateAllSeriesBoxPlotStats(parts, dimension)
  const seriesNames = seriesStats.map((s) => s.seriesName)

  return {
    dimension,
    data,
    seriesStats,
    seriesNames,
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that provides box plot distribution data for parts in the working set.
 * Automatically recalculates when working set changes.
 *
 * Per AC-3.7a.1: Provides data for box plot rendering with one box per series.
 * Per AC-3.7a.3: seriesCount can be used to determine single-series vs multi-series view.
 * Per AC-3.16.4: Optional familyName parameter filters to series within that family.
 *
 * @param familyName - Optional family name to filter parts. When provided, only
 *                     series within that family are included. Use "Unassigned"
 *                     for parts without a PartFamily.
 * @returns Object with box plot data per dimension, series info, and state flags
 *
 * @example
 * function BoxPlotCharts() {
 *   const {
 *     widthData,
 *     heightData,
 *     lengthData,
 *     seriesCount,
 *     isLoading,
 *     isEmpty
 *   } = useBoxPlotDistribution()
 *
 *   if (isLoading) return <Loading />
 *   if (isEmpty) return <EmptyState />
 *
 *   // AC-3.7a.3: Show histogram directly for single series
 *   if (seriesCount === 1) {
 *     return <HistogramView />
 *   }
 *
 *   return (
 *     <>
 *       <BoxPlotChart data={widthData} />
 *       <BoxPlotChart data={heightData} />
 *       <BoxPlotChart data={lengthData} />
 *     </>
 *   )
 * }
 *
 * @example
 * // Drill-down to family: show series within SEAX family
 * const { widthData } = useBoxPlotDistribution('SEAX')
 */
export function useBoxPlotDistribution(
  familyName?: string | null
): BoxPlotDistributionResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  // Filter parts to only those in working set, then optionally by family
  const selectedParts = useMemo(() => {
    if (!allParts || partIds.size === 0) return []
    // Working set uses PartCallout as identifier (per project convention)
    let filtered = allParts.filter((p) => partIds.has(p.PartCallout))
    // AC-3.16.4: Filter by family when familyName is provided
    if (familyName) {
      filtered = filtered.filter(
        (p) => (p.PartFamily || 'Unassigned') === familyName
      )
    }
    return filtered
  }, [allParts, partIds, familyName])

  // Extract unique series names (sorted for consistent ordering)
  const seriesNames = useMemo(() => {
    const names = new Set<string>()
    for (const part of selectedParts) {
      names.add(part.PartSeries || 'Uncategorized')
    }
    return [...names].sort()
  }, [selectedParts])

  // Calculate box plot data for each dimension (memoized per architecture requirement)
  const widthData = useMemo(
    () => createDimensionData(selectedParts, 'width'),
    [selectedParts]
  )

  const heightData = useMemo(
    () => createDimensionData(selectedParts, 'height'),
    [selectedParts]
  )

  const lengthData = useMemo(
    () => createDimensionData(selectedParts, 'length'),
    [selectedParts]
  )

  return {
    widthData,
    heightData,
    lengthData,
    seriesNames,
    seriesCount: seriesNames.length,
    partCount: selectedParts.length,
    isLoading,
    isEmpty: partIds.size === 0,
  }
}
