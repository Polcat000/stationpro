// src/lib/schemas/__tests__/part.test.ts
// Unit tests for Part and InspectionZone Zod schemas
// Tests AC-2.1.1 and AC-2.1.2

import { describe, it, expect } from 'vitest'
import {
  inspectionZoneSchema,
  partSchema,
  partsImportSchema,
  inspectionFaceSchema,
} from '../part'

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInspectionZone(overrides = {}) {
  return {
    ZoneID: 'zone-1',
    Name: 'Top Surface',
    Face: 'Top' as const,
    ZoneDepth_mm: 2.0,
    ZoneOffset_mm: 0.5,
    ...overrides,
  }
}

function createValidPart(overrides = {}) {
  return {
    PartCallout: 'TEST-001',
    PartWidth_mm: 10.0,
    PartHeight_mm: 5.0,
    PartLength_mm: 20.0,
    SmallestLateralFeature_um: 100,
    InspectionZones: [createValidInspectionZone()],
    ...overrides,
  }
}

// =============================================================================
// InspectionZone Schema Tests (AC-2.1.2)
// =============================================================================

describe('inspectionZoneSchema', () => {
  describe('valid zones', () => {
    it('validates a complete valid zone', () => {
      const zone = createValidInspectionZone()
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(true)
    })

    it('validates zone with optional fields', () => {
      const zone = createValidInspectionZone({
        SmallestLateralFeature_um: 50,
        SmallestDepthFeature_um: 25,
      })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.SmallestLateralFeature_um).toBe(50)
        expect(result.data.SmallestDepthFeature_um).toBe(25)
      }
    })

    it('validates zone with ZoneOffset_mm = 0 (non-negative)', () => {
      const zone = createValidInspectionZone({ ZoneOffset_mm: 0 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(true)
    })
  })

  describe('Face enum validation', () => {
    const validFaces = ['Top', 'Bottom', 'Front', 'Back', 'Left', 'Right'] as const

    it.each(validFaces)('accepts valid Face value: %s', (face) => {
      const zone = createValidInspectionZone({ Face: face })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(true)
    })

    it('rejects invalid Face value', () => {
      const zone = createValidInspectionZone({ Face: 'Invalid' })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })
  })

  describe('default values', () => {
    it('applies default RequiredCoverage_pct = 100', () => {
      const zone = createValidInspectionZone()
      delete (zone as Record<string, unknown>).RequiredCoverage_pct
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.RequiredCoverage_pct).toBe(100)
      }
    })

    it('applies default MinPixelsPerFeature = 3', () => {
      const zone = createValidInspectionZone()
      delete (zone as Record<string, unknown>).MinPixelsPerFeature
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.MinPixelsPerFeature).toBe(3)
      }
    })

    it('accepts custom RequiredCoverage_pct within range', () => {
      const zone = createValidInspectionZone({ RequiredCoverage_pct: 75 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.RequiredCoverage_pct).toBe(75)
      }
    })
  })

  describe('invalid zones', () => {
    it('rejects missing ZoneID', () => {
      const zone = createValidInspectionZone()
      delete (zone as Record<string, unknown>).ZoneID
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects empty ZoneID', () => {
      const zone = createValidInspectionZone({ ZoneID: '' })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects missing Name', () => {
      const zone = createValidInspectionZone()
      delete (zone as Record<string, unknown>).Name
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects negative ZoneDepth_mm', () => {
      const zone = createValidInspectionZone({ ZoneDepth_mm: -1 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects zero ZoneDepth_mm (must be positive)', () => {
      const zone = createValidInspectionZone({ ZoneDepth_mm: 0 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects negative ZoneOffset_mm', () => {
      const zone = createValidInspectionZone({ ZoneOffset_mm: -0.5 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects RequiredCoverage_pct > 100', () => {
      const zone = createValidInspectionZone({ RequiredCoverage_pct: 101 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects RequiredCoverage_pct < 0', () => {
      const zone = createValidInspectionZone({ RequiredCoverage_pct: -1 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })

    it('rejects non-integer MinPixelsPerFeature', () => {
      const zone = createValidInspectionZone({ MinPixelsPerFeature: 2.5 })
      const result = inspectionZoneSchema.safeParse(zone)
      expect(result.success).toBe(false)
    })
  })
})

describe('inspectionFaceSchema', () => {
  it('exports Face enum schema', () => {
    const validFaces = ['Top', 'Bottom', 'Front', 'Back', 'Left', 'Right']
    for (const face of validFaces) {
      const result = inspectionFaceSchema.safeParse(face)
      expect(result.success).toBe(true)
    }
  })
})

// =============================================================================
// Part Schema Tests (AC-2.1.1)
// =============================================================================

describe('partSchema', () => {
  describe('valid parts', () => {
    it('validates a complete valid part', () => {
      const part = createValidPart()
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(true)
    })

    it('validates part with optional PartSeries', () => {
      const part = createValidPart({ PartSeries: 'Electronics Series' })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.PartSeries).toBe('Electronics Series')
      }
    })

    it('validates part with optional SmallestDepthFeature_um', () => {
      const part = createValidPart({ SmallestDepthFeature_um: 50 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.SmallestDepthFeature_um).toBe(50)
      }
    })

    it('validates part with multiple inspection zones', () => {
      const part = createValidPart({
        InspectionZones: [
          createValidInspectionZone({ ZoneID: 'zone-1', Face: 'Top' }),
          createValidInspectionZone({ ZoneID: 'zone-2', Face: 'Bottom' }),
          createValidInspectionZone({ ZoneID: 'zone-3', Face: 'Front' }),
        ],
      })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.InspectionZones).toHaveLength(3)
      }
    })
  })

  describe('invalid parts - missing required fields', () => {
    it('rejects missing PartCallout', () => {
      const part = createValidPart()
      delete (part as Record<string, unknown>).PartCallout
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('PartCallout')
      }
    })

    it('rejects empty PartCallout', () => {
      const part = createValidPart({ PartCallout: '' })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects missing PartWidth_mm', () => {
      const part = createValidPart()
      delete (part as Record<string, unknown>).PartWidth_mm
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects missing PartHeight_mm', () => {
      const part = createValidPart()
      delete (part as Record<string, unknown>).PartHeight_mm
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects missing PartLength_mm', () => {
      const part = createValidPart()
      delete (part as Record<string, unknown>).PartLength_mm
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects missing SmallestLateralFeature_um', () => {
      const part = createValidPart()
      delete (part as Record<string, unknown>).SmallestLateralFeature_um
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects missing InspectionZones', () => {
      const part = createValidPart()
      delete (part as Record<string, unknown>).InspectionZones
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })
  })

  describe('invalid parts - dimension validation', () => {
    it('rejects negative PartWidth_mm', () => {
      const part = createValidPart({ PartWidth_mm: -10 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects zero PartWidth_mm (must be positive)', () => {
      const part = createValidPart({ PartWidth_mm: 0 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects negative PartHeight_mm', () => {
      const part = createValidPart({ PartHeight_mm: -5 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects zero PartHeight_mm (must be positive)', () => {
      const part = createValidPart({ PartHeight_mm: 0 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects negative PartLength_mm', () => {
      const part = createValidPart({ PartLength_mm: -20 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects zero PartLength_mm (must be positive)', () => {
      const part = createValidPart({ PartLength_mm: 0 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects negative SmallestLateralFeature_um', () => {
      const part = createValidPart({ SmallestLateralFeature_um: -100 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects zero SmallestLateralFeature_um (must be positive)', () => {
      const part = createValidPart({ SmallestLateralFeature_um: 0 })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })
  })

  describe('invalid parts - InspectionZones validation', () => {
    it('rejects empty InspectionZones array (min 1 required)', () => {
      const part = createValidPart({ InspectionZones: [] })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })

    it('rejects invalid zone within InspectionZones', () => {
      const part = createValidPart({
        InspectionZones: [
          createValidInspectionZone(),
          { ZoneID: '', Name: 'Invalid', Face: 'Top', ZoneDepth_mm: 1, ZoneOffset_mm: 0 },
        ],
      })
      const result = partSchema.safeParse(part)
      expect(result.success).toBe(false)
    })
  })
})

// =============================================================================
// Parts Import Schema Tests
// =============================================================================

describe('partsImportSchema', () => {
  it('validates array of valid parts', () => {
    const parts = [
      createValidPart({ PartCallout: 'PART-001' }),
      createValidPart({ PartCallout: 'PART-002' }),
    ]
    const result = partsImportSchema.safeParse(parts)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('validates empty array (no parts)', () => {
    const result = partsImportSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  it('rejects array with invalid part', () => {
    const parts = [
      createValidPart({ PartCallout: 'PART-001' }),
      { PartCallout: '' }, // Invalid - empty callout
    ]
    const result = partsImportSchema.safeParse(parts)
    expect(result.success).toBe(false)
  })
})
