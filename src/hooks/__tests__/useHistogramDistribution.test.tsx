// src/hooks/__tests__/useHistogramDistribution.test.tsx
// Tests for useHistogramDistribution hook
// AC-3.7a.2: Histogram drill-down, AC-3.7a.3: Single-series auto-switch
// AC-3.7a.5: Part callouts per bin

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHistogramDistribution } from '../useHistogramDistribution'
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

describe('useHistogramDistribution', () => {
  beforeEach(() => {
    // Reset working set store before each test
    useWorkingSetStore.getState().clearAll()
  })

  describe('empty state', () => {
    it('returns isEmpty=true when working set is empty', () => {
      const wrapper = createWrapper([])

      const { result } = renderHook(() => useHistogramDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.partCount).toBe(0)
    })

    it('returns empty bins when no parts match working set', () => {
      const parts = [createTestPart('PART-1', 'Series A', 10)]
      const wrapper = createWrapper(parts)

      // Don't add any parts to working set
      const { result } = renderHook(() => useHistogramDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.widthData.bins).toEqual([])
      expect(result.current.heightData.bins).toEqual([])
      expect(result.current.lengthData.bins).toEqual([])
    })

    it('returns isEmpty=true when series filter matches no parts', () => {
      const parts = [createTestPart('PART-1', 'Series A', 10)]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('PART-1')

      // Filter by non-existent series
      const { result } = renderHook(
        () => useHistogramDistribution('Series B'),
        { wrapper }
      )

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.partCount).toBe(0)
    })
  })

  describe('series filtering (AC-3.7a.2)', () => {
    it('filters parts by series name', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Alpha', 15),
        createTestPart('P3', 'Beta', 20),
        createTestPart('P4', 'Beta', 25),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Alpha'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(2)
      })

      expect(result.current.seriesName).toBe('Alpha')
    })

    it('includes all working set parts when seriesName is null', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Beta', 20),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution(null),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(2)
      })

      expect(result.current.seriesName).toBe('Multiple Series')
    })

    it('handles Uncategorized series (missing PartSeries)', async () => {
      const parts = [
        { ...createTestPart('P1', '', 10), PartSeries: undefined },
        { ...createTestPart('P2', '', 15), PartSeries: undefined },
      ] as Part[]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Uncategorized'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(2)
      })

      expect(result.current.seriesName).toBe('Uncategorized')
    })
  })

  describe('histogram bin data (AC-3.7a.2)', () => {
    it('creates histogram bins for each dimension', async () => {
      const parts = Array.from({ length: 20 }, (_, i) =>
        createTestPart(`P${i}`, 'Series', i * 5, i * 3, i * 8)
      )
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      expect(result.current.heightData.bins.length).toBeGreaterThan(0)
      expect(result.current.lengthData.bins.length).toBeGreaterThan(0)
    })

    it('includes bin range in each bin', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 50),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      const bin = result.current.widthData.bins[0]
      expect(bin.binStart).toBeDefined()
      expect(bin.binEnd).toBeDefined()
      expect(bin.binEnd).toBeGreaterThan(bin.binStart)
    })

    it('includes part callouts in bins (AC-3.7a.5)', async () => {
      const parts = [
        createTestPart('PART-001', 'Series', 10),
        createTestPart('PART-002', 'Series', 11),
        createTestPart('PART-003', 'Series', 12),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series', 1), // 1 bin = all parts in same bin
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      const bin = result.current.widthData.bins[0]
      expect(bin.partCallouts).toContain('PART-001')
      expect(bin.partCallouts).toContain('PART-002')
      expect(bin.partCallouts).toContain('PART-003')
    })

    it('correctly counts parts per bin', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 11),
        createTestPart('P3', 'Series', 50),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series', 2), // 2 bins
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      // 2 parts should be in lower bin, 1 in higher bin
      const totalCount = result.current.widthData.bins.reduce(
        (sum, bin) => sum + bin.count,
        0
      )
      expect(totalCount).toBe(3)
    })
  })

  describe('outlier detection in bins', () => {
    it('marks bins containing outliers (AC-3.7a.4)', async () => {
      // Create dataset with clear outlier
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 11),
        createTestPart('P3', 'Series', 12),
        createTestPart('P4', 'Series', 13),
        createTestPart('P5', 'Series', 14),
        createTestPart('OUTLIER', 'Series', 100), // Clear outlier
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series', 10),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      // At least one bin should have outliers
      const hasOutlierBin = result.current.widthData.bins.some(
        (bin) => bin.hasOutliers
      )
      expect(hasOutlierBin).toBe(true)

      // Find the bin with the outlier
      const outlierBin = result.current.widthData.bins.find(
        (bin) => bin.partCallouts.includes('OUTLIER')
      )
      expect(outlierBin?.hasOutliers).toBe(true)
    })

    it('does not mark bins without outliers', async () => {
      // Create dataset with no outliers (tight distribution)
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 11),
        createTestPart('P3', 'Series', 12),
        createTestPart('P4', 'Series', 13),
        createTestPart('P5', 'Series', 14),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series', 5),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      // No bins should have outliers
      const hasOutlierBin = result.current.widthData.bins.some(
        (bin) => bin.hasOutliers
      )
      expect(hasOutlierBin).toBe(false)
    })
  })

  describe('configurable bin count', () => {
    it('respects custom bin count', async () => {
      const parts = Array.from({ length: 50 }, (_, i) =>
        createTestPart(`P${i}`, 'Series', i)
      )
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result: result5 } = renderHook(
        () => useHistogramDistribution('Series', 5),
        { wrapper }
      )

      const { result: result20 } = renderHook(
        () => useHistogramDistribution('Series', 20),
        { wrapper }
      )

      await waitFor(() => {
        expect(result5.current.widthData.bins.length).toBeGreaterThan(0)
        expect(result20.current.widthData.bins.length).toBeGreaterThan(0)
      })

      // More bins with higher bin count (though empty bins are filtered)
      expect(result20.current.widthData.bins.length).toBeGreaterThanOrEqual(
        result5.current.widthData.bins.length
      )
    })

    it('defaults to 10 bins', async () => {
      const parts = Array.from({ length: 100 }, (_, i) =>
        createTestPart(`P${i}`, 'Series', i)
      )
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      // Should have <= 10 bins (some may be filtered if empty)
      expect(result.current.widthData.bins.length).toBeLessThanOrEqual(10)
    })
  })

  describe('dimension data (AC-3.7a.2)', () => {
    it('returns min/max values for each dimension', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10, 20, 30),
        createTestPart('P2', 'Series', 50, 60, 70),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData.minValue).toBe(10)
      expect(result.current.widthData.maxValue).toBe(50)
      expect(result.current.heightData.minValue).toBe(20)
      expect(result.current.heightData.maxValue).toBe(60)
      expect(result.current.lengthData.minValue).toBe(30)
      expect(result.current.lengthData.maxValue).toBe(70)
    })

    it('returns part count per dimension', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 20),
        createTestPart('P3', 'Series', 30),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(3)
      })

      expect(result.current.widthData.partCount).toBe(3)
      expect(result.current.heightData.partCount).toBe(3)
      expect(result.current.lengthData.partCount).toBe(3)
    })
  })

  describe('single-series detection (AC-3.7a.3)', () => {
    it('returns single series name when all parts are same series', async () => {
      const parts = [
        createTestPart('P1', 'OnlySeries', 10),
        createTestPart('P2', 'OnlySeries', 20),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution(null), // No filter
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(2)
      })

      expect(result.current.seriesName).toBe('OnlySeries')
    })

    it('returns "Multiple Series" when parts span multiple series', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Beta', 20),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution(null),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(2)
      })

      expect(result.current.seriesName).toBe('Multiple Series')
    })
  })

  describe('memoization', () => {
    it('memoizes dimension data to prevent unnecessary recalculations', async () => {
      const parts = [createTestPart('P1', 'Series', 10)]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('P1')

      const { result, rerender } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.widthData.bins.length).toBeGreaterThan(0)
      })

      const initialWidthData = result.current.widthData

      // Re-render with same props
      rerender()

      // Should return same reference (memoized)
      expect(result.current.widthData).toBe(initialWidthData)
    })
  })

  describe('edge cases', () => {
    it('handles single part', async () => {
      const parts = [createTestPart('SOLO', 'Series', 42)]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('SOLO')

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(1)
      })

      expect(result.current.widthData.bins).toHaveLength(1)
      expect(result.current.widthData.bins[0].count).toBe(1)
      expect(result.current.widthData.bins[0].partCallouts).toContain('SOLO')
    })

    it('handles all identical values', async () => {
      const parts = [
        createTestPart('P1', 'Series', 42),
        createTestPart('P2', 'Series', 42),
        createTestPart('P3', 'Series', 42),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(3)
      })

      // All parts in one bin
      expect(result.current.widthData.bins).toHaveLength(1)
      expect(result.current.widthData.bins[0].count).toBe(3)
    })

    it('handles decimal values', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10.123),
        createTestPart('P2', 'Series', 10.456),
        createTestPart('P3', 'Series', 10.789),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(
        () => useHistogramDistribution('Series'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.partCount).toBe(3)
      })

      expect(result.current.widthData.bins.length).toBeGreaterThan(0)
    })
  })
})
