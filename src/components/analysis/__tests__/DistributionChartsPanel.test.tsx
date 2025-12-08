// src/components/analysis/__tests__/DistributionChartsPanel.test.tsx
// Tests for DistributionChartsPanel wrapper component
// Note: Detailed chart behavior is tested in DistributionChartsContainer.test.tsx

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithRouter, screen } from '@/test/router-utils'
import { DistributionChartsPanel } from '../DistributionChartsPanel'
import { useWorkingSetStore } from '@/stores/workingSet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  width: number
): Part {
  return {
    PartCallout: callout,
    PartSeries: series,
    PartWidth_mm: width,
    PartHeight_mm: 50,
    PartLength_mm: 100,
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

function renderWithParts(parts: Part[]) {
  const Wrapper = createWrapper(parts)
  return renderWithRouter(
    <Wrapper>
      <DistributionChartsPanel />
    </Wrapper>
  )
}

// =============================================================================
// Tests
// =============================================================================

describe('DistributionChartsPanel', () => {
  beforeEach(() => {
    // Reset working set store before each test
    useWorkingSetStore.getState().clearAll()
  })

  describe('rendering', () => {
    it('renders panel with title', async () => {
      renderWithParts([])

      expect(await screen.findByText('Dimensional Distribution')).toBeInTheDocument()
    })

    it('renders as a Card component', async () => {
      renderWithParts([])

      // Card title is rendered
      const title = await screen.findByText('Dimensional Distribution')
      expect(title).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty message when working set is empty', async () => {
      renderWithParts([])

      expect(
        await screen.findByTestId('distribution-charts-empty')
      ).toBeInTheDocument()
    })
  })

  describe('with data', () => {
    it('renders charts container when parts are in working set', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Beta', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      // Should show box plot view (multiple series)
      expect(
        await screen.findByTestId('distribution-charts-boxplot')
      ).toBeInTheDocument()
    })

    it('renders histogram when single series in working set', async () => {
      const parts = [
        createTestPart('P1', 'OnlySeries', 10),
        createTestPart('P2', 'OnlySeries', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      // Should show histogram view (single series)
      expect(
        await screen.findByTestId('distribution-charts-histogram')
      ).toBeInTheDocument()
    })
  })
})
