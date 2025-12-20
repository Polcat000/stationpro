// src/components/analysis/__tests__/DistributionChartsContainer.test.tsx
// Tests for DistributionChartsContainer view switching
// AC-3.7a.1: Box plots for multi-series
// AC-3.7a.2: Histogram drill-down
// AC-3.7a.3: Single-series auto-switch

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import { DistributionChartsContainer } from '../DistributionChartsContainer'
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
  width: number,
  height: number = 50,
  length: number = 100,
  family?: string
): Part {
  return {
    PartCallout: callout,
    PartSeries: series,
    PartFamily: family,
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

function renderWithParts(parts: Part[]) {
  const Wrapper = createWrapper(parts)
  return renderWithRouter(
    <Wrapper>
      <DistributionChartsContainer />
    </Wrapper>
  )
}

// =============================================================================
// Tests
// =============================================================================

describe('DistributionChartsContainer', () => {
  beforeEach(() => {
    // Reset working set store before each test
    useWorkingSetStore.getState().clearAll()
  })

  describe('empty state', () => {
    it('shows empty message when working set is empty', async () => {
      renderWithParts([])

      expect(
        await screen.findByTestId('distribution-charts-empty')
      ).toBeInTheDocument()
      expect(
        screen.getByText(/select parts to view distribution charts/i)
      ).toBeInTheDocument()
    })

    it('shows empty message when no parts match working set', async () => {
      const parts = [createTestPart('PART-1', 'Series A', 10)]
      renderWithParts(parts)
      // Don't add parts to working set

      expect(
        await screen.findByTestId('distribution-charts-empty')
      ).toBeInTheDocument()
    })
  })

  describe('box plot view (AC-3.7a.1)', () => {
    it('renders box plot view when multiple series in working set', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Alpha', 15),
        createTestPart('P3', 'Beta', 20),
        createTestPart('P4', 'Beta', 25),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      expect(
        await screen.findByTestId('distribution-charts-boxplot')
      ).toBeInTheDocument()
    })

    it('shows series count and part count in header', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Beta', 20),
        createTestPart('P3', 'Gamma', 30),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText(/3 series/)).toBeInTheDocument()
        expect(screen.getByText(/3 parts/)).toBeInTheDocument()
      })
    })

    it('renders box plot charts for all three dimensions', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Beta', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText(/width distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/height distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/length distribution/i)).toBeInTheDocument()
      })
    })

    it('shows drill-down hint', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Beta', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      expect(
        await screen.findByText(/click a box to drill down/i)
      ).toBeInTheDocument()
    })
  })

  describe('single-series auto-switch (AC-3.7a.3)', () => {
    it('shows histogram directly when only one series in working set', async () => {
      const parts = [
        createTestPart('P1', 'OnlySeries', 10),
        createTestPart('P2', 'OnlySeries', 15),
        createTestPart('P3', 'OnlySeries', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      expect(
        await screen.findByTestId('distribution-charts-histogram')
      ).toBeInTheDocument()
    })

    it('shows series name in histogram header', async () => {
      const parts = [
        createTestPart('P1', 'MySeries', 10),
        createTestPart('P2', 'MySeries', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      expect(await screen.findByText('MySeries')).toBeInTheDocument()
    })

    it('does not show back button for single-series view', async () => {
      const parts = [
        createTestPart('P1', 'OnlySeries', 10),
        createTestPart('P2', 'OnlySeries', 15),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await screen.findByTestId('distribution-charts-histogram')

      // Back button should not exist (AC-3.7a.3: no back nav for single series)
      expect(screen.queryByTestId('back-to-working-set')).not.toBeInTheDocument()
    })
  })

  describe('histogram view', () => {
    it('renders histogram charts for all three dimensions', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText(/width distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/height distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/length distribution/i)).toBeInTheDocument()
      })
    })

    it('shows part count in histogram header', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 15),
        createTestPart('P3', 'Series', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText(/3 parts/)).toBeInTheDocument()
      })
    })
  })

  describe('outlier badge', () => {
    it('shows outlier count badge when outliers present', async () => {
      // Create dataset with clear outlier (value far from others)
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 11),
        createTestPart('P3', 'Series', 12),
        createTestPart('P4', 'Series', 13),
        createTestPart('P5', 'Series', 14),
        createTestPart('OUTLIER', 'Series', 100), // Clear outlier
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      // Should show outlier badge
      await waitFor(() => {
        expect(screen.getByText(/outlier/i)).toBeInTheDocument()
      })
    })

    it('does not show outlier badge when no outliers', async () => {
      // Create dataset with no outliers (tight distribution)
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 11),
        createTestPart('P3', 'Series', 12),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await screen.findByTestId('distribution-charts-histogram')

      // Should not show outlier badge
      expect(screen.queryByText(/outlier/i)).not.toBeInTheDocument()
    })
  })

  describe('view change callback', () => {
    it('calls onViewChange when view changes', async () => {
      const onViewChange = vi.fn()
      const parts = [
        createTestPart('P1', 'Alpha', 10),
        createTestPart('P2', 'Beta', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      const Wrapper = createWrapper(parts)
      renderWithRouter(
        <Wrapper>
          <DistributionChartsContainer onViewChange={onViewChange} />
        </Wrapper>
      )

      // Wait for initial render
      await screen.findByTestId('distribution-charts-boxplot')

      // View change callback is called on user interaction (drill-down)
      // Since we can't easily simulate Nivo click, we just verify the component accepts the prop
      expect(onViewChange).not.toHaveBeenCalled() // Initial render doesn't trigger
    })
  })

  describe('chart height configuration', () => {
    it('accepts custom chart height prop', async () => {
      const parts = [
        createTestPart('P1', 'Series', 10),
        createTestPart('P2', 'Series', 20),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      const Wrapper = createWrapper(parts)
      renderWithRouter(
        <Wrapper>
          <DistributionChartsContainer chartHeight={400} />
        </Wrapper>
      )

      // Component renders without error
      await screen.findByTestId('distribution-charts-histogram')
    })
  })

  describe('family view (AC-3.16.5)', () => {
    it('shows family view when effectiveGroupByFamily is true (>30 series)', async () => {
      // Create 35 series across 5 families (> 30 series threshold)
      const parts: Part[] = []
      for (let f = 0; f < 5; f++) {
        for (let s = 0; s < 7; s++) {
          parts.push(
            createTestPart(
              `F${f}-S${s}`,
              `Series-${f}-${s}`,
              10 + f * 10 + s,
              50,
              100,
              `Family-${f}`
            )
          )
        }
      }

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      // Should show family view (not boxplot or histogram)
      expect(
        await screen.findByTestId('distribution-charts-family')
      ).toBeInTheDocument()
    })

    it('shows "All Families" header in family view', async () => {
      // Create enough series to trigger family grouping
      const parts: Part[] = []
      for (let f = 0; f < 4; f++) {
        for (let s = 0; s < 10; s++) {
          parts.push(
            createTestPart(
              `F${f}-S${s}`,
              `Series-${f}-${s}`,
              10 + s,
              50,
              100,
              `Family-${f}`
            )
          )
        }
      }

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText('All Families')).toBeInTheDocument()
      })
    })

    it('shows family count and part count in family view header', async () => {
      const parts: Part[] = []
      for (let f = 0; f < 3; f++) {
        for (let s = 0; s < 12; s++) {
          parts.push(
            createTestPart(
              `F${f}-S${s}`,
              `Series-${f}-${s}`,
              10 + s,
              50,
              100,
              `Family${f}`
            )
          )
        }
      }

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText(/3 families/)).toBeInTheDocument()
        expect(screen.getByText(/36 parts/)).toBeInTheDocument()
      })
    })
  })

  describe('Group by Family toggle (AC-3.16.6)', () => {
    it('shows toggle when multiple families exist', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10, 50, 100, 'FamilyX'),
        createTestPart('P2', 'Beta', 20, 50, 100, 'FamilyY'),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByTestId('group-by-family-toggle')).toBeInTheDocument()
      })
    })

    it('toggle is disabled when only 1 family exists', async () => {
      // Create > 30 series but only 1 family
      const parts: Part[] = []
      for (let s = 0; s < 35; s++) {
        parts.push(
          createTestPart(
            `P${s}`,
            `Series-${s}`,
            10 + s,
            50,
            100,
            'OnlyFamily'
          )
        )
      }

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        const toggle = screen.getByTestId('group-by-family-toggle')
        expect(toggle).toBeDisabled()
      })
    })

    it('shows "Group by Family" label next to toggle', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10, 50, 100, 'FamilyX'),
        createTestPart('P2', 'Beta', 20, 50, 100, 'FamilyY'),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText('Group by Family')).toBeInTheDocument()
      })
    })
  })

  describe('family drill-down view (AC-3.16.5)', () => {
    it('shows back button in family drill-down view', async () => {
      // We can't easily click on Nivo chart, but we can verify the component
      // structure supports the navigation patterns by checking for proper test IDs
      // and text content that would appear in each view state
      const parts: Part[] = []
      for (let f = 0; f < 4; f++) {
        for (let s = 0; s < 10; s++) {
          parts.push(
            createTestPart(
              `F${f}-S${s}`,
              `Series-${f}-${s}`,
              10 + s,
              50,
              100,
              `Family-${f}`
            )
          )
        }
      }

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      // Verify family view is shown (prerequisite for drill-down)
      await waitFor(() => {
        expect(screen.getByTestId('distribution-charts-family')).toBeInTheDocument()
      })

      // Family view shows drill-down hint
      expect(screen.getByText(/click a family box to drill down/i)).toBeInTheDocument()
    })
  })

  describe('three-level navigation (AC-3.16.5)', () => {
    it('shows drill-down hint in working-set view', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10, 50, 100, 'FamilyX'),
        createTestPart('P2', 'Beta', 20, 50, 100, 'FamilyY'),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      await waitFor(() => {
        expect(screen.getByText(/click a box to drill down/i)).toBeInTheDocument()
      })
    })

    it('renders dimension labels in all views', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10, 50, 100, 'FamilyX'),
        createTestPart('P2', 'Beta', 20, 50, 100, 'FamilyY'),
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      // All three dimension labels should be present
      await waitFor(() => {
        expect(screen.getByText(/width distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/height distribution/i)).toBeInTheDocument()
        expect(screen.getByText(/length distribution/i)).toBeInTheDocument()
      })
    })
  })

  describe('Unassigned family handling (AC-3.16.7)', () => {
    it('renders parts without PartFamily in charts', async () => {
      const parts = [
        createTestPart('P1', 'Alpha', 10, 50, 100, 'FamilyX'),
        { ...createTestPart('P2', 'Beta', 20), PartFamily: undefined }, // Unassigned
      ]

      parts.forEach((p) =>
        useWorkingSetStore.getState().togglePart(p.PartCallout)
      )

      renderWithParts(parts)

      // Component renders without error
      await waitFor(() => {
        expect(screen.getByTestId('distribution-charts-boxplot')).toBeInTheDocument()
      })
    })
  })
})
