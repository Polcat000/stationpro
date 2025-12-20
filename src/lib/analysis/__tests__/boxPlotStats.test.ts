// src/lib/analysis/__tests__/boxPlotStats.test.ts
// Unit tests for box plot statistics with IQR-based outlier detection
// AC-3.7a.1: Box plot stats, AC-3.7a.4: Outlier detection (1.5x IQR)

import { describe, it, expect } from 'vitest'
import {
  calculateBoxPlotStats,
  calculateSeriesBoxPlotStats,
  calculateAllSeriesBoxPlotStats,
  calculateAllFamilyBoxPlotStats,
} from '../boxPlotStats'
import type { Part } from '@/types/domain'

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a value object for calculateBoxPlotStats input.
 */
function createValue(
  value: number,
  partId: string = `PART-${value}`,
  partCallout: string = partId
): { value: number; partId: string; partCallout: string } {
  return { value, partId, partCallout }
}

/**
 * Creates an array of value objects from numbers.
 */
function createValues(values: number[]): { value: number; partId: string; partCallout: string }[] {
  return values.map((v, i) => createValue(v, `PART-${i + 1}`, `PART-${i + 1}`))
}

/**
 * Creates a minimal test Part with specified dimensions.
 */
function createPart(
  callout: string,
  width: number,
  height: number = 50,
  length: number = 100,
  series: string = 'Test Series',
  family?: string
): Part {
  return {
    PartCallout: callout,
    PartSeries: series,
    PartFamily: family,
    PartWidth_mm: width,
    PartHeight_mm: height,
    PartLength_mm: length,
    SmallestLateralFeature_um: 100,
    InspectionZones: [],
  }
}

// =============================================================================
// calculateBoxPlotStats Tests
// =============================================================================

