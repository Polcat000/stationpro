// src/lib/import/__tests__/parseAndValidate.test.ts
import { describe, it, expect } from 'vitest'
import {
  parsePartsJson,
  parseAndValidatePartsIndividually,
  validatePartsIndividually,
  parseComponentsJson,
  parseAndValidateComponentsIndividually,
  validateComponentsIndividually,
} from '../parseAndValidate'
import type { Part } from '@/lib/schemas/part'
import type { LaserLineProfiler, AreascanCamera, LinescanCamera, Lens, SnapshotSensor } from '@/lib/schemas/component'

// Valid part fixture matching the Part schema
const validPart: Part = {
  PartCallout: 'TEST-001',
  PartSeries: 'Test Series',
  PartWidth_mm: 100,
  PartHeight_mm: 50,
  PartLength_mm: 150,
  SmallestLateralFeature_um: 100,
  InspectionZones: [
    {
      ZoneID: 'zone-1',
      Name: 'Top Surface',
      Face: 'Top',
      ZoneDepth_mm: 2.5,
      ZoneOffset_mm: 0,
      RequiredCoverage_pct: 100,
      MinPixelsPerFeature: 3,
    },
  ],
}

// Another valid part for array tests
const validPart2: Part = {
  PartCallout: 'TEST-002',
  PartWidth_mm: 200,
  PartHeight_mm: 100,
  PartLength_mm: 300,
  SmallestLateralFeature_um: 50,
  InspectionZones: [
    {
      ZoneID: 'zone-2',
      Name: 'Bottom Surface',
      Face: 'Bottom',
      ZoneDepth_mm: 1.5,
      ZoneOffset_mm: 5,
      RequiredCoverage_pct: 100,
      MinPixelsPerFeature: 3,
    },
  ],
}

describe('parsePartsJson', () => {
  describe('valid input', () => {
    it('parses a valid single-part array', () => {
      const json = JSON.stringify([validPart])
      const result = parsePartsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].PartCallout).toBe('TEST-001')
      }
    })

    it('parses a valid multi-part array', () => {
      const json = JSON.stringify([validPart, validPart2])
      const result = parsePartsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0].PartCallout).toBe('TEST-001')
        expect(result.data[1].PartCallout).toBe('TEST-002')
      }
    })

    it('parses an empty array', () => {
      const json = '[]'
      const result = parsePartsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(0)
      }
    })

    it('preserves optional fields when present', () => {
      const json = JSON.stringify([validPart])
      const result = parsePartsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].PartSeries).toBe('Test Series')
      }
    })

    it('handles parts without optional fields', () => {
      const partWithoutOptional = { ...validPart }
      delete (partWithoutOptional as Record<string, unknown>).PartSeries
      delete (partWithoutOptional as Record<string, unknown>).SmallestDepthFeature_um

      const json = JSON.stringify([partWithoutOptional])
      const result = parsePartsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].PartSeries).toBeUndefined()
      }
    })
  })

  describe('malformed JSON', () => {
    it('returns root error for invalid JSON syntax', () => {
      const result = parsePartsJson('not json')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].path).toBe('root')
        expect(result.errors[0].message).toContain('Invalid JSON')
      }
    })

    it('returns root error for incomplete JSON', () => {
      const result = parsePartsJson('[{"PartCallout": "TEST"')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].path).toBe('root')
      }
    })

    it('returns root error for empty string', () => {
      const result = parsePartsJson('')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].path).toBe('root')
      }
    })
  })

  describe('invalid schema', () => {
    it('returns error for missing required field PartCallout', () => {
      const invalidPart = { ...validPart }
      delete (invalidPart as Record<string, unknown>).PartCallout

      const result = parsePartsJson(JSON.stringify([invalidPart]))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.path.includes('PartCallout'))).toBe(true)
      }
    })

    it('returns error for negative dimension', () => {
      const invalidPart = { ...validPart, PartWidth_mm: -10 }

      const result = parsePartsJson(JSON.stringify([invalidPart]))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.path.includes('PartWidth_mm'))).toBe(true)
        expect(result.errors.some((e) => e.message.toLowerCase().includes('positive'))).toBe(true)
      }
    })

    it('returns error for empty InspectionZones array', () => {
      const invalidPart = { ...validPart, InspectionZones: [] }

      const result = parsePartsJson(JSON.stringify([invalidPart]))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.path.includes('InspectionZones'))).toBe(true)
      }
    })

    it('returns error for invalid Face enum value', () => {
      const invalidPart = {
        ...validPart,
        InspectionZones: [{ ...validPart.InspectionZones[0], Face: 'InvalidFace' }],
      }

      const result = parsePartsJson(JSON.stringify([invalidPart]))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.path.includes('Face'))).toBe(true)
      }
    })

    it('returns error with dot-notation path for nested field', () => {
      const invalidPart = {
        ...validPart,
        InspectionZones: [{ ...validPart.InspectionZones[0], ZoneDepth_mm: -1 }],
      }

      const result = parsePartsJson(JSON.stringify([invalidPart]))

      expect(result.success).toBe(false)
      if (!result.success) {
        // Path should be like "0.InspectionZones.0.ZoneDepth_mm"
        const depthError = result.errors.find((e) => e.path.includes('ZoneDepth_mm'))
        expect(depthError).toBeDefined()
        expect(depthError?.path).toMatch(/\d+\.InspectionZones\.\d+\.ZoneDepth_mm/)
      }
    })

    it('returns error when input is not an array', () => {
      const result = parsePartsJson(JSON.stringify(validPart))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.message.toLowerCase().includes('array'))).toBe(true)
      }
    })

    it('collects multiple errors from same part', () => {
      const invalidPart = {
        PartCallout: '', // invalid - too short
        PartWidth_mm: -10, // invalid - must be positive
        PartHeight_mm: 50,
        PartLength_mm: 150,
        SmallestLateralFeature_um: 100,
        InspectionZones: [], // invalid - must have at least one
      }

      const result = parsePartsJson(JSON.stringify([invalidPart]))

      expect(result.success).toBe(false)
      if (!result.success) {
        // Should have at least 3 errors
        expect(result.errors.length).toBeGreaterThanOrEqual(3)
      }
    })
  })
})

