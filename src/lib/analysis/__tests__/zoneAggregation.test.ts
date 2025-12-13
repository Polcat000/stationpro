// src/lib/analysis/__tests__/zoneAggregation.test.ts
// Unit tests for zone aggregation calculation functions
// Coverage target: 95%+ per story requirements

import { describe, it, expect } from 'vitest'
import {
  aggregateZones,
  countZonesByFace,
  findDepthRange,
  findSmallestFeature,
  getZoneFeatureSize,
  FACE_COLORS,
  FACE_ORDER,
} from '../zoneAggregation'
import type { Part, InspectionZone, InspectionFace } from '@/types/domain'

// =============================================================================
// Test Helpers
// =============================================================================

function createTestZone(overrides: Partial<InspectionZone> = {}): InspectionZone {
  return {
    ZoneID: 'zone-001',
    Name: 'Test Zone',
    Face: 'Top',
    ZoneDepth_mm: 2.0,
    ZoneOffset_mm: 0,
    RequiredCoverage_pct: 100,
    MinPixelsPerFeature: 3,
    ...overrides,
  }
}

function createTestPart(overrides: Partial<Part> = {}): Part {
  return {
    PartCallout: 'TEST-001',
    PartSeries: 'TestSeries',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 100,
    InspectionZones: [],
    ...overrides,
  }
}

// =============================================================================
// Constants Tests
// =============================================================================

describe('FACE_COLORS', () => {
  it('defines colors for all 6 faces', () => {
    expect(Object.keys(FACE_COLORS)).toHaveLength(6)
    expect(FACE_COLORS.Top).toBeDefined()
    expect(FACE_COLORS.Bottom).toBeDefined()
    expect(FACE_COLORS.Front).toBeDefined()
    expect(FACE_COLORS.Back).toBeDefined()
    expect(FACE_COLORS.Left).toBeDefined()
    expect(FACE_COLORS.Right).toBeDefined()
  })

  it('uses hsl format', () => {
    expect(FACE_COLORS.Top).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/)
    expect(FACE_COLORS.Bottom).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/)
  })

  it('matches face color palette', () => {
    expect(FACE_COLORS.Top).toBe('hsl(204, 56%, 72%)') // Sky Reflection
    expect(FACE_COLORS.Bottom).toBe('hsl(47, 94%, 48%)') // Saffron
    expect(FACE_COLORS.Front).toBe('hsl(123, 36%, 36%)') // Fern
    expect(FACE_COLORS.Back).toBe('hsl(204, 95%, 20%)') // Yale Blue
    expect(FACE_COLORS.Left).toBe('hsl(271, 37%, 60%)') // Purple
    expect(FACE_COLORS.Right).toBe('hsl(15, 59%, 51%)') // Spicy Paprika
  })
})

describe('FACE_ORDER', () => {
  it('contains all 6 faces', () => {
    expect(FACE_ORDER).toHaveLength(6)
  })

  it('has correct order for display', () => {
    expect(FACE_ORDER).toEqual(['Top', 'Bottom', 'Front', 'Back', 'Left', 'Right'])
  })
})

// =============================================================================
// getZoneFeatureSize Tests (AC-3.9.3)
// =============================================================================

describe('getZoneFeatureSize', () => {
  it('returns zone override when present', () => {
    const part = createTestPart({ SmallestLateralFeature_um: 100 })
    const zone = createTestZone({ SmallestLateralFeature_um: 50 })

    const result = getZoneFeatureSize(zone, part)

    expect(result).toBe(50)
  })

  it('returns part default when zone override is undefined', () => {
    const part = createTestPart({ SmallestLateralFeature_um: 100 })
    const zone = createTestZone({ SmallestLateralFeature_um: undefined })

    const result = getZoneFeatureSize(zone, part)

    expect(result).toBe(100)
  })

  it('zone override takes precedence even when larger than part default', () => {
    const part = createTestPart({ SmallestLateralFeature_um: 50 })
    const zone = createTestZone({ SmallestLateralFeature_um: 150 })

    const result = getZoneFeatureSize(zone, part)

    expect(result).toBe(150)
  })
})

