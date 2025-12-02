// src/lib/componentFieldLabels.ts
// Maps component schema field names to human-readable column labels
// Reference: docs/active/component-spec-mapping-reference.md

/**
 * Human-readable labels for component fields.
 * Used in table column headers and column configuration dropdowns.
 *
 * Conventions:
 * - Include units in parentheses: (mm), (µm), (kHz), (fps), (px)
 * - Use µm symbol (not "um") for micrometers
 * - Keep labels concise but clear
 * - Common abbreviations: Res. (Resolution), FOV (Field of View), WD (Working Distance)
 */
export const componentFieldLabels: Record<string, string> = {
  // =============================================================================
  // Base Component Fields (shared by all types)
  // =============================================================================
  PartNumber: 'Part Number',

  // =============================================================================
  // Laser Line Profiler Fields
  // =============================================================================
  NearFieldLateralFOV_mm: 'Near FOV (mm)',
  MidFieldLateralFOV_mm: 'Mid FOV (mm)',
  FarFieldLateralFOV_mm: 'Far FOV (mm)',
  StandoffDistance_mm: 'Standoff (mm)',
  MeasurementRange_mm: 'Z Range (mm)',
  PointsPerProfile: 'Points/Profile',
  LateralResolution_um: 'Lateral Res. (µm)',
  VerticalResolution_um: 'Vertical Res. (µm)',
  VerticalRepeatability_um: 'Z Repeatability (µm)',
  VerticalLinearity_um: 'Z Linearity (µm)',
  MaxScanRate_kHz: 'Max Scan Rate (kHz)',
  LaserClass: 'Laser Class',
  LaserWavelength: 'Laser Wavelength',

  // =============================================================================
  // Camera Shared Fields (Linescan & Areascan)
  // =============================================================================
  SensorVendor: 'Sensor Vendor',
  SensorName: 'Sensor Name',
  SensorType: 'Sensor Type',
  ShutterType: 'Shutter Type',
  OpticalFormat: 'Optical Format',
  SensorDiagonal_mm: 'Sensor Diagonal (mm)',
  SensorWidth_mm: 'Sensor Width (mm)',
  SensorHeight_mm: 'Sensor Height (mm)',
  ResolutionHorizontal_px: 'Res. H (px)',
  ResolutionVertical_px: 'Res. V (px)',
  PixelSizeHorizontal_um: 'Pixel H (µm)',
  PixelSizeVertical_um: 'Pixel V (µm)',
  Chroma: 'Chroma',
  Spectrum: 'Spectrum',
  LensMount: 'Lens Mount',
  DataInterface: 'Data Interface',
  PixelBitDepth_bits: 'Bit Depth',

  // Linescan-specific
  LineRate_kHz: 'Line Rate (kHz)',

  // Areascan-specific
  FrameRate_fps: 'Frame Rate (fps)',

  // =============================================================================
  // Lens Fields (Base - all lenses)
  // =============================================================================
  LensType: 'Lens Type',
  Mount: 'Mount',
  MaxSensorSize_mm: 'Max Sensor (mm)',
  MaxSensorFormat: 'Max Sensor Format',
  ApertureMin_fnum: 'Aperture Min (f/#)',
  ApertureMax_fnum: 'Aperture Max (f/#)',

  // Telecentric Lens Fields
  Magnification: 'Magnification',
  WorkingDistance_mm: 'Working Dist. (mm)',
  WorkingDistanceTolerance_mm: 'WD Tolerance (mm)',
  FieldDepth_mm: 'Field Depth (mm)',
  Telecentricity_deg: 'Telecentricity (°)',
  Distortion_pct: 'Distortion (%)',
  Resolution_um: 'Optical Res. (µm)',

  // Fixed Focal Length Lens Fields
  FocalLength_mm: 'Focal Length (mm)',
  WorkingDistanceMin_mm: 'WD Min (mm)',
  WorkingDistanceMax_mm: 'WD Max (mm)',
  AngleOfView_deg: 'Angle of View (°)',

  // =============================================================================
  // Snapshot Sensor Fields
  // =============================================================================
  Resolution3D_px: '3D Resolution (px)',
  Resolution2D_px: '2D Resolution (px)',
  XYDataInterval_um: 'XY Interval (µm)',
  FOV_X_mm: 'FOV X (mm)',
  FOV_Y_mm: 'FOV Y (mm)',
  // MeasurementRange_mm - already defined above (shared with LaserLineProfiler)
  // WorkingDistance_mm - already defined above (shared with Telecentric lens)
  XYZRepeatability_um: 'XYZ Repeat. (µm)',
  HeightAccuracy_um: 'Height Acc. (µm)',
  WidthAccuracy_um: 'Width Acc. (µm)',
  ShutterSpeedMin_us: 'Shutter Min (µs)',
  ShutterSpeedMax_ms: 'Shutter Max (ms)',
  IntegratedLighting: 'Integrated Light',
  LightSource: 'Light Source',
  ControllerRequired: 'Controller',
}