describe('validatePartsIndividually', () => {
  it('separates valid and invalid parts', () => {
    const invalidPart = { PartCallout: '', PartWidth_mm: -10 }
    const parts = [validPart, invalidPart, validPart2]

    const result = validatePartsIndividually(parts)

    expect(result.validCount).toBe(2)
    expect(result.invalidCount).toBe(1)
    expect(result.validParts).toHaveLength(2)
    expect(result.invalidParts).toHaveLength(1)
    expect(result.invalidParts[0].index).toBe(1)
  })

  it('includes part index in error paths', () => {
    const invalidPart = { ...validPart, PartWidth_mm: -10 }
    const parts = [validPart, invalidPart]

    const result = validatePartsIndividually(parts)

    expect(result.invalidParts[0].errors[0].path).toMatch(/^1\./)
  })

  it('returns all valid when all parts are valid', () => {
    const result = validatePartsIndividually([validPart, validPart2])

    expect(result.validCount).toBe(2)
    expect(result.invalidCount).toBe(0)
  })

  it('returns all invalid when all parts are invalid', () => {
    const invalid1 = { PartCallout: '' }
    const invalid2 = { PartWidth_mm: -10 }

    const result = validatePartsIndividually([invalid1, invalid2])

    expect(result.validCount).toBe(0)
    expect(result.invalidCount).toBe(2)
  })
})

describe('parseAndValidatePartsIndividually', () => {
  it('parses JSON and validates parts individually', () => {
    const invalidPart = { ...validPart, PartWidth_mm: -10 }
    const json = JSON.stringify([validPart, invalidPart])

    const result = parseAndValidatePartsIndividually(json)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.validCount).toBe(1)
      expect(result.data.invalidCount).toBe(1)
    }
  })

  it('returns error for malformed JSON', () => {
    const result = parseAndValidatePartsIndividually('not json')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toBe('root')
    }
  })

  it('returns error when JSON is not an array', () => {
    const result = parseAndValidatePartsIndividually(JSON.stringify({ foo: 'bar' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].message).toContain('array')
    }
  })

  it('handles empty array', () => {
    const result = parseAndValidatePartsIndividually('[]')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.validCount).toBe(0)
      expect(result.data.invalidCount).toBe(0)
    }
  })
})

