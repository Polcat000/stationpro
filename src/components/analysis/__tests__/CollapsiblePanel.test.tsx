// src/components/analysis/__tests__/CollapsiblePanel.test.tsx
// Tests for CollapsiblePanel component
// AC-3.10.1: Panels Collapsible, AC-3.10.2: Visual Indicator

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '@/test/router-utils'
import { CollapsiblePanel } from '../CollapsiblePanel'

const STORAGE_KEY = 'stationpro-analysis-panels'

/**
 * Helper to check if collapsible content is in expanded state
 * Radix Collapsible uses data-state attribute
 */
function getContentContainer(panelId: string) {
  return document.querySelector(`#panel-content-${panelId}`)
}

function isExpanded(panelId: string): boolean {
  const container = getContentContainer(panelId)
  return container?.getAttribute('data-state') === 'open'
}

describe('CollapsiblePanel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders title in card header', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Aggregate Statistics">
          <div>Content</div>
        </CollapsiblePanel>
      )

      expect(await screen.findByText('Aggregate Statistics')).toBeInTheDocument()
    })

    it('renders children content when expanded', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div data-testid="panel-content">Panel Content</div>
        </CollapsiblePanel>
      )

      expect(await screen.findByTestId('panel-content')).toBeInTheDocument()
    })

    it('renders with custom className', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test" className="custom-class">
          <div>Content</div>
        </CollapsiblePanel>
      )

      // Wait for render
      await screen.findByText('Test')

      // Card should have the custom class
      const card = document.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })
  })

  describe('expand/collapse (AC-3.10.1)', () => {
    it('starts expanded by default', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </CollapsiblePanel>
      )

      await screen.findByTestId('panel-content')
      expect(isExpanded('stats')).toBe(true)
    })

    it('starts collapsed when defaultExpanded is false', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel" defaultExpanded={false}>
          <div data-testid="panel-content">Content</div>
        </CollapsiblePanel>
      )

      await screen.findByText('Test Panel')
      expect(isExpanded('stats')).toBe(false)
    })

    it('collapses when header is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </CollapsiblePanel>
      )

      await screen.findByTestId('panel-content')
      expect(isExpanded('stats')).toBe(true)

      // Click header to collapse
      await user.click(screen.getByText('Test Panel'))

      await waitFor(() => {
        expect(isExpanded('stats')).toBe(false)
      })
    })

    it('expands when collapsed header is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel" defaultExpanded={false}>
          <div data-testid="panel-content">Content</div>
        </CollapsiblePanel>
      )

      await screen.findByText('Test Panel')
      expect(isExpanded('stats')).toBe(false)

      // Click to expand
      await user.click(screen.getByText('Test Panel'))

      await waitFor(() => {
        expect(isExpanded('stats')).toBe(true)
      })
    })

    it('header remains visible when collapsed', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </CollapsiblePanel>
      )

      // Wait for render
      const title = await screen.findByText('Test Panel')

      // Click header to collapse
      await user.click(title)

      // Title should still be visible
      expect(title).toBeVisible()
    })
  })

  describe('visual indicator (AC-3.10.2)', () => {
    it('shows chevron icon in header', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      // Chevron is rendered as SVG
      const header = await screen.findByRole('button')
      const chevron = header.querySelector('svg')
      expect(chevron).toBeInTheDocument()
    })

    it('chevron points down when expanded', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      const header = await screen.findByRole('button')
      const chevron = header.querySelector('svg')

      // When expanded, chevron should NOT have -rotate-90 class
      expect(chevron).not.toHaveClass('-rotate-90')
    })

    it('chevron points right when collapsed', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel" defaultExpanded={false}>
          <div>Content</div>
        </CollapsiblePanel>
      )

      const header = await screen.findByRole('button')
      const chevron = header.querySelector('svg')

      // When collapsed, chevron should have -rotate-90 class
      expect(chevron).toHaveClass('-rotate-90')
    })

    it('chevron rotates on state change', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      const header = await screen.findByRole('button')
      const chevron = header.querySelector('svg')

      // Initially expanded (no rotation)
      expect(chevron).not.toHaveClass('-rotate-90')

      // Click to collapse
      await user.click(header)

      await waitFor(() => {
        expect(chevron).toHaveClass('-rotate-90')
      })

      // Click to expand
      await user.click(header)

      await waitFor(() => {
        expect(chevron).not.toHaveClass('-rotate-90')
      })
    })

    it('chevron has transition animation class', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      const header = await screen.findByRole('button')
      const chevron = header.querySelector('svg')

      expect(chevron).toHaveClass('transition-transform')
      expect(chevron).toHaveClass('duration-200')
    })
  })

  describe('accessibility', () => {
    it('header has button role', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      expect(await screen.findByRole('button')).toBeInTheDocument()
    })

    it('header has aria-expanded attribute', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      const header = await screen.findByRole('button')
      expect(header).toHaveAttribute('aria-expanded', 'true')
    })

    it('aria-expanded updates on toggle', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      const header = await screen.findByRole('button')
      expect(header).toHaveAttribute('aria-expanded', 'true')

      await user.click(header)

      await waitFor(() => {
        expect(header).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('header has aria-controls pointing to content', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      const header = await screen.findByRole('button')
      expect(header).toHaveAttribute('aria-controls', 'panel-content-stats')
    })

    it('content has matching id', async () => {
      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      // Wait for render
      await screen.findByText('Test Panel')

      const content = document.querySelector('#panel-content-stats')
      expect(content).toBeInTheDocument()
    })
  })

  describe('state persistence (AC-3.10.3)', () => {
    it('persists collapsed state to localStorage', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div>Content</div>
        </CollapsiblePanel>
      )

      // Wait for render
      const title = await screen.findByText('Test Panel')

      // Click to collapse
      await user.click(title)

      // Wait for debounce
      vi.advanceTimersByTime(100)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored.stats).toBe(false)
    })

    it('restores state from localStorage on mount', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: false }))

      renderWithRouter(
        <CollapsiblePanel panelId="stats" title="Test Panel">
          <div data-testid="panel-content">Content</div>
        </CollapsiblePanel>
      )

      // Should start collapsed based on localStorage
      await screen.findByText('Test Panel')
      expect(isExpanded('stats')).toBe(false)
    })
  })

  describe('multiple panels', () => {
    it('each panel maintains independent state', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(
        <div>
          <CollapsiblePanel panelId="stats" title="Stats Panel">
            <div data-testid="stats-content">Stats Content</div>
          </CollapsiblePanel>
          <CollapsiblePanel panelId="envelope" title="Envelope Panel">
            <div data-testid="envelope-content">Envelope Content</div>
          </CollapsiblePanel>
        </div>
      )

      // Both should start expanded
      await screen.findByTestId('stats-content')
      expect(isExpanded('stats')).toBe(true)
      expect(isExpanded('envelope')).toBe(true)

      // Collapse only stats panel
      await user.click(screen.getByText('Stats Panel'))

      await waitFor(() => {
        expect(isExpanded('stats')).toBe(false)
      })

      // Envelope should still be expanded
      expect(isExpanded('envelope')).toBe(true)
    })
  })
})
