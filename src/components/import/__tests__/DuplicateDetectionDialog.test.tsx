// src/components/import/__tests__/DuplicateDetectionDialog.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DuplicateDetectionDialog } from '../DuplicateDetectionDialog'

describe('DuplicateDetectionDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnAction = vi.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    duplicateCallouts: ['PART-001', 'PART-002'],
    onAction: mockOnAction,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    return render(<DuplicateDetectionDialog {...defaultProps} {...props} />)
  }

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      renderComponent()

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render dialog when open is false', () => {
      renderComponent({ open: false })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders title', () => {
      renderComponent()

      expect(screen.getByText('Duplicate Parts Detected')).toBeInTheDocument()
    })

    it('renders description with count', () => {
      renderComponent()

      expect(screen.getByText(/2 parts already exist/)).toBeInTheDocument()
    })

    it('renders singular description for single duplicate', () => {
      renderComponent({ duplicateCallouts: ['PART-001'] })

      expect(screen.getByText(/1 part already exists/)).toBeInTheDocument()
    })
  })

  describe('duplicate callouts display', () => {
    it('displays duplicate callout values', () => {
      renderComponent()

      expect(screen.getByTestId('duplicate-callout-PART-001')).toBeInTheDocument()
      expect(screen.getByTestId('duplicate-callout-PART-002')).toBeInTheDocument()
    })

    it('displays all callouts when 10 or fewer', () => {
      const tenCallouts = Array.from({ length: 10 }, (_, i) => `PART-${i + 1}`)
      renderComponent({ duplicateCallouts: tenCallouts })

      tenCallouts.forEach((callout) => {
        expect(screen.getByText(callout)).toBeInTheDocument()
      })
    })

    it('truncates callouts when more than 10', () => {
      const fifteenCallouts = Array.from({ length: 15 }, (_, i) => `PART-${i + 1}`)
      renderComponent({ duplicateCallouts: fifteenCallouts })

      // Should show first 10
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`PART-${i}`)).toBeInTheDocument()
      }

      // Should not show 11-15
      expect(screen.queryByText('PART-11')).not.toBeInTheDocument()

      // Should show "and 5 more"
      expect(screen.getByText('... and 5 more')).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('renders Skip Duplicates button', () => {
      renderComponent()

      expect(screen.getByTestId('skip-duplicates-button')).toBeInTheDocument()
      expect(screen.getByText('Skip Duplicates')).toBeInTheDocument()
    })

    it('renders Overwrite Existing button', () => {
      renderComponent()

      expect(screen.getByTestId('overwrite-button')).toBeInTheDocument()
      expect(screen.getByText('Overwrite Existing')).toBeInTheDocument()
    })

    it('renders Cancel button', () => {
      renderComponent()

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    it('calls onAction with "skip" when Skip Duplicates clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByTestId('skip-duplicates-button'))

      expect(mockOnAction).toHaveBeenCalledWith('skip')
    })

    it('calls onAction with "overwrite" when Overwrite clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByTestId('overwrite-button'))

      expect(mockOnAction).toHaveBeenCalledWith('overwrite')
    })

    it('calls onAction with "cancel" when Cancel clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByTestId('cancel-button'))

      expect(mockOnAction).toHaveBeenCalledWith('cancel')
    })
  })

  describe('isProcessing state', () => {
    it('disables buttons when isProcessing is true', () => {
      renderComponent({ isProcessing: true })

      expect(screen.getByTestId('skip-duplicates-button')).toBeDisabled()
      expect(screen.getByTestId('overwrite-button')).toBeDisabled()
      expect(screen.getByTestId('cancel-button')).toBeDisabled()
    })

    it('enables buttons when isProcessing is false', () => {
      renderComponent({ isProcessing: false })

      expect(screen.getByTestId('skip-duplicates-button')).not.toBeDisabled()
      expect(screen.getByTestId('overwrite-button')).not.toBeDisabled()
      expect(screen.getByTestId('cancel-button')).not.toBeDisabled()
    })
  })

  describe('button descriptions', () => {
    it('shows helper text for Skip Duplicates', () => {
      renderComponent()

      expect(screen.getByText('Import only new parts')).toBeInTheDocument()
    })

    it('shows helper text for Overwrite Existing', () => {
      renderComponent()

      expect(screen.getByText('Replace with imported versions')).toBeInTheDocument()
    })
  })
})
