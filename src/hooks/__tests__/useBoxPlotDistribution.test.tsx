// src/hooks/__tests__/useBoxPlotDistribution.test.tsx
// Tests for useBoxPlotDistribution hook
// AC-3.7a.1: Box plot data for working set, AC-3.7a.3: Single-series detection

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBoxPlotDistribution } from '../useBoxPlotDistribution'
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
  length: number = 100
): Part {
  return {
    PartCallout: callout,
    PartSeries: series,
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

describe('useBoxPlotDistribution', () => {
  beforeEach(() => {
    // Reset working set store before each test
    useWorkingSetStore.getState().clearAll()
  })

  describe('empty state', () => {
    it('returns isEmpty=true when working set is empty', () => {
      const wrapper = createWrapper([])

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.partCount).toBe(0)
      expect(result.current.seriesCount).toBe(0)
    })

    it('returns empty data arrays when no parts match working set', () => {
      const parts = [createTestPart('PART-1', 'Series A', 10)]
      const wrapper = createWrapper(parts)

      // Don't add any parts to working set
      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.widthData.data).toEqual([])
      expect(result.current.heightData.data).toEqual([])
      expect(result.current.lengthData.data).toEqual([])
    })
  })

  describe('Nivo data format (AC-3.7a.1)', () => {
    it('transforms parts into NivoBoxPlotDatum format', async () => {
      const parts = [
        createTestPart('PART-1', 'Series A', 10),
        createTestPart('PART-2', 'Series A', 12),
        createTestPart('PART-3', 'Series B', 20),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      // Each part becomes one datum
      expect(result.current.widthData.data).toHaveLength(3)

      // Check datum format
      const datum = result.current.widthData.data.find(d => d.partCallout === 'PART-1')
      expect(datum).toBeDefined()
      expect(datum!.group).toBe('Series A')
      expect(datum!.value).toBe(10)
      expect(datum!.partCallout).toBe('PART-1')
    })

    it('groups data by series name in group field', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Alpha', 11),
        createTestPart('P3', 'Beta', 20),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
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
      const parts = [createTestPart('MY-PART-ID', 'Series', 15)]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('MY-PART-ID')

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.data[0].partCallout).toBe('MY-PART-ID')
    })
  })

  describe('series stats (for outlier layer)', () => {
    it('provides pre-computed BoxPlotSeriesStats per series', async () => {
      const parts = [
        createTestPart('A1', 'Series A', 10),
        createTestPart('A2', 'Series A', 20),
        createTestPart('A3', 'Series A', 30),
        createTestPart('B1', 'Series B', 100),
        createTestPart('B2', 'Series B', 200),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.seriesStats.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.seriesStats).toHaveLength(2)

      const seriesAStats = result.current.widthData.seriesStats.find(
        s => s.seriesName === 'Series A'
      )
      expect(seriesAStats).toBeDefined()
      expect(seriesAStats!.min).toBe(10)
      expect(seriesAStats!.max).toBe(30)
      expect(seriesAStats!.median).toBe(20)
      expect(seriesAStats!.n).toBe(3)
    })

    it('includes outliers in seriesStats (AC-3.7a.4)', async () => {
      // 9 normal parts + 1 outlier in Series A
      const parts = [
        ...Array.from({ length: 9 }, (_, i) =>
          createTestPart(`NORMAL-${i}`, 'Series A', 10)
        ),
        createTestPart('OUTLIER', 'Series A', 100),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.seriesStats.length).toBeGreaterThan(0)
      })

      const stats = result.current.widthData.seriesStats[0]
      expect(stats.outliers.length).toBeGreaterThan(0)
      expect(stats.outliers[0].partCallout).toBe('OUTLIER')
      expect(stats.outliers[0].value).toBe(100)
    })
  })

  describe('series count (AC-3.7a.3)', () => {
    it('returns seriesCount for view switching logic', async () => {
      const parts = [
        createTestPart('A1', 'Series A', 10),
        createTestPart('A2', 'Series A', 11),
        createTestPart('B1', 'Series B', 20),
        createTestPart('C1', 'Series C', 30),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.seriesCount).toBe(3)
      })

      expect(result.current.seriesNames).toEqual(['Series A', 'Series B', 'Series C'])
    })

    it('returns seriesCount=1 for single-series working set', async () => {
      const parts = [
        createTestPart('A1', 'Only Series', 10),
        createTestPart('A2', 'Only Series', 20),
        createTestPart('A3', 'Only Series', 30),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.seriesCount).toBe(1)
      })

      expect(result.current.seriesNames).toEqual(['Only Series'])
    })
  })

  describe('handles undefined PartSeries', () => {
    it('treats undefined PartSeries as "Uncategorized"', async () => {
      const partWithoutSeries: Part = {
        PartCallout: 'NO-SERIES',
        PartWidth_mm: 10,
        PartHeight_mm: 50,
        PartLength_mm: 100,
        SmallestLateralFeature_um: 100,
        InspectionZones: [],
      }
      const wrapper = createWrapper([partWithoutSeries])

      useWorkingSetStore.getState().togglePart('NO-SERIES')

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.data.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.data[0].group).toBe('Uncategorized')
      expect(result.current.seriesNames).toContain('Uncategorized')
    })
  })

  describe('all three dimensions', () => {
    it('returns separate data for width, height, and length', async () => {
      const parts = [createTestPart('PART-1', 'Series', 10, 20, 30)]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('PART-1')

      const { result } = renderHook(() => useBoxPlotDistribution(), {
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
        createTestPart('P1', 'A', 10),
        createTestPart('P2', 'B', 20),
        createTestPart('P3', 'C', 30),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
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
        createTestPart('PART-1', 'Series', 10),
        createTestPart('PART-2', 'Series', 20),
      ]
      const wrapper = createWrapper(parts)

      // Start with one part
      useWorkingSetStore.getState().togglePart('PART-1')

      const { result, rerender } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.partCount).toBe(1)
      })

      // Add second part
      useWorkingSetStore.getState().togglePart('PART-2')
      rerender()

      await waitFor(() => {
        expect(result.current.partCount).toBe(2)
      })
    })
  })

  describe('scale handling (AC performance)', () => {
    it('handles many series (50+ series scale)', async () => {
      // Create 50 series with 5 parts each
      const parts: Part[] = []
      for (let s = 0; s < 50; s++) {
        for (let p = 0; p < 5; p++) {
          parts.push(
            createTestPart(
              `S${s}-P${p}`,
              `Series-${s.toString().padStart(2, '0')}`,
              10 + s
            )
          )
        }
      }
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useBoxPlotDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.seriesCount).toBe(50)
      })

      expect(result.current.partCount).toBe(250)
      expect(result.current.widthData.seriesStats).toHaveLength(50)
    })
  })
})
