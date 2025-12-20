// src/lib/analysis/__tests__/statistics.test.ts
// Unit tests for aggregate statistics calculation functions
// Coverage target: 95%+ per architecture mandate

import { describe, it, expect } from 'vitest'
import {
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculateDimensionStats,
  calculateAggregateStats,
} from '../statistics'
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
// calculateMean Tests (AC 3.5.1)
// =============================================================================

describe('calculateMean', () => {
  it('returns 0 for empty array', () => {
    expect(calculateMean([])).toBe(0)
  })

  it('returns the value for single element', () => {
    expect(calculateMean([42])).toBe(42)
  })

  it('calculates mean correctly for simple values', () => {
    expect(calculateMean([10, 20, 30])).toBe(20)
  })

  it('calculates mean correctly for AC verification case [10,20,30,40,50]', () => {
    // AC 3.5.1 verification: Mean = 30
    expect(calculateMean([10, 20, 30, 40, 50])).toBe(30)
  })

  it('calculates mean correctly for AC verification case [10,20,100]', () => {
    // AC 3.5.1 verification: Mean = 43.33
    expect(calculateMean([10, 20, 100])).toBeCloseTo(43.33, 2)
  })

  it('handles decimal values', () => {
    expect(calculateMean([1.5, 2.5, 3.0])).toBeCloseTo(2.33, 2)
  })

  it('handles negative values', () => {
    expect(calculateMean([-10, 0, 10])).toBe(0)
  })

  it('handles large values', () => {
    expect(calculateMean([1000000, 2000000, 3000000])).toBe(2000000)
  })
})

// =============================================================================
// calculateMedian Tests (AC 3.5.1)
// =============================================================================

describe('calculateMedian', () => {
  it('returns 0 for empty array', () => {
    expect(calculateMedian([])).toBe(0)
  })

  it('returns the value for single element', () => {
    expect(calculateMedian([42])).toBe(42)
  })

  it('returns middle value for odd count', () => {
    expect(calculateMedian([10, 20, 30])).toBe(20)
  })

  it('returns average of middle values for even count', () => {
    expect(calculateMedian([10, 20, 30, 40])).toBe(25)
  })

  it('handles unsorted input correctly', () => {
    expect(calculateMedian([30, 10, 20])).toBe(20)
  })

  it('calculates median correctly for AC verification case [10,20,30,40,50]', () => {
    // AC 3.5.1 verification: Median = 30
    expect(calculateMedian([10, 20, 30, 40, 50])).toBe(30)
  })

  it('calculates median correctly for AC verification case [10,20,100]', () => {
    // AC 3.5.1 verification: Median = 20
    expect(calculateMedian([10, 20, 100])).toBe(20)
  })

  it('handles two elements', () => {
    expect(calculateMedian([10, 20])).toBe(15)
  })

  it('does not mutate original array', () => {
    const original = [30, 10, 20]
    calculateMedian(original)
    expect(original).toEqual([30, 10, 20])
  })

  it('handles duplicate values', () => {
    expect(calculateMedian([5, 5, 5, 5, 5])).toBe(5)
  })
})

// =============================================================================
// calculateStdDev Tests (AC 3.5.5)
// =============================================================================

describe('calculateStdDev', () => {
  it('returns null for empty array', () => {
    expect(calculateStdDev([])).toBeNull()
  })

  it('returns null for single value (AC 3.5.5: undefined for n < 2)', () => {
    expect(calculateStdDev([42])).toBeNull()
  })

  it('returns 0 when all values are identical', () => {
    expect(calculateStdDev([20, 20, 20])).toBe(0)
  })

  it('calculates population std dev correctly for [10, 20, 30]', () => {
    // Mean = 20, Variance = ((10-20)² + (20-20)² + (30-20)²) / 3 = (100 + 0 + 100) / 3 = 66.67
    // StdDev = √66.67 ≈ 8.165
    expect(calculateStdDev([10, 20, 30])).toBeCloseTo(8.165, 2)
  })

  it('calculates population std dev for two values', () => {
    // [10, 20]: Mean = 15, Variance = ((10-15)² + (20-15)²) / 2 = (25 + 25) / 2 = 25
    // StdDev = √25 = 5
    expect(calculateStdDev([10, 20])).toBe(5)
  })

  it('uses population formula (divides by n, not n-1)', () => {
    // For [0, 10]: Mean = 5, Population variance = (25 + 25) / 2 = 25, σ = 5
    // Sample variance would be (25 + 25) / 1 = 50, s = 7.07
    const result = calculateStdDev([0, 10])
    expect(result).toBe(5) // Population formula
    expect(result).not.toBeCloseTo(7.07, 1) // Not sample formula
  })

  it('handles decimal values', () => {
    expect(calculateStdDev([1.0, 2.0, 3.0])).toBeCloseTo(0.816, 2)
  })

  it('handles larger dataset', () => {
    // [1,2,3,4,5]: Mean = 3, Variance = (4+1+0+1+4)/5 = 2, StdDev = √2 ≈ 1.414
    expect(calculateStdDev([1, 2, 3, 4, 5])).toBeCloseTo(1.414, 2)
  })
})

