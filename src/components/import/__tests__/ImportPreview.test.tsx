// src/components/import/__tests__/ImportPreview.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportPreview, type InvalidPart } from '../ImportPreview'
import type { Part } from '@/lib/schemas/part'

describe('ImportPreview', () => {
  const mockOnImport = vi.fn()
  const mockOnCancel = vi.fn()

  const validPart1: Part = {
    PartCallout: 'TEST-001',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 150,
    SmallestLateralFeature_um: 100,
    InspectionZones: [
      {
        ZoneID: 'zone-1',
        Name: 'Top',
        Face: 'Top',
        ZoneDepth_mm: 2,
        ZoneOffset_mm: 0,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  }

  const validPart2: Part = {
    ...validPart1,
    PartCallout: 'TEST-002',
    PartWidth_mm: 200,
  }

  const validPart3: Part = {
    ...validPart1,
    PartCallout: 'TEST-003',
    PartWidth_mm: 300,
  }

  const validPart4: Part = {
    ...validPart1,
    PartCallout: 'TEST-004',
    PartWidth_mm: 400,
  }

  const invalidPart1: InvalidPart = {
    index: 1,
    data: { PartCallout: '' },
    errors: [
      { path: '1.PartCallout', message: 'Part callout is required' },
      { path: '1.PartWidth_mm', message: 'Required' },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    return render(
      <ImportPreview
        validParts={[validPart1, validPart2]}
        invalidParts={[]}
        onImport={mockOnImport}
        onCancel={mockOnCancel}
        {...props}
      />
    )
  }

  describe('summary display', () => {
    it('shows valid parts count', () => {
      renderComponent()

      expect(screen.getByText('2 valid parts')).toBeInTheDocument()
    })

    it('shows singular "part" for single valid part', () => {
      renderComponent({ validParts: [validPart1] })

      expect(screen.getByText('1 valid part')).toBeInTheDocument()
    })

    it('shows invalid parts count when present', () => {
      renderComponent({ invalidParts: [invalidPart1] })

      expect(screen.getByText('1 invalid part')).toBeInTheDocument()
    })

    it('shows total count', () => {
      renderComponent({ validParts: [validPart1], invalidParts: [invalidPart1] })

      expect(screen.getByText('(2 total in file)')).toBeInTheDocument()
    })

    it('hides invalid section when no invalid parts', () => {
      renderComponent({ invalidParts: [] })

      expect(screen.queryByText(/invalid part/)).not.toBeInTheDocument()
    })
  })

  describe('valid parts preview', () => {
    it('shows first 3 valid parts as sample', () => {
      renderComponent({ validParts: [validPart1, validPart2, validPart3, validPart4] })

      expect(screen.getByTestId('preview-part-0')).toBeInTheDocument()
      expect(screen.getByTestId('preview-part-1')).toBeInTheDocument()
      expect(screen.getByTestId('preview-part-2')).toBeInTheDocument()
      expect(screen.queryByTestId('preview-part-3')).not.toBeInTheDocument()
    })

    it('shows part callout in preview', () => {
      renderComponent()

      expect(screen.getByText('TEST-001')).toBeInTheDocument()
      expect(screen.getByText('TEST-002')).toBeInTheDocument()
    })

    it('shows part dimensions in preview', () => {
      renderComponent({ validParts: [validPart1] })

      expect(screen.getByText('100 × 50 × 150 mm')).toBeInTheDocument()
    })

    it('shows "and X more parts" when more than 3 valid', () => {
      renderComponent({ validParts: [validPart1, validPart2, validPart3, validPart4] })

      expect(screen.getByText('... and 1 more part')).toBeInTheDocument()
    })

    it('shows plural "parts" for multiple additional parts', () => {
      const fiveParts = [validPart1, validPart2, validPart3, validPart4, { ...validPart1, PartCallout: 'TEST-005' }]
      renderComponent({ validParts: fiveParts })

      expect(screen.getByText('... and 2 more parts')).toBeInTheDocument()
    })
  })

  describe('invalid parts errors', () => {
    it('shows error details toggle button', () => {
      renderComponent({ invalidParts: [invalidPart1] })

      expect(screen.getByTestId('toggle-error-details')).toBeInTheDocument()
    })

    it('toggles error details visibility', () => {
      renderComponent({ invalidParts: [invalidPart1] })

      // Should be visible by default for small error counts
      expect(screen.getByText('Part callout is required')).toBeInTheDocument()

      // Click to hide
      fireEvent.click(screen.getByTestId('toggle-error-details'))
      expect(screen.queryByText('Part callout is required')).not.toBeInTheDocument()

      // Click to show again
      fireEvent.click(screen.getByTestId('toggle-error-details'))
      expect(screen.getByText('Part callout is required')).toBeInTheDocument()
    })

    it('displays all errors from invalid parts', () => {
      renderComponent({ invalidParts: [invalidPart1] })

      expect(screen.getByText('Part callout is required')).toBeInTheDocument()
      expect(screen.getByText('Required')).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('renders import button with valid count', () => {
      renderComponent()

      expect(screen.getByTestId('import-button')).toHaveTextContent('Import 2 Valid Parts')
    })

    it('renders singular "Part" for single valid part', () => {
      renderComponent({ validParts: [validPart1] })

      expect(screen.getByTestId('import-button')).toHaveTextContent('Import 1 Valid Part')
    })

    it('renders cancel button', () => {
      renderComponent()

      expect(screen.getByTestId('cancel-button')).toHaveTextContent('Cancel')
    })

    it('calls onImport with valid parts when import clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByTestId('import-button'))

      expect(mockOnImport).toHaveBeenCalledWith([validPart1, validPart2])
    })

    it('calls onCancel when cancel clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByTestId('cancel-button'))

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('disables buttons when isImporting is true', () => {
      renderComponent({ isImporting: true })

      expect(screen.getByTestId('import-button')).toBeDisabled()
      expect(screen.getByTestId('cancel-button')).toBeDisabled()
    })

    it('shows "Importing..." when isImporting is true', () => {
      renderComponent({ isImporting: true })

      expect(screen.getByTestId('import-button')).toHaveTextContent('Importing...')
    })

    it('shows "No Valid Parts to Import" when no valid parts', () => {
      renderComponent({ validParts: [], invalidParts: [invalidPart1] })

      expect(screen.getByTestId('import-button')).toHaveTextContent('No Valid Parts to Import')
      expect(screen.getByTestId('import-button')).toBeDisabled()
    })
  })

  describe('styling', () => {
    it('accepts custom className', () => {
      const { container } = renderComponent({ className: 'custom-class' })

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