// =============================================================================
// Component Import Tests (Story 2.4)
// =============================================================================

// Valid component fixtures for all 5 types
const validLaserProfiler: LaserLineProfiler = {
  componentId: 'profiler-001',
  componentType: 'LaserLineProfiler',
  Manufacturer: 'LMI',
  Model: 'Gocator 2330',
  NearFieldLateralFOV_mm: 32,
  MidFieldLateralFOV_mm: 55,
  FarFieldLateralFOV_mm: 88,
  StandoffDistance_mm: 125,
  MeasurementRange_mm: 60,
  PointsPerProfile: 1280,
  LateralResolution_um: 27,
  VerticalResolution_um: 12,
  MaxScanRate_kHz: 5,
}

const validAreascanCamera: AreascanCamera = {
  componentId: 'areascan-001',
  componentType: 'AreascanCamera',
  Manufacturer: 'Basler',
  Model: 'a2A5320-23gmPRO',
  ResolutionHorizontal_px: 5320,
  ResolutionVertical_px: 4600,
  PixelSizeHorizontal_um: 2.33,
  PixelSizeVertical_um: 2.33,
  FrameRate_fps: 23,
  LensMount: 'C-Mount',
}

const validLinescanCamera: LinescanCamera = {
  componentId: 'linescan-001',
  componentType: 'LinescanCamera',
  Manufacturer: 'Basler',
  Model: 'raL8192-16gm',
  ResolutionHorizontal_px: 8192,
  ResolutionVertical_px: 1,
  PixelSizeHorizontal_um: 7.0,
  PixelSizeVertical_um: 7.0,
  LineRate_kHz: 16,
  LensMount: 'M72',
}

const validTelecentricLens: Lens = {
  componentId: 'lens-tele-001',
  componentType: 'Lens',
  LensType: 'Telecentric',
  Manufacturer: 'Opto Engineering',
  Model: 'TC23036',
  Mount: 'C-Mount',
  MaxSensorSize_mm: 11,
  ApertureMin_fnum: 8,
  ApertureMax_fnum: 16,
  Magnification: 0.5,
  WorkingDistance_mm: 65,
  FieldDepth_mm: 2.5,
}

const validFixedFocalLens: Lens = {
  componentId: 'lens-ffl-001',
  componentType: 'Lens',
  LensType: 'FixedFocalLength',
  Manufacturer: 'Fujinon',
  Model: 'HF25XA-5M',
  Mount: 'C-Mount',
  MaxSensorSize_mm: 8.5,
  ApertureMin_fnum: 1.6,
  ApertureMax_fnum: 16,
  FocalLength_mm: 25,
  WorkingDistanceMin_mm: 200,
}

const validSnapshotSensor: SnapshotSensor = {
  componentId: 'snapshot-001',
  componentType: 'SnapshotSensor',
  Manufacturer: 'Photoneo',
  Model: 'PhoXi M',
  FOV_X_mm: 382,
  FOV_Y_mm: 286,
  MeasurementRange_mm: 445,
  WorkingDistance_mm: 680,
  XYDataInterval_um: 49,
}

