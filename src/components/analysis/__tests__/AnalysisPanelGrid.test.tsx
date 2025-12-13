// src/components/analysis/__tests__/AnalysisPanelGrid.test.tsx
// Tests for AnalysisPanelGrid component
// AC-3.10.1: All four panels collapsible

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '@/test/router-utils'
import { AnalysisPanelGrid } from '../AnalysisPanelGrid'
import { useWorkingSetStore } from '@/stores/workingSet'

const STORAGE_KEY = 'stationpro-analysis-panels'

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

    it('renders all four panel titles', async () => {
      renderWithRouter(<AnalysisPanelGrid />)

      expect(await screen.findByText('Aggregate Statistics')).toBeInTheDocument()
      expect(screen.getByText('Worst-Case Envelope')).toBeInTheDocument()
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

      // Find all collapse buttons
      const buttons = await screen.findAllByRole('button')

      // Should have 4 buttons (one per panel)
      expect(buttons.length).toBeGreaterThanOrEqual(4)
    })

    it('clicking panel header toggles content visibility', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(<AnalysisPanelGrid />)

      // Click "Aggregate Statistics" header to collapse
      const statsHeader = await screen.findByText('Aggregate Statistics')
      await user.click(statsHeader)

      // The panel content should be collapsed
      await waitFor(() => {
        const statsButton = statsHeader.closest('[role="button"]')
        expect(statsButton).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })

  describe('panel independence', () => {
    it('collapsing one panel does not affect others', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(<AnalysisPanelGrid />)

      // Collapse "Aggregate Statistics"
      const statsHeader = await screen.findByText('Aggregate Statistics')
      await user.click(statsHeader)

      await waitFor(() => {
        const statsButton = statsHeader.closest('[role="button"]')
        expect(statsButton).toHaveAttribute('aria-expanded', 'false')
      })

      // "Worst-Case Envelope" should still be expanded
      const envelopeHeader = screen.getByText('Worst-Case Envelope')
      const envelopeButton = envelopeHeader.closest('[role="button"]')
      expect(envelopeButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('state persistence', () => {
    it('restores panel states from localStorage', async () => {
      // Set initial state with stats collapsed
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: false }))

      renderWithRouter(<AnalysisPanelGrid />)

      await waitFor(() => {
        const statsHeader = screen.getByText('Aggregate Statistics')
        const statsButton = statsHeader.closest('[role="button"]')
        expect(statsButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Other panels should be expanded (default)
      const envelopeHeader = screen.getByText('Worst-Case Envelope')
      const envelopeButton = envelopeHeader.closest('[role="button"]')
      expect(envelopeButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('persists collapse state to localStorage', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      renderWithRouter(<AnalysisPanelGrid />)

      // Collapse "Aggregate Statistics"
      const statsHeader = await screen.findByText('Aggregate Statistics')
      await user.click(statsHeader)

      // Wait for debounce
      vi.advanceTimersByTime(100)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored.stats).toBe(false)
    })
  })
})
