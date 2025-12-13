// src/lib/analysis/zoneAggregation.ts
// Pure calculation functions for zone aggregation across working set parts
// AC-3.9.1: Zone count per face, AC-3.9.2: Depth range, AC-3.9.3: Smallest feature size

import type { Part, InspectionFace, InspectionZone } from '@/types/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Result of zone aggregation calculation.
 * Aggregates inspection zone characteristics across all parts.
 */
export interface ZoneAggregation {
  /** Total number of inspection zones across all parts */
  totalZones: number
  /** Count of zones per face (only faces with zones included) */
  zonesByFace: Partial<Record<InspectionFace, number>>
  /** Min/max depth range across all zones */
  depthRange: { min: number; max: number }
  /** Smallest feature size across all zones (zone override or part default) */
  smallestFeature_um: number
}

// =============================================================================
// Constants - Face Color Palette (per Architecture visualization.md)
// =============================================================================

/**
 * Face colors per Architecture specification.
 * Used for chart visualization in FaceZoneChart component.
 */
export const FACE_COLORS: Record<InspectionFace, string> = {
  Top: 'hsl(204, 56%, 72%)', // Sky Reflection
  Bottom: 'hsl(47, 94%, 48%)', // Saffron
  Front: 'hsl(123, 36%, 36%)', // Fern
  Back: 'hsl(204, 95%, 20%)', // Yale Blue
  Left: 'hsl(271, 37%, 60%)', // Purple
  Right: 'hsl(15, 59%, 51%)', // Spicy Paprika
}

/**
 * Ordered list of faces for consistent display order in charts.
 */