describe('parseComponentsJson', () => {
  describe('valid input', () => {
    it('parses a valid single LaserLineProfiler', () => {
      const json = JSON.stringify({ Components: [validLaserProfiler] })
      const result = parseComponentsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].componentId).toBe('profiler-001')
        expect(result.data[0].componentType).toBe('LaserLineProfiler')
      }
    })

    it('parses all 5 component types in single JSON file', () => {
      const json = JSON.stringify({
        Components: [
          validLaserProfiler,
          validAreascanCamera,
          validLinescanCamera,
          validTelecentricLens,
          validSnapshotSensor,
        ],
      })
      const result = parseComponentsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(5)
        const types = result.data.map((c) => c.componentType)
        expect(types).toContain('LaserLineProfiler')
        expect(types).toContain('AreascanCamera')
        expect(types).toContain('LinescanCamera')
        expect(types).toContain('SnapshotSensor')
        // Lens is included - check via componentId
        expect(result.data.some((c) => c.componentId === 'lens-tele-001')).toBe(true)
      }
    })

    it('parses both Telecentric and FixedFocalLength lens types', () => {
      const json = JSON.stringify({
        Components: [validTelecentricLens, validFixedFocalLens],
      })
      const result = parseComponentsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        const lenses = result.data as Lens[]
        expect(lenses.some((l) => l.LensType === 'Telecentric')).toBe(true)
        expect(lenses.some((l) => l.LensType === 'FixedFocalLength')).toBe(true)
      }
    })

    it('parses an empty Components array', () => {
      const json = JSON.stringify({ Components: [] })
      const result = parseComponentsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(0)
      }
    })

    it('preserves optional fields when present', () => {
      const profilerWithOptional = {
        ...validLaserProfiler,
        PartNumber: 'G2330-001',
        LaserClass: ['Class 2'],
      }
      const json = JSON.stringify({ Components: [profilerWithOptional] })
      const result = parseComponentsJson(json)

      expect(result.success).toBe(true)
      if (result.success) {
        const profiler = result.data[0] as LaserLineProfiler
        expect(profiler.PartNumber).toBe('G2330-001')
        expect(profiler.LaserClass).toEqual(['Class 2'])
      }
    })
  })

  describe('malformed JSON', () => {
    it('returns root error for invalid JSON syntax', () => {
      const result = parseComponentsJson('not json')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].path).toBe('root')
        expect(result.errors[0].message).toContain('Invalid JSON')
      }
    })

    it('returns root error for incomplete JSON', () => {
      const result = parseComponentsJson('{"Components": [{"componentId": "test"')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].path).toBe('root')
      }
    })

    it('returns root error for empty string', () => {
      const result = parseComponentsJson('')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].path).toBe('root')
      }
    })
  })

  describe('invalid componentType - AC-2.4.2', () => {
    it('rejects invalid componentType with descriptive error', () => {
      const json = JSON.stringify({
        Components: [
          {
            componentId: 'test-001',
            componentType: 'InvalidType',
            Manufacturer: 'Test',
            Model: 'Test Model',
          },
        ],
      })
      const result = parseComponentsJson(json)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
        // Error path should reference Components.0
        expect(result.errors.some((e) => e.path.includes('Components.0'))).toBe(true)
      }
    })

    it('rejects missing componentType', () => {
      const json = JSON.stringify({
        Components: [
          {
            componentId: 'test-001',
            Manufacturer: 'Test',
            Model: 'Test Model',
          },
        ],
      })
      const result = parseComponentsJson(json)

      expect(result.success).toBe(false)
    })
  })

  describe('invalid schema', () => {
    it('returns error for missing required field componentId', () => {
      const invalidComponent = { ...validLaserProfiler }
      delete (invalidComponent as Record<string, unknown>).componentId

      const result = parseComponentsJson(JSON.stringify({ Components: [invalidComponent] }))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.path.includes('componentId'))).toBe(true)
      }
    })

    it('returns error for missing type-specific required field', () => {
      const invalidProfiler = { ...validLaserProfiler }
      delete (invalidProfiler as Record<string, unknown>).NearFieldLateralFOV_mm

      const result = parseComponentsJson(JSON.stringify({ Components: [invalidProfiler] }))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.message.toLowerCase().includes('required') || e.path.includes('NearFieldLateralFOV_mm'))).toBe(true)
      }
    })

    it('returns error for negative numeric value', () => {
      const invalidComponent = { ...validLaserProfiler, StandoffDistance_mm: -100 }

      const result = parseComponentsJson(JSON.stringify({ Components: [invalidComponent] }))

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some((e) => e.message.toLowerCase().includes('positive'))).toBe(true)
      }
    })

    it('returns error when Components is not an array', () => {
      const result = parseComponentsJson(JSON.stringify({ Components: 'not an array' }))

      expect(result.success).toBe(false)
    })

    it('returns error when missing Components wrapper', () => {
      const result = parseComponentsJson(JSON.stringify([validLaserProfiler]))

      expect(result.success).toBe(false)
    })

    it('collects multiple errors from same component', () => {
      const invalidComponent = {
        componentType: 'LaserLineProfiler',
        componentId: '', // invalid - too short
        Manufacturer: '', // invalid - too short
        Model: 'Test',
        NearFieldLateralFOV_mm: -10, // invalid - must be positive
        MidFieldLateralFOV_mm: 55,
        FarFieldLateralFOV_mm: 88,
        StandoffDistance_mm: 125,
        MeasurementRange_mm: 60,
        PointsPerProfile: 1280,
        LateralResolution_um: 27,
        VerticalResolution_um: 12,
        MaxScanRate_kHz: 5,
      }

      const result = parseComponentsJson(JSON.stringify({ Components: [invalidComponent] }))

      expect(result.success).toBe(false)
      if (!result.success) {
        // Should have multiple errors
        expect(result.errors.length).toBeGreaterThanOrEqual(2)
      }
    })
  })
})

