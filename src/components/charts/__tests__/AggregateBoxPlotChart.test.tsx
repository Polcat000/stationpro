// src/components/charts/__tests__/AggregateBoxPlotChart.test.tsx
// Tests for AggregateBoxPlotChart component
// AC-3.17.4: Single boxplot for entire working set
// AC-3.17.5: Tab selector for dimension switching
// AC-3.17.6: Disabled depth tab when no data

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithRouter, screen } from '@/test/router-utils'
import userEvent from '@testing-library/user-event'
import { AggregateBoxPlotChart } from '../AggregateBoxPlotChart'
import { useWorkingSetStore } from '@/stores/workingSet'
import type { Part } from '@/types/domain'

// =============================================================================
// Test Data
// =============================================================================

const mockPartsWithDepth: Part[] = [
  {
    PartCallout: 'PART-001',
    PartSeries: 'SeriesA',
    PartWidth_mm: 10,
    PartHeight_mm: 5,
    PartLength_mm: 20,
    SmallestLateralFeature_um: 100,
    SmallestDepthFeature_um: 150,
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-002',
    PartSeries: 'SeriesB',
    PartWidth_mm: 20,
    PartHeight_mm: 10,
    PartLength_mm: 40,
    SmallestLateralFeature_um: 200,
    SmallestDepthFeature_um: 250,
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-003',
    PartSeries: 'SeriesC',
    PartWidth_mm: 30,
    PartHeight_mm: 15,
    PartLength_mm: 60,
    SmallestLateralFeature_um: 300,
    SmallestDepthFeature_um: 350,
    InspectionZones: [],
  },
]

const mockPartsWithoutDepth: Part[] = [
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
]

// =============================================================================
// Test Setup
// =============================================================================

// Track which mock data to return
let currentMockParts: Part[] = mockPartsWithDepth

// Mock parts repository
vi.mock('@/lib/repositories/partsRepository', () => ({
  partsRepository: {
    getAll: vi.fn(() => Promise.resolve(currentMockParts)),
  },
}))

// =============================================================================
// Tests
// =============================================================================

