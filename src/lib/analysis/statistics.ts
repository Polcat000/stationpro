// src/lib/analysis/statistics.ts
// Pure calculation functions for aggregate statistics across parts
// AC 3.5.1: Statistics calculation, AC 3.5.2: All dimensions, AC 3.5.5: Single part handling

import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

export interface DimensionStats {
  count: number
  min: number
  max: number
  mean: number
  median: number
  stdDev: number | null // null when n < 2
}

export interface AggregateStatistics {
  width: DimensionStats
  height: DimensionStats
  length: DimensionStats
  smallestLateralFeature: DimensionStats
  /** null when no parts in the working set have SmallestDepthFeature_um */
  smallestDepthFeature: DimensionStats | null
}

// =============================================================================
// Calculation Functions
// =============================================================================

/**
 * Calculates the arithmetic mean of an array of numbers.
 * Returns 0 for empty arrays.
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Calculates the median of an array of numbers.
 * For even-length arrays, returns the average of the two middle values.
 * Returns 0 for empty arrays.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Calculates the population standard deviation of an array of numbers.
 * Uses population formula: σ = √(Σ(x-μ)²/n)
 * Returns null for arrays with fewer than 2 values (undefined for single value).
 */
export function calculateStdDev(values: number[]): number | null {
  if (values.length < 2) return null
  const mean = calculateMean(values)
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Calculates all statistics for a single dimension.
 * Returns zeros with null stdDev for empty arrays.
 */
export function calculateDimensionStats(values: number[]): DimensionStats {
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, median: 0, stdDev: null }
  }
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: calculateMean(values),
    median: calculateMedian(values),
    stdDev: calculateStdDev(values),
  }
}

/**
 * Calculates aggregate statistics for all five dimensions of a parts array.
 * Dimensions: Width, Height, Length, SmallestLateralFeature, SmallestDepthFeature
 *
 * SmallestDepthFeature is optional on Part, so returns null if no parts have it.
 */
export function calculateAggregateStats(parts: Part[]): AggregateStatistics {
  // Collect depth feature values only from parts that have them
  const depthFeatureValues = parts
    .filter((p) => p.SmallestDepthFeature_um !== undefined)
    .map((p) => p.SmallestDepthFeature_um as number)

  return {
    width: calculateDimensionStats(parts.map((p) => p.PartWidth_mm)),
    height: calculateDimensionStats(parts.map((p) => p.PartHeight_mm)),
    length: calculateDimensionStats(parts.map((p) => p.PartLength_mm)),
    smallestLateralFeature: calculateDimensionStats(
      parts.map((p) => p.SmallestLateralFeature_um)
    ),
    smallestDepthFeature:
      depthFeatureValues.length > 0
        ? calculateDimensionStats(depthFeatureValues)
        : null,
  }
}