// =============================================================================
// countZonesByFace Tests (AC-3.9.1)
// =============================================================================

describe('countZonesByFace', () => {
  it('returns empty object for empty parts array', () => {
    const result = countZonesByFace([])

    expect(result).toEqual({})
  })

  it('returns empty object for parts with no zones', () => {
    const parts = [
      createTestPart({ InspectionZones: [] }),
      createTestPart({ InspectionZones: [] }),
    ]

    const result = countZonesByFace(parts)

    expect(result).toEqual({})
  })

  it('counts zones correctly for single face', () => {
    const parts = [
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Top' })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Top' })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Top' })],
      }),
    ]

    const result = countZonesByFace(parts)

    expect(result).toEqual({ Top: 3 })
  })

  it('counts zones correctly for multiple faces - AC verification', () => {
    // AC-3.9.1 verification: 3 with Top zones, 2 with Front zones
    const parts = [
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Top' })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Top' })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Top' })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Front' })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Front' })],
      }),
    ]

    const result = countZonesByFace(parts)

    expect(result).toEqual({ Top: 3, Front: 2 })
  })

  it('part with zones on multiple faces counts toward each - AC verification', () => {
    // AC-3.9.1: Part with zones on Top AND Front counts toward both
    const parts = [
      createTestPart({
        InspectionZones: [
          createTestZone({ Face: 'Top' }),
          createTestZone({ Face: 'Front' }),
        ],
      }),
    ]

    const result = countZonesByFace(parts)

    expect(result).toEqual({ Top: 1, Front: 1 })
  })

  it('counts all 6 faces correctly', () => {
    const faces: InspectionFace[] = ['Top', 'Bottom', 'Front', 'Back', 'Left', 'Right']
    const parts = faces.map((face) =>
      createTestPart({
        InspectionZones: [createTestZone({ Face: face })],
      })
    )

    const result = countZonesByFace(parts)

    expect(result).toEqual({
      Top: 1,
      Bottom: 1,
      Front: 1,
      Back: 1,
      Left: 1,
      Right: 1,
    })
  })

  it('only includes faces with zones (skip faces with 0)', () => {
    const parts = [
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Top' })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ Face: 'Front' })],
      }),
    ]

    const result = countZonesByFace(parts)

    // Should NOT include Bottom, Back, Left, Right with 0
    expect(result).toEqual({ Top: 1, Front: 1 })
    expect(result.Bottom).toBeUndefined()
    expect(result.Back).toBeUndefined()
    expect(result.Left).toBeUndefined()
    expect(result.Right).toBeUndefined()
  })
})

// =============================================================================
// findDepthRange Tests (AC-3.9.2)
// =============================================================================

describe('findDepthRange', () => {
  it('returns null for empty parts array', () => {
    const result = findDepthRange([])

    expect(result).toBeNull()
  })

  it('returns null for parts with no zones', () => {
    const parts = [
      createTestPart({ InspectionZones: [] }),
      createTestPart({ InspectionZones: [] }),
    ]

    const result = findDepthRange(parts)

    expect(result).toBeNull()
  })

  it('returns min=max for single zone', () => {
    // AC-3.9.2: Single zone → min equals max
    const parts = [
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 5.0 })],
      }),
    ]

    const result = findDepthRange(parts)

    expect(result).toEqual({ min: 5.0, max: 5.0 })
  })

  it('finds correct range for multiple zones - AC verification', () => {
    // AC-3.9.2: depths 1mm, 3mm, 5mm → shows "1.00 - 5.00 mm"
    const parts = [
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 1.0 })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 3.0 })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 5.0 })],
      }),
    ]

    const result = findDepthRange(parts)

    expect(result).toEqual({ min: 1.0, max: 5.0 })
  })

  it('finds range across zones within same part', () => {
    const parts = [
      createTestPart({
        InspectionZones: [
          createTestZone({ ZoneDepth_mm: 2.0 }),
          createTestZone({ ZoneDepth_mm: 8.0 }),
        ],
      }),
    ]

    const result = findDepthRange(parts)

    expect(result).toEqual({ min: 2.0, max: 8.0 })
  })

  it('handles decimal depths', () => {
    const parts = [
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 0.5 })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 8.25 })],
      }),
    ]

    const result = findDepthRange(parts)

    expect(result).toEqual({ min: 0.5, max: 8.25 })
  })

  it('handles all zones same depth', () => {
    const parts = [
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 3.0 })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 3.0 })],
      }),
      createTestPart({
        InspectionZones: [createTestZone({ ZoneDepth_mm: 3.0 })],
      }),
    ]

    const result = findDepthRange(parts)

    expect(result).toEqual({ min: 3.0, max: 3.0 })
  })
})