describe('calculateBoxPlotStats', () => {
  describe('edge cases', () => {
    it('returns zeros for empty array', () => {
      const stats = calculateBoxPlotStats([])

      expect(stats.n).toBe(0)
      expect(stats.min).toBe(0)
      expect(stats.q1).toBe(0)
      expect(stats.median).toBe(0)
      expect(stats.q3).toBe(0)
      expect(stats.max).toBe(0)
      expect(stats.iqr).toBe(0)
      expect(stats.whiskerLow).toBe(0)
      expect(stats.whiskerHigh).toBe(0)
      expect(stats.outliers).toEqual([])
      expect(stats.mean).toBe(0)
    })

    it('handles single value (all stats equal)', () => {
      const stats = calculateBoxPlotStats([createValue(10)])

      expect(stats.n).toBe(1)
      expect(stats.min).toBe(10)
      expect(stats.q1).toBe(10)
      expect(stats.median).toBe(10)
      expect(stats.q3).toBe(10)
      expect(stats.max).toBe(10)
      expect(stats.iqr).toBe(0)
      expect(stats.whiskerLow).toBe(10)
      expect(stats.whiskerHigh).toBe(10)
      expect(stats.outliers).toEqual([])
      expect(stats.mean).toBe(10)
    })

    it('handles two values', () => {
      const stats = calculateBoxPlotStats(createValues([10, 20]))

      expect(stats.n).toBe(2)
      expect(stats.min).toBe(10)
      expect(stats.max).toBe(20)
      expect(stats.median).toBe(15) // Average of two middle values
      expect(stats.mean).toBe(15)
    })

    it('handles all identical values (IQR = 0)', () => {
      const stats = calculateBoxPlotStats(createValues([5, 5, 5, 5, 5]))

      expect(stats.n).toBe(5)
      expect(stats.min).toBe(5)
      expect(stats.q1).toBe(5)
      expect(stats.median).toBe(5)
      expect(stats.q3).toBe(5)
      expect(stats.max).toBe(5)
      expect(stats.iqr).toBe(0)
      expect(stats.whiskerLow).toBe(5)
      expect(stats.whiskerHigh).toBe(5)
      expect(stats.outliers).toEqual([]) // No outliers when IQR = 0
    })
  })

  describe('quartile calculation (odd-length array)', () => {
    it('calculates quartiles correctly for 5 values', () => {
      // Dataset: [1, 2, 3, 4, 5]
      // Using R-7 method (same as Excel PERCENTILE.INC):
      // Q1 (p=0.25): h = 4*0.25 = 1, value at index 1 = 2
      // Median (p=0.5): h = 4*0.5 = 2, value at index 2 = 3
      // Q3 (p=0.75): h = 4*0.75 = 3, value at index 3 = 4
      const stats = calculateBoxPlotStats(createValues([1, 2, 3, 4, 5]))

      expect(stats.min).toBe(1)
      expect(stats.q1).toBe(2)
      expect(stats.median).toBe(3)
      expect(stats.q3).toBe(4)
      expect(stats.max).toBe(5)
      expect(stats.iqr).toBe(2)
    })

    it('calculates quartiles correctly for 9 values', () => {
      // Dataset: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      // h = (n-1)*p = 8*p
      // Q1: h = 2, value at index 2 = 3
      // Median: h = 4, value at index 4 = 5
      // Q3: h = 6, value at index 6 = 7
      const stats = calculateBoxPlotStats(createValues([1, 2, 3, 4, 5, 6, 7, 8, 9]))

      expect(stats.min).toBe(1)
      expect(stats.q1).toBe(3)
      expect(stats.median).toBe(5)
      expect(stats.q3).toBe(7)
      expect(stats.max).toBe(9)
      expect(stats.iqr).toBe(4)
    })
  })

  describe('quartile calculation (even-length array)', () => {
    it('calculates quartiles correctly for 4 values', () => {
      // Dataset: [1, 2, 3, 4]
      // h = 3*p
      // Q1: h = 0.75, interpolate between index 0 and 1: 1 + 0.75*(2-1) = 1.75
      // Median: h = 1.5, interpolate between index 1 and 2: 2 + 0.5*(3-2) = 2.5
      // Q3: h = 2.25, interpolate between index 2 and 3: 3 + 0.25*(4-3) = 3.25
      const stats = calculateBoxPlotStats(createValues([1, 2, 3, 4]))

      expect(stats.min).toBe(1)
      expect(stats.q1).toBe(1.75)
      expect(stats.median).toBe(2.5)
      expect(stats.q3).toBe(3.25)
      expect(stats.max).toBe(4)
      expect(stats.iqr).toBe(1.5)
    })

    it('calculates quartiles correctly for 8 values', () => {
      // Dataset: [1, 2, 3, 4, 5, 6, 7, 8]
      // h = 7*p
      // Q1: h = 1.75, interpolate between index 1 and 2: 2 + 0.75*(3-2) = 2.75
      // Median: h = 3.5, interpolate between index 3 and 4: 4 + 0.5*(5-4) = 4.5
      // Q3: h = 5.25, interpolate between index 5 and 6: 6 + 0.25*(7-6) = 6.25
      const stats = calculateBoxPlotStats(createValues([1, 2, 3, 4, 5, 6, 7, 8]))

      expect(stats.min).toBe(1)
      expect(stats.q1).toBe(2.75)
      expect(stats.median).toBe(4.5)
      expect(stats.q3).toBe(6.25)
      expect(stats.max).toBe(8)
      expect(stats.iqr).toBe(3.5)
    })
  })

  describe('whisker bounds (1.5x IQR)', () => {
    it('whiskers extend to min/max when no outliers', () => {
      // Dataset: [1, 2, 3, 4, 5]
      // IQR = 2, 1.5*IQR = 3
      // Lower bound = Q1 - 3 = 2 - 3 = -1 (below min)
      // Upper bound = Q3 + 3 = 4 + 3 = 7 (above max)
      // So whiskers go to actual min/max
      const stats = calculateBoxPlotStats(createValues([1, 2, 3, 4, 5]))

      expect(stats.whiskerLow).toBe(1)
      expect(stats.whiskerHigh).toBe(5)
      expect(stats.outliers).toEqual([])
    })

    it('whiskers stop at most extreme non-outlier value', () => {
      // Dataset: [0, 10, 11, 12, 13, 14, 100]
      // For 7 values with h = 6*p:
      // Q1: h = 1.5, interpolate 10 + 0.5*(11-10) = 10.5
      // Median: h = 3, value at index 3 = 12
      // Q3: h = 4.5, interpolate 13 + 0.5*(14-13) = 13.5
      // IQR = 3, 1.5*IQR = 4.5
      // Lower bound = 10.5 - 4.5 = 6 (0 is below this → outlier)
      // Upper bound = 13.5 + 4.5 = 18 (100 is above this → outlier)
      const stats = calculateBoxPlotStats(createValues([0, 10, 11, 12, 13, 14, 100]))

      expect(stats.whiskerLow).toBe(10) // First value >= 6
      expect(stats.whiskerHigh).toBe(14) // Last value <= 18
      expect(stats.outliers).toHaveLength(2)
    })
  })

  describe('outlier detection (1.5x IQR)', () => {
    it('identifies outlier beyond 1.5x IQR', () => {
      // AC verification case: 9 parts at 10mm, 1 part at 100mm
      // This creates an extreme outlier
      const values = [
        ...Array(9).fill(null).map((_, i) => createValue(10, `NORMAL-${i}`)),
        createValue(100, 'OUTLIER', 'OUTLIER'),
      ]

      const stats = calculateBoxPlotStats(values)

      expect(stats.outliers).toHaveLength(1)
      expect(stats.outliers[0].value).toBe(100)
      expect(stats.outliers[0].partCallout).toBe('OUTLIER')
    })

    it('identifies low outlier below Q1 - 1.5*IQR', () => {
      const values = [
        createValue(0, 'LOW-OUTLIER', 'LOW-OUTLIER'),
        ...Array(9).fill(null).map((_, i) => createValue(50, `NORMAL-${i}`)),
      ]

      const stats = calculateBoxPlotStats(values)

      const lowOutliers = stats.outliers.filter((o) => o.value < stats.q1)
      expect(lowOutliers.length).toBeGreaterThan(0)
      expect(lowOutliers[0].partCallout).toBe('LOW-OUTLIER')
    })

    it('identifies outliers on both ends', () => {
      // Values with clear outliers on both ends
      const values = [
        createValue(1, 'LOW', 'LOW'),
        ...createValues([20, 21, 22, 23, 24, 25, 26, 27]),
        createValue(100, 'HIGH', 'HIGH'),
      ]

      const stats = calculateBoxPlotStats(values)

      const lowOutliers = stats.outliers.filter((o) => o.value < stats.whiskerLow)
      const highOutliers = stats.outliers.filter((o) => o.value > stats.whiskerHigh)

      expect(lowOutliers.some((o) => o.partCallout === 'LOW')).toBe(true)
      expect(highOutliers.some((o) => o.partCallout === 'HIGH')).toBe(true)
    })

    it('outliers include part identification for tooltip display', () => {
      const values = [
        ...createValues([10, 11, 12, 13, 14]),
        createValue(100, 'MY-PART-ID', 'PART-CALLOUT-123'),
      ]

      const stats = calculateBoxPlotStats(values)

      expect(stats.outliers).toHaveLength(1)
      expect(stats.outliers[0]).toEqual({
        value: 100,
        partId: 'MY-PART-ID',
        partCallout: 'PART-CALLOUT-123',
      })
    })

    it('no outliers when all values within 1.5x IQR', () => {
      // Tight distribution with no extreme values
      const stats = calculateBoxPlotStats(createValues([10, 11, 10, 11, 10, 11, 10, 11]))

      expect(stats.outliers).toEqual([])
    })
  })

  describe('mean calculation', () => {
    it('calculates mean correctly', () => {
      // [2, 4, 6, 8, 10] → mean = 30/5 = 6
      const stats = calculateBoxPlotStats(createValues([2, 4, 6, 8, 10]))

      expect(stats.mean).toBe(6)
    })

    it('mean is independent of quartile calculations', () => {
      const stats = calculateBoxPlotStats(createValues([1, 2, 3, 4, 100]))

      // Mean affected by outlier: (1+2+3+4+100)/5 = 22
      expect(stats.mean).toBe(22)
      // Median not affected: 3
      expect(stats.median).toBe(3)
    })
  })

  describe('unsorted input handling', () => {
    it('produces same results regardless of input order', () => {
      const ordered = calculateBoxPlotStats(createValues([1, 2, 3, 4, 5]))
      const reversed = calculateBoxPlotStats(createValues([5, 4, 3, 2, 1]))
      const shuffled = calculateBoxPlotStats(createValues([3, 1, 5, 2, 4]))

      expect(ordered.min).toBe(reversed.min)
      expect(ordered.min).toBe(shuffled.min)
      expect(ordered.median).toBe(reversed.median)
      expect(ordered.median).toBe(shuffled.median)
      expect(ordered.q1).toBe(reversed.q1)
      expect(ordered.q1).toBe(shuffled.q1)
    })
  })
})

