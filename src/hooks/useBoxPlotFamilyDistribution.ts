// src/hooks/useBoxPlotFamilyDistribution.ts
// Hook for family-level box plot distribution data across working set parts
// AC-3.16.3: Family distribution hook returning family-level box plot data

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkingSetStore } from '@/stores/workingSet'
import { partsQueryOptions } from '@/lib/queries/parts'
import {
  calculateAllFamilyBoxPlotStats,
  type BoxPlotFamilyStats,
  type Dimension,
} from '@/lib/analysis/boxPlotStats'
import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Nivo BoxPlot datum format for family-level grouping.
 * Nivo expects one datum per individual value, grouped by `group` field.
 */
export interface NivoBoxPlotFamilyDatum {
  /** Family name for grouping */
  group: string
  /** Dimension value */
  value: number
  /** Part callout for identification */
  partCallout: string
}

/**
 * Box plot data for a single dimension at family level.
 */
export interface BoxPlotFamilyDimensionData {
  /** Dimension identifier */
  dimension: Dimension
  /** Data formatted for Nivo BoxPlot component */
  data: NivoBoxPlotFamilyDatum[]
  /** Pre-computed stats per family (for custom outlier layer) */
  familyStats: BoxPlotFamilyStats[]
  /** List of family names in sorted order */
  familyNames: string[]
}

/**
 * Return type for useBoxPlotFamilyDistribution hook.
 * Per AC-3.16.3: Family-level box plot data for each dimension.
 */
export interface BoxPlotFamilyDistributionResult {
  /** Box plot data for width dimension */
  widthData: BoxPlotFamilyDimensionData
  /** Box plot data for height dimension */
  heightData: BoxPlotFamilyDimensionData
  /** Box plot data for length dimension */
  lengthData: BoxPlotFamilyDimensionData
  /** List of unique family names */
  familyNames: string[]
  /** Number of unique families in working set */
  familyCount: number
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
 * Groups by family name (using "Unassigned" for parts without PartFamily).
 * Data is sorted by group name for consistent alphabetical ordering in chart.
 */
function transformToNivoFamilyData(
  parts: Part[],
  dimension: Dimension
): NivoBoxPlotFamilyDatum[] {
  return parts
    .map((part) => ({
      group: part.PartFamily || 'Unassigned',
      value: getDimensionValue(part, dimension),
      partCallout: part.PartCallout,
    }))
    .sort((a, b) => a.group.localeCompare(b.group))
}

/**
 * Creates BoxPlotFamilyDimensionData for a specific dimension.
 */
function createFamilyDimensionData(
  parts: Part[],
  dimension: Dimension
): BoxPlotFamilyDimensionData {
  const data = transformToNivoFamilyData(parts, dimension)
  const familyStats = calculateAllFamilyBoxPlotStats(parts, dimension)
  const familyNames = familyStats.map((s) => s.familyName)

  return {
    dimension,
    data,
    familyStats,
    familyNames,
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that provides family-level box plot distribution data for parts in the working set.
 * Automatically recalculates when working set changes.
 *
 * Per AC-3.16.3: Provides data for box plot rendering with one box per family.
 * Per AC-3.16.7: Parts without PartFamily are grouped under "Unassigned".
 *
 * @returns Object with box plot data per dimension, family info, and state flags
 *
 * @example
 * function FamilyBoxPlotCharts() {
 *   const {
 *     widthData,
 *     heightData,
 *     lengthData,
 *     familyCount,
 *     isLoading,
 *     isEmpty
 *   } = useBoxPlotFamilyDistribution()
 *
 *   if (isLoading) return <Loading />
 *   if (isEmpty) return <EmptyState />
 *
 *   return (
 *     <>
 *       <BoxPlotChart data={widthData} onFamilyClick={handleFamilyClick} />
 *       <BoxPlotChart data={heightData} onFamilyClick={handleFamilyClick} />
 *       <BoxPlotChart data={lengthData} onFamilyClick={handleFamilyClick} />
 *     </>
 *   )
 * }
 */
export function useBoxPlotFamilyDistribution(): BoxPlotFamilyDistributionResult {
  const { data: allParts, isLoading } = useQuery(partsQueryOptions)
  const partIds = useWorkingSetStore((state) => state.partIds)

  // Filter parts to only those in working set
  const selectedParts = useMemo(() => {
    if (!allParts || partIds.size === 0) return []
    // Working set uses PartCallout as identifier (per project convention)
    return allParts.filter((p) => partIds.has(p.PartCallout))
  }, [allParts, partIds])

  // Extract unique family names (sorted for consistent ordering)
  const familyNames = useMemo(() => {
    const names = new Set<string>()
    for (const part of selectedParts) {
      names.add(part.PartFamily || 'Unassigned')
    }
    return [...names].sort()
  }, [selectedParts])

  // Calculate box plot data for each dimension (memoized per architecture requirement)
  const widthData = useMemo(
    () => createFamilyDimensionData(selectedParts, 'width'),
    [selectedParts]
  )

  const heightData = useMemo(
    () => createFamilyDimensionData(selectedParts, 'height'),
    [selectedParts]
  )

  const lengthData = useMemo(
    () => createFamilyDimensionData(selectedParts, 'length'),
    [selectedParts]
  )

  return {
    widthData,
    heightData,
    lengthData,
    familyNames,
    familyCount: familyNames.length,
    partCount: selectedParts.length,
    isLoading,
    isEmpty: partIds.size === 0,
  }
}
