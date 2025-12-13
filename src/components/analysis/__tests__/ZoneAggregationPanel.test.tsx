// src/components/analysis/__tests__/ZoneAggregationPanel.test.tsx
// Component tests for ZoneAggregationPanel
// AC-3.9.1 through AC-3.9.5

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ZoneAggregationPanelStandalone,
  ZoneAggregationPanel,
} from '../ZoneAggregationPanel'
import { useWorkingSetStore } from '@/stores/workingSet'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import userEvent from '@testing-library/user-event'
import type { ZoneAggregation } from '@/lib/analysis/zoneAggregation'
import type { Part, InspectionZone } from '@/types/domain'

// =============================================================================
// Test Data
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

const mockAggregation: ZoneAggregation = {
  totalZones: 5,
  zonesByFace: { Top: 3, Front: 2 },
  depthRange: { min: 1.0, max: 5.0 },
  smallestFeature_um: 50,
}

const singleZoneAggregation: ZoneAggregation = {
  totalZones: 1,
  zonesByFace: { Top: 1 },
  depthRange: { min: 2.5, max: 2.5 },
  smallestFeature_um: 100,
}

const allFacesAggregation: ZoneAggregation = {
  totalZones: 12,
  zonesByFace: {
    Top: 4,
    Bottom: 2,
    Front: 3,
    Back: 1,
    Left: 1,
    Right: 1,
  },
  depthRange: { min: 0.5, max: 8.25 },
  smallestFeature_um: 25,
}

// Mock parts for integration tests
const mockParts: Part[] = [
  {
    PartCallout: 'PART-001',
    PartSeries: 'SeriesA',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 100,
    InspectionZones: [createTestZone({ Face: 'Top', ZoneDepth_mm: 1.0 })],
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

// Mock parts repository
vi.mock('@/lib/repositories/partsRepository', () => ({
  partsRepository: {
    getAll: vi.fn(() => Promise.resolve(mockParts)),
  },
}))

// =============================================================================
// ZoneAggregationPanelStandalone Tests (Isolated component tests)
// =============================================================================

describe('ZoneAggregationPanelStandalone', () => {
  describe('loading state', () => {
    it('renders loading message when isLoading is true', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Loading...')).toBeInTheDocument()
    })

    it('renders card with title during loading', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Inspection Zone Summary')).toBeInTheDocument()
    })
  })

  describe('empty state (AC-3.9.5)', () => {
    it('renders empty message when isEmpty is true', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={null}
          isLoading={false}
          isEmpty={true}
        />
      )

      expect(await screen.findByText('No inspection zones defined')).toBeInTheDocument()
    })

    it('renders empty message when aggregation is null', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={null}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('No inspection zones defined')).toBeInTheDocument()
    })

    it('panel layout remains stable (no layout shift)', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={null}
          isLoading={false}
          isEmpty={true}
        />
      )

      expect(await screen.findByText('Inspection Zone Summary')).toBeInTheDocument()
      expect(screen.getByText('No inspection zones defined')).toBeInTheDocument()
    })
  })

  describe('overall zone distribution (AC-3.9.1)', () => {
    it('displays overall zone distribution header', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={mockAggregation}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Overall Zone Distribution')).toBeInTheDocument()
    })

    it('displays zones by face text summary', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={mockAggregation}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Overall Zone Distribution')
      expect(screen.getByText('Top: 3, Front: 2')).toBeInTheDocument()
    })

    it('only shows faces with zones', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={singleZoneAggregation}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Overall Zone Distribution')
      expect(screen.getByText('Top: 1')).toBeInTheDocument()
    })

    it('displays all 6 faces when present', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={allFacesAggregation}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Overall Zone Distribution')
      // Order follows FACE_ORDER: Top, Bottom, Front, Back, Left, Right
      expect(screen.getByText('Top: 4, Bottom: 2, Front: 3, Back: 1, Left: 1, Right: 1')).toBeInTheDocument()
    })
  })

  describe('zone distribution chart (AC-3.9.4)', () => {
    it('renders FaceZoneChart component', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={mockAggregation}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Overall Zone Distribution')
      expect(screen.getByTestId('face-zone-chart')).toBeInTheDocument()
    })
  })

  describe('card structure', () => {
    it('renders card with correct title', async () => {
      renderWithRouter(
        <ZoneAggregationPanelStandalone
          aggregation={mockAggregation}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Inspection Zone Summary')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// ZoneAggregationPanel Integration Tests (with hook)
// =============================================================================

describe('ZoneAggregationPanel (with useZoneAggregation hook)', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('shows empty state when working set is empty', async () => {
    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('No inspection zones defined')).toBeInTheDocument()
    })
  })

  it('shows empty state when selected parts have no zones', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-NO-ZONES']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('No inspection zones defined')).toBeInTheDocument()
    })
  })

  it('shows aggregation when parts with zones are selected', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('Overall Zone Distribution')).toBeInTheDocument()
    })
  })

  it('calculates correct zone counts per face', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('Overall Zone Distribution')).toBeInTheDocument()
      // Top: 2 (PART-001, PART-002), Front: 2 (PART-002, PART-003), Back: 1 (PART-003)
      expect(screen.getByText('Top: 2, Front: 2, Back: 1')).toBeInTheDocument()
    })
  })

  it('shows face selector dropdown', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('Zone Details by Face')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('shows face-specific metrics when face is selected', async () => {
    const user = userEvent.setup()
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Click the dropdown
    await user.click(screen.getByRole('combobox'))

    // Select "Top" face
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Top/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('option', { name: /Top/i }))

    // Now face-specific metrics should appear
    await waitFor(() => {
      expect(screen.getByText('Depth Range')).toBeInTheDocument()
      expect(screen.getByText('Smallest Lateral Feature')).toBeInTheDocument()
      expect(screen.getByText('Smallest Depth Feature')).toBeInTheDocument()
      expect(screen.getByText('Distribution by Series')).toBeInTheDocument()
    })
  })

  it('updates when working set changes', async () => {
    // Start with empty working set
    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('No inspection zones defined')).toBeInTheDocument()
    })

    // Add parts
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001']),
      stationIds: new Set<string>(),
    })

    await waitFor(() => {
      expect(screen.getByText('Overall Zone Distribution')).toBeInTheDocument()
      expect(screen.getByText('Top: 1')).toBeInTheDocument()
    })
  })

  it('shows empty state when working set cleared', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('Overall Zone Distribution')).toBeInTheDocument()
    })

    // Clear working set
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })

    await waitFor(() => {
      expect(screen.getByText('No inspection zones defined')).toBeInTheDocument()
    })
  })

  it('handles single part with zones', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<ZoneAggregationPanel />)

    await waitFor(() => {
      expect(screen.getByText('Top: 1')).toBeInTheDocument()
    })
  })
})
