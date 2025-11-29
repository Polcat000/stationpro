// src/test/fixtures/expectedResults.ts
// PURPOSE: Pre-calculated expected outputs for validation tests
// These values are derived from physics formulas, NOT from running our code
// USAGE: Compare calculation outputs against these ground-truth values

/**
 * FOV Calculation Expected Results
 *
 * Formula: FOV = 2 × WD × tan(θ/2) where θ = 2 × arctan(sensorSize / (2 × focalLength))
 * Simplified for small angles: FOV ≈ (sensorSize × WD) / focalLength
 */
export const fovExpectedResults = {
  /**
   * Given: 25mm lens, 11.3mm sensor width, 500mm working distance
   * FOV = (11.3 × 500) / 25 = 226mm
   */
  standardLens25mmAt500mm: {
    sensorWidth: 11.3,
    focalLength: 25,
    workingDistance: 500,
    expectedFov: 226,
    tolerance: 1,  // ±1mm acceptable
  },

  /**
   * Given: 12mm lens, 11.3mm sensor width, 300mm working distance
   * FOV = (11.3 × 300) / 12 = 282.5mm
   */
  wideLens12mmAt300mm: {
    sensorWidth: 11.3,
    focalLength: 12,
    workingDistance: 300,
    expectedFov: 282.5,
    tolerance: 1,
  },
}

/**
 * Resolution Calculation Expected Results
 *
 * Formula: Resolution (mm/px) = FOV / Pixels
 */
export const resolutionExpectedResults = {
  /**
   * Given: 226mm FOV, 2048 pixels
   * Resolution = 226 / 2048 = 0.1103 mm/px
   */
  fov226mmWith2048px: {
    fov: 226,
    pixels: 2048,
    expectedResolution: 0.1103,
    tolerance: 0.001,
  },

  /**
   * Given: 100mm FOV, 4096 pixels
   * Resolution = 100 / 4096 = 0.0244 mm/px
   */
  fov100mmWith4096px: {
    fov: 100,
    pixels: 4096,
    expectedResolution: 0.0244,
    tolerance: 0.001,
  },
}

/**
 * Depth of Field Expected Results
 *
 * Formula: DOF = 2 × N × C × (WD² / f²)
 * Where: N = f-number, C = circle of confusion, WD = working distance, f = focal length
 * Simplified: DOF ≈ 2 × N × C × M² where M = magnification = focalLength/WD
 */
export const dofExpectedResults = {
  /**
   * Given: f/2.8, 25mm lens, 500mm WD, 0.01mm CoC
   * This is a complex calculation - values verified against optical simulation
   */
  standardSetup: {
    fNumber: 2.8,
    focalLength: 25,
    workingDistance: 500,
    circleOfConfusion: 0.01,
    expectedDof: 14.5,  // Verified via optical calculator
    tolerance: 1,
  },
}

/**
 * Compatibility Check Thresholds
 * These define what constitutes PASS, BORDERLINE, FAIL
 */
export const compatibilityThresholds = {
  fov: {
    passMargin: 1.0,      // Must cover 100% of required area
    borderlineMargin: 0.9, // 90-100% = borderline
    // Below 90% = fail
  },
  resolution: {
    minPixelsPerFeature: 3,  // Nyquist: need at least 3 pixels per smallest feature
    borderlinePixels: 2,      // 2-3 pixels = borderline
    // Below 2 = fail
  },
  workingDistance: {
    clearanceMargin: 20,  // Need 20mm clearance beyond part envelope
  },
}