// =============================================================================
// calculateDimensionStats Tests
// =============================================================================

describe('calculateDimensionStats', () => {
  it('returns zeros with null stdDev for empty array', () => {
    const result = calculateDimensionStats([])
    expect(result).toEqual({
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: null,
    })
  })

  it('calculates all stats for single value (AC 3.5.5)', () => {
    const result = calculateDimensionStats([25])
    expect(result.count).toBe(1)
    expect(result.min).toBe(25)
    expect(result.max).toBe(25)
    expect(result.mean).toBe(25)
    expect(result.median).toBe(25)
    expect(result.stdDev).toBeNull() // N/A for single value
  })

  it('calculates all stats for multiple values', () => {
    const result = calculateDimensionStats([10, 20, 30, 40, 50])
    expect(result.count).toBe(5)
    expect(result.min).toBe(10)
    expect(result.max).toBe(50)
    expect(result.mean).toBe(30)
    expect(result.median).toBe(30)
    expect(result.stdDev).toBeCloseTo(14.14, 1) // √200
  })

  it('handles unsorted values correctly', () => {
    const result = calculateDimensionStats([50, 10, 30, 20, 40])
    expect(result.min).toBe(10)
    expect(result.max).toBe(50)
    expect(result.median).toBe(30)
  })

  it('calculates stdDev for two values', () => {
    const result = calculateDimensionStats([10, 20])
    expect(result.stdDev).toBe(5)
  })
})

// =============================================================================
// calculateAggregateStats Tests (AC 3.5.2)
// =============================================================================