/**
 * Grouped field definitions for the column configuration dropdown.
 * Groups fields by component type for easier navigation.
 */
export const componentFieldGroups = {
  shared: {
    label: 'Shared',
    fields: ['PartNumber'],
  },
  laserProfiler: {
    label: 'Laser Profiler',
    fields: [
      'NearFieldLateralFOV_mm',
      'MidFieldLateralFOV_mm',
      'FarFieldLateralFOV_mm',
      'StandoffDistance_mm',
      'MeasurementRange_mm',
      'PointsPerProfile',
      'LateralResolution_um',
      'VerticalResolution_um',
      'VerticalRepeatability_um',
      'VerticalLinearity_um',
      'MaxScanRate_kHz',
      'LaserClass',
      'LaserWavelength',
    ],
  },
  areascanCamera: {
    label: 'Areascan Camera',
    fields: [
      'SensorVendor',
      'SensorName',
      'SensorType',
      'ShutterType',
      'OpticalFormat',
      'SensorDiagonal_mm',
      'SensorWidth_mm',
      'SensorHeight_mm',
      'ResolutionHorizontal_px',
      'ResolutionVertical_px',
      'PixelSizeHorizontal_um',
      'PixelSizeVertical_um',
      'FrameRate_fps',
      'Chroma',
      'Spectrum',
      'LensMount',
      'DataInterface',
      'PixelBitDepth_bits',
    ],
  },
  linescanCamera: {
    label: 'Linescan Camera',
    fields: [
      'SensorVendor',
      'SensorName',
      'SensorType',
      'ShutterType',
      'OpticalFormat',
      'SensorDiagonal_mm',
      'ResolutionHorizontal_px',
      'ResolutionVertical_px',
      'PixelSizeHorizontal_um',
      'PixelSizeVertical_um',
      'LineRate_kHz',
      'Chroma',
      'Spectrum',
      'LensMount',
      'DataInterface',
      'PixelBitDepth_bits',
    ],
  },
  lens: {
    label: 'Lens',
    fields: [
      'LensType',
      'Mount',
      'MaxSensorSize_mm',
      'MaxSensorFormat',
      'ApertureMin_fnum',
      'ApertureMax_fnum',
      // Telecentric
      'Magnification',
      'WorkingDistance_mm',
      'WorkingDistanceTolerance_mm',
      'FieldDepth_mm',
      'Telecentricity_deg',
      'Distortion_pct',
      'Resolution_um',
      // Fixed Focal Length
      'FocalLength_mm',
      'WorkingDistanceMin_mm',
      'WorkingDistanceMax_mm',
      'AngleOfView_deg',
    ],
  },
  snapshotSensor: {
    label: 'Snapshot Sensor',
    fields: [
      'Resolution3D_px',
      'Resolution2D_px',
      'XYDataInterval_um',
      'FOV_X_mm',
      'FOV_Y_mm',
      'MeasurementRange_mm',
      'WorkingDistance_mm',
      'XYZRepeatability_um',
      'HeightAccuracy_um',
      'WidthAccuracy_um',
      'ShutterSpeedMin_us',
      'ShutterSpeedMax_ms',
      'IntegratedLighting',
      'LightSource',
      'ControllerRequired',
    ],
  },
} as const

/**
 * All spec field IDs (for column definitions).
 * This is the canonical list of all spec columns that can be added to the table.
 * Derived from componentFieldLabels keys.
 */
export const allSpecFieldIds = Object.keys(componentFieldLabels)
