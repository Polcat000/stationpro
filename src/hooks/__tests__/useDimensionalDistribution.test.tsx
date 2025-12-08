// src/hooks/__tests__/useDimensionalDistribution.test.tsx
// Tests for useDimensionalDistribution hook
// AC 3.7.1: Charts rendered, AC 3.7.2: Series grouping, AC 3.7.3: Outlier highlighting

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDimensionalDistribution } from '../useDimensionalDistribution'
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

describe('useDimensionalDistribution', () => {
  beforeEach(() => {
    // Reset working set store before each test
    useWorkingSetStore.getState().clearAll()
  })

  describe('empty state', () => {
    it('returns isEmpty=true when working set is empty', () => {
      const wrapper = createWrapper([])

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.widthData).toEqual([])
      expect(result.current.heightData).toEqual([])
      expect(result.current.lengthData).toEqual([])
    })

    it('returns empty arrays when no parts match working set', () => {
      const parts = [createTestPart('PART-1', 'Series A', 10)]
      const wrapper = createWrapper(parts)

      // Don't add any parts to working set
      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.widthData).toEqual([])
    })
  })

  describe('data transformation', () => {
    it('transforms parts into ChartDataPoints grouped by series', async () => {
      const parts = [
        createTestPart('PART-1', 'Series A', 10),
        createTestPart('PART-2', 'Series A', 10),
        createTestPart('PART-3', 'Series B', 20),
      ]
      const wrapper = createWrapper(parts)

      // Add parts to working set
      useWorkingSetStore.getState().togglePart('PART-1')
      useWorkingSetStore.getState().togglePart('PART-2')
      useWorkingSetStore.getState().togglePart('PART-3')

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBeGreaterThan(0)
      })

      // Should have 2 data points: one for Series A (2 parts), one for Series B (1 part)
      expect(result.current.widthData).toHaveLength(2)

      const seriesAData = result.current.widthData.find((d) => d.series === 'Series A')
      expect(seriesAData).toBeDefined()
      expect(seriesAData!.count).toBe(2)
      expect(seriesAData!.value).toBe(10)

      const seriesBData = result.current.widthData.find((d) => d.series === 'Series B')
      expect(seriesBData).toBeDefined()
      expect(seriesBData!.count).toBe(1)
      expect(seriesBData!.value).toBe(20)
    })

    it('includes partIds in each data point', async () => {
      const parts = [
        createTestPart('PART-1', 'Series A', 10),
        createTestPart('PART-2', 'Series A', 10),
      ]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('PART-1')
      useWorkingSetStore.getState().togglePart('PART-2')

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBeGreaterThan(0)
      })

      const dataPoint = result.current.widthData[0]
      expect(dataPoint.partIds).toContain('PART-1')
      expect(dataPoint.partIds).toContain('PART-2')
    })

    it('handles parts with undefined PartSeries as "Uncategorized"', async () => {
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

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData[0].series).toBe('Uncategorized')
      expect(result.current.seriesNames).toContain('Uncategorized')
    })
  })

  describe('series grouping (AC 3.7.2)', () => {
    it('extracts unique series names sorted alphabetically', async () => {
      const parts = [
        createTestPart('P1', 'Zebra', 10),
        createTestPart('P2', 'Alpha', 20),
        createTestPart('P3', 'Alpha', 30), // Duplicate series
        createTestPart('P4', 'Beta', 40),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.seriesNames.length).toBeGreaterThan(0)
      })

      expect(result.current.seriesNames).toEqual(['Alpha', 'Beta', 'Zebra'])
    })
  })

  describe('histogram mode (AC 3.7.2)', () => {
    it('uses individual bars when ≤20 parts', async () => {
      const parts = Array.from({ length: 15 }, (_, i) =>
        createTestPart(`PART-${i}`, 'Series', i * 10)
      )
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBeGreaterThan(0)
      })

      expect(result.current.useHistogram).toBe(false)
      // Each unique value should have its own data point
      expect(result.current.widthData.length).toBe(15)
    })

    it('uses histogram binning when >20 parts', async () => {
      const parts = Array.from({ length: 25 }, (_, i) =>
        createTestPart(`PART-${i}`, 'Series', i * 10)
      )
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBeGreaterThan(0)
      })

      expect(result.current.useHistogram).toBe(true)
      // Should have fewer data points due to binning
      expect(result.current.widthData.length).toBeLessThan(25)
    })
  })

  describe('outlier detection (AC 3.7.3)', () => {
    it('identifies outliers in working set', async () => {
      // 9 parts with width 10, 1 outlier with width 100
      const parts = [
        ...Array.from({ length: 9 }, (_, i) =>
          createTestPart(`NORMAL-${i}`, 'Series', 10)
        ),
        createTestPart('OUTLIER', 'Series', 100),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.outliers.width.length).toBeGreaterThan(0)
      })

      expect(result.current.outliers.width).toHaveLength(1)
      expect(result.current.outliers.width[0].PartCallout).toBe('OUTLIER')
    })

    it('marks outlier data points with isOutlier=true', async () => {
      const parts = [
        ...Array.from({ length: 9 }, (_, i) =>
          createTestPart(`NORMAL-${i}`, 'Series', 10)
        ),
        createTestPart('OUTLIER', 'Series', 100),
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBeGreaterThan(0)
      })

      const outlierDataPoint = result.current.widthData.find((d) =>
        d.partIds.includes('OUTLIER')
      )
      expect(outlierDataPoint).toBeDefined()
      expect(outlierDataPoint!.isOutlier).toBe(true)

      const normalDataPoint = result.current.widthData.find((d) =>
        d.partIds.includes('NORMAL-0')
      )
      expect(normalDataPoint).toBeDefined()
      expect(normalDataPoint!.isOutlier).toBe(false)
    })

    it('detects outliers independently per dimension', async () => {
      // Need enough normal values to establish a baseline for outlier detection
      // With 9 normal + 1 outlier, the 2σ threshold calculation works properly
      const parts = [
        ...Array.from({ length: 9 }, (_, i) =>
          createTestPart(`NORMAL-${i}`, 'Series', 10, 10, 10)
        ),
        createTestPart('WIDTH-OUTLIER', 'Series', 100, 10, 10), // Width outlier only
      ]
      const wrapper = createWrapper(parts)

      parts.forEach((p) => useWorkingSetStore.getState().togglePart(p.PartCallout))

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.outliers.width.length).toBeGreaterThan(0)
      })

      // Width outlier should be in width outliers
      expect(
        result.current.outliers.width.map((p) => p.PartCallout)
      ).toContain('WIDTH-OUTLIER')

      // Height and length should have no outliers (all values are 10)
      expect(result.current.outliers.height).toHaveLength(0)
      expect(result.current.outliers.length).toHaveLength(0)
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

      const { result, rerender } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBe(1)
      })

      // Add second part
      useWorkingSetStore.getState().togglePart('PART-2')
      rerender()

      await waitFor(() => {
        expect(result.current.widthData.length).toBe(2)
      })
    })
  })

  describe('all three dimensions', () => {
    it('returns data for width, height, and length', async () => {
      const parts = [createTestPart('PART-1', 'Series', 10, 20, 30)]
      const wrapper = createWrapper(parts)

      useWorkingSetStore.getState().togglePart('PART-1')

      const { result } = renderHook(() => useDimensionalDistribution(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.widthData.length).toBeGreaterThan(0)
      })

      expect(result.current.widthData[0].value).toBe(10)
      expect(result.current.heightData[0].value).toBe(20)
      expect(result.current.lengthData[0].value).toBe(30)
    })
  })
})
