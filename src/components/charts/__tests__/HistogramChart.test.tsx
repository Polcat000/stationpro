// src/components/charts/__tests__/HistogramChart.test.tsx
// Tests for HistogramChart component using Nivo
// AC-3.7a.2: Histogram drill-down with bucketed bars
// AC-3.7a.5: Tooltip with bin range and part callouts
// AC-3.7a.6: Theme compliance
//
// NOTE: Nivo ResponsiveBar requires actual DOM dimensions to render
// SVG content. In JSDOM tests, it renders as 0x0 container. We test:
// 1. Component mounting and container rendering
// 2. Empty state messaging
// 3. Props handling without asserting SVG internals

import { describe, it, expect } from 'vitest'
import { renderWithRouter, screen } from '@/test/router-utils'
import {
  HistogramChart,
  createHistogramBins,
  DEFAULT_BIN_COUNT,
  type HistogramBin,
} from '../HistogramChart'

// =============================================================================
// Test Data Factories
// =============================================================================

function createTestBin(overrides: Partial<HistogramBin> = {}): HistogramBin {
  return {
    binStart: 10,
    binEnd: 15,
    binCenter: 12.5,
    count: 5,
    partCallouts: ['PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005'],
    hasOutliers: false,
    binLabel: '10.0',
    ...overrides,
  }
}

function createTestBins(count: number = 5): HistogramBin[] {
  return Array.from({ length: count }, (_, i) => ({
    binStart: i * 5,
    binEnd: (i + 1) * 5,
    binCenter: i * 5 + 2.5,
    count: Math.floor(Math.random() * 10) + 1,
    partCallouts: Array.from(
      { length: Math.floor(Math.random() * 5) + 1 },
      (_, j) => `PART-${i}-${j}`
    ),
    hasOutliers: false,
    binLabel: `${(i * 5).toFixed(1)}`,
  }))
}

// =============================================================================
// Component Tests
// =============================================================================