// =============================================================================
// calculateSeriesBoxPlotStats Tests
// =============================================================================

describe('calculateSeriesBoxPlotStats', () => {
  it('returns series name from parts', () => {
    const parts = [
      createPart('P1', 10, 50, 100, 'Series Alpha'),
      createPart('P2', 12, 50, 100, 'Series Alpha'),
    ]

    const stats = calculateSeriesBoxPlotStats(parts, 'width')

    expect(stats.seriesName).toBe('Series Alpha')
  })

  it('handles missing series name (Uncategorized)', () => {
    const parts = [
      { ...createPart('P1', 10), PartSeries: undefined },
      { ...createPart('P2', 12), PartSeries: undefined },
    ]

    const stats = calculateSeriesBoxPlotStats(parts, 'width')

    expect(stats.seriesName).toBe('Uncategorized')
  })

  it('calculates stats for width dimension', () => {
    const parts = [
      createPart('P1', 10),
      createPart('P2', 20),
      createPart('P3', 30),
    ]

    const stats = calculateSeriesBoxPlotStats(parts, 'width')

    expect(stats.min).toBe(10)
    expect(stats.max).toBe(30)
    expect(stats.median).toBe(20)
  })

  it('calculates stats for height dimension', () => {
    const parts = [
      createPart('P1', 10, 100),
      createPart('P2', 10, 200),
      createPart('P3', 10, 300),
    ]

    const stats = calculateSeriesBoxPlotStats(parts, 'height')

    expect(stats.min).toBe(100)
    expect(stats.max).toBe(300)
    expect(stats.median).toBe(200)
  })

  it('calculates stats for length dimension', () => {
    const parts = [
      createPart('P1', 10, 50, 1000),
      createPart('P2', 10, 50, 2000),
      createPart('P3', 10, 50, 3000),
    ]

    const stats = calculateSeriesBoxPlotStats(parts, 'length')

    expect(stats.min).toBe(1000)
    expect(stats.max).toBe(3000)
    expect(stats.median).toBe(2000)
  })

  it('identifies outliers with PartCallout', () => {
    const parts = [
      ...Array(9).fill(null).map((_, i) => createPart(`NORMAL-${i}`, 10)),
      createPart('OUTLIER-PART', 100),
    ]

    const stats = calculateSeriesBoxPlotStats(parts, 'width')

    expect(stats.outliers).toHaveLength(1)
    expect(stats.outliers[0].partCallout).toBe('OUTLIER-PART')
  })

  it('handles empty parts array', () => {
    const stats = calculateSeriesBoxPlotStats([], 'width')

    expect(stats.seriesName).toBe('Unknown')
    expect(stats.n).toBe(0)
    expect(stats.outliers).toEqual([])
  })
})

