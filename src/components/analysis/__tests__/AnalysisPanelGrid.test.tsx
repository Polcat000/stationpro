// src/components/analysis/__tests__/AnalysisPanelGrid.test.tsx
// Tests for AnalysisPanelGrid component
// AC-3.10.1: All panels collapsible
// AC-3.17.1-8: UnifiedStatsEnvelopePanel replaces separate stats/envelope panels

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '@/test/router-utils'
import { AnalysisPanelGrid } from '../AnalysisPanelGrid'
import { useWorkingSetStore } from '@/stores/workingSet'

const STORAGE_KEY = 'stationpro-analysis-panels'
const UNIFIED_PANEL_ID = 'unified-stats-envelope'

// Mock parts repository
vi.mock('@/lib/repositories/partsRepository', () => ({
  partsRepository: {
    getAll: vi.fn(() => Promise.resolve([])),
  },
}))

describe('AnalysisPanelGrid', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders grid container', async () => {
      renderWithRouter(<AnalysisPanelGrid />)

      expect(await screen.findByTestId('analysis-panel-grid')).toBeInTheDocument()
    })

    it('renders all three panel titles (AC-3.17.1-8)', async () => {
      renderWithRouter(<AnalysisPanelGrid />)

      // UnifiedStatsEnvelopePanel replaced AggregateStats + Envelope
      expect(await screen.findByText('Working Set Summary')).toBeInTheDocument()
      expect(screen.getByText('Dimensional Distribution')).toBeInTheDocument()
      expect(screen.getByText('Inspection Zone Summary')).toBeInTheDocument()
    })

    it('maintains grid layout classes', async () => {
      renderWithRouter(<AnalysisPanelGrid />)

      const grid = await screen.findByTestId('analysis-panel-grid')
      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('gap-4')
      expect(grid).toHaveClass('md:grid-cols-2')
    })
  })

  describe('collapsible behavior (AC-3.10.1)', () => {
    it('all panels are expandable/collapsible', async () => {
      renderWithRouter(<AnalysisPanelGrid />)

      // Find all collapse buttons - should have 3 (one per panel)
      const buttons = await screen.findAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })

    it('clicking panel header toggles content visibility', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(<AnalysisPanelGrid />)

      // Click "Working Set Summary" header to collapse
      const unifiedHeader = await screen.findByText('Working Set Summary')
      await user.click(unifiedHeader)

      // The panel content should be collapsed
      await waitFor(() => {
        const unifiedButton = unifiedHeader.closest('[role="button"]')
        expect(unifiedButton).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })

  describe('panel independence', () => {
    it('collapsing one panel does not affect others', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(<AnalysisPanelGrid />)

      // Collapse "Working Set Summary"
      const unifiedHeader = await screen.findByText('Working Set Summary')
      await user.click(unifiedHeader)

      await waitFor(() => {
        const unifiedButton = unifiedHeader.closest('[role="button"]')
        expect(unifiedButton).toHaveAttribute('aria-expanded', 'false')
      })

      // "Dimensional Distribution" should still be expanded
      const chartsHeader = screen.getByText('Dimensional Distribution')
      const chartsButton = chartsHeader.closest('[role="button"]')
      expect(chartsButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('state persistence', () => {
    it('restores panel states from localStorage', async () => {
      // Set initial state with unified panel collapsed
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ [UNIFIED_PANEL_ID]: false })
      )

      renderWithRouter(<AnalysisPanelGrid />)

      await waitFor(() => {
        const unifiedHeader = screen.getByText('Working Set Summary')
        const unifiedButton = unifiedHeader.closest('[role="button"]')
        expect(unifiedButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Other panels should be expanded (default)
      const chartsHeader = screen.getByText('Dimensional Distribution')
      const chartsButton = chartsHeader.closest('[role="button"]')
      expect(chartsButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('persists collapse state to localStorage', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(<AnalysisPanelGrid />)

      // Collapse "Working Set Summary"
      const unifiedHeader = await screen.findByText('Working Set Summary')
      await user.click(unifiedHeader)

      // Wait for debounce
      vi.advanceTimersByTime(100)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored[UNIFIED_PANEL_ID]).toBe(false)
    })
  })
})
