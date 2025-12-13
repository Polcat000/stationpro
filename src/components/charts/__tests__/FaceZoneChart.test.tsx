// src/components/charts/__tests__/FaceZoneChart.test.tsx
// Tests for FaceZoneChart component
// AC-3.9.4: Visual breakdown with face color palette
//
// NOTE: Nivo ResponsiveBar requires actual DOM dimensions to render
// SVG content. In JSDOM tests, it renders as 0x0 container. We test:
// 1. Component mounting and container rendering
// 2. Empty state handling (returns null)
// 3. Props handling without asserting SVG internals

import { describe, it, expect } from 'vitest'
import { renderWithRouter, screen } from '@/test/router-utils'
import { FaceZoneChart } from '../FaceZoneChart'
import { FACE_COLORS, FACE_ORDER } from '@/lib/analysis/zoneAggregation'

describe('FaceZoneChart', () => {
  describe('rendering', () => {
    it('renders chart container with correct test id', async () => {
      renderWithRouter(<FaceZoneChart data={{ Top: 5, Front: 3 }} />)

      expect(await screen.findByTestId('face-zone-chart')).toBeInTheDocument()
    })

    it('renders container with bg-muted class', async () => {
      renderWithRouter(<FaceZoneChart data={{ Top: 5 }} />)

      const container = await screen.findByTestId('face-zone-chart')
      expect(container).toHaveClass('bg-muted')
      expect(container).toHaveClass('rounded-lg')
    })

    it('renders for single face data', async () => {
      renderWithRouter(<FaceZoneChart data={{ Top: 10 }} />)

      expect(await screen.findByTestId('face-zone-chart')).toBeInTheDocument()
    })

    it('renders for all 6 faces data', async () => {
      renderWithRouter(
        <FaceZoneChart
          data={{
            Top: 6,
            Bottom: 5,
            Front: 4,
            Back: 3,
            Left: 2,
            Right: 1,
          }}
        />
      )

      expect(await screen.findByTestId('face-zone-chart')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('returns null for empty data object', () => {
      const { container } = renderWithRouter(<FaceZoneChart data={{}} />)

      expect(
        container.querySelector('[data-testid="face-zone-chart"]')
      ).not.toBeInTheDocument()
    })

    it('returns null when all counts are 0', () => {
      const { container } = renderWithRouter(
        <FaceZoneChart data={{ Top: 0, Front: 0 }} />
      )

      expect(
        container.querySelector('[data-testid="face-zone-chart"]')
      ).not.toBeInTheDocument()
    })

    it('returns null when only zero values present', () => {
      const { container } = renderWithRouter(
        <FaceZoneChart
          data={{
            Top: 0,
            Bottom: 0,
            Front: 0,
            Back: 0,
            Left: 0,
            Right: 0,
          }}
        />
      )

      expect(
        container.querySelector('[data-testid="face-zone-chart"]')
      ).not.toBeInTheDocument()
    })
  })

  describe('face colors (AC-3.9.4)', () => {
    it('defines colors for all 6 faces', () => {
      expect(Object.keys(FACE_COLORS)).toHaveLength(6)
      expect(FACE_COLORS.Top).toBeDefined()
      expect(FACE_COLORS.Bottom).toBeDefined()
      expect(FACE_COLORS.Front).toBeDefined()
      expect(FACE_COLORS.Back).toBeDefined()
      expect(FACE_COLORS.Left).toBeDefined()
      expect(FACE_COLORS.Right).toBeDefined()
    })

    it('uses correct color values from Architecture spec', () => {
      expect(FACE_COLORS.Top).toBe('hsl(204, 56%, 72%)') // Sky Reflection
      expect(FACE_COLORS.Bottom).toBe('hsl(47, 94%, 48%)') // Saffron
      expect(FACE_COLORS.Front).toBe('hsl(123, 36%, 36%)') // Fern
      expect(FACE_COLORS.Back).toBe('hsl(204, 95%, 20%)') // Yale Blue
      expect(FACE_COLORS.Left).toBe('hsl(271, 37%, 60%)') // Purple
      expect(FACE_COLORS.Right).toBe('hsl(15, 59%, 51%)') // Spicy Paprika
    })
  })

  describe('face order', () => {
    it('FACE_ORDER has correct sequence', () => {
      expect(FACE_ORDER).toEqual([
        'Top',
        'Bottom',
        'Front',
        'Back',
        'Left',
        'Right',
      ])
    })
  })

  describe('height prop', () => {
    it('uses default height of 200px', async () => {
      renderWithRouter(<FaceZoneChart data={{ Top: 5 }} />)

      const container = await screen.findByTestId('face-zone-chart')
      expect(container).toHaveStyle({ height: '200px' })
    })

    it('respects custom height prop', async () => {
      renderWithRouter(<FaceZoneChart data={{ Top: 5 }} height={300} />)

      const container = await screen.findByTestId('face-zone-chart')
      expect(container).toHaveStyle({ height: '300px' })
    })

    it('respects smaller custom height', async () => {
      renderWithRouter(<FaceZoneChart data={{ Top: 5 }} height={150} />)

      const container = await screen.findByTestId('face-zone-chart')
      expect(container).toHaveStyle({ height: '150px' })
    })
  })

  describe('data filtering', () => {
    it('renders when some faces have zones and others have 0', async () => {
      renderWithRouter(
        <FaceZoneChart
          data={{
            Top: 5,
            Front: 0, // Should be filtered out
            Back: 3,
          }}
        />
      )

      // Component should still render (not all zeros)
      expect(await screen.findByTestId('face-zone-chart')).toBeInTheDocument()
    })

    it('renders when only one face has zones', async () => {
      renderWithRouter(
        <FaceZoneChart
          data={{
            Top: 0,
            Front: 1,
            Back: 0,
          }}
        />
      )

      expect(await screen.findByTestId('face-zone-chart')).toBeInTheDocument()
    })
  })

  describe('partial face data', () => {
    it('renders with only 2 faces provided', async () => {
      renderWithRouter(<FaceZoneChart data={{ Top: 5, Front: 3 }} />)

      expect(await screen.findByTestId('face-zone-chart')).toBeInTheDocument()
    })

    it('renders with only 1 face provided', async () => {
      renderWithRouter(<FaceZoneChart data={{ Back: 10 }} />)

      expect(await screen.findByTestId('face-zone-chart')).toBeInTheDocument()
    })
  })
})
