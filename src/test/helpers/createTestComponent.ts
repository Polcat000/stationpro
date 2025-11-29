// src/test/helpers/createTestComponent.ts
// PURPOSE: Factory functions for creating test Component objects
// USAGE: const profiler = createTestProfiler({ manufacturer: 'Keyence' })

/**
 * Component types supported by StationPro
 * These map to the 5 sensor/lens categories in the PRD
 */
export type ComponentType =
  | 'LaserLineProfiler'
  | 'LinescanCamera'
  | 'AreascanCamera'
  | 'Snapshot3DSensor'
  | 'Lens'

/**
 * Base component interface - all components share these fields
 */
export interface TestComponentBase {
  id: string
  type: ComponentType
  manufacturer: string
  model: string
}

/**
 * Laser Line Profiler - 3D scanning sensor
 */
export interface TestLaserLineProfiler extends TestComponentBase {
  type: 'LaserLineProfiler'
  fovRange: { min: number; max: number }  // mm
  zRange: { min: number; max: number }    // mm
  resolution: number                       // mm (Z-axis resolution)
  standoff: { min: number; max: number }  // mm (working distance)
  lineRate: number                         // Hz
}

/**
 * 2D Linescan Camera
 */
export interface TestLinescanCamera extends TestComponentBase {
  type: 'LinescanCamera'
  resolution: number        // pixels (horizontal)
  sensorWidth: number       // mm
  lineRate: number          // Hz
  pixelSize: number         // µm
}

/**
 * 2D Areascan Camera
 */
export interface TestAreascanCamera extends TestComponentBase {
  type: 'AreascanCamera'
  resolutionH: number       // pixels (horizontal)
  resolutionV: number       // pixels (vertical)
  sensorWidth: number       // mm
  sensorHeight: number      // mm
  frameRate: number         // fps
  pixelSize: number         // µm
}

/**
 * Snapshot 3D Sensor (structured light, etc.)
 */
export interface TestSnapshot3DSensor extends TestComponentBase {
  type: 'Snapshot3DSensor'
  fov: { width: number; height: number }  // mm
  zRange: { min: number; max: number }    // mm
  resolution: { x: number; y: number; z: number }  // mm
  acquisitionTime: number                  // ms
}

/**
 * Lens (telecentric or fixed focal length)
 */
export interface TestLens extends TestComponentBase {
  type: 'Lens'
  focalLength: number       // mm
  lensType: 'telecentric' | 'fixed'
  maxSensorFormat: number   // mm (diagonal)
  fNumber: number           // f-stop
  workingDistance: { min: number; max: number }  // mm
}

/**
 * Union type for all component types
 */
export type TestComponent =
  | TestLaserLineProfiler
  | TestLinescanCamera
  | TestAreascanCamera
  | TestSnapshot3DSensor
  | TestLens

/**
 * Counter for generating unique IDs
 */
let componentIdCounter = 0

/**
 * Creates a test Laser Line Profiler with sensible defaults
 * Based on typical mid-range profiler specs (similar to LMI Gocator 2300 series)
 *
 * @example
 * const profiler = createTestProfiler({ manufacturer: 'LMI', model: 'Gocator 2330' })
 */
export function createTestProfiler(
  overrides?: Partial<Omit<TestLaserLineProfiler, 'type'>>
): TestLaserLineProfiler {
  componentIdCounter++

  return {
    id: `test-profiler-${componentIdCounter}`,
    type: 'LaserLineProfiler',
    manufacturer: 'Test Manufacturer',
    model: `TEST-LLP-${componentIdCounter}`,
    fovRange: { min: 25, max: 100 },      // 25-100mm FOV range
    zRange: { min: 15, max: 50 },         // 15-50mm Z measurement range
    resolution: 0.01,                      // 10 micron Z resolution
    standoff: { min: 75, max: 150 },      // 75-150mm working distance
    lineRate: 5000,                        // 5kHz
    ...overrides,
  }
}

/**
 * Creates a test Linescan Camera with sensible defaults
 * Based on typical industrial linescan (similar to Basler raL series)
 */
