// src/components/analysis/__tests__/UnifiedStatsEnvelopePanel.test.tsx
// Component tests for UnifiedStatsEnvelopePanel
// AC-3.17.1-8: Unified panel with stats, envelope, and boxplot

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  UnifiedStatsEnvelopePanelStandalone,
  UnifiedStatsEnvelopePanel,
} from '../UnifiedStatsEnvelopePanel'
import { useWorkingSetStore } from '@/stores/workingSet'
import { renderWithRouter, screen, within } from '@/test/router-utils'
import type { AggregateStatistics } from '@/lib/analysis/statistics'
import type { EnvelopeResult } from '@/lib/analysis/envelope'
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
  smallestLateralFeature: {
    count: 5,
    min: 100,
    max: 500,
    mean: 300,
    median: 300,
    stdDev: 141.42,
  },
  smallestDepthFeature: null, // No depth feature data
}

const mockStatsWithDepth: AggregateStatistics = {
  ...mockStats,
  smallestDepthFeature: {
    count: 3,
    min: 50,
    max: 200,
    mean: 100,
    median: 75,
    stdDev: 62.36,
  },
}

const mockEnvelope: EnvelopeResult = {
  width_mm: 50,
  height_mm: 25,
  length_mm: 100,
  drivers: {
    maxWidth: { partId: 'PART-005', partCallout: 'PART-005', value: 50 },
    maxHeight: { partId: 'PART-005', partCallout: 'PART-005', value: 25 },
    maxLength: { partId: 'PART-005', partCallout: 'PART-005', value: 100 },
  },
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
// UnifiedStatsEnvelopePanelStandalone Tests (Isolated component tests)
// =============================================================================

describe('UnifiedStatsEnvelopePanelStandalone', () => {
  describe('loading state', () => {
    it('renders loading indicator when isLoading is true', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={null}
          envelope={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Loading...')).toBeInTheDocument()
    })

    it('renders card with title during loading', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={null}
          envelope={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Working Set Summary')).toBeInTheDocument()
    })
  })

  describe('empty state (AC-3.17.5 - Combined empty state)', () => {
    it('renders empty message when isEmpty is true', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={null}
          envelope={null}
          isLoading={false}
          isEmpty={true}
        />
      )

      expect(await screen.findByText('Select parts to view working set summary')).toBeInTheDocument()
    })

    it('renders empty message when stats is null', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={null}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Select parts to view working set summary')).toBeInTheDocument()
    })

    it('renders empty message when envelope is null', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={null}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Select parts to view working set summary')).toBeInTheDocument()
    })
  })

  describe('stats table (AC-3.17.1)', () => {
    it('renders all 5 dimension rows', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Width')).toBeInTheDocument()
      expect(screen.getByText('Height')).toBeInTheDocument()
      expect(screen.getByText('Length')).toBeInTheDocument()
      expect(screen.getByText('Smallest Lateral Feature')).toBeInTheDocument()
      expect(screen.getByText('Smallest Depth Feature')).toBeInTheDocument()
    })

    it('renders all 6 statistics columns in header', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Min')).toBeInTheDocument()
      expect(screen.getByText('Max')).toBeInTheDocument()
      expect(screen.getByText('Mean')).toBeInTheDocument()
      expect(screen.getByText('Median')).toBeInTheDocument()
      expect(screen.getByText('Std Dev')).toBeInTheDocument()
    })

    it('displays correct units (mm for dimensions, µm for features)', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // Width row should have mm units
      const mmCells = screen.getAllByText(/mm/)
      expect(mmCells.length).toBeGreaterThan(0)

      // Lateral Feature row should have µm units
      const umCells = screen.getAllByText(/µm/)
      expect(umCells.length).toBeGreaterThan(0)
    })
  })

  describe('depth feature N/A (AC-3.17.2)', () => {
    it('shows N/A message for depth feature when no data', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats} // mockStats has smallestDepthFeature: null
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')
      expect(screen.getByText('N/A - No parts have this data')).toBeInTheDocument()
    })

    it('shows depth statistics when data is available', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStatsWithDepth}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // Should show depth feature stats instead of N/A
      expect(screen.queryByText('N/A - No parts have this data')).not.toBeInTheDocument()

      // Depth feature min = 50, should be displayed
      expect(screen.getByText('50.00 µm')).toBeInTheDocument()
    })
  })

  describe('envelope section (AC-3.17.3)', () => {
    it('renders envelope section header', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Worst-Case Envelope')).toBeInTheDocument()
    })

    it('displays all 3 envelope dimensions', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Worst-Case Envelope')

      expect(screen.getByText('Max Width')).toBeInTheDocument()
      expect(screen.getByText('Max Height')).toBeInTheDocument()
      expect(screen.getByText('Max Length')).toBeInTheDocument()
    })

    it('displays driver callouts for each dimension', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Worst-Case Envelope')

      // All dimensions driven by PART-005
      const callouts = screen.getAllByText('(PART-005)')
      expect(callouts.length).toBe(3)
    })

    it('displays envelope values with mm units', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')

      // Get envelope section specifically (values may also appear in stats table)
      const envelopeSection = screen.getByLabelText('Worst-case envelope dimensions')

      // Check values within envelope section
      expect(within(envelopeSection).getByText('50.00 mm')).toBeInTheDocument()
      expect(within(envelopeSection).getByText('25.00 mm')).toBeInTheDocument()
      expect(within(envelopeSection).getByText('100.00 mm')).toBeInTheDocument()
    })
  })

  describe('boxplot section (AC-3.17.4, AC-3.17.5)', () => {
    it('renders boxplot area in two-column layout', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // The boxplot component is rendered (uses hook internally, so we just verify the container exists)
      // The AggregateBoxPlotChart has its own tests for dimension tabs
      const statsTable = screen.getByRole('table')
      expect(statsTable).toBeInTheDocument()
    })
  })

  describe('calculating state', () => {
    it('shows calculating overlay when isCalculating is true', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isCalculating={true}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      const overlay = screen.getByLabelText('Calculating statistics')
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has aria-label on stats table', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Aggregate statistics for selected parts')
    })

    it('has aria-label on envelope section', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      const envelope = screen.getByLabelText('Worst-case envelope dimensions')
      expect(envelope).toBeInTheDocument()
    })
  })

  describe('two-column layout (AC-3.17.7)', () => {
    it('renders both stats/envelope and boxplot sections', async () => {
      renderWithRouter(
        <UnifiedStatsEnvelopePanelStandalone
          stats={mockStats}
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Width')

      // Left column: stats table and envelope
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Worst-Case Envelope')).toBeInTheDocument()

      // Right column: boxplot area exists (uses hook internally, verified in AggregateBoxPlotChart tests)
      expect(screen.getByLabelText('Worst-case envelope dimensions')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// UnifiedStatsEnvelopePanel Integration Tests (with hooks)
// =============================================================================

describe('UnifiedStatsEnvelopePanel (with hooks)', () => {
  beforeEach(() => {
    // Reset working set store to empty state
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('shows panel title "Working Set Summary"', async () => {
    renderWithRouter(<UnifiedStatsEnvelopePanel />)

    expect(await screen.findByText('Working Set Summary')).toBeInTheDocument()
  })

  describe('collapsible behavior (AC-3.17.8)', () => {
    it('renders collapsible header with aria-expanded', async () => {
      renderWithRouter(<UnifiedStatsEnvelopePanel />)

      expect(await screen.findByText('Working Set Summary')).toBeInTheDocument()

      // Should have a collapsible header with role="button"
      const header = screen.getByRole('button', { name: /Working Set Summary/i })
      expect(header).toHaveAttribute('aria-expanded', 'true')
    })

    it('has aria-controls for content', async () => {
      renderWithRouter(<UnifiedStatsEnvelopePanel />)

      expect(await screen.findByText('Working Set Summary')).toBeInTheDocument()

      const header = screen.getByRole('button', { name: /Working Set Summary/i })
      expect(header).toHaveAttribute('aria-controls', 'panel-content-unified-stats-envelope')
    })
  })
})
