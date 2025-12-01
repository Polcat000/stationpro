// src/lib/schemas/index.ts
// Re-exports for all Zod schemas and inferred types

export {
  inspectionZoneSchema,
  partSchema,
  partsImportSchema,
  type InspectionZone,
  type Part,
  type InspectionFace,
} from './part'

export {
  baseComponentSchema,
  laserProfilerSchema,
  areascanCameraSchema,
  linescanCameraSchema,
  lensSchema,
  snapshotSensorSchema,
  componentSchema,
  componentsImportSchema,
  type BaseComponent,
  type LaserLineProfiler,
  type AreascanCamera,
  type LinescanCamera,
  type TelecentricLens,
  type FixedFocalLengthLens,
  type Lens,
  type SnapshotSensor,
  type Component,
} from './component'
