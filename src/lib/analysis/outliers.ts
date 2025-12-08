// src/lib/analysis/outliers.ts
// Pure calculation functions for outlier detection across parts
// AC 3.7.3: Outlier highlighting (>2 standard deviations from mean)

import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

export type Dimension = 'width' | 'height' | 'length'

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extracts the dimension value from a part based on dimension name.
 * Maps 'width' → PartWidth_mm, 'height' → PartHeight_mm, 'length' → PartLength_mm
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
// Outlier Detection
// =============================================================================

/**
 * Detects outliers using 2σ threshold (standard statistical definition).
 * An outlier is any part whose dimension value is more than 2 standard
 * deviations from the mean.
 *
 * Edge cases:
 * - Returns empty array for fewer than 3 parts (insufficient data for meaningful stats)
 * - Returns empty array when all values are identical (stdDev = 0)
 *
 * @param parts Array of parts to analyze
 * @param dimension Which dimension to check ('width', 'height', or 'length')
 * @returns Array of parts that are outliers (>2 std dev from mean)
 *
 * @example
 * // Detects the outlier in a set with one extreme value
 * const parts = [
 *   ...normalParts,  // widths around 10mm
 *   outlierPart,     // width of 100mm
 * ]
 * const outliers = detectOutliers(parts, 'width')
 * // outliers contains only outlierPart
 */
export function detectOutliers(parts: Part[], dimension: Dimension): Part[] {
  // Need at least 3 parts for meaningful statistics
  if (parts.length < 3) return []

  const values = parts.map((p) => getDimensionValue(p, dimension))

  // Calculate mean
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length

  // Calculate population variance and standard deviation
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  // If all values are identical, no outliers possible
  if (stdDev === 0) return []

  // Outlier threshold: 2 standard deviations from mean
  const threshold = 2 * stdDev

  return parts.filter((p) => {
    const value = getDimensionValue(p, dimension)
    return Math.abs(value - mean) > threshold
  })
}

/**
 * Checks if a specific part is an outlier for a given dimension.
 * Convenience function for checking individual parts.
 *
 * @param part The part to check
 * @param allParts The full set of parts for context
 * @param dimension Which dimension to check
 * @returns true if the part is an outlier, false otherwise
 */
export function isOutlier(
  part: Part,
  allParts: Part[],
  dimension: Dimension
): boolean {
  const outliers = detectOutliers(allParts, dimension)
  return outliers.some((p) => p.PartCallout === part.PartCallout)
}

/**
 * Detects outliers for all dimensions at once.
 * Returns a record mapping each dimension to its outlier parts.
 *
 * @param parts Array of parts to analyze
 * @returns Object with width, height, and length arrays of outlier parts
 */
export function detectAllOutliers(parts: Part[]): Record<Dimension, Part[]> {
  return {
    width: detectOutliers(parts, 'width'),
    height: detectOutliers(parts, 'height'),
    length: detectOutliers(parts, 'length'),
  }
}

/**
 * Gets the set of part IDs that are outliers for any dimension.
 * Useful for quick membership checks in rendering.
 *
 * @param outliers Record of outliers by dimension
 * @returns Set of PartCallout values that are outliers
 */
export function getOutlierPartIds(
  outliers: Record<Dimension, Part[]>
): Set<string> {
  const ids = new Set<string>()
  for (const dimension of Object.keys(outliers) as Dimension[]) {
    for (const part of outliers[dimension]) {
      ids.add(part.PartCallout)
    }
  }
  return ids
}
