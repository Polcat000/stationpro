// src/lib/schemas/component.ts
// Zod schemas for all Component types with discriminated union
// Canonical reference: docs/active/data-schemas.md

import { z } from 'zod'

// =============================================================================
// Base Component Schema
// =============================================================================

/**
 * Base fields shared by all components
 */
export const baseComponentSchema = z.object({
  componentId: z.string().min(1, 'Component ID is required'),
  Manufacturer: z.string().min(1, 'Manufacturer is required'),
  Model: z.string().min(1, 'Model is required'),
  PartNumber: z.string().optional(),
})

export type BaseComponent = z.infer<typeof baseComponentSchema>

// =============================================================================
// Laser Line Profiler Schema
// =============================================================================

/**
 * Laser Line Profiler - self-contained 3D scanner
 */
export const laserProfilerSchema = baseComponentSchema.extend({
  componentType: z.literal('LaserLineProfiler'),
  // Field of View (at reference distances)
  NearFieldLateralFOV_mm: z.number().positive('Near field FOV must be positive'),
  MidFieldLateralFOV_mm: z.number().positive('Mid field FOV must be positive'),
  FarFieldLateralFOV_mm: z.number().positive('Far field FOV must be positive'),
  // Working Distance
  StandoffDistance_mm: z.number().positive('Standoff distance must be positive'),
  MeasurementRange_mm: z.number().positive('Measurement range must be positive'),
  // Resolution
  PointsPerProfile: z.number().int().positive('Points per profile must be positive integer'),
  LateralResolution_um: z.number().positive('Lateral resolution must be positive'),
  VerticalResolution_um: z.number().positive('Vertical resolution must be positive'),
  // Accuracy metrics (optional)
  VerticalRepeatability_um: z.number().positive().optional(),
  VerticalLinearity_um: z.number().positive().optional(),
  // Performance
  MaxScanRate_kHz: z.number().positive('Max scan rate must be positive'),
  // Laser properties (optional)
  LaserClass: z.array(z.string()).optional(),
  LaserWavelength: z.array(z.string()).optional(),
})

export type LaserLineProfiler = z.infer<typeof laserProfilerSchema>

// =============================================================================
// Linescan Camera Schema
// =============================================================================

/**
 * 2D Linescan Camera - requires lens pairing
 */
export const linescanCameraSchema = baseComponentSchema.extend({
  componentType: z.literal('LinescanCamera'),
  // Sensor identification (optional)
  SensorVendor: z.string().optional(),
  SensorName: z.string().optional(),
  SensorType: z.string().optional(),
  ShutterType: z.string().optional(),
  // Sensor dimensions (optional)
  OpticalFormat: z.string().optional(),
  SensorDiagonal_mm: z.number().positive().optional(),
  // Resolution
  ResolutionHorizontal_px: z.number().int().positive('Horizontal resolution must be positive integer'),
  ResolutionVertical_px: z.number().int().positive().default(1),
  // Pixel size
  PixelSizeHorizontal_um: z.number().positive('Horizontal pixel size must be positive'),
  PixelSizeVertical_um: z.number().positive('Vertical pixel size must be positive'),
  // Performance
  LineRate_kHz: z.number().positive('Line rate must be positive'),
  // Color/spectrum (optional)
  Chroma: z.string().optional(),
  Spectrum: z.string().optional(),
  // Interface
  LensMount: z.string().min(1, 'Lens mount is required'),
  DataInterface: z.string().optional(),
  PixelBitDepth_bits: z.number().int().positive().optional(),
})

export type LinescanCamera = z.infer<typeof linescanCameraSchema>

// =============================================================================
// Areascan Camera Schema
// =============================================================================

/**
 * 2D Areascan Camera - requires lens pairing
 */
export const areascanCameraSchema = baseComponentSchema.extend({
  componentType: z.literal('AreascanCamera'),
  // Sensor identification (optional)
  SensorVendor: z.string().optional(),
  SensorName: z.string().optional(),
  SensorType: z.string().optional(),
  ShutterType: z.string().optional(),
  // Sensor dimensions (optional)
  OpticalFormat: z.string().optional(),
  SensorDiagonal_mm: z.number().positive().optional(),
  SensorWidth_mm: z.number().positive().optional(),
  SensorHeight_mm: z.number().positive().optional(),
  // Resolution
  ResolutionHorizontal_px: z.number().int().positive('Horizontal resolution must be positive integer'),
  ResolutionVertical_px: z.number().int().positive('Vertical resolution must be positive integer'),
  // Pixel size
  PixelSizeHorizontal_um: z.number().positive('Horizontal pixel size must be positive'),
  PixelSizeVertical_um: z.number().positive('Vertical pixel size must be positive'),
  // Performance
  FrameRate_fps: z.number().positive('Frame rate must be positive'),
  // Color/spectrum (optional)
  Chroma: z.string().optional(),
  Spectrum: z.string().optional(),
  // Interface
  LensMount: z.string().min(1, 'Lens mount is required'),
  DataInterface: z.string().optional(),
  PixelBitDepth_bits: z.number().int().positive().optional(),
})

