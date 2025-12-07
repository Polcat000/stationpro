// src/lib/analysis/__tests__/envelope.test.ts
// Unit tests for worst-case envelope calculation functions
// Coverage target: 95%+ per architecture mandate

import { describe, it, expect } from 'vitest'
import { calculateEnvelope } from '../envelope'
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
// calculateEnvelope Tests (AC 3.6.4)
// =============================================================================

describe('calculateEnvelope', () => {
  describe('empty array handling', () => {
    it('returns null for empty array', () => {
      expect(calculateEnvelope([])).toBeNull()
    })
  })

  describe('single part handling', () => {
    it('returns single part dimensions for single part', () => {
      const parts = [
        createTestPart({
          PartCallout: 'ONLY',
          PartWidth_mm: 50,
          PartHeight_mm: 25,
          PartLength_mm: 100,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result).not.toBeNull()
      expect(result!.width_mm).toBe(50)
      expect(result!.height_mm).toBe(25)
      expect(result!.length_mm).toBe(100)
    })

    it('identifies single part as driver for all dimensions', () => {
      const parts = [
        createTestPart({
          PartCallout: 'ONLY-PART',
          PartWidth_mm: 50,
          PartHeight_mm: 25,
          PartLength_mm: 100,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.drivers.maxWidth.partCallout).toBe('ONLY-PART')
      expect(result!.drivers.maxHeight.partCallout).toBe('ONLY-PART')
      expect(result!.drivers.maxLength.partCallout).toBe('ONLY-PART')
    })
  })

  describe('max dimension calculation (AC 3.6.4)', () => {
    it('calculates max dimensions correctly for 3 parts', () => {
      const parts = [
        createTestPart({
          PartCallout: 'A',
          PartWidth_mm: 10,
          PartHeight_mm: 5,
          PartLength_mm: 20,
        }),
        createTestPart({
          PartCallout: 'B',
          PartWidth_mm: 25,
          PartHeight_mm: 12,
          PartLength_mm: 15,
        }),
        createTestPart({
          PartCallout: 'C',
          PartWidth_mm: 15,
          PartHeight_mm: 8,
          PartLength_mm: 30,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result).not.toBeNull()
      expect(result!.width_mm).toBe(25)
      expect(result!.height_mm).toBe(12)
      expect(result!.length_mm).toBe(30)
    })

    it('calculates max correctly for AC verification case - widths [10, 25, 45]', () => {
      // AC 3.6.1 verification: Max Width = 45.00 mm
      const parts = [
        createTestPart({ PartCallout: 'P1', PartWidth_mm: 10 }),
        createTestPart({ PartCallout: 'P2', PartWidth_mm: 25 }),
        createTestPart({ PartCallout: 'P3', PartWidth_mm: 45 }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(45)
    })

    it('calculates max correctly for AC verification case - heights [5, 12, 8]', () => {
      // AC 3.6.1 verification: Max Height = 12.00 mm
      const parts = [
        createTestPart({ PartCallout: 'P1', PartHeight_mm: 5 }),
        createTestPart({ PartCallout: 'P2', PartHeight_mm: 12 }),
        createTestPart({ PartCallout: 'P3', PartHeight_mm: 8 }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.height_mm).toBe(12)
    })

    it('calculates max correctly for AC verification case - widths [10, 20, 30, 15, 25]', () => {
      // AC 3.6.4 verification: Max Width = 30
      const parts = [
        createTestPart({ PartCallout: 'P1', PartWidth_mm: 10 }),
        createTestPart({ PartCallout: 'P2', PartWidth_mm: 20 }),
        createTestPart({ PartCallout: 'P3', PartWidth_mm: 30 }),
        createTestPart({ PartCallout: 'P4', PartWidth_mm: 15 }),
        createTestPart({ PartCallout: 'P5', PartWidth_mm: 25 }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(30)
    })

    it('each dimension calculated independently', () => {
      // AC 3.6.4: All dimensions independently calculated
      const parts = [
        createTestPart({
          PartCallout: 'P1',
          PartWidth_mm: 100,
          PartHeight_mm: 10,
          PartLength_mm: 50,
        }),
        createTestPart({
          PartCallout: 'P2',
          PartWidth_mm: 50,
          PartHeight_mm: 100,
          PartLength_mm: 10,
        }),
        createTestPart({
          PartCallout: 'P3',
          PartWidth_mm: 10,
          PartHeight_mm: 50,
          PartLength_mm: 100,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(100)
      expect(result!.height_mm).toBe(100)
      expect(result!.length_mm).toBe(100)
    })
  })

  describe('driver identification (AC 3.6.2)', () => {
    it('identifies correct driver parts for each dimension', () => {
      const parts = [
        createTestPart({
          PartCallout: 'CONN-A',
          PartWidth_mm: 45,
          PartHeight_mm: 5,
          PartLength_mm: 20,
        }),
        createTestPart({
          PartCallout: 'CONN-B',
          PartWidth_mm: 30,
          PartHeight_mm: 15,
          PartLength_mm: 25,
        }),
        createTestPart({
          PartCallout: 'CONN-C',
          PartWidth_mm: 35,
          PartHeight_mm: 10,
          PartLength_mm: 40,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.drivers.maxWidth.partCallout).toBe('CONN-A')
      expect(result!.drivers.maxHeight.partCallout).toBe('CONN-B')
      expect(result!.drivers.maxLength.partCallout).toBe('CONN-C')
    })

    it('driver includes partId matching PartCallout', () => {
      const parts = [
        createTestPart({
          PartCallout: 'CABLE-X',
          PartWidth_mm: 100,
          PartHeight_mm: 50,
          PartLength_mm: 200,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.drivers.maxWidth.partId).toBe('CABLE-X')
      expect(result!.drivers.maxWidth.partCallout).toBe('CABLE-X')
    })

    it('driver value matches envelope dimension', () => {
      const parts = [
        createTestPart({
          PartCallout: 'PART-A',
          PartWidth_mm: 75,
          PartHeight_mm: 40,
          PartLength_mm: 120,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.drivers.maxWidth.value).toBe(75)
      expect(result!.width_mm).toBe(75)
      expect(result!.drivers.maxHeight.value).toBe(40)
      expect(result!.height_mm).toBe(40)
      expect(result!.drivers.maxLength.value).toBe(120)
      expect(result!.length_mm).toBe(120)
    })

    it('each dimension can have different driver - AC verification', () => {
      // AC 3.6.4: Width driver may differ from Height driver
      const parts = [
        createTestPart({
          PartCallout: 'WIDE',
          PartWidth_mm: 100,
          PartHeight_mm: 5,
          PartLength_mm: 5,
        }),
        createTestPart({
          PartCallout: 'TALL',
          PartWidth_mm: 5,
          PartHeight_mm: 100,
          PartLength_mm: 5,
        }),
        createTestPart({
          PartCallout: 'LONG',
          PartWidth_mm: 5,
          PartHeight_mm: 5,
          PartLength_mm: 100,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.drivers.maxWidth.partCallout).toBe('WIDE')
      expect(result!.drivers.maxHeight.partCallout).toBe('TALL')
      expect(result!.drivers.maxLength.partCallout).toBe('LONG')
    })
  })

  describe('tie-breaking (AC 3.6.2)', () => {
    it('uses first part when multiple have same max (tie-breaking)', () => {
      // AC 3.6.2: if multiple parts tie, show the first one (by array order)
      const parts = [
        createTestPart({ PartCallout: 'FIRST', PartWidth_mm: 20 }),
        createTestPart({ PartCallout: 'SECOND', PartWidth_mm: 20 }),
        createTestPart({ PartCallout: 'THIRD', PartWidth_mm: 20 }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.drivers.maxWidth.partCallout).toBe('FIRST')
    })

    it('tie-breaking applies independently per dimension', () => {
      const parts = [
        createTestPart({
          PartCallout: 'FIRST',
          PartWidth_mm: 50,
          PartHeight_mm: 30,
          PartLength_mm: 100,
        }),
        createTestPart({
          PartCallout: 'SECOND',
          PartWidth_mm: 50,
          PartHeight_mm: 50,
          PartLength_mm: 100,
        }),
        createTestPart({
          PartCallout: 'THIRD',
          PartWidth_mm: 40,
          PartHeight_mm: 50,
          PartLength_mm: 100,
        }),
      ]

      const result = calculateEnvelope(parts)

      // Width: FIRST and SECOND tie at 50, FIRST wins
      expect(result!.drivers.maxWidth.partCallout).toBe('FIRST')
      // Height: SECOND and THIRD tie at 50, SECOND wins (first in order)
      expect(result!.drivers.maxHeight.partCallout).toBe('SECOND')
      // Length: all tie at 100, FIRST wins
      expect(result!.drivers.maxLength.partCallout).toBe('FIRST')
    })

    it('AC verification - CABLE-X and CABLE-Y tie on height', () => {
      // AC 3.6.2 verification: Part "CABLE-X" height=20, Part "CABLE-Y" height=20
      // → Max Height shows first one encountered
      const parts = [
        createTestPart({ PartCallout: 'CABLE-X', PartHeight_mm: 20 }),
        createTestPart({ PartCallout: 'CABLE-Y', PartHeight_mm: 20 }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.drivers.maxHeight.partCallout).toBe('CABLE-X')
    })
  })

  describe('decimal values', () => {
    it('handles decimal dimension values', () => {
      const parts = [
        createTestPart({
          PartCallout: 'DECIMAL',
          PartWidth_mm: 45.5,
          PartHeight_mm: 12.75,
          PartLength_mm: 100.125,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(45.5)
      expect(result!.height_mm).toBe(12.75)
      expect(result!.length_mm).toBe(100.125)
    })

    it('finds max with decimal precision', () => {
      const parts = [
        createTestPart({ PartCallout: 'A', PartWidth_mm: 45.123 }),
        createTestPart({ PartCallout: 'B', PartWidth_mm: 45.124 }),
        createTestPart({ PartCallout: 'C', PartWidth_mm: 45.122 }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(45.124)
      expect(result!.drivers.maxWidth.partCallout).toBe('B')
    })
  })

  describe('large datasets', () => {
    it('handles many parts efficiently', () => {
      const parts = Array.from({ length: 100 }, (_, i) =>
        createTestPart({
          PartCallout: `PART-${i}`,
          PartWidth_mm: i + 1,
          PartHeight_mm: 100 - i,
          PartLength_mm: (i % 50) + 1,
        })
      )

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(100) // PART-99 has width 100
      expect(result!.height_mm).toBe(100) // PART-0 has height 100
      expect(result!.length_mm).toBe(50) // PART-49 has length 50
    })
  })

  describe('edge cases', () => {
    it('handles zero dimensions', () => {
      const parts = [
        createTestPart({
          PartCallout: 'ZERO',
          PartWidth_mm: 0,
          PartHeight_mm: 0,
          PartLength_mm: 0,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(0)
      expect(result!.height_mm).toBe(0)
      expect(result!.length_mm).toBe(0)
    })

    it('handles very large dimensions', () => {
      const parts = [
        createTestPart({
          PartCallout: 'LARGE',
          PartWidth_mm: 10000,
          PartHeight_mm: 5000,
          PartLength_mm: 20000,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(10000)
      expect(result!.height_mm).toBe(5000)
      expect(result!.length_mm).toBe(20000)
    })

    it('handles very small dimensions', () => {
      const parts = [
        createTestPart({
          PartCallout: 'TINY',
          PartWidth_mm: 0.001,
          PartHeight_mm: 0.002,
          PartLength_mm: 0.003,
        }),
      ]

      const result = calculateEnvelope(parts)

      expect(result!.width_mm).toBe(0.001)
      expect(result!.height_mm).toBe(0.002)
      expect(result!.length_mm).toBe(0.003)
    })
  })
})
