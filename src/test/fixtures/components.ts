// src/test/fixtures/components.ts
// PURPOSE: Pre-defined test components with known specs
// USAGE: import { fixtures } from '@/test/fixtures'

import {
  createTestProfiler,
  createTestLinescanCamera,
  createTestAreascanCamera,
  createTestSnapshot3D,
  createTestLens,
  createTestTelecentricLens,
  type TestComponent,
} from '../helpers'

/**
 * Mid-range laser line profiler
 * Based on: LMI Gocator 2330 specifications
 */
export const midRangeProfiler = createTestProfiler({
  id: 'fixture-profiler-mid',
  manufacturer: 'LMI',
  model: 'Gocator 2330',
  fovRange: { min: 32, max: 88 },
  zRange: { min: 25, max: 65 },
  resolution: 0.012,
  standoff: { min: 95, max: 155 },
  lineRate: 5000,
})

/**
 * Wide FOV laser line profiler
 * Based on: LMI Gocator 2380 specifications
 */
export const wideFovProfiler = createTestProfiler({
  id: 'fixture-profiler-wide',
  manufacturer: 'LMI',
  model: 'Gocator 2380',
  fovRange: { min: 145, max: 520 },
  zRange: { min: 200, max: 640 },
  resolution: 0.068,
  standoff: { min: 315, max: 955 },
  lineRate: 3000,
})

/**
 * High-resolution linescan camera
 * Based on: Basler raL8192-16gm specifications
 */
export const highResLinescan = createTestLinescanCamera({
  id: 'fixture-linescan-highres',
  manufacturer: 'Basler',
  model: 'raL8192-16gm',
  resolution: 8192,
  sensorWidth: 57.3,
  lineRate: 16000,
  pixelSize: 7.0,
})

/**
 * Standard linescan camera
 * Based on: Basler raL4096-24gm specifications
 */
export const standardLinescan = createTestLinescanCamera({
  id: 'fixture-linescan-standard',
  manufacturer: 'Basler',
  model: 'raL4096-24gm',
  resolution: 4096,
  sensorWidth: 28.7,
  lineRate: 24000,
  pixelSize: 7.0,
})

/**
 * High-resolution areascan camera
 * Based on: Basler ace2 a2A5320-23gmPRO specifications
 */
export const highResAreascan = createTestAreascanCamera({
  id: 'fixture-areascan-highres',
  manufacturer: 'Basler',
  model: 'a2A5320-23gmPRO',
  resolutionH: 5320,
  resolutionV: 4600,
  sensorWidth: 12.4,
  sensorHeight: 10.7,
  frameRate: 23,
  pixelSize: 2.33,
})

/**
 * Standard areascan camera
 * Based on: Basler ace2 a2A2048-35gmPRO specifications
 */
export const standardAreascan = createTestAreascanCamera({
  id: 'fixture-areascan-standard',
  manufacturer: 'Basler',
  model: 'a2A2048-35gmPRO',
  resolutionH: 2048,
  resolutionV: 1536,
  sensorWidth: 11.3,
  sensorHeight: 7.1,
  frameRate: 35,
  pixelSize: 5.5,
})

/**
 * Snapshot 3D sensor
 * Based on: Photoneo PhoXi 3D Scanner M specifications
 */
export const snapshot3DScanner = createTestSnapshot3D({
  id: 'fixture-snapshot3d',
  manufacturer: 'Photoneo',
  model: 'PhoXi M',
  fov: { width: 382, height: 286 },
  zRange: { min: 458, max: 903 },
  resolution: { x: 0.049, y: 0.049, z: 0.02 },
  acquisitionTime: 250,
})

/**
 * Standard 25mm lens
 * Based on: Fujinon HF25XA-5M specifications
 */
export const lens25mm = createTestLens({
  id: 'fixture-lens-25mm',
  manufacturer: 'Fujinon',
  model: 'HF25XA-5M',
  focalLength: 25,
  lensType: 'fixed',
  maxSensorFormat: 8.5,  // 2/3"
  fNumber: 1.6,
  workingDistance: { min: 200, max: 2000 },
})

/**
 * Wide 12mm lens
 * Based on: Fujinon HF12XA-5M specifications
 */
export const lens12mm = createTestLens({
  id: 'fixture-lens-12mm',
  manufacturer: 'Fujinon',
  model: 'HF12XA-5M',
  focalLength: 12,
  lensType: 'fixed',
  maxSensorFormat: 8.5,
  fNumber: 1.6,
  workingDistance: { min: 100, max: 1000 },
})

/**
 * Telecentric lens
 * Based on: Opto Engineering TC23036 specifications
 */
export const telecentricLens = createTestTelecentricLens({
  id: 'fixture-telecentric',
  manufacturer: 'Opto Engineering',
  model: 'TC23036',
  focalLength: 36,
  maxSensorFormat: 11,  // 2/3"
  fNumber: 8.0,
  workingDistance: { min: 65, max: 65 },  // Fixed for telecentric
})

/**
 * All fixture components for batch testing
 */
export const allFixtureComponents: TestComponent[] = [
  midRangeProfiler,
  wideFovProfiler,
  highResLinescan,
  standardLinescan,
  highResAreascan,
  standardAreascan,
  snapshot3DScanner,
  lens25mm,
  lens12mm,
  telecentricLens,
]
