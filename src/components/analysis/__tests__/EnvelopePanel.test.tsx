// src/components/analysis/__tests__/EnvelopePanel.test.tsx
// Component tests for EnvelopePanel
// AC 3.6.1, 3.6.2, 3.6.3

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  EnvelopePanelStandalone,
  EnvelopePanel,
} from '../EnvelopePanel'
import { useWorkingSetStore } from '@/stores/workingSet'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import type { EnvelopeResult } from '@/lib/analysis/envelope'
import type { Part } from '@/types/domain'

// =============================================================================
// Test Data
// =============================================================================

const mockEnvelope: EnvelopeResult = {
  width_mm: 45.5,
  height_mm: 12.25,
  length_mm: 100.0,
  drivers: {
    maxWidth: { partId: 'CONN-A', partCallout: 'CONN-A', value: 45.5 },
    maxHeight: { partId: 'CONN-B', partCallout: 'CONN-B', value: 12.25 },
    maxLength: { partId: 'CONN-C', partCallout: 'CONN-C', value: 100.0 },
  },
}

const decimalEnvelope: EnvelopeResult = {
  width_mm: 45.123,
  height_mm: 12.0,
  length_mm: 100.5678,
  drivers: {
    maxWidth: { partId: 'A', partCallout: 'A', value: 45.123 },
    maxHeight: { partId: 'B', partCallout: 'B', value: 12.0 },
    maxLength: { partId: 'C', partCallout: 'C', value: 100.5678 },
  },
}

// Mock parts for integration tests
// Use same data as AggregateStatsPanel.test.tsx to avoid mock hoisting issues
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
// EnvelopePanelStandalone Tests (Isolated component tests)
// =============================================================================

