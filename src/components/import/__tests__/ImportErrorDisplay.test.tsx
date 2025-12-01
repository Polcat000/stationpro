// src/components/import/__tests__/ImportErrorDisplay.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportErrorDisplay } from '../ImportErrorDisplay'
import type { ImportError } from '@/lib/import/parseAndValidate'

describe('ImportErrorDisplay', () => {
  const singlePartErrors: ImportError[] = [
    { path: '0.PartCallout', message: 'Part callout is required' },
    { path: '0.PartWidth_mm', message: 'Width must be positive' },
  ]

  const multiPartErrors: ImportError[] = [
    { path: '0.PartCallout', message: 'Part callout is required' },
    { path: '2.InspectionZones.0.Face', message: 'Invalid enum value' },
    { path: '2.PartHeight_mm', message: 'Height must be positive' },
    { path: '5.SmallestLateralFeature_um', message: 'Required' },
  ]

  const rootError: ImportError[] = [{ path: 'root', message: 'Expected an array' }]

  describe('rendering', () => {
    it('renders nothing when errors array is empty', () => {
      const { container } = render(<ImportErrorDisplay errors={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders error count in header', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      // Both header and group show error counts, so use getAllByText
      const errorCounts = screen.getAllByText('(2 errors)')
      expect(errorCounts.length).toBeGreaterThan(0)
    })

    it('renders singular "error" for single error', () => {
      render(<ImportErrorDisplay errors={[singlePartErrors[0]]} />)

      // Header shows total count
      expect(screen.getByRole('heading', { name: 'Validation Errors' })).toBeInTheDocument()
      // One of the "(1 error)" texts should be in the header area
      const errorCounts = screen.getAllByText('(1 error)')
      expect(errorCounts.length).toBeGreaterThan(0)
    })

    it('renders custom title when provided', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} title="Custom Errors" />)

      expect(screen.getByText('Custom Errors')).toBeInTheDocument()
    })

    it('renders default title "Validation Errors"', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      expect(screen.getByText('Validation Errors')).toBeInTheDocument()
    })
  })

  describe('grouping errors by part index', () => {
    it('groups errors from same part together', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      const group = screen.getByTestId('error-group-0')
      expect(group).toBeInTheDocument()
      expect(screen.getByText('Part 0')).toBeInTheDocument()
    })

    it('creates separate groups for different parts', () => {
      render(<ImportErrorDisplay errors={multiPartErrors} />)

      expect(screen.getByTestId('error-group-0')).toBeInTheDocument()
      expect(screen.getByTestId('error-group-2')).toBeInTheDocument()
      expect(screen.getByTestId('error-group-5')).toBeInTheDocument()
    })

    it('shows error count per group', () => {
      render(<ImportErrorDisplay errors={multiPartErrors} />)

      // Part 0 has 1 error
      expect(screen.getByText('Part 0').parentElement).toHaveTextContent('1 error')
      // Part 2 has 2 errors
      expect(screen.getByText('Part 2').parentElement).toHaveTextContent('2 errors')
    })

    it('labels non-indexed errors as "General Errors"', () => {
      render(<ImportErrorDisplay errors={rootError} />)

      expect(screen.getByText('General Errors')).toBeInTheDocument()
    })
  })

  describe('field path formatting', () => {
    it('removes part index from field path display', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      // Should show "PartCallout" not "0.PartCallout"
      expect(screen.getByText('PartCallout')).toBeInTheDocument()
      expect(screen.getByText('PartWidth_mm')).toBeInTheDocument()
    })

    it('preserves nested field paths correctly', () => {
      render(<ImportErrorDisplay errors={multiPartErrors} />)

      // "2.InspectionZones.0.Face" should become "InspectionZones.0.Face"
      expect(screen.getByText('InspectionZones.0.Face')).toBeInTheDocument()
    })
  })

  describe('error messages', () => {
    it('displays error messages', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      expect(screen.getByText('Part callout is required')).toBeInTheDocument()
      expect(screen.getByText('Width must be positive')).toBeInTheDocument()
    })

    it('displays error messages for expanded groups', () => {
      render(<ImportErrorDisplay errors={multiPartErrors} />)

      // Part 0 and Part 2 are expanded by default (-1, 0, 1, 2 are auto-expanded)
      expect(screen.getByText('Part callout is required')).toBeInTheDocument()
      expect(screen.getByText('Invalid enum value')).toBeInTheDocument()
      expect(screen.getByText('Height must be positive')).toBeInTheDocument()
    })

    it('shows errors for collapsed group after expanding', () => {
      render(<ImportErrorDisplay errors={multiPartErrors} />)

      // Part 5 is collapsed by default (only 0, 1, 2 auto-expand)
      expect(screen.queryByText('Required')).not.toBeInTheDocument()

      // Expand Part 5
      fireEvent.click(screen.getByText('Part 5'))
      expect(screen.getByText('Required')).toBeInTheDocument()
    })
  })

  describe('collapsible groups', () => {
    it('expands first few groups by default', () => {
      render(<ImportErrorDisplay errors={multiPartErrors} />)

      // Groups 0, 1, 2 should be expanded by default
      // Error messages should be visible
      expect(screen.getByText('Part callout is required')).toBeInTheDocument()
      expect(screen.getByText('Invalid enum value')).toBeInTheDocument()
    })

    it('collapses group when header is clicked', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      // Click to collapse
      fireEvent.click(screen.getByText('Part 0'))

      // Error messages should be hidden
      expect(screen.queryByText('Part callout is required')).not.toBeInTheDocument()
    })

    it('expands group when clicked again', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      // Click to collapse
      fireEvent.click(screen.getByText('Part 0'))
      // Click to expand
      fireEvent.click(screen.getByText('Part 0'))

      // Error messages should be visible again
      expect(screen.getByText('Part callout is required')).toBeInTheDocument()
    })

    it('has aria-expanded attribute on group header', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      const groupHeader = screen.getByRole('button', { name: /Part 0/i })
      expect(groupHeader).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(groupHeader)
      expect(groupHeader).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('styling', () => {
    it('has destructive styling classes', () => {
      const { container } = render(<ImportErrorDisplay errors={singlePartErrors} />)

      expect(container.firstChild).toHaveClass('border-destructive/30')
      expect(container.firstChild).toHaveClass('bg-destructive/5')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <ImportErrorDisplay errors={singlePartErrors} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('test id attributes', () => {
    it('has error group test ids', () => {
      render(<ImportErrorDisplay errors={multiPartErrors} />)

      expect(screen.getByTestId('error-group-0')).toBeInTheDocument()
      expect(screen.getByTestId('error-group-2')).toBeInTheDocument()
      expect(screen.getByTestId('error-group-5')).toBeInTheDocument()
    })

    it('has error item test ids with path', () => {
      render(<ImportErrorDisplay errors={singlePartErrors} />)

      expect(screen.getByTestId('error-item-0.PartCallout')).toBeInTheDocument()
      expect(screen.getByTestId('error-item-0.PartWidth_mm')).toBeInTheDocument()
    })
  })
})
