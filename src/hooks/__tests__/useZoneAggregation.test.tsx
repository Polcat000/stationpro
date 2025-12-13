// src/hooks/__tests__/useZoneAggregation.test.tsx
// Unit tests for useZoneAggregation hook
// AC-3.9.1 through AC-3.9.5: Zone aggregation with auto-update

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useZoneAggregation } from '../useZoneAggregation'
import { useWorkingSetStore } from '@/stores/workingSet'
import type { Part, InspectionZone } from '@/types/domain'
import type { ReactNode } from 'react'

// =============================================================================
// Test Helpers
// =============================================================================

function createTestZone(overrides: Partial<InspectionZone> = {}): InspectionZone {
  return {
    ZoneID: `zone-${Math.random().toString(36).slice(2)}`,
    Name: 'Test Zone',
    Face: 'Top',
    ZoneDepth_mm: 2.0,
    ZoneOffset_mm: 0,
    RequiredCoverage_pct: 100,
    MinPixelsPerFeature: 3,
    ...overrides,
  }
}

// =============================================================================
// Test Data
// =============================================================================

// Parts with various zone configurations
const mockParts: Part[] = [
  {
    PartCallout: 'PART-001',
    PartSeries: 'SeriesA',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 100,
    InspectionZones: [
      createTestZone({ Face: 'Top', ZoneDepth_mm: 1.0 }),
    ],
  },
  {
    PartCallout: 'PART-002',
    PartSeries: 'SeriesB',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 150,
    InspectionZones: [
      createTestZone({ Face: 'Top', ZoneDepth_mm: 2.0 }),
      createTestZone({ Face: 'Front', ZoneDepth_mm: 3.0, SmallestLateralFeature_um: 50 }),
    ],
  },
  {
    PartCallout: 'PART-003',
    PartSeries: 'SeriesC',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 200,
    InspectionZones: [
      createTestZone({ Face: 'Front', ZoneDepth_mm: 4.0 }),
      createTestZone({ Face: 'Back', ZoneDepth_mm: 5.0 }),
    ],
  },
  {
    PartCallout: 'PART-NO-ZONES',
    PartSeries: 'SeriesD',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 100,
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

describe('useZoneAggregation', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  describe('empty state (AC-3.9.5)', () => {
    it('returns null aggregation and isEmpty=true when working set is empty', async () => {
      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.aggregation).toBeNull()
        expect(result.current.isEmpty).toBe(true)
      })
    })

    it('returns null aggregation when all selected parts have no zones', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-NO-ZONES']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.aggregation).toBeNull()
        expect(result.current.isEmpty).toBe(false) // Parts selected, but no zones
      })
    })
  })

  describe('single part with zones', () => {
    it('returns aggregation for single part with one zone', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.aggregation).not.toBeNull()
        expect(result.current.isEmpty).toBe(false)

        const agg = result.current.aggregation!
        expect(agg.totalZones).toBe(1)
        expect(agg.zonesByFace).toEqual({ Top: 1 })
        expect(agg.depthRange).toEqual({ min: 1.0, max: 1.0 })
        expect(agg.smallestFeature_um).toBe(100)
      })
    })
  })

  describe('zone count per face (AC-3.9.1)', () => {
    it('counts zones correctly across multiple parts', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        const agg = result.current.aggregation!
        expect(agg.totalZones).toBe(5) // 1 + 2 + 2
        expect(agg.zonesByFace.Top).toBe(2) // PART-001, PART-002
        expect(agg.zonesByFace.Front).toBe(2) // PART-002, PART-003
        expect(agg.zonesByFace.Back).toBe(1) // PART-003
      })
    })
  })

  describe('depth range (AC-3.9.2)', () => {
    it('calculates correct depth range across all zones', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        const agg = result.current.aggregation!
        // Depths: 1.0, 2.0, 3.0, 4.0, 5.0
        expect(agg.depthRange.min).toBe(1.0)
        expect(agg.depthRange.max).toBe(5.0)
      })
    })
  })

  describe('smallest feature size (AC-3.9.3)', () => {
    it('finds smallest feature size with zone override', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        const agg = result.current.aggregation!
        // PART-002's Front zone has SmallestLateralFeature_um: 50 override
        expect(agg.smallestFeature_um).toBe(50)
      })
    })

    it('uses part default when zone override not present', async () => {
      // Only select PART-001 which has no zone-level override
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        const agg = result.current.aggregation!
        // PART-001's part-level default is 100
        expect(agg.smallestFeature_um).toBe(100)
      })
    })
  })

  describe('auto-update on working set change', () => {
    it('updates when parts are added', async () => {
      const { result, rerender } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      // Initially empty
      await waitFor(() => {
        expect(result.current.aggregation).toBeNull()
        expect(result.current.isEmpty).toBe(true)
      })

      // Add first part
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })
      rerender()

      await waitFor(() => {
        expect(result.current.aggregation).not.toBeNull()
        expect(result.current.aggregation!.totalZones).toBe(1)
      })

      // Add more parts
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })
      rerender()

      await waitFor(() => {
        expect(result.current.aggregation!.totalZones).toBe(3)
      })
    })

    it('updates when parts are removed', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      const { result, rerender } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.aggregation!.totalZones).toBe(5)
      })

      // Remove PART-003
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })
      rerender()

      await waitFor(() => {
        expect(result.current.aggregation!.totalZones).toBe(3)
        expect(result.current.aggregation!.zonesByFace.Back).toBeUndefined()
      })
    })

    it('shows empty state when all parts cleared', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      const { result, rerender } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.aggregation).not.toBeNull()
      })

      // Clear all parts
      useWorkingSetStore.setState({
        partIds: new Set<string>(),
        stationIds: new Set<string>(),
      })
      rerender()

      await waitFor(() => {
        expect(result.current.aggregation).toBeNull()
        expect(result.current.isEmpty).toBe(true)
      })
    })
  })

  describe('loading state', () => {
    it('returns isLoading while query is pending', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('filters parts by working set IDs correctly', async () => {
      // Only select PART-001
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        const agg = result.current.aggregation!
        expect(agg.totalZones).toBe(1)
        expect(agg.zonesByFace).toEqual({ Top: 1 })
      })
    })

    it('ignores non-existent part IDs in working set', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'NONEXISTENT-999']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.aggregation!.totalZones).toBe(1)
      })
    })

    it('returns null if all selected IDs are non-existent', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['NONEXISTENT-001', 'NONEXISTENT-002']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        // isEmpty is false because partIds.size > 0, but aggregation is null because no valid parts
        expect(result.current.aggregation).toBeNull()
        expect(result.current.isEmpty).toBe(false)
      })
    })

    it('handles mixed parts - some with zones, some without', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-NO-ZONES']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useZoneAggregation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        // Only PART-001 has zones
        expect(result.current.aggregation!.totalZones).toBe(1)
      })
    })
  })
})