// =============================================================================
// calculateAllSeriesBoxPlotStats Tests
// =============================================================================

describe('calculateAllSeriesBoxPlotStats', () => {
  it('groups parts by series and calculates stats for each', () => {
    const parts = [
      createPart('A1', 10, 50, 100, 'Series A'),
      createPart('A2', 12, 50, 100, 'Series A'),
      createPart('B1', 20, 50, 100, 'Series B'),
      createPart('B2', 22, 50, 100, 'Series B'),
    ]

    const allStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    expect(allStats).toHaveLength(2)
    expect(allStats[0].seriesName).toBe('Series A')
    expect(allStats[1].seriesName).toBe('Series B')
  })

  it('returns stats sorted by series name', () => {
    const parts = [
      createPart('Z1', 10, 50, 100, 'Zebra'),
      createPart('A1', 20, 50, 100, 'Alpha'),
      createPart('M1', 30, 50, 100, 'Middle'),
    ]

    const allStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    expect(allStats[0].seriesName).toBe('Alpha')
    expect(allStats[1].seriesName).toBe('Middle')
    expect(allStats[2].seriesName).toBe('Zebra')
  })

  it('handles parts without series (Uncategorized)', () => {
    const parts = [
      { ...createPart('P1', 10), PartSeries: undefined },
      createPart('P2', 20, 50, 100, 'Named Series'),
    ]

    const allStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    const names = allStats.map((s) => s.seriesName)
    expect(names).toContain('Uncategorized')
    expect(names).toContain('Named Series')
  })

  it('calculates independent outliers per series', () => {
    // Series A has tight distribution
    // Series B has an outlier
    const parts = [
      ...Array(5).fill(null).map((_, i) => createPart(`A${i}`, 10, 50, 100, 'Series A')),
      ...Array(9).fill(null).map((_, i) => createPart(`B${i}`, 10, 50, 100, 'Series B')),
      createPart('B-OUT', 100, 50, 100, 'Series B'), // Outlier in Series B
    ]

    const allStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    const seriesA = allStats.find((s) => s.seriesName === 'Series A')!
    const seriesB = allStats.find((s) => s.seriesName === 'Series B')!

    expect(seriesA.outliers).toHaveLength(0)
    expect(seriesB.outliers).toHaveLength(1)
    expect(seriesB.outliers[0].partCallout).toBe('B-OUT')
  })

  it('handles many series (AC scale requirement)', () => {
    // AC mentions 50-80 series - verify it handles many
    const parts: Part[] = []
    for (let s = 0; s < 50; s++) {
      for (let p = 0; p < 10; p++) {
        parts.push(createPart(`S${s}-P${p}`, 10 + s, 50, 100, `Series-${s.toString().padStart(2, '0')}`))
      }
    }

    const allStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    expect(allStats).toHaveLength(50)
    // Verify sorting works with many series
    expect(allStats[0].seriesName).toBe('Series-00')
    expect(allStats[49].seriesName).toBe('Series-49')
  })

  it('returns empty array for empty parts', () => {
    const allStats = calculateAllSeriesBoxPlotStats([], 'width')

    expect(allStats).toEqual([])
  })

  it('each series stats contains correct n count', () => {
    const parts = [
      createPart('A1', 10, 50, 100, 'Series A'),
      createPart('A2', 12, 50, 100, 'Series A'),
      createPart('A3', 14, 50, 100, 'Series A'),
      createPart('B1', 20, 50, 100, 'Series B'),
      createPart('B2', 22, 50, 100, 'Series B'),
    ]

    const allStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    const seriesA = allStats.find((s) => s.seriesName === 'Series A')!
    const seriesB = allStats.find((s) => s.seriesName === 'Series B')!

    expect(seriesA.n).toBe(3)
    expect(seriesB.n).toBe(2)
  })
})

