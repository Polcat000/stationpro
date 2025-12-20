// src/lib/analysis/boxPlotStats.ts
// Pure calculation functions for box plot statistics with IQR-based outlier detection
// AC-3.7a.1: Box plot stats, AC-3.7a.4: Outlier detection (1.5x IQR)

import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Outlier data point with part identification.
 * AC-3.7a.4: Outlier dots show part callout on hover.
 */
export interface OutlierPoint {
  value: number
  partId: string
  partCallout: string
}

/**
 * Box plot statistics for a single series.
 * Uses standard box plot calculations with 1.5×IQR whisker bounds.
 *
 * Quartile calculation uses the inclusive method (same as Excel QUARTILE.INC):
 * - Q1 = 25th percentile
 * - Q2 = 50th percentile (median)
 * - Q3 = 75th percentile
 *
 * Whisker bounds follow Tukey's definition:
 * - Lower whisker: Q1 - 1.5×IQR (bounded by min value within range)
 * - Upper whisker: Q3 + 1.5×IQR (bounded by max value within range)
 *
 * Values outside whisker bounds are classified as outliers.
 */
export interface BoxPlotStats {
  /** Minimum value in the dataset */
  min: number
  /** First quartile (25th percentile) */
  q1: number
  /** Median (50th percentile) */
  median: number
  /** Third quartile (75th percentile) */
  q3: number
  /** Maximum value in the dataset */
  max: number
  /** Interquartile range (Q3 - Q1) */
  iqr: number
  /** Lower whisker bound: max(min, Q1 - 1.5×IQR) */
  whiskerLow: number
  /** Upper whisker bound: min(max, Q3 + 1.5×IQR) */
  whiskerHigh: number
  /** Values outside whisker bounds with part identification */
  outliers: OutlierPoint[]
  /** Total number of parts */
  n: number
  /** Mean value (for reference, not used in box plot rendering) */
  mean: number
}

/**
 * Box plot statistics for a series, including series identification.
 * AC-3.7a.1: One box per series.
 */
export interface BoxPlotSeriesStats extends BoxPlotStats {
  /** Series name for grouping */
  seriesName: string
}

/**
 * Box plot statistics for a family, including family identification.
 * AC-3.16.2: One box per family with series count.
 */
export interface BoxPlotFamilyStats extends BoxPlotStats {
  /** Family name for grouping */
  familyName: string
  /** Number of unique series in this family */
  seriesCount: number
}

/**
 * Dimension identifier for Part dimension access.
 */
export type Dimension = 'width' | 'height' | 'length'

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculates a percentile value using linear interpolation.
 * Uses the R-7 method (default in R, same as Excel PERCENTILE.INC).
 *
 * @param sortedValues - Pre-sorted array of numbers (ascending)
 * @param p - Percentile as decimal (0 to 1)
 * @returns The interpolated percentile value
 *
 * @example
 * // For sorted array [1, 2, 3, 4, 5], Q1 (p=0.25) = 2
 * percentile([1, 2, 3, 4, 5], 0.25) // Returns 2
 */
function percentile(sortedValues: number[], p: number): number {
  const n = sortedValues.length
  if (n === 0) return 0
  if (n === 1) return sortedValues[0]

  // R-7 method: h = (n-1)*p + 1, but 0-indexed so h = (n-1)*p
  const h = (n - 1) * p
  const lower = Math.floor(h)
  const upper = Math.ceil(h)
  const fraction = h - lower

  if (lower === upper) {
    return sortedValues[lower]
  }

  // Linear interpolation between lower and upper
  return sortedValues[lower] + fraction * (sortedValues[upper] - sortedValues[lower])
}

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

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Calculates box plot statistics for an array of values with part identification.
 * Uses 1.5×IQR for whisker bounds and outlier detection per AC-3.7a.4.
 *
 * Edge cases:
 * - Empty array: Returns zeros with empty outliers
 * - Single value: All quartiles equal that value, no outliers possible
 * - Two values: Q1=min, median=average, Q3=max
 * - All identical values: IQR=0, no outliers possible
 *
 * @param values - Array of {value, partId, partCallout} objects
 * @returns Complete box plot statistics including outliers
 *
 * @example
 * const stats = calculateBoxPlotStats([
 *   { value: 10, partId: '1', partCallout: 'PART-001' },
 *   { value: 12, partId: '2', partCallout: 'PART-002' },
 *   { value: 100, partId: '3', partCallout: 'PART-003' }, // outlier
 * ])
 * // stats.outliers = [{ value: 100, partId: '3', partCallout: 'PART-003' }]
 */
export function calculateBoxPlotStats(
  values: { value: number; partId: string; partCallout: string }[]
): BoxPlotStats {
  const n = values.length

  // Empty array edge case
  if (n === 0) {
    return {
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      iqr: 0,
      whiskerLow: 0,
      whiskerHigh: 0,
      outliers: [],
      n: 0,
      mean: 0,
    }
  }

  // Sort values ascending
  const sorted = [...values].sort((a, b) => a.value - b.value)
  const sortedValues = sorted.map((v) => v.value)

  // Calculate basic stats
  const min = sortedValues[0]
  const max = sortedValues[n - 1]
  const mean = sortedValues.reduce((sum, v) => sum + v, 0) / n

  // Calculate quartiles using percentile function
  const q1 = percentile(sortedValues, 0.25)
  const median = percentile(sortedValues, 0.5)
  const q3 = percentile(sortedValues, 0.75)
  const iqr = q3 - q1

  // Calculate whisker bounds (1.5×IQR rule)
  // Whiskers extend to the most extreme data point within 1.5×IQR
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  // Find actual whisker endpoints (most extreme non-outlier values)
  // Whisker goes to the last value that's still within bounds
  let whiskerLow = min
  let whiskerHigh = max

  for (const v of sortedValues) {
    if (v >= lowerBound) {
      whiskerLow = v
      break
    }
  }

  for (let i = n - 1; i >= 0; i--) {
    if (sortedValues[i] <= upperBound) {
      whiskerHigh = sortedValues[i]
      break
    }
  }

  // Identify outliers (values outside whisker bounds)
  const outliers: OutlierPoint[] = sorted
    .filter((v) => v.value < lowerBound || v.value > upperBound)
    .map((v) => ({
      value: v.value,
      partId: v.partId,
      partCallout: v.partCallout,
    }))

  return {
    min,
    q1,
    median,
    q3,
    max,
    iqr,
    whiskerLow,
    whiskerHigh,
    outliers,
    n,
    mean,
  }
}