describe('EnvelopePanelStandalone', () => {
  describe('loading state', () => {
    it('renders loading message when isLoading is true', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Loading...')).toBeInTheDocument()
    })

    it('renders card with title during loading', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={null}
          isLoading={true}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Worst-Case Envelope')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('renders empty message when isEmpty is true', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={null}
          isLoading={false}
          isEmpty={true}
        />
      )

      expect(await screen.findByText('Select parts to view envelope')).toBeInTheDocument()
    })

    it('renders empty message when envelope is null', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={null}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Select parts to view envelope')).toBeInTheDocument()
    })

    it('panel layout remains stable (no layout shift)', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={null}
          isLoading={false}
          isEmpty={true}
        />
      )

      // Card title and content should exist to maintain layout structure
      expect(await screen.findByText('Worst-Case Envelope')).toBeInTheDocument()
      expect(screen.getByText('Select parts to view envelope')).toBeInTheDocument()
    })
  })

  describe('envelope display (AC 3.6.1)', () => {
    it('renders all 3 dimensions', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Max Width')).toBeInTheDocument()
      expect(screen.getByText('Max Height')).toBeInTheDocument()
      expect(screen.getByText('Max Length')).toBeInTheDocument()
    })

    it('renders card title "Worst-Case Envelope" (AC 3.6.1)', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      expect(await screen.findByText('Worst-Case Envelope')).toBeInTheDocument()
    })

    it('displays values with correct units (mm)', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')

      // All values should show mm
      expect(screen.getByText('45.50 mm')).toBeInTheDocument()
      expect(screen.getByText('12.25 mm')).toBeInTheDocument()
      expect(screen.getByText('100.00 mm')).toBeInTheDocument()
    })
  })

  describe('driver identification (AC 3.6.2)', () => {
    it('displays driver callouts for each dimension', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')

      expect(screen.getByText('(CONN-A)')).toBeInTheDocument()
      expect(screen.getByText('(CONN-B)')).toBeInTheDocument()
      expect(screen.getByText('(CONN-C)')).toBeInTheDocument()
    })

    it('driver callout has muted styling class', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')

      const driverCallout = screen.getByText('(CONN-A)')
      expect(driverCallout).toHaveClass('text-muted-foreground')
    })
  })

  describe('values formatted correctly (AC 3.6.1)', () => {
    it('formats values with 2 decimal places', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={decimalEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')

      // 45.123 should become 45.12
      expect(screen.getByText('45.12 mm')).toBeInTheDocument()
      // 12.0 should become 12.00
      expect(screen.getByText('12.00 mm')).toBeInTheDocument()
      // 100.5678 should become 100.57
      expect(screen.getByText('100.57 mm')).toBeInTheDocument()
    })

    it('rounds values correctly', async () => {
      const roundingEnvelope: EnvelopeResult = {
        width_mm: 45.125, // rounds to 45.13
        height_mm: 45.124, // rounds to 45.12
        length_mm: 45.1, // rounds to 45.10
        drivers: {
          maxWidth: { partId: 'A', partCallout: 'A', value: 45.125 },
          maxHeight: { partId: 'B', partCallout: 'B', value: 45.124 },
          maxLength: { partId: 'C', partCallout: 'C', value: 45.1 },
        },
      }

      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={roundingEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')

      expect(screen.getByText('45.13 mm')).toBeInTheDocument() // rounded up
      expect(screen.getByText('45.12 mm')).toBeInTheDocument() // rounded down
      expect(screen.getByText('45.10 mm')).toBeInTheDocument() // trailing zero
    })
  })

  describe('accessibility', () => {
    it('has aria-label on content', async () => {
      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={mockEnvelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')

      const content = screen.getByLabelText('Worst-case envelope dimensions')
      expect(content).toBeInTheDocument()
    })
  })

  describe('AC verification cases', () => {
    it('AC 3.6.1: widths [10, 25, 45] → Max Width = 45.00 mm', async () => {
      const envelope: EnvelopeResult = {
        width_mm: 45,
        height_mm: 10,
        length_mm: 10,
        drivers: {
          maxWidth: { partId: 'P3', partCallout: 'P3', value: 45 },
          maxHeight: { partId: 'P1', partCallout: 'P1', value: 10 },
          maxLength: { partId: 'P1', partCallout: 'P1', value: 10 },
        },
      }

      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={envelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')
      expect(screen.getByText('45.00 mm')).toBeInTheDocument()
    })

    it('AC 3.6.1: heights [5, 12, 8] → Max Height = 12.00 mm', async () => {
      const envelope: EnvelopeResult = {
        width_mm: 10,
        height_mm: 12,
        length_mm: 10,
        drivers: {
          maxWidth: { partId: 'P1', partCallout: 'P1', value: 10 },
          maxHeight: { partId: 'P2', partCallout: 'P2', value: 12 },
          maxLength: { partId: 'P1', partCallout: 'P1', value: 10 },
        },
      }

      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={envelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Height')
      expect(screen.getByText('12.00 mm')).toBeInTheDocument()
    })

    it('AC 3.6.2: driver format "45.00 mm (CONN-A)"', async () => {
      const envelope: EnvelopeResult = {
        width_mm: 45,
        height_mm: 30,
        length_mm: 25,
        drivers: {
          maxWidth: { partId: 'CONN-A', partCallout: 'CONN-A', value: 45 },
          maxHeight: { partId: 'CONN-B', partCallout: 'CONN-B', value: 30 },
          maxLength: { partId: 'CONN-C', partCallout: 'CONN-C', value: 25 },
        },
      }

      renderWithRouter(
        <EnvelopePanelStandalone
          envelope={envelope}
          isLoading={false}
          isEmpty={false}
        />
      )

      await screen.findByText('Max Width')
      expect(screen.getByText('45.00 mm')).toBeInTheDocument()
      expect(screen.getByText('(CONN-A)')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// EnvelopePanel Integration Tests (with hook)
// =============================================================================

describe('EnvelopePanel (with useEnvelopeCalculation hook)', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('shows empty state when working set is empty', async () => {
    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      expect(screen.getByText('Select parts to view envelope')).toBeInTheDocument()
    })
  })

  it('shows envelope when parts are selected', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      expect(screen.getByText('Max Width')).toBeInTheDocument()
      // Max width from mock data: PART-003 = 30
      expect(screen.getByText('30.00 mm')).toBeInTheDocument()
    })
  })

  it('identifies correct driver parts', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      // All dimensions driven by PART-003 (width=30, height=15, length=60)
      // Multiple (PART-003) callouts should appear
      const part003Callouts = screen.getAllByText('(PART-003)')
      expect(part003Callouts.length).toBe(3) // All 3 dimensions driven by PART-003
    })
  })

  it('updates when working set changes (AC 3.6.3)', async () => {
    // Start with empty working set
    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      expect(screen.getByText('Select parts to view envelope')).toBeInTheDocument()
    })

    // Add parts
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    await waitFor(() => {
      // Should now show envelope
      expect(screen.getByText('Max Width')).toBeInTheDocument()
      // Max width: PART-002 = 20
      expect(screen.getByText('20.00 mm')).toBeInTheDocument()
    })
  })

  it('updates driver when larger part added (AC 3.6.3)', async () => {
    // Start with smaller parts
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      // Max width: PART-002 = 20 (PART-002 drives all dimensions)
      expect(screen.getByText('20.00 mm')).toBeInTheDocument()
      // PART-002 appears multiple times (drives all dimensions)
      expect(screen.getAllByText('(PART-002)').length).toBeGreaterThanOrEqual(1)
    })

    // Add larger part
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    await waitFor(() => {
      // Max width: PART-003 = 30 (PART-003 now drives all dimensions)
      expect(screen.getByText('30.00 mm')).toBeInTheDocument()
      expect(screen.getAllByText('(PART-003)').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('updates driver when driving part removed (AC 3.6.3)', async () => {
    // Start with all parts - PART-003 is width driver
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      expect(screen.getByText('30.00 mm')).toBeInTheDocument()
      expect(screen.getAllByText('(PART-003)').length).toBeGreaterThanOrEqual(1)
    })

    // Remove PART-003
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    await waitFor(() => {
      // PART-002 should now be driver (drives all dimensions)
      expect(screen.getByText('20.00 mm')).toBeInTheDocument()
      expect(screen.getAllByText('(PART-002)').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows empty state when working set cleared (AC 3.6.3)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      expect(screen.getByText('Max Width')).toBeInTheDocument()
    })

    // Clear working set
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })

    await waitFor(() => {
      expect(screen.getByText('Select parts to view envelope')).toBeInTheDocument()
    })
  })

  it('handles single part', async () => {
    // Fresh state reset
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })

    useWorkingSetStore.setState({
      partIds: new Set(['PART-001']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<EnvelopePanel />)

    await waitFor(() => {
      expect(screen.getByText('Max Width')).toBeInTheDocument()
      // PART-001: width=10, height=5, length=20
      expect(screen.getByText('10.00 mm')).toBeInTheDocument()
      expect(screen.getByText('5.00 mm')).toBeInTheDocument()
      expect(screen.getByText('20.00 mm')).toBeInTheDocument()
      // All driven by PART-001
      expect(screen.getAllByText('(PART-001)').length).toBe(3)
    })
  })
})
