// src/components/charts/__tests__/DimensionalDistributionChart.test.tsx
// Tests for DimensionalDistributionChart component
// AC 3.7.1, 3.7.4, 3.7.5
//
// NOTE: Recharts ResponsiveContainer requires actual DOM dimensions to render
// SVG content. In JSDOM tests, it renders as 0x0 container. We test:
// 1. Component mounting and container rendering
// 2. Empty state messaging
// 3. Props handling without asserting SVG internals

import { describe, it, expect } from 'vitest'
import { renderWithRouter, screen } from '@/test/router-utils'
import { DimensionalDistributionChart } from '../DimensionalDistributionChart'
import type { ChartDataPoint } from '@/hooks/useDimensionalDistribution'

// =============================================================================
// Test Data
// =============================================================================

const mockDataSingleSeries: ChartDataPoint[] = [
  { value: 10, count: 3, series: 'Series-A', partIds: ['p1', 'p2', 'p3'], isOutlier: false },
  { value: 15, count: 2, series: 'Series-A', partIds: ['p4', 'p5'], isOutlier: false },
  { value: 20, count: 1, series: 'Series-A', partIds: ['p6'], isOutlier: false },
]

const mockDataMultipleSeries: ChartDataPoint[] = [
  { value: 10, count: 3, series: 'Series-A', partIds: ['p1', 'p2', 'p3'], isOutlier: false },
  { value: 10, count: 2, series: 'Series-B', partIds: ['p4', 'p5'], isOutlier: false },
  { value: 20, count: 1, series: 'Series-C', partIds: ['p6'], isOutlier: false },
]

const mockDataWithOutlier: ChartDataPoint[] = [
  { value: 10, count: 3, series: 'Series-A', partIds: ['p1', 'p2', 'p3'], isOutlier: false },
  { value: 15, count: 2, series: 'Series-A', partIds: ['p4', 'p5'], isOutlier: false },
  { value: 50, count: 1, series: 'Series-A', partIds: ['p6'], isOutlier: true },
]

// =============================================================================
// Tests
// =============================================================================