export function createTestLinescanCamera(
  overrides?: Partial<Omit<TestLinescanCamera, 'type'>>
): TestLinescanCamera {
  componentIdCounter++

  return {
    id: `test-linescan-${componentIdCounter}`,
    type: 'LinescanCamera',
    manufacturer: 'Test Manufacturer',
    model: `TEST-LS-${componentIdCounter}`,
    resolution: 4096,           // 4K pixels
    sensorWidth: 28.7,          // mm
    lineRate: 80000,            // 80kHz
    pixelSize: 7.0,             // 7µm pixels
    ...overrides,
  }
}

/**
 * Creates a test Areascan Camera with sensible defaults
 * Based on typical industrial areascan (similar to Basler ace2)
 */
export function createTestAreascanCamera(
  overrides?: Partial<Omit<TestAreascanCamera, 'type'>>
): TestAreascanCamera {
  componentIdCounter++

  return {
    id: `test-areascan-${componentIdCounter}`,
    type: 'AreascanCamera',
    manufacturer: 'Test Manufacturer',
    model: `TEST-AS-${componentIdCounter}`,
    resolutionH: 2048,          // 2MP horizontal
    resolutionV: 1536,          // 2MP vertical
    sensorWidth: 11.3,          // mm
    sensorHeight: 7.1,          // mm
    frameRate: 60,              // 60fps
    pixelSize: 5.5,             // 5.5µm pixels
    ...overrides,
  }
}

/**
 * Creates a test Snapshot 3D Sensor with sensible defaults
 * Based on typical structured light sensor (similar to Photoneo)
 */
export function createTestSnapshot3D(
  overrides?: Partial<Omit<TestSnapshot3DSensor, 'type'>>
): TestSnapshot3DSensor {
  componentIdCounter++

  return {
    id: `test-snapshot3d-${componentIdCounter}`,
    type: 'Snapshot3DSensor',
    manufacturer: 'Test Manufacturer',
    model: `TEST-S3D-${componentIdCounter}`,
    fov: { width: 200, height: 150 },     // 200x150mm FOV
    zRange: { min: 300, max: 600 },       // 300-600mm depth range
    resolution: { x: 0.1, y: 0.1, z: 0.05 }, // 100µm XY, 50µm Z
    acquisitionTime: 500,                  // 500ms per capture
    ...overrides,
  }
}

/**
 * Creates a test Lens with sensible defaults
 * Based on typical industrial fixed focal length lens
 */
export function createTestLens(
  overrides?: Partial<Omit<TestLens, 'type'>>
): TestLens {
  componentIdCounter++

  return {
    id: `test-lens-${componentIdCounter}`,
    type: 'Lens',
    manufacturer: 'Test Manufacturer',
    model: `TEST-LENS-${componentIdCounter}`,
    focalLength: 25,            // 25mm focal length
    lensType: 'fixed',
    maxSensorFormat: 16,        // 16mm (1" format)
    fNumber: 2.8,               // f/2.8
    workingDistance: { min: 150, max: 500 },  // 150-500mm
    ...overrides,
  }
}

/**
 * Creates a test Telecentric Lens with sensible defaults
 */
export function createTestTelecentricLens(
  overrides?: Partial<Omit<TestLens, 'type' | 'lensType'>>
): TestLens {
  componentIdCounter++

  return {
    id: `test-telecentric-${componentIdCounter}`,
    type: 'Lens',
    manufacturer: 'Test Manufacturer',
    model: `TEST-TC-${componentIdCounter}`,
    focalLength: 50,            // 50mm effective focal length
    lensType: 'telecentric',
    maxSensorFormat: 11,        // 2/3" format
    fNumber: 8.0,               // f/8 (typical for telecentric)
    workingDistance: { min: 65, max: 65 },  // Fixed WD for telecentric
    ...overrides,
  }
}

/**
 * Resets the component ID counter
 * Call this in beforeEach() if you need deterministic IDs
 */
export function resetComponentIdCounter(): void {
  componentIdCounter = 0
}
