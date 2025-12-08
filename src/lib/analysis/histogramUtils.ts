// src/lib/analysis/histogramUtils.ts
// Utility functions for histogram data processing
// Extracted from HistogramChart.tsx for react-refresh compliance

import type { HistogramBin } from '@/components/charts/HistogramChart'

/**
 * Default number of bins for histogram.
 */
export const DEFAULT_BIN_COUNT = 10

/**
 * Creates histogram bins from raw values with part identification.
 *
 * @param values - Array of { value, partCallout, isOutlier }
 * @param binCount - Number of bins to create (default 10)
 * @returns Array of HistogramBin objects ready for chart
 *
 * @example
 * const parts = [
 *   { value: 10.5, partCallout: 'PART-001', isOutlier: false },
 *   { value: 15.2, partCallout: 'PART-002', isOutlier: false },
 *   { value: 100.0, partCallout: 'PART-003', isOutlier: true },
 * ]
 * const bins = createHistogramBins(parts, 10)
 */
export function createHistogramBins(
  values: { value: number; partCallout: string; isOutlier: boolean }[],
  binCount: number = DEFAULT_BIN_COUNT
): HistogramBin[] {
  if (values.length === 0) return []

  // Find range
  const numericValues = values.map((v) => v.value)
  const minValue = Math.min(...numericValues)
  const maxValue = Math.max(...numericValues)
  const range = maxValue - minValue

  // Handle case where all values are identical
  if (range === 0) {
    return [
      {
        binStart: minValue,
        binEnd: maxValue,
        binCenter: minValue,
        count: values.length,
        partCallouts: values.map((v) => v.partCallout),
        hasOutliers: values.some((v) => v.isOutlier),
        binLabel: minValue.toFixed(1),
      },
    ]
  }

  // Calculate bin width
  const binWidth = range / binCount

  // Initialize bins
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    binStart: minValue + i * binWidth,
    binEnd: minValue + (i + 1) * binWidth,
    binCenter: minValue + (i + 0.5) * binWidth,
    count: 0,
    partCallouts: [],
    hasOutliers: false,
    binLabel: `${(minValue + i * binWidth).toFixed(1)}`,
  }))

  // Assign values to bins
  for (const v of values) {
    let binIndex = Math.floor((v.value - minValue) / binWidth)
    // Handle edge case where value === maxValue
    if (binIndex >= binCount) {
      binIndex = binCount - 1
    }

    bins[binIndex].count++
    bins[binIndex].partCallouts.push(v.partCallout)
    if (v.isOutlier) {
      bins[binIndex].hasOutliers = true
    }
  }

  // Filter out empty bins for cleaner display
  return bins.filter((bin) => bin.count > 0)
}
