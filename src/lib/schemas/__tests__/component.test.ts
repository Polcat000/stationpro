// src/lib/schemas/__tests__/component.test.ts
// Unit tests for Component Zod schemas (discriminated union)
// Tests AC-2.1.3

import { describe, it, expect } from 'vitest'
import {
  componentSchema,
  componentsImportSchema,
  laserProfilerSchema,
  linescanCameraSchema,
  areascanCameraSchema,
  lensSchema,
  snapshotSensorSchema,
  telecentricLensSchema,
  fixedFocalLengthLensSchema,
  baseComponentSchema,
} from '../component'

// =============================================================================
// Test Data Factories
// =============================================================================

function createBaseComponent(overrides = {}) {
  return {
    componentId: 'comp-001',
    Manufacturer: 'Test Manufacturer',
    Model: 'Test Model',
    ...overrides,
  }
}

function createValidLaserProfiler(overrides = {}) {
  return {
    ...createBaseComponent(),
    componentType: 'LaserLineProfiler' as const,
    NearFieldLateralFOV_mm: 100,
    MidFieldLateralFOV_mm: 150,
    FarFieldLateralFOV_mm: 200,
    StandoffDistance_mm: 300,
    MeasurementRange_mm: 100,
    PointsPerProfile: 1280,
    LateralResolution_um: 50,
    VerticalResolution_um: 10,
    MaxScanRate_kHz: 5,
    ...overrides,
  }
}

function createValidLinescanCamera(overrides = {}) {
  return {
    ...createBaseComponent(),
    componentType: 'LinescanCamera' as const,
    ResolutionHorizontal_px: 4096,
    ResolutionVertical_px: 1,
    PixelSizeHorizontal_um: 7.0,
    PixelSizeVertical_um: 7.0,
    LineRate_kHz: 100,
    LensMount: 'C',
    ...overrides,
  }
}

function createValidAreascanCamera(overrides = {}) {
  return {
    ...createBaseComponent(),
    componentType: 'AreascanCamera' as const,
    ResolutionHorizontal_px: 2048,
    ResolutionVertical_px: 1536,
    PixelSizeHorizontal_um: 5.5,
    PixelSizeVertical_um: 5.5,
    FrameRate_fps: 30,
    LensMount: 'C',
    ...overrides,
  }
}

function createValidTelecentricLens(overrides = {}) {
  return {
    ...createBaseComponent(),
    componentType: 'Lens' as const,
    LensType: 'Telecentric' as const,
    Mount: 'C',
    MaxSensorSize_mm: 11.0,
    ApertureMin_fnum: 4.0,
    ApertureMax_fnum: 16.0,
    Magnification: 0.5,
    WorkingDistance_mm: 100,
    FieldDepth_mm: 5.0,
    ...overrides,
  }
}

function createValidFixedFocalLengthLens(overrides = {}) {
  return {
    ...createBaseComponent(),
    componentType: 'Lens' as const,
    LensType: 'FixedFocalLength' as const,
    Mount: 'C',
    MaxSensorSize_mm: 16.0,
    ApertureMin_fnum: 1.4,
    ApertureMax_fnum: 16.0,
    FocalLength_mm: 25,
    WorkingDistanceMin_mm: 200,
    ...overrides,
  }
}

function createValidSnapshotSensor(overrides = {}) {
  return {
    ...createBaseComponent(),
    componentType: 'SnapshotSensor' as const,
    XYDataInterval_um: 30,
    FOV_X_mm: 90,
    FOV_Y_mm: 70,
    MeasurementRange_mm: 50,
    WorkingDistance_mm: 250,
    ...overrides,
  }
}

// =============================================================================
// Base Component Schema Tests
// =============================================================================

