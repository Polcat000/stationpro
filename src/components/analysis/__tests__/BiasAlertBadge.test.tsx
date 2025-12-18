// src/components/analysis/__tests__/BiasAlertBadge.test.tsx
// Component tests for BiasAlertBadge
// AC 3.4.1, 3.4.2, 3.4.3, 3.4.5

import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { BiasAlertBadgeStandalone, BiasAlertBadge } from '../BiasAlertBadge'
import { useWorkingSetStore } from '@/stores/workingSet'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import type { BiasResult } from '@/lib/analysis/bias'
import type { Part } from '@/types/domain'

// =============================================================================
// Test Data
// =============================================================================

const seriesDominanceBias: BiasResult = {
  hasBias: true,
  biasType: 'series-dominant',
  severity: 'warning',
  message: 'Series bias detected: SeriesA represents 90% of selection',
  details: {
    dominantSeries: {
      name: 'SeriesA',
      percentage: 90,
      count: 9,
      total: 10,
    },
  },
}

const tooFewPartsBias: BiasResult = {
  hasBias: true,
  biasType: 'too-few-parts',
  severity: 'info',
  message: 'Small sample size: 2 part(s) selected. Consider adding more for meaningful statistics.',
  details: {
    partCount: 2,
  },
}

const outlierSkewBias: BiasResult = {
  hasBias: true,
  biasType: 'outlier-skew',
  severity: 'info',
  message: 'Dimensional outlier: PART-LARGE is outside IQR bounds on Width',
  details: {
    outlierParts: [
      {
        callout: 'PART-LARGE',
        dimension: 'Width',
        value: 200,
        q1: 45,
        q3: 55,
        direction: 'above',
      },
    ],
  },
}

// Mock parts data for integration tests
const mockParts: Part[] = [
  {
    PartCallout: 'PART-001',
    PartSeries: 'SeriesA',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 10,
    InspectionZones: [],
  },
  {
    PartCallout: 'PART-002',
    PartSeries: 'SeriesA',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 10,
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
// BiasAlertBadgeStandalone Tests (Isolated component tests)
// =============================================================================

describe('BiasAlertBadgeStandalone', () => {
  describe('empty state (AC 3.4.6)', () => {
    it('renders nothing when hasBias is false', () => {
      const { container } = renderWithRouter(
        <BiasAlertBadgeStandalone biases={[]} hasBias={false} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when biases array is empty', () => {
      const { container } = renderWithRouter(
        <BiasAlertBadgeStandalone biases={[]} hasBias={false} />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('series dominance warning (AC 3.4.1)', () => {
    it('renders warning badge with correct styling', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[seriesDominanceBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Series Bias')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('border-amber-500')
      expect(badge).toHaveClass('text-amber-700')
    })

    it('includes warning icon', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[seriesDominanceBias]} hasBias={true} />
      )

      // Badge should contain AlertTriangle icon (has aria-hidden)
      const badge = await screen.findByText('Series Bias')
      const icon = badge.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('shows tooltip with details on hover (AC 3.4.5)', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[seriesDominanceBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Series Bias')
      await user.hover(badge)

      await waitFor(() => {
        // May appear in multiple places (aria-label + tooltip), so use getAllBy
        const messages = screen.getAllByText(/Series bias detected: SeriesA represents 90% of selection/)
        expect(messages.length).toBeGreaterThanOrEqual(1)
        const detailsElements = screen.getAllByText(/9 of 10 parts/)
        expect(detailsElements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('too few parts info (AC 3.4.2)', () => {
    it('renders info badge with correct styling', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[tooFewPartsBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Small Sample')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('border-blue-500')
      expect(badge).toHaveClass('text-blue-700')
    })

    it('includes info icon', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[tooFewPartsBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Small Sample')
      const icon = badge.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('shows tooltip with suggestion on hover (AC 3.4.5)', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[tooFewPartsBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Small Sample')
      await user.hover(badge)

      await waitFor(() => {
        // May appear in multiple places (aria-label + tooltip), so use getAllBy
        const messages = screen.getAllByText(/Small sample size: 2 part\(s\) selected/)
        expect(messages.length).toBeGreaterThanOrEqual(1)
        const suggestions = screen.getAllByText(/Add more parts for meaningful statistical analysis/)
        expect(suggestions.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('outlier skew info (AC 3.4.3)', () => {
    it('renders info badge with correct label', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[outlierSkewBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Outlier Detected')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('border-blue-500')
    })

    it('shows tooltip with part details on hover (AC 3.4.5)', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[outlierSkewBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Outlier Detected')
      await user.hover(badge)

      await waitFor(() => {
        // May appear in multiple places (aria-label + tooltip), so use getAllBy
        const messages = screen.getAllByText(/PART-LARGE is outside IQR bounds on Width/)
        expect(messages.length).toBeGreaterThanOrEqual(1)
        // New format shows "PART-LARGE: Width = 200mm (above IQR)"
        const details = screen.getAllByText(/PART-LARGE: Width = 200mm \(above IQR\)/)
        expect(details.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('multiple biases (AC 3.4.7)', () => {
    it('displays multiple badges simultaneously', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone
          biases={[seriesDominanceBias, outlierSkewBias]}
          hasBias={true}
        />
      )

      expect(await screen.findByText('Series Bias')).toBeInTheDocument()
      expect(await screen.findByText('Outlier Detected')).toBeInTheDocument()
    })

    it('each badge has independent tooltip', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <BiasAlertBadgeStandalone
          biases={[seriesDominanceBias, tooFewPartsBias]}
          hasBias={true}
        />
      )

      const seriesBadge = await screen.findByText('Series Bias')
      await user.hover(seriesBadge)

      await waitFor(() => {
        // May appear in multiple places, so use getAllBy
        const details = screen.getAllByText(/9 of 10 parts/)
        expect(details.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('accessibility', () => {
    it('has aria-label on badges', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[seriesDominanceBias]} hasBias={true} />
      )

      const badge = await screen.findByText('Series Bias')
      expect(badge).toHaveAttribute('aria-label', seriesDominanceBias.message)
    })

    it('has role=status on container', async () => {
      renderWithRouter(
        <BiasAlertBadgeStandalone biases={[seriesDominanceBias]} hasBias={true} />
      )

      await screen.findByText('Series Bias')
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// BiasAlertBadge Integration Tests (with hook)
// =============================================================================

describe('BiasAlertBadge (with useBiasDetection hook)', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('renders nothing when working set is empty', async () => {
    const { container } = renderWithRouter(<BiasAlertBadge />)

    // Wait for any async operations
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
  })

  it('shows too-few-parts when only 2 parts selected', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<BiasAlertBadge />)

    await waitFor(() => {
      expect(screen.getByText('Small Sample')).toBeInTheDocument()
    })
  })

  it('shows series-dominant when 2 parts from same series (100%)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['PART-001', 'PART-002']),
      stationIds: new Set<string>(),
    })

    renderWithRouter(<BiasAlertBadge />)

    await waitFor(() => {
      // Both parts are from SeriesA, so 100% = series dominant
      expect(screen.getByText('Series Bias')).toBeInTheDocument()
    })
  })
})
