// src/lib/analysis/__tests__/bias.test.ts
// Unit tests for bias detection functions
// Coverage target: 95%+ per architecture mandate

import { describe, it, expect } from 'vitest'
import {
  detectSeriesDominance,
  detectTooFewParts,
  detectOutlierSkew,
  detectBias,
} from '../bias'
import type { Part } from '@/types/domain'

// =============================================================================
// Test Helpers
// =============================================================================

function createTestPart(overrides: Partial<Part> = {}): Part {
  return {
    PartCallout: 'TEST-001',
    PartSeries: 'TestSeries',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 10,
    InspectionZones: [],
    ...overrides,
  }
}

// =============================================================================
// detectSeriesDominance Tests (AC 3.4.1)
// =============================================================================

describe('detectSeriesDominance', () => {
  it('returns null for empty parts array', () => {
    expect(detectSeriesDominance([])).toBeNull()
  })

  it('returns null when no series exceeds 80%', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1', PartSeries: 'A' }),
      createTestPart({ PartCallout: 'P2', PartSeries: 'B' }),
    ]
    expect(detectSeriesDominance(parts)).toBeNull()
  })

  it('returns null for exactly 80% (threshold is >80%, not >=80%)', () => {
    // 8 of 10 = 80% exactly - should NOT trigger
    const parts = [
      ...Array.from({ length: 8 }, (_, i) =>
        createTestPart({ PartCallout: `A${i}`, PartSeries: 'SeriesA' })
      ),
      createTestPart({ PartCallout: 'B1', PartSeries: 'SeriesB' }),
      createTestPart({ PartCallout: 'B2', PartSeries: 'SeriesB' }),
    ]
    expect(detectSeriesDominance(parts)).toBeNull()
  })

  it('returns bias when series exceeds 80% (e.g., 90%)', () => {
    // 9 of 10 = 90%
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `D${i}`, PartSeries: 'Dominant' })
      ),
      createTestPart({ PartCallout: 'O1', PartSeries: 'Other' }),
    ]
    const result = detectSeriesDominance(parts)
    expect(result?.hasBias).toBe(true)
    expect(result?.biasType).toBe('series-dominant')
    expect(result?.severity).toBe('warning')
    expect(result?.details.dominantSeries?.percentage).toBe(90)
    expect(result?.details.dominantSeries?.count).toBe(9)
    expect(result?.details.dominantSeries?.total).toBe(10)
    expect(result?.details.dominantSeries?.name).toBe('Dominant')
  })

  it('returns bias when series is 100%', () => {
    const parts = Array.from({ length: 8 }, (_, i) =>
      createTestPart({ PartCallout: `ALL${i}`, PartSeries: 'AllSame' })
    )
    const result = detectSeriesDominance(parts)
    expect(result?.hasBias).toBe(true)
    expect(result?.details.dominantSeries?.percentage).toBe(100)
  })

  it('handles parts without PartSeries field (uses "Unknown")', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1', PartSeries: undefined }),
      createTestPart({ PartCallout: 'P2', PartSeries: undefined }),
    ]
    const result = detectSeriesDominance(parts)
    // 2 of 2 = 100% "Unknown"
    expect(result?.hasBias).toBe(true)
    expect(result?.details.dominantSeries?.name).toBe('Unknown')
  })

  it('returns correct message format', () => {
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `D${i}`, PartSeries: 'MySeries' })
      ),
      createTestPart({ PartCallout: 'O1', PartSeries: 'Other' }),
    ]
    const result = detectSeriesDominance(parts)
    expect(result?.message).toBe('Series bias detected: MySeries represents 90% of selection')
  })

  it('returns null for 4/6 split (67% - below threshold)', () => {
    const parts = [
      ...Array.from({ length: 4 }, (_, i) =>
        createTestPart({ PartCallout: `A${i}`, PartSeries: 'SeriesA' })
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createTestPart({ PartCallout: `B${i}`, PartSeries: 'SeriesB' })
      ),
    ]
    expect(detectSeriesDominance(parts)).toBeNull()
  })
})