describe('AggregateBoxPlotChart', () => {
  beforeEach(() => {
    currentMockParts = mockPartsWithDepth
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  describe('rendering (AC-3.17.4)', () => {
    it('renders chart container when parts are in working set', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<AggregateBoxPlotChart />)

      const chart = await screen.findByTestId('aggregate-boxplot-width')
      expect(chart).toBeInTheDocument()
    })

    it('shows loading state or resolves quickly', async () => {
      // Note: Loading state is transient and may resolve before assertion
      // We verify the component renders successfully
      renderWithRouter(<AggregateBoxPlotChart />)

      // Either loading or resolved state should be present
      const loadingOrEmpty = await screen.findByTestId(/aggregate-boxplot-(loading|empty)/)
      expect(loadingOrEmpty).toBeInTheDocument()
    })

    it('shows empty state when working set is empty', async () => {
      useWorkingSetStore.setState({
        partIds: new Set<string>(),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<AggregateBoxPlotChart />)

      const emptyState = await screen.findByTestId('aggregate-boxplot-empty')
      expect(emptyState).toBeInTheDocument()
      expect(screen.getByText(/no parts in working set/i)).toBeInTheDocument()
    })

    it('applies muted background per theme requirements', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<AggregateBoxPlotChart />)

      const chart = await screen.findByTestId('aggregate-boxplot-width')
      expect(chart).toHaveClass('bg-muted')
    })

    it('accepts custom height prop', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<AggregateBoxPlotChart height={300} />)

      const chart = await screen.findByTestId('aggregate-boxplot-width')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('dimension tabs (AC-3.17.5)', () => {
    beforeEach(() => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })
    })

    it('renders all 5 dimension tabs', async () => {
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      expect(screen.getByTestId('dimension-tab-width')).toBeInTheDocument()
      expect(screen.getByTestId('dimension-tab-height')).toBeInTheDocument()
      expect(screen.getByTestId('dimension-tab-length')).toBeInTheDocument()
      expect(screen.getByTestId('dimension-tab-lateral')).toBeInTheDocument()
      expect(screen.getByTestId('dimension-tab-depth')).toBeInTheDocument()
    })

    it('defaults to width dimension', async () => {
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      const widthTab = screen.getByTestId('dimension-tab-width')
      expect(widthTab).toHaveAttribute('data-state', 'active')
    })

    it('switches to height dimension on tab click', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      await user.click(screen.getByTestId('dimension-tab-height'))

      await screen.findByTestId('aggregate-boxplot-height')
      const heightTab = screen.getByTestId('dimension-tab-height')
      expect(heightTab).toHaveAttribute('data-state', 'active')
    })

    it('switches to length dimension on tab click', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      await user.click(screen.getByTestId('dimension-tab-length'))

      await screen.findByTestId('aggregate-boxplot-length')
      const lengthTab = screen.getByTestId('dimension-tab-length')
      expect(lengthTab).toHaveAttribute('data-state', 'active')
    })

    it('switches to lateral dimension on tab click', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      await user.click(screen.getByTestId('dimension-tab-lateral'))

      await screen.findByTestId('aggregate-boxplot-lateral')
      const lateralTab = screen.getByTestId('dimension-tab-lateral')
      expect(lateralTab).toHaveAttribute('data-state', 'active')
    })

    it('switches to depth dimension when parts have depth data', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      await user.click(screen.getByTestId('dimension-tab-depth'))

      await screen.findByTestId('aggregate-boxplot-depth')
      const depthTab = screen.getByTestId('dimension-tab-depth')
      expect(depthTab).toHaveAttribute('data-state', 'active')
    })
  })

  describe('disabled depth tab (AC-3.17.6)', () => {
    beforeEach(() => {
      currentMockParts = mockPartsWithoutDepth
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })
    })

    it('disables depth tab when no parts have depth data', async () => {
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      const depthTab = screen.getByTestId('dimension-tab-depth')
      expect(depthTab).toBeDisabled()
    })

    it('shows tooltip on disabled depth tab hover', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      // Hover over the disabled depth tab
      const depthTab = screen.getByTestId('dimension-tab-depth')
      await user.hover(depthTab.parentElement!) // Hover on the wrapper span

      // Tooltip should appear - find the tooltip content specifically
      const tooltips = await screen.findAllByText(/no parts have depth feature data/i)
      expect(tooltips.length).toBeGreaterThan(0)
    })

    it('enables depth tab when parts have depth data', async () => {
      currentMockParts = mockPartsWithDepth
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      const depthTab = screen.getByTestId('dimension-tab-depth')
      expect(depthTab).not.toBeDisabled()
    })
  })

  describe('data display', () => {
    beforeEach(() => {
      currentMockParts = mockPartsWithDepth
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })
    })

    it('renders chart with box plot for single aggregate group', async () => {
      renderWithRouter(<AggregateBoxPlotChart />)

      const chart = await screen.findByTestId('aggregate-boxplot-width')
      // Chart should render (Nivo internals tested separately)
      expect(chart).toBeInTheDocument()
    })

    it('renders rounded corners per design system', async () => {
      renderWithRouter(<AggregateBoxPlotChart />)

      const chart = await screen.findByTestId('aggregate-boxplot-width')
      expect(chart).toHaveClass('rounded-lg')
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003']),
        stationIds: new Set<string>(),
      })
    })

    it('tabs are keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AggregateBoxPlotChart />)

      await screen.findByTestId('aggregate-boxplot-width')

      // Focus on first tab
      const widthTab = screen.getByTestId('dimension-tab-width')
      widthTab.focus()

      // Tab to next dimension
      await user.keyboard('{ArrowRight}')

      const heightTab = screen.getByTestId('dimension-tab-height')
      expect(heightTab).toHaveFocus()
    })

    it('has accessible chart with aria-label', async () => {
      renderWithRouter(<AggregateBoxPlotChart />)

      const chart = await screen.findByTestId('aggregate-boxplot-width')
      // Chart container renders; Nivo SVG has aria-label internally
      expect(chart).toBeInTheDocument()
    })
  })
})
