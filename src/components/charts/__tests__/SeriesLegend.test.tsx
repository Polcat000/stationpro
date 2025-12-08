// src/components/charts/__tests__/SeriesLegend.test.tsx
// Tests for SeriesLegend component
// AC 3.7.2: Series legend/key visible near charts

import { describe, it, expect } from 'vitest'
import { renderWithRouter, screen } from '@/test/router-utils'
import { SeriesLegend } from '../SeriesLegend'

describe('SeriesLegend', () => {
  describe('rendering', () => {
    it('renders legend with series names', async () => {
      renderWithRouter(
        <SeriesLegend seriesNames={['Series-A', 'Series-B']} />
      )

      expect(await screen.findByText('Series-A')).toBeInTheDocument()
      expect(await screen.findByText('Series-B')).toBeInTheDocument()
    })

    it('renders legend with aria-label', async () => {
      renderWithRouter(
        <SeriesLegend seriesNames={['Series-A']} />
      )

      expect(await screen.findByRole('list', { name: 'Chart legend' })).toBeInTheDocument()
    })

    it('renders color swatches for each series', async () => {
      renderWithRouter(
        <SeriesLegend seriesNames={['Series-A', 'Series-B']} />
      )

      const listItems = await screen.findAllByRole('listitem')
      expect(listItems).toHaveLength(2)
    })

    it('handles 5 series (AC 3.7.5 color theme)', async () => {
      const fiveSeries = ['Series-1', 'Series-2', 'Series-3', 'Series-4', 'Series-5']
      renderWithRouter(
        <SeriesLegend seriesNames={fiveSeries} />
      )

      for (const name of fiveSeries) {
        expect(await screen.findByText(name)).toBeInTheDocument()
      }
    })

    it('handles more than 5 series (NFR-S5)', async () => {
      const manySeries = Array.from({ length: 10 }, (_, i) => `Series-${i + 1}`)
      renderWithRouter(
        <SeriesLegend seriesNames={manySeries} />
      )

      const listItems = await screen.findAllByRole('listitem')
      expect(listItems).toHaveLength(10)
    })
  })

  describe('empty state', () => {
    it('returns null when no series and no outlier indicator', async () => {
      const { container } = renderWithRouter(
        <SeriesLegend seriesNames={[]} showOutlierIndicator={false} />
      )

      // Component should render nothing
      expect(container.querySelector('[role="list"]')).not.toBeInTheDocument()
    })
  })

  describe('outlier indicator', () => {
    it('shows outlier indicator when enabled', async () => {
      renderWithRouter(
        <SeriesLegend seriesNames={['Series-A']} showOutlierIndicator />
      )

      expect(await screen.findByText('Outlier')).toBeInTheDocument()
    })

    it('does not show outlier indicator when disabled', async () => {
      renderWithRouter(
        <SeriesLegend seriesNames={['Series-A']} showOutlierIndicator={false} />
      )

      expect(screen.queryByText('Outlier')).not.toBeInTheDocument()
    })

    it('shows outlier indicator even with empty series', async () => {
      renderWithRouter(
        <SeriesLegend seriesNames={[]} showOutlierIndicator />
      )

      expect(await screen.findByText('Outlier')).toBeInTheDocument()
    })
  })

  describe('long series names', () => {
    it('truncates long series names with title attribute', async () => {
      const longName = 'Very Long Series Name That Should Be Truncated'
      renderWithRouter(
        <SeriesLegend seriesNames={[longName]} />
      )

      const nameElement = await screen.findByText(longName)
      expect(nameElement).toHaveAttribute('title', longName)
      expect(nameElement).toHaveClass('truncate')
    })
  })
})
