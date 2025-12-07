// src/hooks/__tests__/useBiasDetection.test.ts
// Unit tests for useBiasDetection hook

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBiasDetection } from '../useBiasDetection'
import { useWorkingSetStore } from '@/stores/workingSet'
import type { Part } from '@/types/domain'
import type { ReactNode } from 'react'

// =============================================================================
// Test Data
// =============================================================================

// Parts with varied series for testing different bias scenarios
const mockPartsVariedSeries: Part[] = [
  { PartCallout: 'PART-001', PartSeries: 'SeriesA', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'PART-002', PartSeries: 'SeriesB', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'PART-003', PartSeries: 'SeriesC', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'PART-004', PartSeries: 'SeriesD', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'PART-005', PartSeries: 'SeriesE', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
]

// Parts for series dominance testing (90% same series)
const mockPartsDominantSeries: Part[] = [
  { PartCallout: 'D-001', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-002', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-003', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-004', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-005', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-006', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-007', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-008', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'D-009', PartSeries: 'Dominant', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
  { PartCallout: 'O-001', PartSeries: 'Other', PartWidth_mm: 100, PartHeight_mm: 50, PartLength_mm: 200, SmallestLateralFeature_um: 10, InspectionZones: [] },
]

// =============================================================================
// Test Setup
// =============================================================================

let mockPartsData: Part[] = mockPartsVariedSeries

// Mock parts repository
vi.mock('@/lib/repositories/partsRepository', () => ({
  partsRepository: {
    getAll: vi.fn(() => Promise.resolve(mockPartsData)),
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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('useBiasDetection', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
    mockPartsData = mockPartsVariedSeries
  })

  it('returns no bias when working set is empty', async () => {
    const { result } = renderHook(() => useBiasDetection(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.hasBias).toBe(false)
      expect(result.current.biases).toHaveLength(0)
    })
  })

  it('returns too-few-parts bias when 2 parts selected', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useBiasDetection(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.hasBias).toBe(true)
      const biasTypes = result.current.biases.map((b) => b.biasType)
      expect(biasTypes).toContain('too-few-parts')
    })
  })

  it('returns no too-few-parts bias when 3+ parts selected', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useBiasDetection(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      const biasTypes = result.current.biases.map((b) => b.biasType)
      expect(biasTypes).not.toContain('too-few-parts')
    })
  })

  it('returns series-dominant bias when >80% from same series', async () => {
    mockPartsData = mockPartsDominantSeries

    useWorkingSetStore.setState({
      partIds: new Set(['D-001', 'D-002', 'D-003', 'D-004', 'D-005', 'D-006', 'D-007', 'D-008', 'D-009', 'O-001']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useBiasDetection(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.hasBias).toBe(true)
      const biasTypes = result.current.biases.map((b) => b.biasType)
      expect(biasTypes).toContain('series-dominant')
    })
  })

  // Note: Outlier detection is tested comprehensively in the bias.test.ts unit tests
  // Here we verify the hook integrates properly, but don't need to test all bias scenarios
  // since the hook is a thin wrapper around detectBias()
  it('hook returns bias result structure correctly', async () => {
    // Use the default mockPartsVariedSeries which has parts from different series
    // Selecting 2 parts triggers too-few-parts bias
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    const { result } = renderHook(() => useBiasDetection(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.hasBias).toBe(true)
      expect(Array.isArray(result.current.biases)).toBe(true)
      expect(result.current.biases.length).toBeGreaterThan(0)
      // Verify structure of bias result
      expect(result.current.biases[0]).toHaveProperty('biasType')
      expect(result.current.biases[0]).toHaveProperty('severity')
      expect(result.current.biases[0]).toHaveProperty('message')
    })
  })

  it('updates when working set changes', async () => {
    const { result, rerender } = renderHook(() => useBiasDetection(), {
      wrapper: createWrapper(),
    })

    // Initially empty
    await waitFor(() => {
      expect(result.current.hasBias).toBe(false)
    })

    // Add 1 part
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001']),
      stationIds: new Set<string>(),
    })

    rerender()

    // Should now have too-few-parts bias
    await waitFor(() => {
      expect(result.current.hasBias).toBe(true)
      const biasTypes = result.current.biases.map((b) => b.biasType)
      expect(biasTypes).toContain('too-few-parts')
    })
  })
})