// =============================================================================
// detectTooFewParts Tests (AC 3.4.2)
// =============================================================================

describe('detectTooFewParts', () => {
  it('returns null for empty parts array', () => {
    expect(detectTooFewParts([])).toBeNull()
  })

  it('returns bias for 1 part', () => {
    const parts = [createTestPart({ PartCallout: 'SINGLE' })]
    const result = detectTooFewParts(parts)
    expect(result?.hasBias).toBe(true)
    expect(result?.biasType).toBe('too-few-parts')
    expect(result?.severity).toBe('info')
    expect(result?.details.partCount).toBe(1)
    expect(result?.message).toContain('1 part(s) selected')
  })

  it('returns bias for 2 parts', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1' }),
      createTestPart({ PartCallout: 'P2' }),
    ]
    const result = detectTooFewParts(parts)
    expect(result?.hasBias).toBe(true)
    expect(result?.details.partCount).toBe(2)
    expect(result?.message).toContain('2 part(s) selected')
  })

  it('returns null for exactly 3 parts (threshold is <3)', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1' }),
      createTestPart({ PartCallout: 'P2' }),
      createTestPart({ PartCallout: 'P3' }),
    ]
    expect(detectTooFewParts(parts)).toBeNull()
  })

  it('returns null for 4+ parts', () => {
    const parts = Array.from({ length: 10 }, (_, i) =>
      createTestPart({ PartCallout: `P${i}` })
    )
    expect(detectTooFewParts(parts)).toBeNull()
  })

  it('returns correct message with suggestion', () => {
    const parts = [createTestPart({ PartCallout: 'SINGLE' })]
    const result = detectTooFewParts(parts)
    expect(result?.message).toContain('Consider adding more for meaningful statistics')
  })
})

// =============================================================================
// detectOutlierSkew Tests (AC 3.4.3) - IQR-based (1.5×IQR Tukey's rule)
// =============================================================================

