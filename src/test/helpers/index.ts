// src/test/helpers/index.ts
// PURPOSE: Re-export all test helper functions
// USAGE: import { createTestPart, createTestProfiler } from '@/test/helpers'

export {
  createTestPart,
  createTestInspectionZone,
  resetPartIdCounter,
  type TestPart,
  type TestInspectionZone,
  type InspectionFace,
} from './createTestPart'

export {
  createTestProfiler,
  createTestLinescanCamera,
  createTestAreascanCamera,
  createTestSnapshot3D,
  createTestLens,
  createTestTelecentricLens,
  resetComponentIdCounter,
  type TestComponent,
  type TestComponentBase,
  type TestLaserLineProfiler,
  type TestLinescanCamera,
  type TestAreascanCamera,
  type TestSnapshot3DSensor,
  type TestLens,
  type ComponentType,
} from './createTestComponent'