export type AreascanCamera = z.infer<typeof areascanCameraSchema>

// =============================================================================
// Lens Schema (Discriminated Union)
// =============================================================================

/**
 * Lens type enum
 */
export const lensTypeSchema = z.enum(['Telecentric', 'FixedFocalLength'])

export type LensType = z.infer<typeof lensTypeSchema>

/**
 * Base lens fields shared by all lens types
 */
const baseLensFields = {
  componentType: z.literal('Lens'),
  Mount: z.string().min(1, 'Mount is required'),
  MaxSensorSize_mm: z.number().positive('Max sensor size must be positive'),
  MaxSensorFormat: z.string().optional(),
  ApertureMin_fnum: z.number().positive('Minimum aperture must be positive'),
  ApertureMax_fnum: z.number().positive('Maximum aperture must be positive'),
}

/**
 * Telecentric Lens - fixed magnification, constant FOV
 */
export const telecentricLensSchema = baseComponentSchema.extend({
  ...baseLensFields,
  LensType: z.literal('Telecentric'),
  Magnification: z.number().positive('Magnification must be positive'),
  WorkingDistance_mm: z.number().positive('Working distance must be positive'),
  WorkingDistanceTolerance_mm: z.number().positive().optional(),
  FieldDepth_mm: z.number().positive('Field depth must be positive'),
  Telecentricity_deg: z.number().optional(),
  Distortion_pct: z.number().optional(),
  Resolution_um: z.number().positive().optional(),
})

export type TelecentricLens = z.infer<typeof telecentricLensSchema>

/**
 * Fixed Focal Length Lens - variable magnification
 */
export const fixedFocalLengthLensSchema = baseComponentSchema.extend({
  ...baseLensFields,
  LensType: z.literal('FixedFocalLength'),
  FocalLength_mm: z.number().positive('Focal length must be positive'),
  WorkingDistanceMin_mm: z.number().positive('Minimum working distance must be positive'),
  WorkingDistanceMax_mm: z.number().positive().optional(),
  AngleOfView_deg: z.number().optional(),
  Distortion_pct: z.number().optional(),
})

export type FixedFocalLengthLens = z.infer<typeof fixedFocalLengthLensSchema>

/**
 * Combined Lens schema - discriminated union on LensType
 */
export const lensSchema = z.discriminatedUnion('LensType', [
  telecentricLensSchema,
  fixedFocalLengthLensSchema,
])

export type Lens = z.infer<typeof lensSchema>

// =============================================================================
// Snapshot Sensor Schema
// =============================================================================

/**
 * 2D/3D Snapshot Sensor - self-contained
 */
export const snapshotSensorSchema = baseComponentSchema.extend({
  componentType: z.literal('SnapshotSensor'),
  // Resolution
  Resolution3D_px: z.string().optional(),
  Resolution2D_px: z.string().optional(),
  // Lateral resolution
  XYDataInterval_um: z.number().positive('XY data interval must be positive'),
  // Field of view (fixed 2D area)
  FOV_X_mm: z.number().positive('FOV X must be positive'),
  FOV_Y_mm: z.number().positive('FOV Y must be positive'),
  // Z measurement
  MeasurementRange_mm: z.number().positive('Measurement range must be positive'),
  WorkingDistance_mm: z.number().positive('Working distance must be positive'),
  // Accuracy (optional)
  XYZRepeatability_um: z.number().positive().optional(),
  HeightAccuracy_um: z.number().positive().optional(),
  WidthAccuracy_um: z.number().positive().optional(),
  // Acquisition (optional)
  ShutterSpeedMin_us: z.number().positive().optional(),
  ShutterSpeedMax_ms: z.number().positive().optional(),
  // Integrated features (optional)
  IntegratedLighting: z.boolean().optional(),
  LightSource: z.string().optional(),
  ControllerRequired: z.string().optional(),
})

export type SnapshotSensor = z.infer<typeof snapshotSensorSchema>

// =============================================================================
// Component Discriminated Union
// =============================================================================

/**
 * Component schema - all 5 component types
 * Uses z.union() because Lens types share componentType='Lens' and discriminate on LensType
 * The lensSchema handles the nested discrimination internally
 */
export const componentSchema = z.union([
  laserProfilerSchema,
  linescanCameraSchema,
  areascanCameraSchema,
  lensSchema, // Handles both TelecentricLens and FixedFocalLengthLens via LensType discriminator
  snapshotSensorSchema,
])

export type Component = z.infer<typeof componentSchema>

// =============================================================================
// Import Schema
// =============================================================================

/**
 * Components import schema - for bulk JSON import
 * Components are wrapped in { Components: [...] }
 */
export const componentsImportSchema = z.object({
  Components: z.array(componentSchema),
})

export type ComponentsImport = z.infer<typeof componentsImportSchema>