describe('detectOutlierSkew', () => {
  it('returns null for fewer than 3 parts', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1' }),
      createTestPart({ PartCallout: 'P2' }),
    ]
    expect(detectOutlierSkew(parts)).toBeNull()
  })

  it('returns null when all dimensions are within IQR bounds', () => {
    // Uniform distribution - no outliers
    const parts = Array.from({ length: 10 }, (_, i) =>
      createTestPart({
        PartCallout: `P${i}`,
        PartWidth_mm: 20 + i, // 20-29, uniform spread
        PartHeight_mm: 10,
        PartLength_mm: 30,
      })
    )
    expect(detectOutlierSkew(parts)).toBeNull()
  })

  it('returns null when all values are identical (IQR = 0)', () => {
    const parts = Array.from({ length: 5 }, (_, i) =>
      createTestPart({
        PartCallout: `P${i}`,
        PartWidth_mm: 100,
        PartHeight_mm: 50,
        PartLength_mm: 200,
      })
    )
    expect(detectOutlierSkew(parts)).toBeNull()
  })

  it('detects width outlier outside 1.5×IQR bounds', () => {
    // Create dataset where one value is clearly outside IQR bounds
    // Values: [10, 10, 10, 10, 10, 10, 10, 10, 10, 100]
    // Q1 = 10, Q3 = 10, IQR = 0... this won't work
    // Need variation. Let's use: [10, 11, 12, 13, 14, 15, 16, 17, 18, 100]
    // Sorted: [10, 11, 12, 13, 14, 15, 16, 17, 18, 100]
    // Q1 (25th percentile, index 2.25): ~12.25
    // Q3 (75th percentile, index 6.75): ~16.75
    // IQR = 4.5
    // Upper bound = 16.75 + 1.5*4.5 = 16.75 + 6.75 = 23.5
    // 100 > 23.5 → outlier
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartWidth_mm: 10 + i })
      ),
      createTestPart({ PartCallout: 'OUTLIER-001', PartWidth_mm: 100 }),
    ]
    const result = detectOutlierSkew(parts)
    expect(result?.hasBias).toBe(true)
    expect(result?.biasType).toBe('outlier-skew')
    expect(result?.severity).toBe('info')
    expect(result?.details.outlierParts).toBeDefined()
    expect(result?.details.outlierParts?.length).toBe(1)
    expect(result?.details.outlierParts?.[0].callout).toBe('OUTLIER-001')
    expect(result?.details.outlierParts?.[0].dimension).toBe('Width')
    expect(result?.message).toContain('OUTLIER-001')
  })

  it('detects height outlier', () => {
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartHeight_mm: 50 + i })
      ),
      createTestPart({ PartCallout: 'TALL-PART', PartHeight_mm: 250 }),
    ]
    const result = detectOutlierSkew(parts)
    expect(result?.hasBias).toBe(true)
    expect(result?.details.outlierParts?.[0].dimension).toBe('Height')
  })

  it('detects length outlier', () => {
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartLength_mm: 100 + i })
      ),
      createTestPart({ PartCallout: 'LONG-PART', PartLength_mm: 500 }),
    ]
    const result = detectOutlierSkew(parts)
    expect(result?.hasBias).toBe(true)
    expect(result?.details.outlierParts?.[0].dimension).toBe('Length')
  })

  it('does NOT detect values within 1.5×IQR bounds', () => {
    // Create dataset where max is just inside bounds
    // Values: [10, 12, 14, 16, 18] → Q1=11, Q3=17, IQR=6
    // Upper bound = 17 + 9 = 26, Lower bound = 11 - 9 = 2
    // All values 10-18 are within [2, 26]
    const parts = [
      createTestPart({ PartCallout: 'P1', PartWidth_mm: 10 }),
      createTestPart({ PartCallout: 'P2', PartWidth_mm: 12 }),
      createTestPart({ PartCallout: 'P3', PartWidth_mm: 14 }),
      createTestPart({ PartCallout: 'P4', PartWidth_mm: 16 }),
      createTestPart({ PartCallout: 'P5', PartWidth_mm: 18 }),
    ]
    expect(detectOutlierSkew(parts)).toBeNull()
  })

  it('returns direction (above/below) in outlier details', () => {
    const partsAbove = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartWidth_mm: 10 + i })
      ),
      createTestPart({ PartCallout: 'BIG', PartWidth_mm: 100 }),
    ]
    const resultAbove = detectOutlierSkew(partsAbove)
    expect(resultAbove?.details.outlierParts?.[0].direction).toBe('above')

    const partsBelow = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartWidth_mm: 90 + i })
      ),
      createTestPart({ PartCallout: 'SMALL', PartWidth_mm: 1 }),
    ]
    const resultBelow = detectOutlierSkew(partsBelow)
    expect(resultBelow?.details.outlierParts?.[0].direction).toBe('below')
  })

  it('provides actual value and quartiles in details', () => {
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartWidth_mm: 10 + i })
      ),
      createTestPart({ PartCallout: 'OUTLIER', PartWidth_mm: 100 }),
    ]
    const result = detectOutlierSkew(parts)
    expect(result?.details.outlierParts?.[0].value).toBe(100)
    expect(result?.details.outlierParts?.[0].q1).toBeDefined()
    expect(result?.details.outlierParts?.[0].q3).toBeDefined()
  })

  it('returns ALL outliers, not just first', () => {
    // Two outliers in width dimension
    const parts = [
      ...Array.from({ length: 8 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartWidth_mm: 10 + i })
      ),
      createTestPart({ PartCallout: 'OUTLIER-LOW', PartWidth_mm: -100 }),
      createTestPart({ PartCallout: 'OUTLIER-HIGH', PartWidth_mm: 200 }),
    ]
    const result = detectOutlierSkew(parts)
    expect(result?.details.outlierParts?.length).toBe(2)
  })

  it('deduplicates outliers by callout (same part outlier on multiple dimensions counted once)', () => {
    // One part that's outlier on both width AND height
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({
          PartCallout: `N${i}`,
          PartWidth_mm: 10 + i,
          PartHeight_mm: 50 + i,
        })
      ),
      createTestPart({
        PartCallout: 'MULTI-OUTLIER',
        PartWidth_mm: 200,  // outlier on width
        PartHeight_mm: 500, // outlier on height
      }),
    ]
    const result = detectOutlierSkew(parts)
    // Should only count MULTI-OUTLIER once (first dimension found: Width)
    expect(result?.details.outlierParts?.length).toBe(1)
    expect(result?.details.outlierParts?.[0].callout).toBe('MULTI-OUTLIER')
    expect(result?.details.outlierParts?.[0].dimension).toBe('Width')
  })

  it('message format: singular for 1 outlier, plural for multiple', () => {
    // Single outlier
    const partsSingle = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartWidth_mm: 10 + i })
      ),
      createTestPart({ PartCallout: 'ONE-OUTLIER', PartWidth_mm: 100 }),
    ]
    const resultSingle = detectOutlierSkew(partsSingle)
    expect(resultSingle?.message).toContain('ONE-OUTLIER')
    expect(resultSingle?.message).toContain('IQR')

    // Multiple outliers
    const partsMulti = [
      ...Array.from({ length: 8 }, (_, i) =>
        createTestPart({ PartCallout: `N${i}`, PartWidth_mm: 10 + i })
      ),
      createTestPart({ PartCallout: 'OUT1', PartWidth_mm: -100 }),
      createTestPart({ PartCallout: 'OUT2', PartWidth_mm: 200 }),
    ]
    const resultMulti = detectOutlierSkew(partsMulti)
    expect(resultMulti?.message).toContain('2 dimensional outliers')
  })
})

