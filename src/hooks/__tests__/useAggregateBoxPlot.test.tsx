// src/hooks/__tests__/useAggregateBoxPlot.test.tsx
// Unit tests for useAggregateBoxPlot hook
// AC-3.17.4, AC-3.17.5, AC-3.17.6: Aggregate boxplot with dimension tabs

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAggregateBoxPlot, type AggregateDimension } from '../useAggregateBoxPlot'
import { useWorkingSetStore } from '@/stores/workingSet'
import type { Part } from '@/types/domain'
import type { ReactNode } from 'react'

// =============================================================================
// Test Data
// =============================================================================

const mockParts: Part[] = [
  {
    PartCallout: 'PART-001',
    PartSeries: 'SeriesA',
    PartWidth_mm: 10,
    PartHeight_mm: 5,
    PartLength_mm: 20,
    SmallestLateralFeature_um: 100,
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-002',
    PartSeries: 'SeriesB',
    PartWidth_mm: 20,
    PartHeight_mm: 10,
    PartLength_mm: 40,
    SmallestLateralFeature_um: 200,
    SmallestDepthFeature_um: 150,
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-003',
    PartSeries: 'SeriesC',
    PartWidth_mm: 30,
    PartHeight_mm: 15,
    PartLength_mm: 60,
    SmallestLateralFeature_um: 300,
    SmallestDepthFeature_um: 250,
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-004',
    PartSeries: 'SeriesD',
    PartWidth_mm: 40,
    PartHeight_mm: 20,
    PartLength_mm: 80,
    SmallestLateralFeature_um: 400,
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-005',
    PartSeries: 'SeriesE',
    PartWidth_mm: 50,
    PartHeight_mm: 25,
    PartLength_mm: 100,
    SmallestLateralFeature_um: 500,
    SmallestDepthFeature_um: 350,
    InspectionZones: [],
  },
]

// =============================================================================
// Test Setup
// =============================================================================

// Mock parts repository
vi.mock('@/lib/repositories/partsRepository', () => ({
  partsRepository: {
    getAll: vi.fn(() => Promise.resolve(mockParts)),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('useAggregateBoxPlot', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('returns null boxPlotData and isEmpty=true when working set is empty', async () => {
    const { result } = renderHook(() => useAggregateBoxPlot('width'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.boxPlotData).toBeNull()
      expect(result.current.isEmpty).toBe(true)
    })
  })

  it('returns boxplot data for width dimension (AC-3.17.4)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('width'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.boxPlotData).not.toBeNull()
      expect(result.current.boxPlotData!.dimension).toBe('width')
      expect(result.current.boxPlotData!.data).toHaveLength(5)
      expect(result.current.boxPlotData!.stats.n).toBe(5)
      // Width: [10, 20, 30, 40, 50]
      expect(result.current.boxPlotData!.stats.min).toBe(10)
      expect(result.current.boxPlotData!.stats.max).toBe(50)
      expect(result.current.boxPlotData!.stats.median).toBe(30)
    })
  })

  it('returns boxplot data for height dimension', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('height'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.boxPlotData).not.toBeNull()
      expect(result.current.boxPlotData!.dimension).toBe('height')
      // Height: [5, 10, 15]
      expect(result.current.boxPlotData!.stats.min).toBe(5)
      expect(result.current.boxPlotData!.stats.max).toBe(15)
      expect(result.current.boxPlotData!.stats.median).toBe(10)
    })
  })

  it('returns boxplot data for length dimension', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('length'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.boxPlotData).not.toBeNull()
      expect(result.current.boxPlotData!.dimension).toBe('length')
      // Length: [20, 40, 60]
      expect(result.current.boxPlotData!.stats.min).toBe(20)
      expect(result.current.boxPlotData!.stats.max).toBe(60)
      expect(result.current.boxPlotData!.stats.median).toBe(40)
    })
  })

  it('returns boxplot data for lateral feature dimension', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('lateral'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.boxPlotData).not.toBeNull()
      expect(result.current.boxPlotData!.dimension).toBe('lateral')
      // Lateral: [100, 200, 300]
      expect(result.current.boxPlotData!.stats.min).toBe(100)
      expect(result.current.boxPlotData!.stats.max).toBe(300)
      expect(result.current.boxPlotData!.stats.median).toBe(200)
    })
  })

  it('returns boxplot data for depth feature when parts have depth data', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-002', 'PART-003', 'PART-005']), // All have SmallestDepthFeature_um
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('depth'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.boxPlotData).not.toBeNull()
      expect(result.current.boxPlotData!.dimension).toBe('depth')
      // Depth: [150, 250, 350]
      expect(result.current.boxPlotData!.stats.min).toBe(150)
      expect(result.current.boxPlotData!.stats.max).toBe(350)
      expect(result.current.boxPlotData!.stats.median).toBe(250)
      expect(result.current.hasNoDepthData).toBe(false)
    })
  })

  it('returns null boxPlotData for depth when no parts have depth data (AC-3.17.6)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-004']), // Neither have SmallestDepthFeature_um
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('depth'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.boxPlotData).toBeNull()
      expect(result.current.hasNoDepthData).toBe(true)
      expect(result.current.isEmpty).toBe(false) // Working set is not empty
    })
  })

  it('data has single group "Working Set" for aggregate view', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('width'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const data = result.current.boxPlotData!.data
      expect(data).toHaveLength(3)
      expect(data.every((d) => d.group === 'Working Set')).toBe(true)
    })
  })

  it('includes partCallout in data for outlier identification', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('width'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const data = result.current.boxPlotData!.data
      const callouts = data.map((d) => d.partCallout).sort()
      expect(callouts).toEqual(['PART-001', 'PART-002'])
    })
  })

  it('updates when dimension parameter changes (AC-3.17.5)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result, rerender } = renderHook<
      ReturnType<typeof useAggregateBoxPlot>,
      { dimension: AggregateDimension }
    >(({ dimension }) => useAggregateBoxPlot(dimension), {
      wrapper: createWrapper(),
      initialProps: { dimension: 'width' },
    })

    await waitFor(() => {
      expect(result.current.boxPlotData!.dimension).toBe('width')
      expect(result.current.boxPlotData!.stats.median).toBe(20) // Width median
    })

    // Change to height
    rerender({ dimension: 'height' })

    await waitFor(() => {
      expect(result.current.boxPlotData!.dimension).toBe('height')
      expect(result.current.boxPlotData!.stats.median).toBe(10) // Height median
    })
  })

  it('updates when working set changes', async () => {
    const { result, rerender } = renderHook(() => useAggregateBoxPlot('width'), {
      wrapper: createWrapper(),
    })

    // Initially empty
    await waitFor(() => {
      expect(result.current.isEmpty).toBe(true)
    })

    // Add parts
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })
    rerender()

    await waitFor(() => {
      expect(result.current.isEmpty).toBe(false)
      expect(result.current.boxPlotData!.stats.n).toBe(2)
    })
  })

  it('calculates outliers correctly', async () => {
    // Create a dataset with an outlier
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateBoxPlot('width'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const stats = result.current.boxPlotData!.stats
      // Width: [10, 20, 30, 40, 50] - evenly distributed, no outliers expected
      expect(stats.outliers).toHaveLength(0)
    })
  })
})