export const FACE_ORDER: InspectionFace[] = [
  'Top',
  'Bottom',
  'Front',
  'Back',
  'Left',
  'Right',
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the effective feature size for a zone.
 * Zone-level override takes precedence over part default (AC-3.9.3).
 *
 * @param zone Inspection zone
 * @param part Parent part with default feature size
 * @returns Feature size in microns
 */
export function getZoneFeatureSize(zone: InspectionZone, part: Part): number {
  return zone.SmallestLateralFeature_um ?? part.SmallestLateralFeature_um
}

/**
 * Count zones per face across all parts.
 * MVP constraint: 1 zone per face per part maximum.
 *
 * @param parts Array of parts with inspection zones
 * @returns Partial record of face -> zone count (only faces with zones)
 */
export function countZonesByFace(
  parts: Part[]
): Partial<Record<InspectionFace, number>> {
  const counts: Partial<Record<InspectionFace, number>> = {}

  for (const part of parts) {
    for (const zone of part.InspectionZones) {
      counts[zone.Face] = (counts[zone.Face] ?? 0) + 1
    }
  }

  return counts
}

/**
 * Find depth range across all zones.
 *
 * @param parts Array of parts with inspection zones
 * @returns Min/max depth in mm, or null if no zones
 */
export function findDepthRange(
  parts: Part[]
): { min: number; max: number } | null {
  let min = Infinity
  let max = -Infinity

  for (const part of parts) {
    for (const zone of part.InspectionZones) {
      if (zone.ZoneDepth_mm < min) min = zone.ZoneDepth_mm
      if (zone.ZoneDepth_mm > max) max = zone.ZoneDepth_mm
    }
  }

  // No zones found
  if (min === Infinity) return null

  return { min, max }
}

/**
 * Find smallest feature size across all zones (AC-3.9.3).
 * Zone-level overrides take precedence over part defaults.
 *
 * @param parts Array of parts with inspection zones
 * @returns Smallest feature size in microns, or null if no zones
 */
export function findSmallestFeature(parts: Part[]): number | null {
  let smallest = Infinity

  for (const part of parts) {
    for (const zone of part.InspectionZones) {
      const size = getZoneFeatureSize(zone, part)
      if (size < smallest) smallest = size
    }
  }

  // No zones found
  if (smallest === Infinity) return null

  return smallest
}

// =============================================================================
// Face-Specific Aggregation Functions
// =============================================================================

/**
 * Face-specific aggregation result.
 */
export interface FaceAggregation {
  /** Depth range for zones of this face */
  depthRange: { min: number; max: number } | null
  /** Smallest lateral feature across zones of this face */
  smallestLateral_um: number | null
  /** Smallest depth feature across zones of this face (null if none defined) */
  smallestDepth_um: number | null
}

/**
 * Aggregate metrics for zones of a specific face.
 *
 * @param parts Array of parts with inspection zones
 * @param face The inspection face to filter by
 * @returns FaceAggregation with depth range and feature sizes
 */
export function aggregateByFace(
  parts: Part[],
  face: InspectionFace
): FaceAggregation {
  let depthMin = Infinity
  let depthMax = -Infinity
  let smallestLateral = Infinity
  let smallestDepth = Infinity

  for (const part of parts) {
    for (const zone of part.InspectionZones) {
      if (zone.Face !== face) continue

      // Depth range
      if (zone.ZoneDepth_mm < depthMin) depthMin = zone.ZoneDepth_mm
      if (zone.ZoneDepth_mm > depthMax) depthMax = zone.ZoneDepth_mm

      // Smallest lateral feature (zone override or part default)
      const lateral = zone.SmallestLateralFeature_um ?? part.SmallestLateralFeature_um
      if (lateral < smallestLateral) smallestLateral = lateral

      // Smallest depth feature (zone override or part default, may be undefined)
      const depth = zone.SmallestDepthFeature_um ?? part.SmallestDepthFeature_um
      if (depth !== undefined && depth < smallestDepth) smallestDepth = depth
    }
  }

  return {
    depthRange: depthMin === Infinity ? null : { min: depthMin, max: depthMax },
    smallestLateral_um: smallestLateral === Infinity ? null : smallestLateral,
    smallestDepth_um: smallestDepth === Infinity ? null : smallestDepth,
  }
}

/**
 * Count zones per series for a specific face.
 * Only includes series that have at least one zone of the specified face.
 *
 * @param parts Array of parts with inspection zones
 * @param face The inspection face to filter by
 * @returns Record of series name -> zone count
 */
export function countZonesBySeriesForFace(
  parts: Part[],
  face: InspectionFace
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const part of parts) {
    const seriesName = part.PartSeries ?? 'Unassigned'
    for (const zone of part.InspectionZones) {
      if (zone.Face !== face) continue
      counts[seriesName] = (counts[seriesName] ?? 0) + 1
    }
  }

  return counts
}

// =============================================================================
// Main Calculation Function
// =============================================================================

/**
 * Aggregate inspection zone characteristics from selected parts.
 * Returns null if no parts or no zones exist (empty state).
 *
 * @param parts Array of parts in working set
 * @returns ZoneAggregation result, or null if no zones to aggregate
 *
 * @example
 * const result = aggregateZones(selectedParts)
 * if (result) {
 *   console.log(`Total zones: ${result.totalZones}`)
 *   console.log(`Depth range: ${result.depthRange.min} - ${result.depthRange.max} mm`)
 * }
 */
export function aggregateZones(parts: Part[]): ZoneAggregation | null {
  // Empty parts array
  if (parts.length === 0) return null

  // Count total zones
  let totalZones = 0
  for (const part of parts) {
    totalZones += part.InspectionZones.length
  }

  // No zones across all parts (AC-3.9.5: empty state)
  if (totalZones === 0) return null

  // Calculate aggregations
  const zonesByFace = countZonesByFace(parts)
  const depthRange = findDepthRange(parts)
  const smallestFeature = findSmallestFeature(parts)

  // Safety check - should not be null if totalZones > 0
  if (!depthRange || smallestFeature === null) return null

  return {
    totalZones,
    zonesByFace,
    depthRange,
    smallestFeature_um: smallestFeature,
  }
}