// =============================================================================
// findSmallestFeature Tests (AC-3.9.3)
// =============================================================================

describe('findSmallestFeature', () => {
  it('returns null for empty parts array', () => {
    const result = findSmallestFeature([])

    expect(result).toBeNull()
  })

  it('returns null for parts with no zones', () => {
    const parts = [
      createTestPart({ InspectionZones: [] }),
      createTestPart({ InspectionZones: [] }),
    ]

    const result = findSmallestFeature(parts)

    expect(result).toBeNull()
  })

  it('finds smallest across multiple zones - AC verification', () => {
    // AC-3.9.3: zones with 100um, 150um, 200um → shows "Smallest Feature: 100 um"
    const parts = [
      createTestPart({
        SmallestLateralFeature_um: 100,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: undefined })],
      }),
      createTestPart({
        SmallestLateralFeature_um: 150,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: undefined })],
      }),
      createTestPart({
        SmallestLateralFeature_um: 200,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: undefined })],
      }),
    ]

    const result = findSmallestFeature(parts)

    expect(result).toBe(100)
  })

  it('zone override smaller than part default - AC verification', () => {
    // AC-3.9.3: Zone with override smaller than part default → uses override
    const parts = [
      createTestPart({
        SmallestLateralFeature_um: 200,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: 50 })],
      }),
    ]

    const result = findSmallestFeature(parts)

    expect(result).toBe(50)
  })

  it('zone override larger than part default still uses override', () => {
    const parts = [
      createTestPart({
        SmallestLateralFeature_um: 50,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: 200 })],
      }),
    ]

    const result = findSmallestFeature(parts)

    expect(result).toBe(200)
  })

  it('finds smallest across mixed override and default', () => {
    const parts = [
      createTestPart({
        SmallestLateralFeature_um: 100,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: 150 })], // uses 150
      }),
      createTestPart({
        SmallestLateralFeature_um: 80,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: undefined })], // uses 80
      }),
      createTestPart({
        SmallestLateralFeature_um: 200,
        InspectionZones: [createTestZone({ SmallestLateralFeature_um: 60 })], // uses 60
      }),
    ]

    const result = findSmallestFeature(parts)

    expect(result).toBe(60)
  })

  it('finds smallest across multiple zones within same part', () => {
    const parts = [
      createTestPart({
        SmallestLateralFeature_um: 100,
        InspectionZones: [
          createTestZone({ SmallestLateralFeature_um: 150 }),
          createTestZone({ SmallestLateralFeature_um: 75 }),
          createTestZone({ SmallestLateralFeature_um: 200 }),
        ],
      }),
    ]

    const result = findSmallestFeature(parts)

    expect(result).toBe(75)
  })
})

// =============================================================================
// aggregateZones Tests (Main Function)
// =============================================================================

