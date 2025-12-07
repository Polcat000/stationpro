// src/components/analysis/__tests__/AggregateStatsPanel.test.tsx
// Component tests for AggregateStatsPanel
// AC 3.5.1, 3.5.2, 3.5.4, 3.5.5

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AggregateStatsPanelStandalone,
  AggregateStatsPanel,
} from '../AggregateStatsPanel'
import { useWorkingSetStore } from '@/stores/workingSet'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import type { AggregateStatistics } from '@/lib/analysis/statistics'
import type { Part } from '@/types/domain'

// =============================================================================
// Test Data
// =============================================================================

const mockStats: AggregateStatistics = {
  width: {
    count: 5,
    min: 10,
    max: 50,
    mean: 30,
    median: 30,
    stdDev: 14.14,
  },
  height: {
    count: 5,
    min: 5,
    max: 25,
    mean: 15,
    median: 15,
    stdDev: 7.07,
  },
  length: {
    count: 5,
    min: 20,
    max: 100,
    mean: 60,
    median: 60,
    stdDev: 28.28,
  },
  smallestFeature: {
    count: 5,
    min: 100,
    max: 500,
    mean: 300,
    median: 300,
    stdDev: 141.42,
  },
}

const singlePartStats: AggregateStatistics = {
  width: { count: 1, min: 25, max: 25, mean: 25, median: 25, stdDev: null },
  height: { count: 1, min: 15, max: 15, mean: 15, median: 15, stdDev: null },
  length: { count: 1, min: 50, max: 50, mean: 50, median: 50, stdDev: null },
  smallestFeature: { count: 1, min: 5, max: 5, mean: 5, median: 5, stdDev: null },
}

// Mock parts for integration tests
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

// Mock parts repository
vi.mock('@/lib/repositories/partsRepository', () => ({
  partsRepository: {
    getAll: vi.fn(() => Promise.resolve(mockParts)),
  },
}))

// =============================================================================
// AggregateStatsPanelStandalone Tests (Isolated component tests)
// =============================================================================

describe('AggregateStatsPanelStandalone', () => {
  describe('loading state', () => {
    it('renders loading message when isLoading is true', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Loading...')).toBeInTheDocument()
    })

    it('renders card with title during loading', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Aggregate Statistics')).toBeInTheDocument()
    })
  })

  describe('empty state (AC 3.5.4)', () => {
    it('renders empty message when isEmpty is true', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={null}
          isLoading={false}
          isEmpty={true}
        />
      )

      expect(await screen.findByText('Select parts to view statistics')).toBeInTheDocument()
    })

    it('renders empty message when stats is null', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={null}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Select parts to view statistics')).toBeInTheDocument()
    })

    it('panel layout remains stable (no layout shift)', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={null}
          isLoading={false}
          isEmpty={true}
        />
      )

      // Card title and content should exist to maintain layout structure
      expect(await screen.findByText('Aggregate Statistics')).toBeInTheDocument()
      expect(screen.getByText('Select parts to view statistics')).toBeInTheDocument()
    })
  })

  describe('statistics display (AC 3.5.1)', () => {
    it('renders all 6 statistics in header', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={mockStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      // Header row should have all 6 stat columns
      expect(await screen.findByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Min')).toBeInTheDocument()
      expect(screen.getByText('Max')).toBeInTheDocument()
      expect(screen.getByText('Mean')).toBeInTheDocument()
      expect(screen.getByText('Median')).toBeInTheDocument()
      expect(screen.getByText('Std Dev')).toBeInTheDocument()
    })

    it('renders card title "Aggregate Statistics"', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={mockStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Aggregate Statistics')).toBeInTheDocument()
    })
  })

  describe('all dimensions covered (AC 3.5.2)', () => {
    it('renders all 4 dimension rows', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={mockStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Width')).toBeInTheDocument()
      expect(screen.getByText('Height')).toBeInTheDocument()
      expect(screen.getByText('Length')).toBeInTheDocument()
      expect(screen.getByText('Smallest Feature')).toBeInTheDocument()
    })

    it('displays correct units (mm for dimensions, µm for feature)', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={mockStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // Width row should have mm units
      const cells = screen.getAllByText(/mm/)
      expect(cells.length).toBeGreaterThan(0)

      // Smallest Feature row should have µm units
      const umCells = screen.getAllByText(/µm/)
      expect(umCells.length).toBeGreaterThan(0)
    })
  })

  describe('values formatted correctly (AC 3.5.1)', () => {
    it('formats values with 2 decimal places', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={mockStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // Width min = 10.00 (appears once)
      expect(screen.getByText('10.00 mm')).toBeInTheDocument()
      // Width max = 50.00 (appears once)
      expect(screen.getByText('50.00 mm')).toBeInTheDocument()
      // Width mean = 30.00 (appears twice: once for mean, once for median)
      const thirties = screen.getAllByText('30.00 mm')
      expect(thirties.length).toBe(2) // mean and median are both 30.00
    })

    it('displays count as integer (no decimal)', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={mockStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // Count should appear as "5" (multiple times for each dimension)
      const fives = screen.getAllByText('5')
      expect(fives.length).toBeGreaterThanOrEqual(4) // 4 dimensions
    })
  })

  describe('single part handling (AC 3.5.5)', () => {
    it('shows N/A for Std Dev when count is 1', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={singlePartStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // All 4 dimensions should show N/A for std dev
      const naTexts = screen.getAllByText('N/A')
      expect(naTexts.length).toBe(4)
    })

    it('shows same value for Min, Max, Mean, Median when count is 1', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={singlePartStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // Width = 25, should appear 4 times (min, max, mean, median)
      const widthValues = screen.getAllByText('25.00 mm')
      expect(widthValues.length).toBe(4)
    })
  })

  describe('accessibility', () => {
    it('has aria-label on table', async () => {
      renderWithRouter(
        <AggregateStatsPanelStandalone
          stats={mockStats}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Aggregate statistics for selected parts')
    })
  })
})

// =============================================================================
// AggregateStatsPanel Integration Tests (with hook)
// =============================================================================

describe('AggregateStatsPanel (with useAggregateStats hook)', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('shows empty state when working set is empty', async () => {
    renderWithRouter(<AggregateStatsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Select parts to view statistics')).toBeInTheDocument()
    })
  })

  it('shows statistics when parts are selected', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<AggregateStatsPanel />)

    await waitFor(() => {
      // Should show Width row
      expect(screen.getByText('Width')).toBeInTheDocument()
      // Count should be 5
      const fives = screen.getAllByText('5')
      expect(fives.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows N/A for stdDev with single part (AC 3.5.5)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<AggregateStatsPanel />)

    await waitFor(() => {
      const naTexts = screen.getAllByText('N/A')
      expect(naTexts.length).toBe(4) // All 4 dimensions
    })
  })

  it('updates when working set changes (AC 3.5.3)', async () => {
    // Start with empty working set
    renderWithRouter(<AggregateStatsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Select parts to view statistics')).toBeInTheDocument()
    })

    // Add parts
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    await waitFor(() => {
      // Should now show statistics
      expect(screen.getByText('Width')).toBeInTheDocument()
      // Count should be 2
      const twos = screen.getAllByText('2')
      expect(twos.length).toBeGreaterThanOrEqual(1)
    })
  })
})
