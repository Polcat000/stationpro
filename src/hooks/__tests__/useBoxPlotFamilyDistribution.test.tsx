// src/hooks/__tests__/useBoxPlotFamilyDistribution.test.tsx
// Tests for useBoxPlotFamilyDistribution hook
// AC-3.16.3: Family distribution hook returning family-level box plot data

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBoxPlotFamilyDistribution } from '../useBoxPlotFamilyDistribution'
import { useWorkingSetStore } from '@/stores/workingSet'
import type { Part } from '@/types/domain'
import type { ReactNode } from 'react'

// =============================================================================
// Mocks
// =============================================================================

// Mock the parts query
vi.mock('@/lib/queries/parts', () => ({
  partsQueryOptions: {
    queryKey: ['parts'],
    queryFn: vi.fn(),
  },
}))

// =============================================================================
// Test Helpers
// =============================================================================

function createTestPart(
  callout: string,
  series: string,
  width: number,
  height: number = 50,
  length: number = 100,
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

function createWrapper(parts: Part[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  // Pre-populate the cache with parts data
  queryClient.setQueryData(['parts'], parts)

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('useBoxPlotFamilyDistribution', () => {
  beforeEach(() => {
    // Reset working set store before each test
    useWorkingSetStore.getState().clearAll()
  })

  describe('empty state', () => {
    it('returns isEmpty=true when working set is empty', () => {
      const wrapper = createWrapper([])

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.partCount).toBe(0)
      expect(result.current.familyCount).toBe(0)
    })

    it('returns empty data arrays when no parts match working set', () => {
      const parts = [createTestPart('PART-1', 'Series A', 10, 50, 100, 'FamilyX')]
      const wrapper = createWrapper(parts)

      // Don't add any parts to working set
      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.widthData.data).toEqual([])
      expect(result.current.heightData.data).toEqual([])
      expect(result.current.lengthData.data).toEqual([])
    })
  })

  describe('Nivo data format (AC-3.16.3)', () => {
    it('transforms parts into NivoBoxPlotFamilyDatum format', async () => {
      const parts = [
        createTestPart('PART-1', 'Series A', 10, 50, 100, 'FamilyX'),
        createTestPart('PART-2', 'Series A', 12, 50, 100, 'FamilyX'),
        createTestPart('PART-3', 'Series B', 20, 50, 100, 'FamilyY'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      // Each part becomes one datum
      expect(result.current.widthData.data).toHaveLength(3)

      // Check datum format - grouped by family
      const datum = result.current.widthData.data.find(d => d.partCallout === 'PART-1')
      expect(datum).toBeDefined()
      expect(datum!.group).toBe('FamilyX')
      expect(datum!.value).toBe(10)
      expect(datum!.partCallout).toBe('PART-1')
    })

    it('groups data by family name in group field', async () => {
      const parts = [
        createTestPart('P1', 'S1', 10, 50, 100, 'Alpha'),
        createTestPart('P2', 'S1', 11, 50, 100, 'Alpha'),
        createTestPart('P3', 'S2', 20, 50, 100, 'Beta'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      const alphaData = result.current.widthData.data.filter(d => d.group === 'Alpha')
      const betaData = result.current.widthData.data.filter(d => d.group === 'Beta')

      expect(alphaData).toHaveLength(2)
      expect(betaData).toHaveLength(1)
    })

    it('includes partCallout in each datum for tooltip display', async () => {
      const parts = [createTestPart('MY-PART-ID', 'Series', 15, 50, 100, 'Family')]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('MY-PART-ID')

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.data[0].partCallout).toBe('MY-PART-ID')
    })
  })

  describe('family stats (for outlier layer)', () => {
    it('provides pre-computed BoxPlotFamilyStats per family', async () => {
      const parts = [
        createTestPart('A1', 'S1', 10, 50, 100, 'FamilyX'),
        createTestPart('A2', 'S1', 20, 50, 100, 'FamilyX'),
        createTestPart('A3', 'S2', 30, 50, 100, 'FamilyX'),
        createTestPart('B1', 'S3', 100, 50, 100, 'FamilyY'),
        createTestPart('B2', 'S3', 200, 50, 100, 'FamilyY'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.familyStats.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.familyStats).toHaveLength(2)

      const familyXStats = result.current.widthData.familyStats.find(
        s => s.familyName === 'FamilyX'
      )
      expect(familyXStats).toBeDefined()
      expect(familyXStats!.min).toBe(10)
      expect(familyXStats!.max).toBe(30)
      expect(familyXStats!.median).toBe(20)
      expect(familyXStats!.n).toBe(3)
    })

    it('includes seriesCount in familyStats', async () => {
      const parts = [
        createTestPart('A1', 'S1', 10, 50, 100, 'FamilyX'),
        createTestPart('A2', 'S1', 20, 50, 100, 'FamilyX'),
        createTestPart('A3', 'S2', 30, 50, 100, 'FamilyX'), // different series
        createTestPart('B1', 'S3', 100, 50, 100, 'FamilyY'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.familyStats.length).toBeGreaterThan(0)
      })

      const familyXStats = result.current.widthData.familyStats.find(
        s => s.familyName === 'FamilyX'
      )
      expect(familyXStats!.seriesCount).toBe(2) // S1 and S2
    })

    it('includes outliers in familyStats', async () => {
      // 9 normal parts + 1 outlier in FamilyX
      const parts = [
        ...Array.from({ length: 9 }, (_, i) =>
          createTestPart(`NORMAL-${i}`, 'Series', 10, 50, 100, 'FamilyX')
        ),
        createTestPart('OUTLIER', 'Series', 100, 50, 100, 'FamilyX'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.familyStats.length).toBeGreaterThan(0)
      })

      const stats = result.current.widthData.familyStats[0]
      expect(stats.outliers.length).toBeGreaterThan(0)
      expect(stats.outliers[0].partCallout).toBe('OUTLIER')
      expect(stats.outliers[0].value).toBe(100)
    })
  })

  describe('family count and names', () => {
    it('returns familyCount for view switching logic', async () => {
      const parts = [
        createTestPart('A1', 'S1', 10, 50, 100, 'FamilyA'),
        createTestPart('A2', 'S1', 11, 50, 100, 'FamilyA'),
        createTestPart('B1', 'S2', 20, 50, 100, 'FamilyB'),
        createTestPart('C1', 'S3', 30, 50, 100, 'FamilyC'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.familyCount).toBe(3)
      })

      expect(result.current.familyNames).toEqual(['FamilyA', 'FamilyB', 'FamilyC'])
    })

    it('returns familyCount=1 for single-family working set', async () => {
      const parts = [
        createTestPart('A1', 'S1', 10, 50, 100, 'OnlyFamily'),
        createTestPart('A2', 'S1', 20, 50, 100, 'OnlyFamily'),
        createTestPart('A3', 'S2', 30, 50, 100, 'OnlyFamily'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.familyCount).toBe(1)
      })

      expect(result.current.familyNames).toEqual(['OnlyFamily'])
    })
  })

  describe('Unassigned handling (AC-3.16.7)', () => {
    it('treats undefined PartFamily as "Unassigned"', async () => {
      const partWithoutFamily: Part = {
        PartCallout: 'NO-FAMILY',
        PartSeries: 'Series',
        PartWidth_mm: 10,
        PartHeight_mm: 50,
        PartLength_mm: 100,
        SmallestLateralFeature_um: 100,
        InspectionZones: [],
      }
      const wrapper = createWrapper([partWithoutFamily])

      useWorkingSetStore.getState().togglePart('NO-FAMILY')

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.data[0].group).toBe('Unassigned')
      expect(result.current.familyNames).toContain('Unassigned')
    })

    it('includes Unassigned in familyStats', async () => {
      const parts = [
        createTestPart('P1', 'S1', 10, 50, 100, 'FamilyX'),
        { ...createTestPart('P2', 'S2', 20), PartFamily: undefined },
        { ...createTestPart('P3', 'S2', 25), PartFamily: undefined },
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.familyStats.length).toBeGreaterThan(0)
      })

      const unassignedStats = result.current.widthData.familyStats.find(
        s => s.familyName === 'Unassigned'
      )
      expect(unassignedStats).toBeDefined()
      expect(unassignedStats!.n).toBe(2)
    })
  })

  describe('all three dimensions', () => {
    it('returns separate data for width, height, and length', async () => {
      const parts = [createTestPart('PART-1', 'Series', 10, 20, 30, 'Family')]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('PART-1')

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.data[0].value).toBe(10)
      expect(result.current.widthData.dimension).toBe('width')

      expect(result.current.heightData.data[0].value).toBe(20)
      expect(result.current.heightData.dimension).toBe('height')

      expect(result.current.lengthData.data[0].value).toBe(30)
      expect(result.current.lengthData.dimension).toBe('length')
    })
  })

  describe('partCount', () => {
    it('returns total number of parts in working set', async () => {
      const parts = [
        createTestPart('P1', 'S1', 10, 50, 100, 'A'),
        createTestPart('P2', 'S2', 20, 50, 100, 'B'),
        createTestPart('P3', 'S3', 30, 50, 100, 'C'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.partCount).toBe(3)
      })
    })
  })

  describe('working set reactivity', () => {
    it('recalculates when working set changes', async () => {
      const parts = [
        createTestPart('PART-1', 'Series', 10, 50, 100, 'FamilyA'),
        createTestPart('PART-2', 'Series', 20, 50, 100, 'FamilyB'),
      ]
      const wrapper = createWrapper(parts)

      // Start with one part
      useWorkingSetStore.getState().togglePart('PART-1')

      const { result, rerender } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.partCount).toBe(1)
        expect(result.current.familyCount).toBe(1)
      })

      // Add second part
      useWorkingSetStore.getState().togglePart('PART-2')
      rerender()

      await waitFor(() => {
        expect(result.current.partCount).toBe(2)
        expect(result.current.familyCount).toBe(2)
      })
    })
  })

  describe('scale handling (AC performance)', () => {
    it('handles many families (30+ families scale)', async () => {
      // Create 35 families with 5 parts each
      const parts: Part[] = []
      for (let f = 0; f < 35; f++) {
        for (let p = 0; p < 5; p++) {
          parts.push(
            createTestPart(
              `F${f}-P${p}`,
              `Series-${p}`,
              10 + f,
              50,
              100,
              `Family-${f.toString().padStart(2, '0')}`
            )
          )
        }
      }
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.familyCount).toBe(35)
      })

      expect(result.current.partCount).toBe(175)
      expect(result.current.widthData.familyStats).toHaveLength(35)
    })
  })

  describe('familyNames in dimension data', () => {
    it('includes sorted familyNames in each dimension data', async () => {
      const parts = [
        createTestPart('Z1', 'S1', 10, 50, 100, 'Zebra'),
        createTestPart('A1', 'S2', 20, 50, 100, 'Alpha'),
        createTestPart('M1', 'S3', 30, 50, 100, 'Middle'),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotFamilyDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.familyNames.length).toBe(3)
      })

      // Should be sorted alphabetically
      expect(result.current.widthData.familyNames).toEqual(['Alpha', 'Middle', 'Zebra'])
      expect(result.current.heightData.familyNames).toEqual(['Alpha', 'Middle', 'Zebra'])
      expect(result.current.lengthData.familyNames).toEqual(['Alpha', 'Middle', 'Zebra'])
    })
  })
})
