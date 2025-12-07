// src/hooks/__tests__/useEnvelopeCalculation.test.tsx
// Unit tests for useEnvelopeCalculation hook
// AC 3.6.3: Auto-update on working set change

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEnvelopeCalculation } from '../useEnvelopeCalculation'
import { useWorkingSetStore } from '@/stores/workingSet'
import type { Part } from '@/types/domain'
import type { ReactNode } from 'react'

// =============================================================================
// Test Data
// =============================================================================

// Use consistent mock data across all analysis tests
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

describe('useEnvelopeCalculation', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  describe('empty state', () => {
    it('returns null envelope and isEmpty=true when working set is empty', async () => {
      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.envelope).toBeNull()
        expect(result.current.isEmpty).toBe(true)
      })
    })
  })

  describe('single part', () => {
    it('returns envelope for single part', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.envelope).not.toBeNull()
        expect(result.current.isEmpty).toBe(false)

        const envelope = result.current.envelope!
        expect(envelope.width_mm).toBe(10)
        expect(envelope.height_mm).toBe(5)
        expect(envelope.length_mm).toBe(20)
        expect(envelope.drivers.maxWidth.partCallout).toBe('PART-001')
      })
    })
  })

  describe('max dimension calculation (AC 3.6.4)', () => {
    it('returns correct max dimensions for multiple parts', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.envelope).not.toBeNull()

        const envelope = result.current.envelope!
        // Max width: 30 (PART-003)
        expect(envelope.width_mm).toBe(30)
        // Max height: 15 (PART-003)
        expect(envelope.height_mm).toBe(15)
        // Max length: 60 (PART-003)
        expect(envelope.length_mm).toBe(60)
      })
    })
  })

  describe('driver identification (AC 3.6.2)', () => {
    it('identifies correct driver parts', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        const envelope = result.current.envelope!
        // All dimensions driven by PART-003 (width=30, height=15, length=60)
        expect(envelope.drivers.maxWidth.partCallout).toBe('PART-003')
        expect(envelope.drivers.maxWidth.value).toBe(30)
        expect(envelope.drivers.maxHeight.partCallout).toBe('PART-003')
        expect(envelope.drivers.maxHeight.value).toBe(15)
        expect(envelope.drivers.maxLength.partCallout).toBe('PART-003')
        expect(envelope.drivers.maxLength.value).toBe(60)
      })
    })
  })

  describe('auto-update on working set change (AC 3.6.3)', () => {
    it('updates when parts are added', async () => {
      const { result, rerender } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      // Initially empty
      await waitFor(() => {
        expect(result.current.envelope).toBeNull()
        expect(result.current.isEmpty).toBe(true)
      })

      // Add first part
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })
      rerender()

      await waitFor(() => {
        expect(result.current.envelope).not.toBeNull()
        expect(result.current.envelope!.width_mm).toBe(10)
      })

      // Add larger part
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-003']),
        stationIds: new Set<string>(),
      })
      rerender()

      await waitFor(() => {
        expect(result.current.envelope!.width_mm).toBe(30)
        expect(result.current.envelope!.drivers.maxWidth.partCallout).toBe('PART-003')
      })
    })

    it('updates when driving part is removed (AC 3.6.3 verification)', async () => {
      // Start with all parts - PART-003 drives width
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      const { result, rerender } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.envelope!.drivers.maxWidth.partCallout).toBe('PART-003')
        expect(result.current.envelope!.width_mm).toBe(30)
      })

      // Remove PART-003 (the width driver)
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })
      rerender()

      // PART-002 should now be the width driver
      await waitFor(() => {
        expect(result.current.envelope!.drivers.maxWidth.partCallout).toBe('PART-002')
        expect(result.current.envelope!.width_mm).toBe(20)
      })
    })

    it('shows empty state when all parts cleared', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      const { result, rerender } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.envelope).not.toBeNull()
      })

      // Clear all parts
      useWorkingSetStore.setState({
        partIds: new Set<string>(),
        stationIds: new Set<string>(),
      })
      rerender()

      await waitFor(() => {
        expect(result.current.envelope).toBeNull()
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

      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('filters parts by working set IDs correctly', async () => {
      // Only select parts 1 and 2
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        const envelope = result.current.envelope!
        expect(envelope.width_mm).toBe(20) // PART-002
        expect(envelope.height_mm).toBe(10) // PART-002
        expect(envelope.length_mm).toBe(40) // PART-002
      })
    })

    it('ignores non-existent part IDs in working set', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'NONEXISTENT-999']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        // Only PART-001 exists
        expect(result.current.envelope!.width_mm).toBe(10)
        expect(result.current.envelope!.drivers.maxWidth.partCallout).toBe('PART-001')
      })
    })

    it('returns null if all selected IDs are non-existent', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['NONEXISTENT-001', 'NONEXISTENT-002']),
        stationIds: new Set<string>(),
      })

      const { result } = renderHook(() => useEnvelopeCalculation(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        // isEmpty is false because partIds.size > 0, but envelope is null because no valid parts
        expect(result.current.envelope).toBeNull()
        expect(result.current.isEmpty).toBe(false)
      })
    })
  })
})