describe('HistogramChart', () => {
  describe('rendering (AC-3.7a.2)', () => {
    it('renders chart container for width dimension', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('renders chart container for height dimension', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="height" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('height-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('renders chart container for length dimension', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="length" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('length-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('applies muted background per theme requirements', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      const bgElement = chart.querySelector('.bg-muted')
      expect(bgElement).toBeInTheDocument()
    })
  })

  describe('empty state (AC-3.7a.2)', () => {
    it('shows empty state message for width when no data', async () => {
      renderWithRouter(
        <HistogramChart data={[]} dimension="width" seriesName="Series-A" />
      )

      expect(
        await screen.findByText(/no data for width distribution/i)
      ).toBeInTheDocument()
    })

    it('shows empty state message for height when no data', async () => {
      renderWithRouter(
        <HistogramChart data={[]} dimension="height" seriesName="Series-A" />
      )

      expect(
        await screen.findByText(/no data for height distribution/i)
      ).toBeInTheDocument()
    })

    it('shows empty state message for length when no data', async () => {
      renderWithRouter(
        <HistogramChart data={[]} dimension="length" seriesName="Series-A" />
      )

      expect(
        await screen.findByText(/no data for length distribution/i)
      ).toBeInTheDocument()
    })

    it('uses empty state test ID when no data', async () => {
      renderWithRouter(
        <HistogramChart data={[]} dimension="width" seriesName="Series-A" />
      )

      expect(await screen.findByTestId('width-histogram-empty')).toBeInTheDocument()
    })

    it('empty state has muted styling', async () => {
      renderWithRouter(
        <HistogramChart data={[]} dimension="width" seriesName="Series-A" />
      )

      const emptyState = await screen.findByTestId('width-histogram-empty')
      expect(emptyState).toHaveClass('text-muted-foreground')
    })
  })

  describe('bin data handling (AC-3.7a.2)', () => {
    it('renders with single bin', async () => {
      const data = [createTestBin()]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('renders with 10 bins (default histogram)', async () => {
      const data = createTestBins(10)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('renders with many bins (20+)', async () => {
      const data = createTestBins(20)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('handles bins with high part counts', async () => {
      const data = [
        createTestBin({
          count: 100,
          partCallouts: Array.from({ length: 100 }, (_, i) => `PART-${i}`),
        }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('outlier bin styling (AC-3.7a.2)', () => {
    it('renders chart with outlier bins', async () => {
      const data = [
        createTestBin({ hasOutliers: false }),
        createTestBin({ binStart: 15, binEnd: 20, binLabel: '15.0', hasOutliers: true }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('handles multiple outlier bins', async () => {
      const data = [
        createTestBin({ hasOutliers: true }),
        createTestBin({ binStart: 15, binEnd: 20, binLabel: '15.0', hasOutliers: false }),
        createTestBin({ binStart: 20, binEnd: 25, binLabel: '20.0', hasOutliers: true }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('handles all bins as outliers', async () => {
      const data = createTestBins(5).map((bin) => ({ ...bin, hasOutliers: true }))

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('part callouts (AC-3.7a.5)', () => {
    it('renders with bins containing few parts (≤5)', async () => {
      const data = [
        createTestBin({
          count: 3,
          partCallouts: ['PART-001', 'PART-002', 'PART-003'],
        }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('renders with bins containing many parts (>5)', async () => {
      const data = [
        createTestBin({
          count: 20,
          partCallouts: Array.from({ length: 20 }, (_, i) => `PART-${i + 1}`),
        }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('height configuration', () => {
    it('uses default height of 250px', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      const container = chart.querySelector('[style*="height"]')
      expect(container).toBeInTheDocument()
    })

    it('accepts custom height prop', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart
          data={data}
          dimension="width"
          seriesName="Series-A"
          height={400}
        />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('series name handling', () => {
    it('accepts series name prop', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="My Custom Series" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('handles Uncategorized series', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Uncategorized" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('data variations', () => {
    it('handles decimal bin edges', async () => {
      const data = [
        createTestBin({ binStart: 10.5, binEnd: 15.75, binLabel: '10.5' }),
        createTestBin({ binStart: 15.75, binEnd: 20.123, binLabel: '15.8' }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('handles very small values', async () => {
      const data = [
        createTestBin({ binStart: 0.001, binEnd: 0.005, binLabel: '0.0' }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })

    it('handles very large values', async () => {
      const data = [
        createTestBin({ binStart: 10000, binEnd: 15000, binLabel: '10000.0' }),
      ]

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has aria-label describing the chart', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Series-A" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Width')
      )
    })

    it('includes series name in aria-label', async () => {
      const data = createTestBins(5)

      renderWithRouter(
        <HistogramChart data={data} dimension="width" seriesName="Test Series" />
      )

      const chart = await screen.findByTestId('width-histogram')
      expect(chart).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Test Series')
      )
    })
  })
})

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('createHistogramBins', () => {
  describe('basic binning', () => {
    it('creates correct number of bins', () => {
      const values = [
        { value: 10, partCallout: 'P1', isOutlier: false },
        { value: 20, partCallout: 'P2', isOutlier: false },
        { value: 30, partCallout: 'P3', isOutlier: false },
        { value: 40, partCallout: 'P4', isOutlier: false },
        { value: 50, partCallout: 'P5', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 5)

      // Should have bins (some may be empty and filtered out)
      expect(bins.length).toBeGreaterThan(0)
      expect(bins.length).toBeLessThanOrEqual(5)
    })

    it('returns empty array for empty input', () => {
      const bins = createHistogramBins([])
      expect(bins).toEqual([])
    })

    it('handles single value', () => {
      const values = [{ value: 15, partCallout: 'P1', isOutlier: false }]

      const bins = createHistogramBins(values, 10)

      expect(bins).toHaveLength(1)
      expect(bins[0].count).toBe(1)
      expect(bins[0].partCallouts).toContain('P1')
    })

    it('handles all identical values', () => {
      const values = [
        { value: 15, partCallout: 'P1', isOutlier: false },
        { value: 15, partCallout: 'P2', isOutlier: false },
        { value: 15, partCallout: 'P3', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 10)

      expect(bins).toHaveLength(1)
      expect(bins[0].count).toBe(3)
      expect(bins[0].binStart).toBe(15)
      expect(bins[0].binEnd).toBe(15)
    })

    it('uses default bin count when not specified', () => {
      const values = Array.from({ length: 100 }, (_, i) => ({
        value: i,
        partCallout: `P${i}`,
        isOutlier: false,
      }))

      const bins = createHistogramBins(values)

      // Default is 10 bins, but empty bins are filtered
      expect(bins.length).toBeLessThanOrEqual(DEFAULT_BIN_COUNT)
    })
  })

  describe('bin boundaries', () => {
    it('calculates correct bin boundaries', () => {
      const values = [
        { value: 0, partCallout: 'P1', isOutlier: false },
        { value: 100, partCallout: 'P2', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 10)

      // First bin should start at 0
      expect(bins[0].binStart).toBe(0)

      // Last populated bin should end at or near 100
      const lastBin = bins[bins.length - 1]
      expect(lastBin.binEnd).toBeGreaterThanOrEqual(100)
    })

    it('assigns values to correct bins', () => {
      const values = [
        { value: 5, partCallout: 'P1', isOutlier: false },
        { value: 15, partCallout: 'P2', isOutlier: false },
        { value: 25, partCallout: 'P3', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 3)

      // Each value should be in a different bin
      expect(bins.length).toBe(3)
      expect(bins.map((b) => b.count)).toEqual([1, 1, 1])
    })

    it('handles maxValue at bin edge', () => {
      const values = [
        { value: 0, partCallout: 'P1', isOutlier: false },
        { value: 50, partCallout: 'P2', isOutlier: false },
        { value: 100, partCallout: 'P3', isOutlier: false }, // Exactly at max
      ]

      const bins = createHistogramBins(values, 10)

      // Should not throw, maxValue should be in last bin
      expect(bins).toBeDefined()
      const lastBin = bins.find((b) => b.partCallouts.includes('P3'))
      expect(lastBin).toBeDefined()
    })
  })

  describe('part callouts tracking', () => {
    it('tracks part callouts in bins', () => {
      const values = [
        { value: 10, partCallout: 'PART-A', isOutlier: false },
        { value: 11, partCallout: 'PART-B', isOutlier: false },
        { value: 12, partCallout: 'PART-C', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 1) // Force all into one bin

      expect(bins[0].partCallouts).toContain('PART-A')
      expect(bins[0].partCallouts).toContain('PART-B')
      expect(bins[0].partCallouts).toContain('PART-C')
    })

    it('correctly counts parts per bin', () => {
      const values = [
        { value: 10, partCallout: 'P1', isOutlier: false },
        { value: 10, partCallout: 'P2', isOutlier: false },
        { value: 50, partCallout: 'P3', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 5)

      // Find bins with parts
      const lowBin = bins.find((b) => b.partCallouts.includes('P1'))
      const highBin = bins.find((b) => b.partCallouts.includes('P3'))

      expect(lowBin?.count).toBe(2)
      expect(highBin?.count).toBe(1)
    })
  })

  describe('outlier tracking', () => {
    it('marks bins with outliers', () => {
      const values = [
        { value: 10, partCallout: 'P1', isOutlier: false },
        { value: 11, partCallout: 'P2', isOutlier: true },
      ]

      const bins = createHistogramBins(values, 1)

      expect(bins[0].hasOutliers).toBe(true)
    })

    it('does not mark bins without outliers', () => {
      const values = [
        { value: 10, partCallout: 'P1', isOutlier: false },
        { value: 11, partCallout: 'P2', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 1)

      expect(bins[0].hasOutliers).toBe(false)
    })

    it('marks bin as outlier if any part is outlier', () => {
      const values = [
        { value: 10, partCallout: 'P1', isOutlier: false },
        { value: 10.5, partCallout: 'P2', isOutlier: false },
        { value: 11, partCallout: 'P3', isOutlier: true },
        { value: 11.5, partCallout: 'P4', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 1)

      expect(bins[0].hasOutliers).toBe(true)
    })
  })

  describe('bin labels', () => {
    it('generates readable bin labels', () => {
      const values = [
        { value: 10.123, partCallout: 'P1', isOutlier: false },
        { value: 20.456, partCallout: 'P2', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 2)

      // Labels should be formatted numbers
      bins.forEach((bin) => {
        expect(bin.binLabel).toMatch(/^\d+\.\d$/)
      })
    })
  })

  describe('edge cases', () => {
    it('handles two identical values', () => {
      const values = [
        { value: 15, partCallout: 'P1', isOutlier: false },
        { value: 15, partCallout: 'P2', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 10)

      expect(bins).toHaveLength(1)
      expect(bins[0].count).toBe(2)
    })

    it('handles negative values', () => {
      const values = [
        { value: -10, partCallout: 'P1', isOutlier: false },
        { value: 0, partCallout: 'P2', isOutlier: false },
        { value: 10, partCallout: 'P3', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 3)

      expect(bins.length).toBeGreaterThan(0)
    })

    it('handles very small range', () => {
      const values = [
        { value: 10.0001, partCallout: 'P1', isOutlier: false },
        { value: 10.0002, partCallout: 'P2', isOutlier: false },
        { value: 10.0003, partCallout: 'P3', isOutlier: false },
      ]

      const bins = createHistogramBins(values, 10)

      expect(bins.length).toBeGreaterThan(0)
    })

    it('handles large dataset (performance sanity check)', () => {
      const values = Array.from({ length: 1000 }, (_, i) => ({
        value: Math.random() * 100,
        partCallout: `P${i}`,
        isOutlier: i % 50 === 0, // 2% outliers
      }))

      const start = performance.now()
      const bins = createHistogramBins(values, 20)
      const elapsed = performance.now() - start

      expect(bins.length).toBeGreaterThan(0)
      expect(elapsed).toBeLessThan(100) // Should be fast
    })
  })
})