describe('DimensionalDistributionChart', () => {
  describe('rendering', () => {
    it('renders chart container with data for Width dimension', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={mockDataSingleSeries}
          dimension="Width"
          seriesNames={['Series-A']}
          outlierPartIds={new Set()}
        />
      )

      // Chart container should be present with test ID
      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('renders chart container for Height dimension', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={mockDataSingleSeries}
          dimension="Height"
          seriesNames={['Series-A']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('height-chart')
      expect(chart).toBeInTheDocument()
    })

    it('renders chart container for Length dimension', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={mockDataSingleSeries}
          dimension="Length"
          seriesNames={['Series-A']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('length-chart')
      expect(chart).toBeInTheDocument()
    })

    it('renders ResponsiveContainer wrapper', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={mockDataSingleSeries}
          dimension="Width"
          seriesNames={['Series-A']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      // ResponsiveContainer adds this class
      expect(chart.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state message for Width when no data', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={[]}
          dimension="Width"
          seriesNames={[]}
          outlierPartIds={new Set()}
        />
      )

      expect(
        await screen.findByText(/select parts to view width distribution/i)
      ).toBeInTheDocument()
    })

    it('shows empty state message for Height when no data', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={[]}
          dimension="Height"
          seriesNames={[]}
          outlierPartIds={new Set()}
        />
      )

      expect(
        await screen.findByText(/select parts to view height distribution/i)
      ).toBeInTheDocument()
    })

    it('shows empty state message for Length when no data', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={[]}
          dimension="Length"
          seriesNames={[]}
          outlierPartIds={new Set()}
        />
      )

      expect(
        await screen.findByText(/select parts to view length distribution/i)
      ).toBeInTheDocument()
    })

    it('does not show chart container when empty', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={[]}
          dimension="Width"
          seriesNames={[]}
          outlierPartIds={new Set()}
        />
      )

      // Chart test ID should not be present when empty
      expect(screen.queryByTestId('width-chart')).not.toBeInTheDocument()
    })

    it('empty state shows muted text styling', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={[]}
          dimension="Width"
          seriesNames={[]}
          outlierPartIds={new Set()}
        />
      )

      // Empty state message has muted styling
      const message = await screen.findByText(/select parts to view width distribution/i)
      expect(message).toHaveClass('text-muted-foreground')
    })
  })

  describe('multiple series handling', () => {
    it('renders chart with multiple series data', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={mockDataMultipleSeries}
          dimension="Width"
          seriesNames={['Series-A', 'Series-B', 'Series-C']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('handles up to 5 series (AC 3.7.5 color theme)', async () => {
      const fiveSeriesData: ChartDataPoint[] = [
        { value: 10, count: 1, series: 'Series-1', partIds: ['p1'], isOutlier: false },
        { value: 20, count: 1, series: 'Series-2', partIds: ['p2'], isOutlier: false },
        { value: 30, count: 1, series: 'Series-3', partIds: ['p3'], isOutlier: false },
        { value: 40, count: 1, series: 'Series-4', partIds: ['p4'], isOutlier: false },
        { value: 50, count: 1, series: 'Series-5', partIds: ['p5'], isOutlier: false },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={fiveSeriesData}
          dimension="Width"
          seriesNames={['Series-1', 'Series-2', 'Series-3', 'Series-4', 'Series-5']}
          outlierPartIds={new Set()}
        />
      )

      // Should render without error
      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('cycles colors for more than 5 series (NFR-S5: 10+ series)', async () => {
      const manySeriesData: ChartDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
        value: (i + 1) * 10,
        count: 1,
        series: `Series-${i + 1}`,
        partIds: [`p${i + 1}`],
        isOutlier: false,
      }))

      renderWithRouter(
        <DimensionalDistributionChart
          data={manySeriesData}
          dimension="Width"
          seriesNames={manySeriesData.map((d) => d.series)}
          outlierPartIds={new Set()}
        />
      )

      // Should handle 10+ series gracefully (NFR-S5)
      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('outlier handling (AC 3.7.3)', () => {
    it('renders chart with outlier data', async () => {
      renderWithRouter(
        <DimensionalDistributionChart
          data={mockDataWithOutlier}
          dimension="Width"
          seriesNames={['Series-A']}
          outlierPartIds={new Set(['p6'])}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('handles multiple outliers', async () => {
      const multipleOutliers: ChartDataPoint[] = [
        { value: 5, count: 1, series: 'Series-A', partIds: ['outlier-1'], isOutlier: true },
        { value: 10, count: 3, series: 'Series-A', partIds: ['p1', 'p2', 'p3'], isOutlier: false },
        { value: 100, count: 1, series: 'Series-A', partIds: ['outlier-2'], isOutlier: true },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={multipleOutliers}
          dimension="Width"
          seriesNames={['Series-A']}
          outlierPartIds={new Set(['outlier-1', 'outlier-2'])}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('handles outliers across multiple series', async () => {
      const mixedOutliers: ChartDataPoint[] = [
        { value: 10, count: 2, series: 'Series-A', partIds: ['a1', 'a2'], isOutlier: false },
        { value: 50, count: 1, series: 'Series-A', partIds: ['a3'], isOutlier: true },
        { value: 15, count: 2, series: 'Series-B', partIds: ['b1', 'b2'], isOutlier: false },
        { value: 60, count: 1, series: 'Series-B', partIds: ['b3'], isOutlier: true },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={mixedOutliers}
          dimension="Width"
          seriesNames={['Series-A', 'Series-B']}
          outlierPartIds={new Set(['a3', 'b3'])}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('data variations', () => {
    it('renders single data point', async () => {
      const singlePoint: ChartDataPoint[] = [
        { value: 25, count: 5, series: 'Single', partIds: ['p1', 'p2', 'p3', 'p4', 'p5'], isOutlier: false },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={singlePoint}
          dimension="Width"
          seriesNames={['Single']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('renders data with high counts', async () => {
      const highCounts: ChartDataPoint[] = [
        { value: 10, count: 100, series: 'Batch', partIds: Array(100).fill('').map((_, i) => `p${i}`), isOutlier: false },
        { value: 20, count: 50, series: 'Batch', partIds: Array(50).fill('').map((_, i) => `p${100 + i}`), isOutlier: false },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={highCounts}
          dimension="Width"
          seriesNames={['Batch']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('renders data with decimal values', async () => {
      const decimalValues: ChartDataPoint[] = [
        { value: 10.5, count: 2, series: 'Precision', partIds: ['p1', 'p2'], isOutlier: false },
        { value: 15.75, count: 1, series: 'Precision', partIds: ['p3'], isOutlier: false },
        { value: 20.123, count: 3, series: 'Precision', partIds: ['p4', 'p5', 'p6'], isOutlier: false },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={decimalValues}
          dimension="Width"
          seriesNames={['Precision']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('handles Uncategorized series', async () => {
      const uncategorized: ChartDataPoint[] = [
        { value: 10, count: 2, series: 'Uncategorized', partIds: ['p1', 'p2'], isOutlier: false },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={uncategorized}
          dimension="Width"
          seriesNames={['Uncategorized']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('handles very small values', async () => {
      const smallValues: ChartDataPoint[] = [
        { value: 0.001, count: 1, series: 'Micro', partIds: ['p1'], isOutlier: false },
        { value: 0.005, count: 2, series: 'Micro', partIds: ['p2', 'p3'], isOutlier: false },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={smallValues}
          dimension="Width"
          seriesNames={['Micro']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })

    it('handles very large values', async () => {
      const largeValues: ChartDataPoint[] = [
        { value: 10000, count: 1, series: 'Large', partIds: ['p1'], isOutlier: false },
        { value: 50000, count: 2, series: 'Large', partIds: ['p2', 'p3'], isOutlier: false },
      ]

      renderWithRouter(
        <DimensionalDistributionChart
          data={largeValues}
          dimension="Width"
          seriesNames={['Large']}
          outlierPartIds={new Set()}
        />
      )

      const chart = await screen.findByTestId('width-chart')
      expect(chart).toBeInTheDocument()
    })
  })
})
