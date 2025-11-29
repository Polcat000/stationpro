// src/test/fixtures/parts.ts
// PURPOSE: Pre-defined test parts with known characteristics
// SOURCE: architecture.md "Reference Fixtures" section
// USAGE: import { fixtures } from '@/test/fixtures'

import {
  createTestPart,
  createTestInspectionZone,
  type TestPart,
} from '../helpers'

/**
 * Small electronics connector - tests precision inspection
 * Based on: USB-C connector, typical SMT component
 * Key challenge: Small features (50 microns) require high resolution
 */
export const smallElectronicsPart: TestPart = createTestPart({
  id: 'fixture-small-electronics',
  callout: 'USB-C-001',
  series: 'Connectors',
  dimensions: { width: 15, height: 8, length: 25 },
  smallestFeature: 0.05,  // 50 micron features
  inspectionZones: [
    createTestInspectionZone({
      id: 'zone-top-pins',
      face: 'Top',
      depth: 2.5,
      featureSize: 0.05,
      coverageRequired: { width: 12, height: 20 },
    }),
  ],
})

/**
 * Large automotive part - tests FOV coverage at scale
 * Based on: Engine block inspection, typical FOV challenge
 * Key challenge: Large coverage area requires wide FOV or stitching
 */
export const largeAutomotivePart: TestPart = createTestPart({
  id: 'fixture-large-automotive',
  callout: 'BLOCK-V8',
  series: 'Engine Blocks',
  dimensions: { width: 600, height: 400, length: 800 },
  smallestFeature: 0.5,  // 500 micron features
  inspectionZones: [
    createTestInspectionZone({
      id: 'zone-deck-surface',
      face: 'Top',
      depth: 15,
      featureSize: 0.5,
      coverageRequired: { width: 550, height: 350 },
    }),
    createTestInspectionZone({
      id: 'zone-bore',
      face: 'Front',
      depth: 150,
      featureSize: 0.1,
      coverageRequired: { width: 100, height: 150 },
    }),
  ],
})

/**
 * Medium complexity medical device - tests balanced requirements
 * Based on: Syringe barrel inspection
 * Key challenge: Multiple zones with varying requirements
 */
export const medicalDevicePart: TestPart = createTestPart({
  id: 'fixture-medical-device',
  callout: 'SYRINGE-10ML',
  series: 'Syringes',
  dimensions: { width: 20, height: 20, length: 100 },
  smallestFeature: 0.02,  // 20 micron features (graduation marks)
  inspectionZones: [
    createTestInspectionZone({
      id: 'zone-barrel-surface',
      face: 'Front',
      depth: 0.5,
      featureSize: 0.02,
      coverageRequired: { width: 18, height: 80 },
    }),
    createTestInspectionZone({
      id: 'zone-tip',
      face: 'Left',
      depth: 3,
      featureSize: 0.05,
      coverageRequired: { width: 15, height: 15 },
    }),
  ],
})

/**
 * Part with all 6 faces having zones - tests comprehensive coverage
 */
export const sixFacePart: TestPart = createTestPart({
  id: 'fixture-six-face',
  callout: 'CUBE-001',
  series: 'Test Cubes',
  dimensions: { width: 50, height: 50, length: 50 },
  smallestFeature: 0.1,
  inspectionZones: [
    createTestInspectionZone({ id: 'zone-top', face: 'Top' }),
    createTestInspectionZone({ id: 'zone-bottom', face: 'Bottom' }),
    createTestInspectionZone({ id: 'zone-front', face: 'Front' }),
    createTestInspectionZone({ id: 'zone-back', face: 'Back' }),
    createTestInspectionZone({ id: 'zone-left', face: 'Left' }),
    createTestInspectionZone({ id: 'zone-right', face: 'Right' }),
  ],
})

/**
 * Edge case: Part with no inspection zones
 * Should be handled gracefully
 */
export const partWithNoZones: TestPart = createTestPart({
  id: 'fixture-no-zones',
  callout: 'BLANK-001',
  series: 'Test Parts',
  inspectionZones: [],
})

/**
 * Edge case: Part with extreme dimensions (very flat)
 */
export const flatPart: TestPart = createTestPart({
  id: 'fixture-flat',
  callout: 'WAFER-001',
  series: 'Wafers',
  dimensions: { width: 300, height: 0.5, length: 300 },
  smallestFeature: 0.001,  // 1 micron features
})

/**
 * Collection of all fixture parts for batch testing
 */
export const allFixtureParts: TestPart[] = [
  smallElectronicsPart,
  largeAutomotivePart,
  medicalDevicePart,
  sixFacePart,
  partWithNoZones,
  flatPart,
]