// =============================================================================
// detectBias Tests (Combined)
// =============================================================================

describe('detectBias', () => {
  it('returns no biases for empty array', () => {
    const result = detectBias([])
    expect(result.hasBias).toBe(false)
    expect(result.biases).toHaveLength(0)
  })

  it('returns no biases for well-balanced set of 5+ parts', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1', PartSeries: 'A', PartWidth_mm: 100 }),
      createTestPart({ PartCallout: 'P2', PartSeries: 'B', PartWidth_mm: 102 }),
      createTestPart({ PartCallout: 'P3', PartSeries: 'C', PartWidth_mm: 101 }),
      createTestPart({ PartCallout: 'P4', PartSeries: 'D', PartWidth_mm: 99 }),
      createTestPart({ PartCallout: 'P5', PartSeries: 'E', PartWidth_mm: 100 }),
    ]
    const result = detectBias(parts)
    expect(result.hasBias).toBe(false)
    expect(result.biases).toHaveLength(0)
  })

  it('returns single bias when only series dominance detected', () => {
    const parts = Array.from({ length: 10 }, (_, i) =>
      createTestPart({
        PartCallout: `P${i}`,
        PartSeries: 'SameSeries',
        PartWidth_mm: 100 + i,
      })
    )
    const result = detectBias(parts)
    expect(result.hasBias).toBe(true)
    expect(result.biases).toHaveLength(1)
    expect(result.biases[0].biasType).toBe('series-dominant')
  })

  it('returns single bias when only too-few-parts detected', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1', PartSeries: 'A' }),
      createTestPart({ PartCallout: 'P2', PartSeries: 'B' }),
    ]
    const result = detectBias(parts)
    expect(result.hasBias).toBe(true)
    expect(result.biases).toHaveLength(1)
    expect(result.biases[0].biasType).toBe('too-few-parts')
  })

  it('returns single bias when only outlier detected', () => {
    // Need 10 parts with different series (no single series >80%)
    // and outlier in dimensions - IQR requires variation in normal values
    const parts = [
      createTestPart({ PartCallout: 'P0', PartSeries: 'Series0', PartWidth_mm: 10 }),
      createTestPart({ PartCallout: 'P1', PartSeries: 'Series1', PartWidth_mm: 11 }),
      createTestPart({ PartCallout: 'P2', PartSeries: 'Series2', PartWidth_mm: 12 }),
      createTestPart({ PartCallout: 'P3', PartSeries: 'Series3', PartWidth_mm: 13 }),
      createTestPart({ PartCallout: 'P4', PartSeries: 'Series4', PartWidth_mm: 14 }),
      createTestPart({ PartCallout: 'P5', PartSeries: 'Series5', PartWidth_mm: 15 }),
      createTestPart({ PartCallout: 'P6', PartSeries: 'Series6', PartWidth_mm: 16 }),
      createTestPart({ PartCallout: 'P7', PartSeries: 'Series7', PartWidth_mm: 17 }),
      createTestPart({ PartCallout: 'P8', PartSeries: 'Series8', PartWidth_mm: 18 }),
      createTestPart({ PartCallout: 'OUTLIER', PartSeries: 'Other', PartWidth_mm: 200 }),
    ]
    const result = detectBias(parts)
    expect(result.hasBias).toBe(true)
    expect(result.biases).toHaveLength(1)
    expect(result.biases[0].biasType).toBe('outlier-skew')
  })

  it('returns multiple biases when series dominance AND outlier detected', () => {
    // IQR requires variation - use incrementing values for non-outlier parts
    const parts = [
      ...Array.from({ length: 9 }, (_, i) =>
        createTestPart({
          PartCallout: `P${i}`,
          PartSeries: 'Dominant',
          PartWidth_mm: 10 + i, // 10-18, gives IQR variation
        })
      ),
      createTestPart({
        PartCallout: 'OUTLIER',
        PartSeries: 'Dominant', // Still dominant (100%)
        PartWidth_mm: 200, // But also outlier (outside IQR bounds)
      }),
    ]
    const result = detectBias(parts)
    expect(result.hasBias).toBe(true)
    expect(result.biases).toHaveLength(2)
    const biasTypes = result.biases.map((b) => b.biasType)
    expect(biasTypes).toContain('series-dominant')
    expect(biasTypes).toContain('outlier-skew')
  })

  it('returns too-few-parts but NOT outlier for 2 parts (outlier requires 3+)', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1', PartSeries: 'A', PartWidth_mm: 10 }),
      createTestPart({ PartCallout: 'P2', PartSeries: 'B', PartWidth_mm: 1000 }),
    ]
    const result = detectBias(parts)
    expect(result.biases).toHaveLength(1)
    expect(result.biases[0].biasType).toBe('too-few-parts')
  })

  it('returns series-dominant AND too-few-parts for 2 parts of same series', () => {
    const parts = [
      createTestPart({ PartCallout: 'P1', PartSeries: 'Same' }),
      createTestPart({ PartCallout: 'P2', PartSeries: 'Same' }),
    ]
    const result = detectBias(parts)
    expect(result.biases).toHaveLength(2)
    const biasTypes = result.biases.map((b) => b.biasType)
    expect(biasTypes).toContain('series-dominant')
    expect(biasTypes).toContain('too-few-parts')
  })

  it('biases array order: series-dominant, too-few-parts, outlier-skew', () => {
    // Create scenario with all three biases
    // Need 2 parts of same series with outlier dimensions
    // But outlier requires 3+ parts... so can only have 2 biases max with <3 parts
    // Let's just verify order with 2 biases
    const parts = [
      createTestPart({ PartCallout: 'P1', PartSeries: 'Same' }),
      createTestPart({ PartCallout: 'P2', PartSeries: 'Same' }),
    ]
    const result = detectBias(parts)
    expect(result.biases[0].biasType).toBe('series-dominant')
    expect(result.biases[1].biasType).toBe('too-few-parts')
  })
})