describe('calculateAggregateStats', () => {
  it('returns stats for all five dimensions (AC 3.17.1)', () => {
    const parts = [
      createTestPart({
        PartWidth_mm: 10,
        PartHeight_mm: 5,
        PartLength_mm: 20,
        SmallestLateralFeature_um: 100,
        SmallestDepthFeature_um: 50,
      }),
      createTestPart({
        PartWidth_mm: 20,
        PartHeight_mm: 10,
        PartLength_mm: 40,
        SmallestLateralFeature_um: 200,
        SmallestDepthFeature_um: 100,
      }),
    ]
    const stats = calculateAggregateStats(parts)

    // Width
    expect(stats.width.count).toBe(2)
    expect(stats.width.min).toBe(10)
    expect(stats.width.max).toBe(20)
    expect(stats.width.mean).toBe(15)

    // Height
    expect(stats.height.count).toBe(2)
    expect(stats.height.min).toBe(5)
    expect(stats.height.max).toBe(10)
    expect(stats.height.mean).toBe(7.5)

    // Length
    expect(stats.length.count).toBe(2)
    expect(stats.length.min).toBe(20)
    expect(stats.length.max).toBe(40)
    expect(stats.length.mean).toBe(30)

    // SmallestLateralFeature
    expect(stats.smallestLateralFeature.count).toBe(2)
    expect(stats.smallestLateralFeature.min).toBe(100)
    expect(stats.smallestLateralFeature.max).toBe(200)
    expect(stats.smallestLateralFeature.mean).toBe(150)

    // SmallestDepthFeature
    expect(stats.smallestDepthFeature).not.toBeNull()
    expect(stats.smallestDepthFeature!.count).toBe(2)
    expect(stats.smallestDepthFeature!.min).toBe(50)
    expect(stats.smallestDepthFeature!.max).toBe(100)
    expect(stats.smallestDepthFeature!.mean).toBe(75)
  })

  it('returns null for smallestDepthFeature when no parts have it (AC 3.17.2)', () => {
    const parts = [
      createTestPart({
        PartWidth_mm: 10,
        SmallestLateralFeature_um: 100,
        // No SmallestDepthFeature_um
      }),
      createTestPart({
        PartWidth_mm: 20,
        SmallestLateralFeature_um: 200,
        // No SmallestDepthFeature_um
      }),
    ]
    const stats = calculateAggregateStats(parts)

    expect(stats.smallestLateralFeature.count).toBe(2)
    expect(stats.smallestDepthFeature).toBeNull()
  })

  it('calculates depth feature stats only for parts that have it', () => {
    const parts = [
      createTestPart({
        SmallestLateralFeature_um: 100,
        SmallestDepthFeature_um: 50,
      }),
      createTestPart({
        SmallestLateralFeature_um: 200,
        // No depth feature
      }),
      createTestPart({
        SmallestLateralFeature_um: 150,
        SmallestDepthFeature_um: 75,
      }),
    ]
    const stats = calculateAggregateStats(parts)

    // Lateral includes all 3 parts
    expect(stats.smallestLateralFeature.count).toBe(3)

    // Depth only includes 2 parts with depth data
    expect(stats.smallestDepthFeature).not.toBeNull()
    expect(stats.smallestDepthFeature!.count).toBe(2)
    expect(stats.smallestDepthFeature!.min).toBe(50)
    expect(stats.smallestDepthFeature!.max).toBe(75)
    expect(stats.smallestDepthFeature!.mean).toBe(62.5)
  })

  it('handles empty parts array (AC 3.5.4)', () => {
    const stats = calculateAggregateStats([])
    expect(stats.width.count).toBe(0)
    expect(stats.height.count).toBe(0)
    expect(stats.length.count).toBe(0)
    expect(stats.smallestLateralFeature.count).toBe(0)
    expect(stats.smallestDepthFeature).toBeNull()
    expect(stats.width.stdDev).toBeNull()
  })

  it('handles single part (AC 3.5.5)', () => {
    const parts = [
      createTestPart({
        PartWidth_mm: 25,
        PartHeight_mm: 15,
        PartLength_mm: 50,
        SmallestLateralFeature_um: 5,
        SmallestDepthFeature_um: 2,
      }),
    ]
    const stats = calculateAggregateStats(parts)

    expect(stats.width.count).toBe(1)
    expect(stats.width.min).toBe(25)
    expect(stats.width.max).toBe(25)
    expect(stats.width.mean).toBe(25)
    expect(stats.width.median).toBe(25)
    expect(stats.width.stdDev).toBeNull() // N/A for single part
    expect(stats.smallestDepthFeature!.stdDev).toBeNull() // N/A for single part
  })

  it('calculates correct stats for AC verification case (5 parts)', () => {
    // AC 3.5.1 verification: [10, 20, 30, 40, 50] → Mean = 30, Median = 30
    const parts = [
      createTestPart({ PartWidth_mm: 10 }),
      createTestPart({ PartWidth_mm: 20 }),
      createTestPart({ PartWidth_mm: 30 }),
      createTestPart({ PartWidth_mm: 40 }),
      createTestPart({ PartWidth_mm: 50 }),
    ]
    const stats = calculateAggregateStats(parts)

    expect(stats.width.mean).toBe(30)
    expect(stats.width.median).toBe(30)
  })

  it('calculates correct stats for AC verification case (3 parts with outlier)', () => {
    // AC 3.5.1 verification: [10, 20, 100] → Mean = 43.33, Median = 20
    const parts = [
      createTestPart({ PartWidth_mm: 10 }),
      createTestPart({ PartWidth_mm: 20 }),
      createTestPart({ PartWidth_mm: 100 }),
    ]
    const stats = calculateAggregateStats(parts)

    expect(stats.width.mean).toBeCloseTo(43.33, 2)
    expect(stats.width.median).toBe(20)
  })

  it('returns consistent count across all dimensions', () => {
    const parts = Array.from({ length: 7 }, (_, i) =>
      createTestPart({ PartCallout: `P${i}` })
    )
    const stats = calculateAggregateStats(parts)

    expect(stats.width.count).toBe(7)
    expect(stats.height.count).toBe(7)
    expect(stats.length.count).toBe(7)
    expect(stats.smallestLateralFeature.count).toBe(7)
    // smallestDepthFeature is null since test parts don't have it
    expect(stats.smallestDepthFeature).toBeNull()
  })

  it('calculates independent statistics per dimension', () => {
    const parts = [
      createTestPart({
        PartWidth_mm: 100,
        PartHeight_mm: 10,
        PartLength_mm: 1000,
        SmallestLateralFeature_um: 1,
        SmallestDepthFeature_um: 0.5,
      }),
      createTestPart({
        PartWidth_mm: 200,
        PartHeight_mm: 20,
        PartLength_mm: 2000,
        SmallestLateralFeature_um: 2,
        SmallestDepthFeature_um: 1,
      }),
    ]
    const stats = calculateAggregateStats(parts)

    // Each dimension should have its own distinct statistics
    expect(stats.width.mean).toBe(150)
    expect(stats.height.mean).toBe(15)
    expect(stats.length.mean).toBe(1500)
    expect(stats.smallestLateralFeature.mean).toBe(1.5)
    expect(stats.smallestDepthFeature!.mean).toBe(0.75)
  })
})
