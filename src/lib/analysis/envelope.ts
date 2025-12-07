// src/lib/analysis/envelope.ts
// Pure calculation functions for worst-case envelope across parts
// AC 3.6.1: Envelope displayed, AC 3.6.2: Driver identification, AC 3.6.4: Calculation accuracy

import type { Part } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Identifies which part drives a dimension boundary (FR17)
 */
export interface EnvelopeDriver {
  partId: string
  partCallout: string
  value: number
}

/**
 * Result of worst-case envelope calculation
 * Contains max dimensions and which part drives each boundary
 */
export interface EnvelopeResult {
  width_mm: number
  height_mm: number
  length_mm: number
  drivers: {
    maxWidth: EnvelopeDriver
    maxHeight: EnvelopeDriver
    maxLength: EnvelopeDriver
  }
}

// =============================================================================
// Calculation Functions
// =============================================================================

/**
 * Find the part with the maximum value for a given dimension.
 * When multiple parts tie, the first one (by array order) wins (AC 3.6.2).
 *
 * @param parts Array of parts to search
 * @param getValue Function to extract dimension value from part
 * @returns EnvelopeDriver with the part that has the max value
 */
function findMaxDriver(
  parts: Part[],
  getValue: (part: Part) => number
): EnvelopeDriver {
  let maxPart = parts[0]
  let maxValue = getValue(parts[0])

  for (const part of parts) {
    const value = getValue(part)
    // Strict greater-than ensures first part wins on tie (AC 3.6.2)
    if (value > maxValue) {
      maxValue = value
      maxPart = part
    }
  }

  return {
    partId: maxPart.PartCallout, // Using PartCallout as ID per project convention
    partCallout: maxPart.PartCallout,
    value: maxValue,
  }
}

/**
 * Calculate worst-case envelope from selected parts.
 * Returns the maximum dimension for each axis and identifies the driving part (FR14, FR17).
 *
 * @param parts Array of parts in working set
 * @returns EnvelopeResult with max dimensions and driver parts, or null if empty
 */
export function calculateEnvelope(parts: Part[]): EnvelopeResult | null {
  if (parts.length === 0) return null

  const maxWidth = findMaxDriver(parts, (p) => p.PartWidth_mm)
  const maxHeight = findMaxDriver(parts, (p) => p.PartHeight_mm)
  const maxLength = findMaxDriver(parts, (p) => p.PartLength_mm)

  return {
    width_mm: maxWidth.value,
    height_mm: maxHeight.value,
    length_mm: maxLength.value,
    drivers: {
      maxWidth,
      maxHeight,
      maxLength,
    },
  }
}