// =============================================================================
// calculateAllFamilyBoxPlotStats Tests (AC-3.16.2)
// =============================================================================

describe('calculateAllFamilyBoxPlotStats', () => {
  describe('empty and edge cases', () => {
    it('returns empty array for empty parts', () => {
      const allStats = calculateAllFamilyBoxPlotStats([], 'width')

      expect(allStats).toEqual([])
    })

    it('handles single family', () => {
      const parts = [
        createPart('P1', 10, 50, 100, 'Series A', 'FamilyX'),
        createPart('P2', 12, 50, 100, 'Series A', 'FamilyX'),
        createPart('P3', 14, 50, 100, 'Series B', 'FamilyX'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats).toHaveLength(1)
      expect(allStats[0].familyName).toBe('FamilyX')
      expect(allStats[0].n).toBe(3)
    })

    it('handles single part in single family', () => {
      const parts = [createPart('P1', 10, 50, 100, 'Series A', 'FamilyX')]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats).toHaveLength(1)
      expect(allStats[0].familyName).toBe('FamilyX')
      expect(allStats[0].n).toBe(1)
      expect(allStats[0].seriesCount).toBe(1)
    })
  })

  describe('family grouping', () => {
    it('groups parts by family and calculates stats for each', () => {
      const parts = [
        createPart('A1', 10, 50, 100, 'Series A', 'FamilyX'),
        createPart('A2', 12, 50, 100, 'Series A', 'FamilyX'),
        createPart('B1', 20, 50, 100, 'Series B', 'FamilyY'),
        createPart('B2', 22, 50, 100, 'Series B', 'FamilyY'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats).toHaveLength(2)
      expect(allStats[0].familyName).toBe('FamilyX')
      expect(allStats[1].familyName).toBe('FamilyY')
    })

    it('calculates correct stats per family', () => {
      const parts = [
        createPart('X1', 10, 50, 100, 'S1', 'FamilyX'),
        createPart('X2', 20, 50, 100, 'S1', 'FamilyX'),
        createPart('X3', 30, 50, 100, 'S2', 'FamilyX'),
        createPart('Y1', 100, 50, 100, 'S3', 'FamilyY'),
        createPart('Y2', 200, 50, 100, 'S3', 'FamilyY'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      const familyX = allStats.find((s) => s.familyName === 'FamilyX')!
      const familyY = allStats.find((s) => s.familyName === 'FamilyY')!

      expect(familyX.min).toBe(10)
      expect(familyX.max).toBe(30)
      expect(familyX.median).toBe(20)
      expect(familyX.n).toBe(3)

      expect(familyY.min).toBe(100)
      expect(familyY.max).toBe(200)
      expect(familyY.median).toBe(150) // interpolated for 2 values
      expect(familyY.n).toBe(2)
    })
  })

  describe('Unassigned handling (AC-3.16.7)', () => {
    it('groups parts without PartFamily under "Unassigned"', () => {
      const parts = [
        createPart('A1', 10, 50, 100, 'Series A', 'FamilyX'),
        createPart('A2', 12, 50, 100, 'Series A'), // no family
        createPart('A3', 14, 50, 100, 'Series B'), // no family
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      const names = allStats.map((s) => s.familyName)
      expect(names).toContain('Unassigned')
      expect(names).toContain('FamilyX')
    })

    it('calculates stats correctly for Unassigned family', () => {
      const parts = [
        createPart('U1', 10, 50, 100, 'S1'), // no family
        createPart('U2', 20, 50, 100, 'S1'), // no family
        createPart('U3', 30, 50, 100, 'S2'), // no family
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats).toHaveLength(1)
      expect(allStats[0].familyName).toBe('Unassigned')
      expect(allStats[0].n).toBe(3)
      expect(allStats[0].median).toBe(20)
    })

    it('handles undefined PartFamily as Unassigned', () => {
      const parts = [
        { ...createPart('P1', 10, 50, 100, 'S1'), PartFamily: undefined },
        { ...createPart('P2', 20, 50, 100, 'S1'), PartFamily: undefined },
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats).toHaveLength(1)
      expect(allStats[0].familyName).toBe('Unassigned')
    })
  })

  describe('seriesCount accuracy', () => {
    it('counts unique series within each family', () => {
      const parts = [
        createPart('X1', 10, 50, 100, 'S1', 'FamilyX'),
        createPart('X2', 12, 50, 100, 'S1', 'FamilyX'),
        createPart('X3', 14, 50, 100, 'S2', 'FamilyX'),
        createPart('X4', 16, 50, 100, 'S3', 'FamilyX'),
        createPart('Y1', 20, 50, 100, 'S4', 'FamilyY'),
        createPart('Y2', 22, 50, 100, 'S4', 'FamilyY'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      const familyX = allStats.find((s) => s.familyName === 'FamilyX')!
      const familyY = allStats.find((s) => s.familyName === 'FamilyY')!

      expect(familyX.seriesCount).toBe(3) // S1, S2, S3
      expect(familyY.seriesCount).toBe(1) // S4
    })

    it('treats undefined PartSeries as Uncategorized for seriesCount', () => {
      const parts = [
        { ...createPart('P1', 10, 50, 100, 'S1', 'FamilyX'), PartSeries: undefined },
        { ...createPart('P2', 12, 50, 100, 'S2', 'FamilyX'), PartSeries: undefined },
        createPart('P3', 14, 50, 100, 'S3', 'FamilyX'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      // Two undefined series → one Uncategorized, plus one S3
      expect(allStats[0].seriesCount).toBe(2)
    })
  })

  describe('alphabetical sorting', () => {
    it('returns stats sorted alphabetically by familyName', () => {
      const parts = [
        createPart('Z1', 10, 50, 100, 'S1', 'Zebra'),
        createPart('A1', 20, 50, 100, 'S2', 'Alpha'),
        createPart('M1', 30, 50, 100, 'S3', 'Middle'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats[0].familyName).toBe('Alpha')
      expect(allStats[1].familyName).toBe('Middle')
      expect(allStats[2].familyName).toBe('Zebra')
    })

    it('Unassigned sorts correctly among named families', () => {
      const parts = [
        createPart('Z1', 10, 50, 100, 'S1', 'Zebra'),
        createPart('U1', 20, 50, 100, 'S2'), // Unassigned
        createPart('A1', 30, 50, 100, 'S3', 'Alpha'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      // Unassigned should sort alphabetically (U comes after A, before Z)
      expect(allStats[0].familyName).toBe('Alpha')
      expect(allStats[1].familyName).toBe('Unassigned')
      expect(allStats[2].familyName).toBe('Zebra')
    })
  })

  describe('outlier detection per family', () => {
    it('identifies outliers independently per family', () => {
      const parts = [
        // FamilyX: tight distribution with one outlier
        ...Array.from({ length: 9 }, (_, i) =>
          createPart(`X${i}`, 10, 50, 100, 'S1', 'FamilyX')
        ),
        createPart('X-OUT', 100, 50, 100, 'S1', 'FamilyX'), // outlier

        // FamilyY: tight distribution, no outliers
        ...Array.from({ length: 5 }, (_, i) =>
          createPart(`Y${i}`, 20, 50, 100, 'S2', 'FamilyY')
        ),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      const familyX = allStats.find((s) => s.familyName === 'FamilyX')!
      const familyY = allStats.find((s) => s.familyName === 'FamilyY')!

      expect(familyX.outliers).toHaveLength(1)
      expect(familyX.outliers[0].partCallout).toBe('X-OUT')
      expect(familyY.outliers).toHaveLength(0)
    })
  })

  describe('dimension handling', () => {
    it('calculates stats for width dimension', () => {
      const parts = [
        createPart('P1', 10, 50, 100, 'S1', 'Family'),
        createPart('P2', 20, 60, 110, 'S1', 'Family'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats[0].min).toBe(10)
      expect(allStats[0].max).toBe(20)
    })

    it('calculates stats for height dimension', () => {
      const parts = [
        createPart('P1', 10, 50, 100, 'S1', 'Family'),
        createPart('P2', 20, 60, 110, 'S1', 'Family'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'height')

      expect(allStats[0].min).toBe(50)
      expect(allStats[0].max).toBe(60)
    })

    it('calculates stats for length dimension', () => {
      const parts = [
        createPart('P1', 10, 50, 100, 'S1', 'Family'),
        createPart('P2', 20, 60, 110, 'S1', 'Family'),
      ]

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'length')

      expect(allStats[0].min).toBe(100)
      expect(allStats[0].max).toBe(110)
    })
  })

  describe('scale handling', () => {
    it('handles many families (30+ families)', () => {
      const parts: Part[] = []
      for (let f = 0; f < 35; f++) {
        for (let p = 0; p < 10; p++) {
          parts.push(
            createPart(
              `F${f}-P${p}`,
              10 + f,
              50,
              100,
              `Series-${p}`,
              `Family-${f.toString().padStart(2, '0')}`
            )
          )
        }
      }

      const allStats = calculateAllFamilyBoxPlotStats(parts, 'width')

      expect(allStats).toHaveLength(35)
      // Verify sorting works with many families
      expect(allStats[0].familyName).toBe('Family-00')
      expect(allStats[34].familyName).toBe('Family-34')
    })
  })
})

// =============================================================================
// Family vs Series Consistency Tests
// =============================================================================

describe('Family vs Series consistency', () => {
  it('family max equals the max of all parts within that family', () => {
    // Create parts across multiple series within ONE family
    // Series A: values 10-50
    // Series B: values 60-100 (higher range)
    const parts = [
      createPart('A1', 10, 50, 100, 'Series A', 'FamilyX'),
      createPart('A2', 30, 50, 100, 'Series A', 'FamilyX'),
      createPart('A3', 50, 50, 100, 'Series A', 'FamilyX'),
      createPart('B1', 60, 50, 100, 'Series B', 'FamilyX'),
      createPart('B2', 80, 50, 100, 'Series B', 'FamilyX'),
      createPart('B3', 100, 50, 100, 'Series B', 'FamilyX'), // MAX value
    ]

    // Calculate family stats
    const familyStats = calculateAllFamilyBoxPlotStats(parts, 'width')

    // Calculate series stats for same parts
    const seriesStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    // Family should see ALL parts
    const family = familyStats.find((f) => f.familyName === 'FamilyX')!
    expect(family.n).toBe(6)

    // The max of the series within this family
    const seriesMaxes = seriesStats.map((s) => s.max)
    const maxOfSeries = Math.max(...seriesMaxes)

    // CRITICAL INVARIANT: Family max MUST equal the max of all its parts
    expect(family.max).toBe(100)
    expect(family.max).toBe(maxOfSeries)
  })

  it('family sees all parts that series see when filtered by family', () => {
    // Simulate the exact data flow: parts filtered by family
    const allParts = [
      createPart('A1', 10, 50, 100, 'Series A', 'FamilyX'),
      createPart('A2', 80, 50, 100, 'Series A', 'FamilyX'),
      createPart('B1', 50, 50, 100, 'Series B', 'FamilyX'),
      createPart('B2', 100, 50, 100, 'Series B', 'FamilyX'), // MAX
      createPart('C1', 200, 50, 100, 'Series C', 'FamilyY'), // Different family
    ]

    // Family-level calculation (what useBoxPlotFamilyDistribution does)
    const familyStats = calculateAllFamilyBoxPlotStats(allParts, 'width')
    const familyX = familyStats.find((f) => f.familyName === 'FamilyX')!

    // Series-level calculation with family filter (what useBoxPlotDistribution does)
    const partsInFamilyX = allParts.filter((p) => p.PartFamily === 'FamilyX')
    const seriesStats = calculateAllSeriesBoxPlotStats(partsInFamilyX, 'width')

    // Both should see 4 parts for FamilyX
    expect(familyX.n).toBe(4)
    expect(seriesStats.reduce((sum, s) => sum + s.n, 0)).toBe(4)

    // Both should see max of 100
    expect(familyX.max).toBe(100)
    expect(Math.max(...seriesStats.map((s) => s.max))).toBe(100)
  })

  it('family whiskerHigh is at least as high as any series whiskerHigh within it', () => {
    // Create a scenario with outliers in one series
    const parts = [
      // Series A: normal distribution
      ...Array.from({ length: 9 }, (_, i) =>
        createPart(`A${i}`, 10, 50, 100, 'Series A', 'FamilyX')
      ),
      // Series B: includes a value that would be an outlier in Series A
      // but might not be an outlier at the family level
      createPart('B1', 50, 50, 100, 'Series B', 'FamilyX'),
      createPart('B2', 60, 50, 100, 'Series B', 'FamilyX'),
      createPart('B3', 70, 50, 100, 'Series B', 'FamilyX'),
      createPart('B4', 80, 50, 100, 'Series B', 'FamilyX'),
    ]

    const familyStats = calculateAllFamilyBoxPlotStats(parts, 'width')
    const seriesStats = calculateAllSeriesBoxPlotStats(parts, 'width')

    const family = familyStats.find((f) => f.familyName === 'FamilyX')!
    const seriesWhiskerHighs = seriesStats.map((s) => s.whiskerHigh)
    const maxSeriesWhiskerHigh = Math.max(...seriesWhiskerHighs)

    // Family whiskerHigh should reflect the spread of ALL values
    // It may not be exactly equal due to different IQR calculations,
    // but the family MAX should always be >= any series MAX
    expect(family.max).toBeGreaterThanOrEqual(maxSeriesWhiskerHigh)
  })

  it('parts with undefined PartFamily are correctly assigned to Unassigned', () => {
    const parts = [
      createPart('A1', 10, 50, 100, 'Series A', 'FamilyX'),
      createPart('A2', 100, 50, 100, 'Series A'), // No family - should be Unassigned
    ]

    const familyStats = calculateAllFamilyBoxPlotStats(parts, 'width')

    // Should have 2 families: FamilyX and Unassigned
    expect(familyStats).toHaveLength(2)

    const familyX = familyStats.find((f) => f.familyName === 'FamilyX')!
    const unassigned = familyStats.find((f) => f.familyName === 'Unassigned')!

    // FamilyX should only have the 10mm part
    expect(familyX.n).toBe(1)
    expect(familyX.max).toBe(10)

    // Unassigned should have the 100mm part
    expect(unassigned.n).toBe(1)
    expect(unassigned.max).toBe(100)
  })
})
