// src/hooks/__tests__/useUnifiedStatsEnvelope.test.tsx
// Unit tests for useUnifiedStatsEnvelope hook
// AC-3.17.1, AC-3.17.3, AC-3.17.6: Combined stats and envelope

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUnifiedStatsEnvelope } from '../useUnifiedStatsEnvelope'
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

describe('useUnifiedStatsEnvelope', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('returns null stats and envelope when working set is empty', async () => {
    const { result } = renderHook(() => useUnifiedStatsEnvelope(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.stats).toBeNull()
      expect(result.current.envelope).toBeNull()
      expect(result.current.isEmpty).toBe(true)
    })
  })

  it('returns both stats and envelope for parts in working set', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useUnifiedStatsEnvelope(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
      expect(result.current.envelope).not.toBeNull()
      expect(result.current.isEmpty).toBe(false)
    })
  })

  it('provides stats with all 5 dimensions (AC-3.17.1)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useUnifiedStatsEnvelope(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const stats = result.current.stats!
      expect(stats).toHaveProperty('width')
      expect(stats).toHaveProperty('height')
      expect(stats).toHaveProperty('length')
      expect(stats).toHaveProperty('smallestLateralFeature')
      expect(stats).toHaveProperty('smallestDepthFeature')

      // Width: [10, 20, 30]
      expect(stats.width.count).toBe(3)
      expect(stats.width.min).toBe(10)
      expect(stats.width.max).toBe(30)
    })
  })

  it('provides envelope with driver callouts (AC-3.17.3)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useUnifiedStatsEnvelope(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const envelope = result.current.envelope!
      expect(envelope.width_mm).toBe(30)
      expect(envelope.height_mm).toBe(15)
      expect(envelope.length_mm).toBe(60)

      // Driver identification
      expect(envelope.drivers.maxWidth.partCallout).toBe('PART-003')
      expect(envelope.drivers.maxHeight.partCallout).toBe('PART-003')
      expect(envelope.drivers.maxLength.partCallout).toBe('PART-003')
    })
  })

  it('returns smallestDepthFeature stats when parts have depth data', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-002', 'PART-003']), // Both have SmallestDepthFeature_um
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useUnifiedStatsEnvelope(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const stats = result.current.stats!
      expect(stats.smallestDepthFeature).not.toBeNull()
      expect(stats.smallestDepthFeature!.count).toBe(2)
      expect(stats.smallestDepthFeature!.min).toBe(150)
      expect(stats.smallestDepthFeature!.max).toBe(250)
    })
  })

  it('returns null smallestDepthFeature when no parts have depth data (AC-3.17.2)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001']), // No SmallestDepthFeature_um
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useUnifiedStatsEnvelope(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const stats = result.current.stats!
      expect(stats.smallestDepthFeature).toBeNull()
    })
  })

  it('provides combined loading state (AC-3.17.6)', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const { result } = renderHook(() => useUnifiedStatsEnvelope(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)
  })

  it('updates when working set changes', async () => {
    const { result, rerender } = renderHook(() => useUnifiedStatsEnvelope(), {
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

    // Should now have data
    await waitFor(() => {
      expect(result.current.isEmpty).toBe(false)
      expect(result.current.stats!.width.count).toBe(2)
      expect(result.current.envelope!.width_mm).toBe(20)
    })
  })
})