describe('baseComponentSchema', () => {
  it('validates base component fields', () => {
    const base = createBaseComponent()
    const result = baseComponentSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('validates with optional PartNumber', () => {
    const base = createBaseComponent({ PartNumber: 'SKU-12345' })
    const result = baseComponentSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.PartNumber).toBe('SKU-12345')
    }
  })

  it('rejects missing componentId', () => {
    const base = createBaseComponent()
    delete (base as Record<string, unknown>).componentId
    const result = baseComponentSchema.safeParse(base)
    expect(result.success).toBe(false)
  })

  it('rejects empty componentId', () => {
    const base = createBaseComponent({ componentId: '' })
    const result = baseComponentSchema.safeParse(base)
    expect(result.success).toBe(false)
  })

  it('rejects missing Manufacturer', () => {
    const base = createBaseComponent()
    delete (base as Record<string, unknown>).Manufacturer
    const result = baseComponentSchema.safeParse(base)
    expect(result.success).toBe(false)
  })

  it('rejects missing Model', () => {
    const base = createBaseComponent()
    delete (base as Record<string, unknown>).Model
    const result = baseComponentSchema.safeParse(base)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Laser Line Profiler Schema Tests
// =============================================================================

describe('laserProfilerSchema', () => {
  it('validates a complete laser profiler', () => {
    const profiler = createValidLaserProfiler()
    const result = laserProfilerSchema.safeParse(profiler)
    expect(result.success).toBe(true)
  })

  it('validates with optional accuracy fields', () => {
    const profiler = createValidLaserProfiler({
      VerticalRepeatability_um: 5,
      VerticalLinearity_um: 8,
    })
    const result = laserProfilerSchema.safeParse(profiler)
    expect(result.success).toBe(true)
  })

  it('validates with optional laser properties', () => {
    const profiler = createValidLaserProfiler({
      LaserClass: ['2', '3R'],
      LaserWavelength: ['660nm', 'red'],
    })
    const result = laserProfilerSchema.safeParse(profiler)
    expect(result.success).toBe(true)
  })

  it('rejects missing StandoffDistance_mm', () => {
    const profiler = createValidLaserProfiler()
    delete (profiler as Record<string, unknown>).StandoffDistance_mm
    const result = laserProfilerSchema.safeParse(profiler)
    expect(result.success).toBe(false)
  })

  it('rejects negative MeasurementRange_mm', () => {
    const profiler = createValidLaserProfiler({ MeasurementRange_mm: -50 })
    const result = laserProfilerSchema.safeParse(profiler)
    expect(result.success).toBe(false)
  })

  it('rejects non-integer PointsPerProfile', () => {
    const profiler = createValidLaserProfiler({ PointsPerProfile: 1280.5 })
    const result = laserProfilerSchema.safeParse(profiler)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Linescan Camera Schema Tests
// =============================================================================

describe('linescanCameraSchema', () => {
  it('validates a complete linescan camera', () => {
    const camera = createValidLinescanCamera()
    const result = linescanCameraSchema.safeParse(camera)
    expect(result.success).toBe(true)
  })

  it('applies default ResolutionVertical_px = 1', () => {
    const camera = createValidLinescanCamera()
    delete (camera as Record<string, unknown>).ResolutionVertical_px
    const result = linescanCameraSchema.safeParse(camera)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ResolutionVertical_px).toBe(1)
    }
  })

  it('validates with optional sensor fields', () => {
    const camera = createValidLinescanCamera({
      SensorVendor: 'e2v',
      SensorName: 'EV71YC3M',
      SensorType: 'CMOS',
      ShutterType: 'Global',
    })
    const result = linescanCameraSchema.safeParse(camera)
    expect(result.success).toBe(true)
  })

  it('rejects missing LensMount', () => {
    const camera = createValidLinescanCamera()
    delete (camera as Record<string, unknown>).LensMount
    const result = linescanCameraSchema.safeParse(camera)
    expect(result.success).toBe(false)
  })

  it('rejects empty LensMount', () => {
    const camera = createValidLinescanCamera({ LensMount: '' })
    const result = linescanCameraSchema.safeParse(camera)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Areascan Camera Schema Tests
// =============================================================================

describe('areascanCameraSchema', () => {
  it('validates a complete areascan camera', () => {
    const camera = createValidAreascanCamera()
    const result = areascanCameraSchema.safeParse(camera)
    expect(result.success).toBe(true)
  })

  it('validates with optional sensor dimension fields', () => {
    const camera = createValidAreascanCamera({
      SensorWidth_mm: 11.26,
      SensorHeight_mm: 8.45,
      OpticalFormat: '2/3"',
    })
    const result = areascanCameraSchema.safeParse(camera)
    expect(result.success).toBe(true)
  })

  it('rejects zero FrameRate_fps', () => {
    const camera = createValidAreascanCamera({ FrameRate_fps: 0 })
    const result = areascanCameraSchema.safeParse(camera)
    expect(result.success).toBe(false)
  })

  it('rejects non-integer ResolutionHorizontal_px', () => {
    const camera = createValidAreascanCamera({ ResolutionHorizontal_px: 2048.5 })
    const result = areascanCameraSchema.safeParse(camera)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Lens Schema Tests (Discriminated Union)
// =============================================================================

describe('lensSchema', () => {
  describe('telecentric lens', () => {
    it('validates a complete telecentric lens', () => {
      const lens = createValidTelecentricLens()
      const result = lensSchema.safeParse(lens)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.LensType).toBe('Telecentric')
      }
    })

    it('validates with optional quality metrics', () => {
      const lens = createValidTelecentricLens({
        Telecentricity_deg: 0.1,
        Distortion_pct: 0.05,
        Resolution_um: 15,
      })
      const result = lensSchema.safeParse(lens)
      expect(result.success).toBe(true)
    })

    it('rejects missing Magnification', () => {
      const lens = createValidTelecentricLens()
      delete (lens as Record<string, unknown>).Magnification
      const result = telecentricLensSchema.safeParse(lens)
      expect(result.success).toBe(false)
    })

    it('rejects missing FieldDepth_mm', () => {
      const lens = createValidTelecentricLens()
      delete (lens as Record<string, unknown>).FieldDepth_mm
      const result = telecentricLensSchema.safeParse(lens)
      expect(result.success).toBe(false)
    })
  })

  describe('fixed focal length lens', () => {
    it('validates a complete fixed focal length lens', () => {
      const lens = createValidFixedFocalLengthLens()
      const result = lensSchema.safeParse(lens)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.LensType).toBe('FixedFocalLength')
      }
    })

    it('validates with optional fields', () => {
      const lens = createValidFixedFocalLengthLens({
        WorkingDistanceMax_mm: 500,
        AngleOfView_deg: 45,
        Distortion_pct: 0.5,
      })
      const result = lensSchema.safeParse(lens)
      expect(result.success).toBe(true)
    })

    it('rejects missing FocalLength_mm', () => {
      const lens = createValidFixedFocalLengthLens()
      delete (lens as Record<string, unknown>).FocalLength_mm
      const result = fixedFocalLengthLensSchema.safeParse(lens)
      expect(result.success).toBe(false)
    })

    it('rejects missing WorkingDistanceMin_mm', () => {
      const lens = createValidFixedFocalLengthLens()
      delete (lens as Record<string, unknown>).WorkingDistanceMin_mm
      const result = fixedFocalLengthLensSchema.safeParse(lens)
      expect(result.success).toBe(false)
    })
  })

  describe('discriminator validation', () => {
    it('correctly identifies telecentric lens by LensType', () => {
      const lens = createValidTelecentricLens()
      const result = lensSchema.safeParse(lens)
      expect(result.success).toBe(true)
      if (result.success && result.data.LensType === 'Telecentric') {
        expect(result.data.Magnification).toBeDefined()
      }
    })

    it('correctly identifies fixed focal length lens by LensType', () => {
      const lens = createValidFixedFocalLengthLens()
      const result = lensSchema.safeParse(lens)
      expect(result.success).toBe(true)
      if (result.success && result.data.LensType === 'FixedFocalLength') {
        expect(result.data.FocalLength_mm).toBeDefined()
      }
    })
  })
})

// =============================================================================
// Snapshot Sensor Schema Tests
// =============================================================================

describe('snapshotSensorSchema', () => {
  it('validates a complete snapshot sensor', () => {
    const sensor = createValidSnapshotSensor()
    const result = snapshotSensorSchema.safeParse(sensor)
    expect(result.success).toBe(true)
  })

  it('validates with optional resolution strings', () => {
    const sensor = createValidSnapshotSensor({
      Resolution3D_px: '3072x3072',
      Resolution2D_px: '3072x3072',
    })
    const result = snapshotSensorSchema.safeParse(sensor)
    expect(result.success).toBe(true)
  })

  it('validates with optional accuracy fields', () => {
    const sensor = createValidSnapshotSensor({
      XYZRepeatability_um: 2.5,
      HeightAccuracy_um: 10,
      WidthAccuracy_um: 15,
    })
    const result = snapshotSensorSchema.safeParse(sensor)
    expect(result.success).toBe(true)
  })

  it('rejects zero FOV_X_mm', () => {
    const sensor = createValidSnapshotSensor({ FOV_X_mm: 0 })
    const result = snapshotSensorSchema.safeParse(sensor)
    expect(result.success).toBe(false)
  })

  it('rejects negative WorkingDistance_mm', () => {
    const sensor = createValidSnapshotSensor({ WorkingDistance_mm: -250 })
    const result = snapshotSensorSchema.safeParse(sensor)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Component Discriminated Union Tests
// =============================================================================

describe('componentSchema', () => {
  describe('valid components by type', () => {
    it('validates LaserLineProfiler', () => {
      const component = createValidLaserProfiler()
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.componentType).toBe('LaserLineProfiler')
      }
    })

    it('validates LinescanCamera', () => {
      const component = createValidLinescanCamera()
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.componentType).toBe('LinescanCamera')
      }
    })

    it('validates AreascanCamera', () => {
      const component = createValidAreascanCamera()
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.componentType).toBe('AreascanCamera')
      }
    })

    it('validates Telecentric Lens', () => {
      const component = createValidTelecentricLens()
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.componentType).toBe('Lens')
      }
    })

    it('validates FixedFocalLength Lens', () => {
      const component = createValidFixedFocalLengthLens()
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.componentType).toBe('Lens')
      }
    })

    it('validates SnapshotSensor', () => {
      const component = createValidSnapshotSensor()
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.componentType).toBe('SnapshotSensor')
      }
    })
  })

  describe('invalid component types', () => {
    it('rejects unknown componentType', () => {
      const component = {
        ...createBaseComponent(),
        componentType: 'InvalidType',
      }
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(false)
    })

    it('rejects missing componentType', () => {
      const component = createBaseComponent()
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(false)
    })
  })

  describe('type-specific field validation', () => {
    it('rejects LaserLineProfiler missing type-specific required field', () => {
      const component = createValidLaserProfiler()
      delete (component as Record<string, unknown>).StandoffDistance_mm
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(false)
    })

    it('rejects LinescanCamera missing type-specific required field', () => {
      const component = createValidLinescanCamera()
      delete (component as Record<string, unknown>).LineRate_kHz
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(false)
    })

    it('rejects AreascanCamera missing type-specific required field', () => {
      const component = createValidAreascanCamera()
      delete (component as Record<string, unknown>).FrameRate_fps
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(false)
    })

    it('rejects SnapshotSensor missing type-specific required field', () => {
      const component = createValidSnapshotSensor()
      delete (component as Record<string, unknown>).FOV_X_mm
      const result = componentSchema.safeParse(component)
      expect(result.success).toBe(false)
    })
  })
})

// =============================================================================
// Lens Filtering Tests (AC 3.11.1 - Both subtypes filter by componentType='Lens')
// =============================================================================

describe('lens filtering by componentType', () => {
  it('both Telecentric and FixedFocalLength lenses have componentType="Lens"', () => {
    const telecentricLens = createValidTelecentricLens()
    const fixedFocalLens = createValidFixedFocalLengthLens()

    const telecentricResult = componentSchema.safeParse(telecentricLens)
    const fixedFocalResult = componentSchema.safeParse(fixedFocalLens)

    expect(telecentricResult.success).toBe(true)
    expect(fixedFocalResult.success).toBe(true)

    if (telecentricResult.success && fixedFocalResult.success) {
      // Both must have componentType='Lens' for filtering to work
      expect(telecentricResult.data.componentType).toBe('Lens')
      expect(fixedFocalResult.data.componentType).toBe('Lens')
    }
  })

  it('filtering by componentType="Lens" includes both subtypes', () => {
    const components = [
      createValidLaserProfiler({ componentId: 'laser-1' }),
      createValidTelecentricLens({ componentId: 'tele-1' }),
      createValidFixedFocalLengthLens({ componentId: 'ffl-1' }),
      createValidAreascanCamera({ componentId: 'camera-1' }),
      createValidTelecentricLens({ componentId: 'tele-2' }),
    ]

    // Parse all components
    const parsedComponents = components
      .map((c) => componentSchema.safeParse(c))
      .filter((r) => r.success)
      .map((r) => (r.success ? r.data : null))
      .filter((c) => c !== null)

    // Filter by componentType='Lens' (simulates UI filter)
    const lensFilter = (c: { componentType: string }) => c.componentType === 'Lens'
    const filteredLenses = parsedComponents.filter(lensFilter)

    // Should include all 3 lens components (2 telecentric + 1 fixed focal)
    expect(filteredLenses).toHaveLength(3)

    // Verify we got both subtypes
    const lensTypes = filteredLenses.map((l) => (l as { LensType: string }).LensType)
    expect(lensTypes.filter((t) => t === 'Telecentric')).toHaveLength(2)
    expect(lensTypes.filter((t) => t === 'FixedFocalLength')).toHaveLength(1)
  })

  it('rejects legacy "TelecentricLens" componentType', () => {
    const invalidLens = {
      ...createBaseComponent(),
      componentType: 'TelecentricLens', // Legacy incorrect value
      LensType: 'Telecentric',
      Mount: 'C',
      MaxSensorSize_mm: 11.0,
      ApertureMin_fnum: 4.0,
      ApertureMax_fnum: 16.0,
      Magnification: 0.5,
      WorkingDistance_mm: 100,
      FieldDepth_mm: 5.0,
    }
    const result = componentSchema.safeParse(invalidLens)
    expect(result.success).toBe(false)
  })

  it('rejects legacy "FixedFocalLengthLens" componentType', () => {
    const invalidLens = {
      ...createBaseComponent(),
      componentType: 'FixedFocalLengthLens', // Legacy incorrect value
      LensType: 'FixedFocalLength',
      Mount: 'C',
      MaxSensorSize_mm: 16.0,
      ApertureMin_fnum: 1.4,
      ApertureMax_fnum: 16.0,
      FocalLength_mm: 25,
      WorkingDistanceMin_mm: 200,
    }
    const result = componentSchema.safeParse(invalidLens)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Components Import Schema Tests
// =============================================================================

describe('componentsImportSchema', () => {
  it('validates object with Components array', () => {
    const importData = {
      Components: [
        createValidLaserProfiler({ componentId: 'profiler-1' }),
        createValidAreascanCamera({ componentId: 'camera-1' }),
        createValidTelecentricLens({ componentId: 'lens-1' }),
      ],
    }
    const result = componentsImportSchema.safeParse(importData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.Components).toHaveLength(3)
    }
  })

  it('validates empty Components array', () => {
    const importData = { Components: [] }
    const result = componentsImportSchema.safeParse(importData)
    expect(result.success).toBe(true)
  })

  it('rejects missing Components wrapper', () => {
    const importData = [createValidLaserProfiler()]
    const result = componentsImportSchema.safeParse(importData)
    expect(result.success).toBe(false)
  })

  it('rejects invalid component in array', () => {
    const importData = {
      Components: [
        createValidLaserProfiler(),
        { componentId: 'invalid', componentType: 'Unknown' },
      ],
    }
    const result = componentsImportSchema.safeParse(importData)
    expect(result.success).toBe(false)
  })
})