describe('validateComponentsIndividually', () => {
  it('separates valid and invalid components', () => {
    const invalidComponent = { componentType: 'InvalidType', componentId: '' }
    const components = [validLaserProfiler, invalidComponent, validAreascanCamera]

    const result = validateComponentsIndividually(components)

    expect(result.validCount).toBe(2)
    expect(result.invalidCount).toBe(1)
    expect(result.validComponents).toHaveLength(2)
    expect(result.invalidComponents).toHaveLength(1)
    expect(result.invalidComponents[0].index).toBe(1)
  })

  it('includes Components.index in error paths', () => {
    const invalidComponent = { ...validLaserProfiler, StandoffDistance_mm: -100 }
    const components = [validLaserProfiler, invalidComponent]

    const result = validateComponentsIndividually(components)

    expect(result.invalidComponents[0].errors[0].path).toMatch(/^Components\.1\./)
  })

  it('returns all valid when all components are valid', () => {
    const result = validateComponentsIndividually([
      validLaserProfiler,
      validAreascanCamera,
      validLinescanCamera,
    ])

    expect(result.validCount).toBe(3)
    expect(result.invalidCount).toBe(0)
  })

  it('returns all invalid when all components are invalid', () => {
    const invalid1 = { componentType: 'Invalid' }
    const invalid2 = { componentId: '' }

    const result = validateComponentsIndividually([invalid1, invalid2])

    expect(result.validCount).toBe(0)
    expect(result.invalidCount).toBe(2)
  })
})

describe('parseAndValidateComponentsIndividually', () => {
  it('parses JSON and validates components individually', () => {
    const invalidComponent = { ...validLaserProfiler, StandoffDistance_mm: -100 }
    const json = JSON.stringify({ Components: [validLaserProfiler, invalidComponent] })

    const result = parseAndValidateComponentsIndividually(json)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.validCount).toBe(1)
      expect(result.data.invalidCount).toBe(1)
    }
  })

  it('returns error for malformed JSON', () => {
    const result = parseAndValidateComponentsIndividually('not json')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].path).toBe('root')
    }
  })

  it('returns error when missing Components wrapper', () => {
    const result = parseAndValidateComponentsIndividually(JSON.stringify({ foo: 'bar' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].message).toContain('Components')
    }
  })

  it('returns error when Components is not an array', () => {
    const result = parseAndValidateComponentsIndividually(JSON.stringify({ Components: 'not array' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].message).toContain('array')
    }
  })

  it('handles empty Components array', () => {
    const result = parseAndValidateComponentsIndividually(JSON.stringify({ Components: [] }))

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.validCount).toBe(0)
      expect(result.data.invalidCount).toBe(0)
    }
  })
})