/**
 * Calculates box plot statistics for a series of parts on a specific dimension.
 * Groups calculation by series name.
 *
 * @param parts - Array of parts to analyze
 * @param dimension - Which dimension to calculate stats for
 * @returns Box plot stats with series identification
 *
 * @example
 * const seriesStats = calculateSeriesBoxPlotStats(partsFromSeriesA, 'width')
 * // seriesStats.seriesName = 'Series A'
 * // seriesStats.median = 15.2
 */
export function calculateSeriesBoxPlotStats(
  parts: Part[],
  dimension: Dimension
): BoxPlotSeriesStats {
  if (parts.length === 0) {
    return {
      seriesName: 'Unknown',
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      iqr: 0,
      whiskerLow: 0,
      whiskerHigh: 0,
      outliers: [],
      n: 0,
      mean: 0,
    }
  }

  // Extract series name from first part (all parts should be same series)
  const seriesName = parts[0].PartSeries || 'Uncategorized'

  // Convert parts to value array with identification
  const values = parts.map((part) => ({
    value: getDimensionValue(part, dimension),
    partId: part.PartCallout, // Using PartCallout as ID per project convention
    partCallout: part.PartCallout,
  }))

  const stats = calculateBoxPlotStats(values)

  return {
    seriesName,
    ...stats,
  }
}

/**
 * Calculates box plot statistics for all series in a parts array.
 * Groups parts by PartSeries and calculates stats for each group.
 *
 * @param parts - Array of parts from multiple series
 * @param dimension - Which dimension to calculate stats for
 * @returns Array of box plot stats, one per series, sorted by series name
 *
 * @example
 * const allStats = calculateAllSeriesBoxPlotStats(workingSetParts, 'width')
 * // Returns: [
 * //   { seriesName: 'Series A', median: 15.2, ... },
 * //   { seriesName: 'Series B', median: 18.7, ... },
 * // ]
 */
export function calculateAllSeriesBoxPlotStats(
  parts: Part[],
  dimension: Dimension
): BoxPlotSeriesStats[] {
  if (parts.length === 0) return []

  // Group parts by series
  const seriesGroups = new Map<string, Part[]>()
  for (const part of parts) {
    const seriesName = part.PartSeries || 'Uncategorized'
    if (!seriesGroups.has(seriesName)) {
      seriesGroups.set(seriesName, [])
    }
    seriesGroups.get(seriesName)!.push(part)
  }

  // Calculate stats for each series
  const results: BoxPlotSeriesStats[] = []
  for (const [seriesName, seriesParts] of seriesGroups) {
    const stats = calculateSeriesBoxPlotStats(seriesParts, dimension)
    // Ensure seriesName is set correctly (in case of empty parts edge case)
    results.push({ ...stats, seriesName })
  }

  // Sort by series name for consistent ordering
  return results.sort((a, b) => a.seriesName.localeCompare(b.seriesName))
}

/**
 * Calculates box plot statistics for all families in a parts array.
 * Groups parts by PartFamily and calculates stats for each group.
 * Per AC-3.16.2: Family-level stats with seriesCount.
 * Per AC-3.16.7: Parts without PartFamily grouped under "Unassigned".
 *
 * @param parts - Array of parts from multiple families
 * @param dimension - Which dimension to calculate stats for
 * @returns Array of box plot stats, one per family, sorted by family name
 *
 * @example
 * const allStats = calculateAllFamilyBoxPlotStats(workingSetParts, 'width')
 * // Returns: [
 * //   { familyName: 'SEAX', seriesCount: 3, median: 15.2, ... },
 * //   { familyName: 'Unassigned', seriesCount: 2, median: 18.7, ... },
 * // ]
 */
export function calculateAllFamilyBoxPlotStats(
  parts: Part[],
  dimension: Dimension
): BoxPlotFamilyStats[] {
  if (parts.length === 0) return []

  // Group parts by family
  const familyGroups = new Map<string, Part[]>()
  for (const part of parts) {
    const familyName = part.PartFamily || 'Unassigned'
    if (!familyGroups.has(familyName)) {
      familyGroups.set(familyName, [])
    }
    familyGroups.get(familyName)!.push(part)
  }

  // Calculate stats for each family
  const results: BoxPlotFamilyStats[] = []
  for (const [familyName, familyParts] of familyGroups) {
    // Count unique series in this family
    const seriesNames = new Set<string>()
    for (const part of familyParts) {
      seriesNames.add(part.PartSeries || 'Uncategorized')
    }

    // Convert parts to value array with identification
    const values = familyParts.map((part) => ({
      value: getDimensionValue(part, dimension),
      partId: part.PartCallout,
      partCallout: part.PartCallout,
    }))

    const stats = calculateBoxPlotStats(values)
    results.push({
      ...stats,
      familyName,
      seriesCount: seriesNames.size,
    })
  }

  // Sort by family name for consistent ordering
  return results.sort((a, b) => a.familyName.localeCompare(b.familyName))
}
