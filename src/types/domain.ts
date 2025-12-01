// src/types/domain.ts
// Domain types matching docs/active/data-schemas.md
// Single source of truth for Part, InspectionZone, and Component types

// =============================================================================
// Part & InspectionZone Types
// =============================================================================

/**
 * Inspection zone face - which side of the part to inspect
 */
export type InspectionFace = 'Top' | 'Bottom' | 'Front' | 'Back' | 'Left' | 'Right'

/**
 * Inspection zone within a part.
 * Uses center-plane offset model:
 * - ZoneOffset_mm: distance from part face to zone center
 * - ZoneDepth_mm: thickness of zone (extends ±ZoneDepth_mm/2 from center)
 */
export interface InspectionZone {
  ZoneID: string
  Name: string
  Face: InspectionFace
  ZoneDepth_mm: number
  ZoneOffset_mm: number
  SmallestLateralFeature_um?: number
  SmallestDepthFeature_um?: number
  RequiredCoverage_pct: number
  MinPixelsPerFeature: number
}

/**
 * Part to be inspected.
 * Dimensions follow X/Y/Z axis convention:
 * - Width: X-axis
 * - Height: Y-axis
 * - Length: Z-axis (scan direction)
 */
export interface Part {
  PartCallout: string
  PartSeries?: string
  PartWidth_mm: number
  PartHeight_mm: number
  PartLength_mm: number
  SmallestLateralFeature_um: number
  SmallestDepthFeature_um?: number
  InspectionZones: InspectionZone[]
}

// =============================================================================
// Component Types
// =============================================================================

/**
 * Base fields shared by all components
 */
export interface BaseComponent {
  componentId: string
  componentType: string
  Manufacturer: string
  Model: string
  PartNumber?: string
}

/**
 * Laser Line Profiler - self-contained 3D scanner
 */
export interface LaserLineProfiler extends BaseComponent {
  componentType: 'LaserLineProfiler'
  NearFieldLateralFOV_mm: number
  MidFieldLateralFOV_mm: number
  FarFieldLateralFOV_mm: number
  StandoffDistance_mm: number
  MeasurementRange_mm: number
  PointsPerProfile: number
  LateralResolution_um: number
  VerticalResolution_um: number
  MaxScanRate_kHz: number
  VerticalRepeatability_um?: number
  VerticalLinearity_um?: number
  LaserClass?: string[]
  LaserWavelength?: string[]
}

/**
 * 2D Linescan Camera - requires lens pairing
 */
export interface LinescanCamera extends BaseComponent {
  componentType: 'LinescanCamera'
  SensorVendor?: string
  SensorName?: string
  SensorType?: string
  ShutterType?: string
  OpticalFormat?: string
  SensorDiagonal_mm?: number
  ResolutionHorizontal_px: number
  ResolutionVertical_px: number
  PixelSizeHorizontal_um: number
  PixelSizeVertical_um: number
  LineRate_kHz: number
  Chroma?: string
  Spectrum?: string
  LensMount: string
  DataInterface?: string
  PixelBitDepth_bits?: number
}

/**
 * 2D Areascan Camera - requires lens pairing
 */
export interface AreascanCamera extends BaseComponent {
  componentType: 'AreascanCamera'
  SensorVendor?: string
  SensorName?: string
  SensorType?: string
  ShutterType?: string
  OpticalFormat?: string
  SensorDiagonal_mm?: number
  SensorWidth_mm?: number
  SensorHeight_mm?: number
  ResolutionHorizontal_px: number
  ResolutionVertical_px: number
  PixelSizeHorizontal_um: number
  PixelSizeVertical_um: number
  FrameRate_fps: number
  Chroma?: string
  Spectrum?: string
  LensMount: string
  DataInterface?: string
  PixelBitDepth_bits?: number
}

/**
 * 2D/3D Snapshot Sensor - self-contained
 */
export interface SnapshotSensor extends BaseComponent {
  componentType: 'SnapshotSensor'
  Resolution3D_px: string
  Resolution2D_px: string
  XYDataInterval_um: number
  FOV_X_mm: number
  FOV_Y_mm: number
  MeasurementRange_mm: number
  WorkingDistance_mm: number
  XYZRepeatability_um?: number
  HeightAccuracy_um?: number
  WidthAccuracy_um?: number
  ShutterSpeedMin_us?: number
  ShutterSpeedMax_ms?: number
  IntegratedLighting?: boolean
  LightSource?: string
  ControllerRequired?: string
}

/**
 * Lens type discriminator
 */
export type LensType = 'Telecentric' | 'FixedFocalLength'

/**
 * Base lens fields shared by all lens types
 */
export interface BaseLens extends BaseComponent {
  componentType: 'TelecentricLens' | 'FixedFocalLengthLens'
  LensType: LensType
  Mount: string
  MaxSensorSize_mm: number
  MaxSensorFormat?: string
  ApertureMin_fnum: number
  ApertureMax_fnum: number
}

/**
 * Telecentric Lens - fixed magnification, constant FOV
 */
export interface TelecentricLens extends BaseLens {
  componentType: 'TelecentricLens'
  LensType: 'Telecentric'
  Magnification: number
  WorkingDistance_mm: number
  WorkingDistanceTolerance_mm?: number
  FieldDepth_mm: number
  Telecentricity_deg?: number
  Distortion_pct?: number
  Resolution_um?: number
}

/**
 * Fixed Focal Length Lens - variable magnification
 */
export interface FixedFocalLengthLens extends BaseLens {
  componentType: 'FixedFocalLengthLens'
  LensType: 'FixedFocalLength'
  FocalLength_mm: number
  WorkingDistanceMin_mm: number
  WorkingDistanceMax_mm?: number
  AngleOfView_deg?: number
  Distortion_pct?: number
}

/**
 * Lens discriminated union
 */
export type Lens = TelecentricLens | FixedFocalLengthLens

/**
 * Component discriminated union - all component types
 * Use componentType field as discriminator
 */
export type Component =
  | LaserLineProfiler
  | LinescanCamera
  | AreascanCamera
  | SnapshotSensor
  | TelecentricLens
  | FixedFocalLengthLens
