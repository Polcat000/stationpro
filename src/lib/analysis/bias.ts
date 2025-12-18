// src/lib/analysis/bias.ts
// Pure calculation functions for working set bias detection
// AC 3.4.1: Series dominance, AC 3.4.2: Too few parts, AC 3.4.3: Outlier skew

import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

export type BiasType = 'series-dominant' | 'too-few-parts' | 'outlier-skew'

export interface OutlierPartDetail {
  callout: string
  dimension: string
  value: number
  q1: number
  q3: number
  direction: 'above' | 'below'
}

export interface BiasResult {
  hasBias: boolean
  biasType: BiasType | null
  severity: 'info' | 'warning'
  message: string
  details: {
    dominantSeries?: { name: string; percentage: number; count: number; total: number }
    partCount?: number
    outlierParts?: OutlierPartDetail[]
  }
}

export interface CombinedBiasResult {
  biases: BiasResult[]
  hasBias: boolean
}

// =============================================================================
// Thresholds
// =============================================================================

const SERIES_DOMINANCE_THRESHOLD = 0.80 // 80%
const MIN_PARTS_THRESHOLD = 3
const IQR_MULTIPLIER = 1.5 // Tukey's rule for outlier detection

// =============================================================================
// Bias Detection Functions
// =============================================================================

/**
 * Detects if a single series dominates the working set (>80% of parts).
 * AC 3.4.1: Series Dominance Warning
 */
export function detectSeriesDominance(parts: Part[]): BiasResult | null {
  if (parts.length === 0) return null

  const seriesCounts = new Map<string, number>()
  parts.forEach((p) => {
    const series = p.PartSeries ?? 'Unknown'
    const count = seriesCounts.get(series) ?? 0
    seriesCounts.set(series, count + 1)
  })

  for (const [series, count] of seriesCounts) {
    const percentage = count / parts.length
    if (percentage > SERIES_DOMINANCE_THRESHOLD) {
      return {
        hasBias: true,
        biasType: 'series-dominant',
        severity: 'warning',
        message: `Series bias detected: ${series} represents ${Math.round(percentage * 100)}% of selection`,
        details: {
          dominantSeries: {
            name: series,
            percentage: Math.round(percentage * 100),
            count,
            total: parts.length,
          },
        },
      }
    }
  }
  return null
}

/**
 * Detects if the working set has too few parts for meaningful statistics (<3).
 * AC 3.4.2: Too Few Parts Info
 */
export function detectTooFewParts(parts: Part[]): BiasResult | null {
  if (parts.length >= MIN_PARTS_THRESHOLD) return null
  if (parts.length === 0) return null

  return {
    hasBias: true,
    biasType: 'too-few-parts',
    severity: 'info',
    message: `Small sample size: ${parts.length} part(s) selected. Consider adding more for meaningful statistics.`,
    details: { partCount: parts.length },
  }
}

/**
 * Helper: Calculate percentile using linear interpolation (same as boxPlotStats.ts)
 */
function percentile(sortedValues: number[], p: number): number {
  const n = sortedValues.length
  if (n === 0) return 0
  if (n === 1) return sortedValues[0]

  const index = p * (n - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (upper >= n) return sortedValues[n - 1]
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

/**
 * Detects if any parts are outliers using 1.5×IQR (Tukey's rule).
 * AC 3.4.3: Outlier Skew Info
 * Returns ALL outliers found across all dimensions.
 */
export function detectOutlierSkew(parts: Part[]): BiasResult | null {
  if (parts.length < MIN_PARTS_THRESHOLD) return null

  const dimensions = ['PartWidth_mm', 'PartHeight_mm', 'PartLength_mm'] as const
  const dimensionLabels: Record<(typeof dimensions)[number], string> = {
    PartWidth_mm: 'Width',
    PartHeight_mm: 'Height',
    PartLength_mm: 'Length',
  }

  const outlierParts: OutlierPartDetail[] = []
  const seenCallouts = new Set<string>() // Track unique outliers by callout

  for (const dim of dimensions) {
    const values = parts.map((p) => p[dim])
    const sorted = [...values].sort((a, b) => a - b)

    const q1 = percentile(sorted, 0.25)
    const q3 = percentile(sorted, 0.75)
    const iqr = q3 - q1

    // If IQR is 0, all values are effectively the same - no outliers
    if (iqr === 0) continue

    const lowerBound = q1 - IQR_MULTIPLIER * iqr
    const upperBound = q3 + IQR_MULTIPLIER * iqr

    for (const part of parts) {
      const value = part[dim]
      if (value < lowerBound || value > upperBound) {
        // Only add if we haven't seen this part as outlier yet
        if (!seenCallouts.has(part.PartCallout)) {
          seenCallouts.add(part.PartCallout)
          outlierParts.push({
            callout: part.PartCallout,
            dimension: dimensionLabels[dim],
            value,
            q1: Number(q1.toFixed(2)),
            q3: Number(q3.toFixed(2)),
            direction: value > upperBound ? 'above' : 'below',
          })
        }
      }
    }
  }

  if (outlierParts.length === 0) return null

  const count = outlierParts.length
  const message =
    count === 1
      ? `Dimensional outlier: ${outlierParts[0].callout} is outside IQR bounds on ${outlierParts[0].dimension}`
      : `${count} dimensional outliers detected outside IQR bounds`

  return {
    hasBias: true,
    biasType: 'outlier-skew',
    severity: 'info',
    message,
    details: {
      outlierParts,
    },
  }
}

/**
 * Combines all bias detection checks into a single result.
 * Returns all detected biases, allowing multiple to display simultaneously.
 */
export function detectBias(parts: Part[]): CombinedBiasResult {
  const biases: BiasResult[] = []

  const seriesBias = detectSeriesDominance(parts)
  if (seriesBias) biases.push(seriesBias)

  const fewPartsBias = detectTooFewParts(parts)
  if (fewPartsBias) biases.push(fewPartsBias)

  const outlierBias = detectOutlierSkew(parts)
  if (outlierBias) biases.push(outlierBias)

  return {
    biases,
    hasBias: biases.length > 0,
  }
}
