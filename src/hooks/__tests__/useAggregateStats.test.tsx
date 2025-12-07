// src/hooks/__tests__/useAggregateStats.test.tsx
// Unit tests for useAggregateStats hook
// AC 3.5.3: Auto-update on working set change

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAggregateStats } from '../useAggregateStats'
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
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-003',
    PartSeries: 'SeriesC',
    PartWidth_mm: 30,
    PartHeight_mm: 15,
    PartLength_mm: 60,
    SmallestLateralFeature_um: 300,
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

describe('useAggregateStats', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('returns null stats and isEmpty=true when working set is empty', async () => {
    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.stats).toBeNull()
      expect(result.current.isEmpty).toBe(true)
    })
  })

  it('returns stats for single part (AC 3.5.5)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
      expect(result.current.isEmpty).toBe(false)

      const stats = result.current.stats!
      expect(stats.width.count).toBe(1)
      expect(stats.width.min).toBe(10)
      expect(stats.width.max).toBe(10)
      expect(stats.width.mean).toBe(10)
      expect(stats.width.median).toBe(10)
      expect(stats.width.stdDev).toBeNull() // N/A for single part
    })
  })

  it('returns stats for multiple parts', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()

      const stats = result.current.stats!
      // Width: [10, 20, 30, 40, 50]
      expect(stats.width.count).toBe(5)
      expect(stats.width.min).toBe(10)
      expect(stats.width.max).toBe(50)
      expect(stats.width.mean).toBe(30) // AC verification
      expect(stats.width.median).toBe(30) // AC verification
      expect(stats.width.stdDev).not.toBeNull()
    })
  })

  it('calculates all four dimensions (AC 3.5.2)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const stats = result.current.stats!
      expect(stats).toHaveProperty('width')
      expect(stats).toHaveProperty('height')
      expect(stats).toHaveProperty('length')
      expect(stats).toHaveProperty('smallestFeature')

      // Verify each has all required fields
      expect(stats.width).toHaveProperty('count')
      expect(stats.width).toHaveProperty('min')
      expect(stats.width).toHaveProperty('max')
      expect(stats.width).toHaveProperty('mean')
      expect(stats.width).toHaveProperty('median')
      expect(stats.width).toHaveProperty('stdDev')
    })
  })

  it('updates when working set changes (AC 3.5.3)', async () => {
    const { result, rerender } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    // Initially empty
    await waitFor(() => {
      expect(result.current.stats).toBeNull()
      expect(result.current.isEmpty).toBe(true)
    })

    // Add parts
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })
    rerender()

    // Should now have stats
    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
      expect(result.current.isEmpty).toBe(false)
      expect(result.current.stats!.width.count).toBe(2)
    })

    // Add more parts
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })
    rerender()

    // Should update
    await waitFor(() => {
      expect(result.current.stats!.width.count).toBe(3)
    })

    // Clear all parts
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
    rerender()

    // Should be empty again
    await waitFor(() => {
      expect(result.current.stats).toBeNull()
      expect(result.current.isEmpty).toBe(true)
    })
  })

  it('returns isLoading while query is pending', () => {
    // Create a slow query client to test loading state
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)
  })

  it('filters parts by working set IDs correctly', async () => {
    // Only select parts 2 and 4
    useWorkingSetStore.setState({
      partIds: new Set(['PART-002', 'PART-004']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const stats = result.current.stats!
      // Width: [20, 40]
      expect(stats.width.count).toBe(2)
      expect(stats.width.min).toBe(20)
      expect(stats.width.max).toBe(40)
      expect(stats.width.mean).toBe(30)
    })
  })

  it('ignores non-existent part IDs in working set', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'NONEXISTENT-999']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      // Only PART-001 exists, so count should be 1
      expect(result.current.stats!.width.count).toBe(1)
    })
  })

  it('returns null if all selected IDs are non-existent', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['NONEXISTENT-001', 'NONEXISTENT-002']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useAggregateStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      // isEmpty is false because partIds.size > 0, but stats is null because no valid parts
      expect(result.current.stats).toBeNull()
      expect(result.current.isEmpty).toBe(false)
    })
  })
})
