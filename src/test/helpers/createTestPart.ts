// src/test/helpers/createTestPart.ts
// PURPOSE: Factory function for creating test Part objects
// USAGE: const part = createTestPart({ callout: 'MY-PART' })

/**
 * Inspection zone face options
 * Maps to the 6 faces of a rectangular part envelope
 */
export type InspectionFace = 'Top' | 'Bottom' | 'Front' | 'Back' | 'Left' | 'Right'

/**
 * Inspection zone definition for testing
 * Simplified version - full Zod schema defined in Epic 2
 */
export interface TestInspectionZone {
  id: string
  face: InspectionFace
  depth: number
  offset: { x: number; y: number }
  featureSize: number
  coverageRequired: { width: number; height: number }
}

/**
 * Part definition for testing
 * Simplified version - full Zod schema defined in Epic 2
 */
export interface TestPart {
  id: string
  callout: string
  series: string
  family?: string
  dimensions: {
    width: number   // X-axis (mm)
    height: number  // Y-axis (mm)
    length: number  // Z-axis (mm)
  }
  smallestFeature: number // mm
  inspectionZones: TestInspectionZone[]
}

/**
 * Counter for generating unique IDs
 */
let partIdCounter = 0

/**
 * Creates a test Part with sensible defaults
 * Override any property by passing it in the overrides object
 *
 * @example
 * // Create a default test part
 * const part = createTestPart()
 *
 * @example
 * // Create a part with custom dimensions
 * const largePart = createTestPart({
 *   callout: 'LARGE-001',
 *   dimensions: { width: 500, height: 300, length: 800 }
 * })
 *
 * @example
 * // Create a part with inspection zones
 * const partWithZones = createTestPart({
 *   inspectionZones: [
 *     createTestInspectionZone({ face: 'Top', featureSize: 0.1 })
 *   ]
 * })
 */
export function createTestPart(overrides?: Partial<TestPart>): TestPart {
  partIdCounter++

  return {
    id: `test-part-${partIdCounter}`,
    callout: `TEST-PART-${partIdCounter}`,
    series: 'Test Series A',
    dimensions: {
      width: 100,   // 100mm default
      height: 50,   // 50mm default
      length: 150,  // 150mm default
    },
    smallestFeature: 0.1, // 100 microns default
    inspectionZones: [],
    ...overrides,
  }
}

/**
 * Creates a test InspectionZone with sensible defaults
 *
 * @example
 * const zone = createTestInspectionZone({ face: 'Front', depth: 5 })
 */
export function createTestInspectionZone(
  overrides?: Partial<TestInspectionZone>
): TestInspectionZone {
  return {
    id: `test-zone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    face: 'Top',
    depth: 2.0,
    offset: { x: 0, y: 0 },
    featureSize: 0.1,
    coverageRequired: { width: 80, height: 120 },
    ...overrides,
  }
}

/**
 * Resets the part ID counter
 * Call this in beforeEach() if you need deterministic IDs
 */
export function resetPartIdCounter(): void {
  partIdCounter = 0
}
