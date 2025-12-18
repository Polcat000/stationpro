// src/lib/schemas/index.ts
// Re-exports for all Zod schemas and inferred types

export {
  inspectionZoneSchema,
  partSchema,
  partsImportSchema,
  partFormSchema,
  inspectionZoneFormSchema,
  type InspectionZone,
  type InspectionZoneFormInput,
  type Part,
  type PartFormInput,
  type InspectionFace,
} from './part'

// Import-specific schemas (handle null → undefined conversion at boundaries)
export {
  inspectionZoneImportSchema,
  partImportSchema,
  partsImportBulkSchema,
  preprocessImportData,
} from './part-import'

// Schema utilities
export { convertNullsToUndefined, nullToUndefined } from './helpers'

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
