// src/lib/analysis/bias.ts
// Pure calculation functions for working set bias detection
// AC 3.4.1: Series dominance, AC 3.4.2: Too few parts, AC 3.4.3: Outlier skew

import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

export type BiasType = 'series-dominant' | 'too-few-parts' | 'outlier-skew'

export interface BiasResult {
  hasBias: boolean
  biasType: BiasType | null
  severity: 'info' | 'warning'
  message: string
  details: {
    dominantSeries?: { name: string; percentage: number; count: number; total: number }
    partCount?: number
    outlierPart?: { callout: string; dimension: string; deviation: number; value: number; mean: number }
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
const OUTLIER_SIGMA_THRESHOLD = 2

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
 * Detects if any part is an outlier (>2 standard deviations from mean) on any dimension.
 * AC 3.4.3: Outlier Skew Info
 * Uses population standard deviation: σ = √(Σ(x-μ)²/n)
 */
export function detectOutlierSkew(parts: Part[]): BiasResult | null {
  if (parts.length < MIN_PARTS_THRESHOLD) return null

  const dimensions = ['PartWidth_mm', 'PartHeight_mm', 'PartLength_mm'] as const
  const dimensionLabels: Record<(typeof dimensions)[number], string> = {
    PartWidth_mm: 'Width',
    PartHeight_mm: 'Height',
    PartLength_mm: 'Length',
  }

  for (const dim of dimensions) {
    const values = parts.map((p) => p[dim])
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) continue // All same value, no outliers possible

    for (const part of parts) {
      const deviation = Math.abs(part[dim] - mean) / stdDev
      if (deviation > OUTLIER_SIGMA_THRESHOLD) {
        const direction = part[dim] > mean ? 'above' : 'below'
        return {
          hasBias: true,
          biasType: 'outlier-skew',
          severity: 'info',
          message: `Dimensional outlier: ${part.PartCallout} is ${deviation.toFixed(1)}σ ${direction} mean on ${dimensionLabels[dim]}`,
          details: {
            outlierPart: {
              callout: part.PartCallout,
              dimension: dimensionLabels[dim],
              deviation: Number(deviation.toFixed(2)),
              value: part[dim],
              mean: Number(mean.toFixed(2)),
            },
          },
        }
      }
    }
  }
  return null
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