describe('aggregateZones', () => {
  describe('empty/null handling', () => {
    it('returns null for empty parts array', () => {
      const result = aggregateZones([])

      expect(result).toBeNull()
    })

    it('returns null when all parts have no zones (AC-3.9.5)', () => {
      const parts = [
        createTestPart({ InspectionZones: [] }),
        createTestPart({ InspectionZones: [] }),
        createTestPart({ InspectionZones: [] }),
      ]

      const result = aggregateZones(parts)

      expect(result).toBeNull()
    })
  })

  describe('single zone', () => {
    it('aggregates single zone correctly', () => {
      const parts = [
        createTestPart({
          SmallestLateralFeature_um: 100,
          InspectionZones: [
            createTestZone({ Face: 'Top', ZoneDepth_mm: 5.0 }),
          ],
        }),
      ]

      const result = aggregateZones(parts)

      expect(result).not.toBeNull()
      expect(result!.totalZones).toBe(1)
      expect(result!.zonesByFace).toEqual({ Top: 1 })
      expect(result!.depthRange).toEqual({ min: 5.0, max: 5.0 })
      expect(result!.smallestFeature_um).toBe(100)
    })
  })

  describe('multiple zones', () => {
    it('aggregates multiple zones across multiple parts', () => {
      const parts = [
        createTestPart({
          SmallestLateralFeature_um: 100,
          InspectionZones: [
            createTestZone({ Face: 'Top', ZoneDepth_mm: 1.0 }),
          ],
        }),
        createTestPart({
          SmallestLateralFeature_um: 150,
          InspectionZones: [
            createTestZone({ Face: 'Top', ZoneDepth_mm: 2.0 }),
            createTestZone({ Face: 'Front', ZoneDepth_mm: 3.0, SmallestLateralFeature_um: 50 }),
          ],
        }),
        createTestPart({
          SmallestLateralFeature_um: 200,
          InspectionZones: [
            createTestZone({ Face: 'Front', ZoneDepth_mm: 4.0 }),
            createTestZone({ Face: 'Back', ZoneDepth_mm: 5.0 }),
          ],
        }),
      ]

      const result = aggregateZones(parts)

      expect(result).not.toBeNull()
      expect(result!.totalZones).toBe(5)
      expect(result!.zonesByFace).toEqual({ Top: 2, Front: 2, Back: 1 })
      expect(result!.depthRange).toEqual({ min: 1.0, max: 5.0 })
      expect(result!.smallestFeature_um).toBe(50) // Zone override on second part's Front zone
    })
  })

  describe('AC verification scenarios', () => {
    it('AC-3.9.1: 5 parts, 3 Top, 2 Front', () => {
      const parts = [
        createTestPart({
          InspectionZones: [createTestZone({ Face: 'Top', ZoneDepth_mm: 1 })],
          SmallestLateralFeature_um: 100,
        }),
        createTestPart({
          InspectionZones: [createTestZone({ Face: 'Top', ZoneDepth_mm: 2 })],
          SmallestLateralFeature_um: 100,
        }),
        createTestPart({
          InspectionZones: [createTestZone({ Face: 'Top', ZoneDepth_mm: 3 })],
          SmallestLateralFeature_um: 100,
        }),
        createTestPart({
          InspectionZones: [createTestZone({ Face: 'Front', ZoneDepth_mm: 4 })],
          SmallestLateralFeature_um: 100,
        }),
        createTestPart({
          InspectionZones: [createTestZone({ Face: 'Front', ZoneDepth_mm: 5 })],
          SmallestLateralFeature_um: 100,
        }),
      ]

      const result = aggregateZones(parts)

      expect(result!.totalZones).toBe(5)
      expect(result!.zonesByFace.Top).toBe(3)
      expect(result!.zonesByFace.Front).toBe(2)
    })

    it('AC-3.9.2: depths 1mm, 3mm, 5mm range', () => {
      const parts = [
        createTestPart({
          InspectionZones: [createTestZone({ ZoneDepth_mm: 1.0 })],
          SmallestLateralFeature_um: 100,
        }),
        createTestPart({
          InspectionZones: [createTestZone({ ZoneDepth_mm: 3.0 })],
          SmallestLateralFeature_um: 100,
        }),
        createTestPart({
          InspectionZones: [createTestZone({ ZoneDepth_mm: 5.0 })],
          SmallestLateralFeature_um: 100,
        }),
      ]

      const result = aggregateZones(parts)

      expect(result!.depthRange.min).toBe(1.0)
      expect(result!.depthRange.max).toBe(5.0)
    })

    it('AC-3.9.3: zone override smaller than part default', () => {
      const parts = [
        createTestPart({
          SmallestLateralFeature_um: 200,
          InspectionZones: [
            createTestZone({ SmallestLateralFeature_um: 50 }),
          ],
        }),
      ]

      const result = aggregateZones(parts)

      expect(result!.smallestFeature_um).toBe(50)
    })
  })

  describe('edge cases', () => {
    it('handles part with multiple zones on different faces', () => {
      const parts = [
        createTestPart({
          SmallestLateralFeature_um: 100,
          InspectionZones: [
            createTestZone({ Face: 'Top', ZoneDepth_mm: 1.0 }),
            createTestZone({ Face: 'Bottom', ZoneDepth_mm: 2.0 }),
            createTestZone({ Face: 'Front', ZoneDepth_mm: 3.0 }),
            createTestZone({ Face: 'Back', ZoneDepth_mm: 4.0 }),
            createTestZone({ Face: 'Left', ZoneDepth_mm: 5.0 }),
            createTestZone({ Face: 'Right', ZoneDepth_mm: 6.0 }),
          ],
        }),
      ]

      const result = aggregateZones(parts)

      expect(result!.totalZones).toBe(6)
      expect(result!.zonesByFace).toEqual({
        Top: 1,
        Bottom: 1,
        Front: 1,
        Back: 1,
        Left: 1,
        Right: 1,
      })
      expect(result!.depthRange).toEqual({ min: 1.0, max: 6.0 })
    })

    it('handles very small feature sizes', () => {
      const parts = [
        createTestPart({
          SmallestLateralFeature_um: 10,
          InspectionZones: [createTestZone({ SmallestLateralFeature_um: 5 })],
        }),
      ]

      const result = aggregateZones(parts)

      expect(result!.smallestFeature_um).toBe(5)
    })

    it('handles large number of parts', () => {
      const parts = Array.from({ length: 100 }, (_, i) =>
        createTestPart({
          PartCallout: `PART-${i}`,
          SmallestLateralFeature_um: 100 + i,
          InspectionZones: [
            createTestZone({
              Face: FACE_ORDER[i % 6],
              ZoneDepth_mm: i + 1,
            }),
          ],
        })
      )

      const result = aggregateZones(parts)

      expect(result!.totalZones).toBe(100)
      expect(result!.depthRange.min).toBe(1)
      expect(result!.depthRange.max).toBe(100)
      expect(result!.smallestFeature_um).toBe(100) // First part has 100
    })

    it('handles mixed parts - some with zones, some without', () => {
      const parts = [
        createTestPart({ InspectionZones: [] }), // No zones
        createTestPart({
          SmallestLateralFeature_um: 100,
          InspectionZones: [createTestZone({ Face: 'Top', ZoneDepth_mm: 2.0 })],
        }),
        createTestPart({ InspectionZones: [] }), // No zones
        createTestPart({
          SmallestLateralFeature_um: 150,
          InspectionZones: [createTestZone({ Face: 'Front', ZoneDepth_mm: 4.0 })],
        }),
      ]

      const result = aggregateZones(parts)

      expect(result!.totalZones).toBe(2)
      expect(result!.zonesByFace).toEqual({ Top: 1, Front: 1 })
    })

    it('handles decimal depths correctly', () => {
      const parts = [
        createTestPart({
          SmallestLateralFeature_um: 100,
          InspectionZones: [createTestZone({ ZoneDepth_mm: 0.5 })],
        }),
        createTestPart({
          SmallestLateralFeature_um: 100,
          InspectionZones: [createTestZone({ ZoneDepth_mm: 8.25 })],
        }),
      ]

      const result = aggregateZones(parts)

      expect(result!.depthRange.min).toBe(0.5)
      expect(result!.depthRange.max).toBe(8.25)
    })
  })
})
