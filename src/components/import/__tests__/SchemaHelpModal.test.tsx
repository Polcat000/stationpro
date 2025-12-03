import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemaHelpModal } from '../SchemaHelpModal'

describe('SchemaHelpModal', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    mockOnOpenChange.mockClear()
    // Clipboard mock defined globally in setup.ts
  })

  const renderComponent = (open = true) => {
    return render(
      <SchemaHelpModal open={open} onOpenChange={mockOnOpenChange} />
    )
  }

  describe('rendering (AC-2.9.1)', () => {
    it('renders modal when open is true', () => {
      renderComponent(true)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render modal when open is false', () => {
      renderComponent(false)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('displays modal title "JSON Import Schema"', () => {
      renderComponent()
      expect(screen.getByText('JSON Import Schema')).toBeInTheDocument()
    })

    it('displays modal description', () => {
      renderComponent()
      expect(
        screen.getByText(/Reference documentation for JSON file formats/)
      ).toBeInTheDocument()
    })

    it('renders Parts Schema and Components Schema tabs', () => {
      renderComponent()
      expect(screen.getByRole('tab', { name: /Parts Schema/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Components Schema/i })).toBeInTheDocument()
    })
  })

  describe('Parts Schema tab (AC-2.9.2)', () => {
    it('shows Parts tab as active by default', () => {
      renderComponent()
      expect(screen.getByRole('tab', { name: /Parts Schema/i })).toHaveAttribute(
        'data-state',
        'active'
      )
    })

    it('displays Part JSON example with PartCallout field', () => {
      renderComponent()
      // PartCallout appears multiple times (JSON example and field reference table)
      const elements = screen.getAllByText(/PartCallout/)
      expect(elements.length).toBeGreaterThan(0)
    })

    it('displays InspectionZones in the example', () => {
      renderComponent()
      // InspectionZones appears multiple times in the JSON and field reference
      const elements = screen.getAllByText(/InspectionZones/)
      expect(elements.length).toBeGreaterThan(0)
    })

    it('renders JSON example in a pre/code block', () => {
      renderComponent()
      const codeBlock = screen.getAllByRole('code')[0]
      expect(codeBlock).toBeInTheDocument()
      expect(codeBlock.closest('pre')).toBeInTheDocument()
    })

    it('displays Part Fields reference section', () => {
      renderComponent()
      expect(screen.getByText('Part Fields')).toBeInTheDocument()
    })

    it('displays InspectionZone Fields reference section', () => {
      renderComponent()
      expect(screen.getByText('InspectionZone Fields')).toBeInTheDocument()
    })

    it('marks PartCallout as required in the table', () => {
      renderComponent()
      const rows = screen.getAllByRole('row')
      const partCalloutRow = rows.find((row) =>
        row.textContent?.includes('PartCallout')
      )
      expect(partCalloutRow?.textContent).toContain('Yes')
    })
  })

  describe('Components Schema tab (AC-2.9.3)', () => {
    it('switches to Components tab when clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('tab', { name: /Components Schema/i }))

      expect(screen.getByRole('tab', { name: /Components Schema/i })).toHaveAttribute(
        'data-state',
        'active'
      )
    })

    it('shows all 5 component types', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('tab', { name: /Components Schema/i }))

      expect(screen.getByText('LaserLineProfiler')).toBeInTheDocument()
      expect(screen.getByText('AreascanCamera')).toBeInTheDocument()
      expect(screen.getByText('LinescanCamera')).toBeInTheDocument()
      expect(screen.getByText('SnapshotSensor')).toBeInTheDocument()
      // Lens appears in multiple places
      const lensElements = screen.getAllByText('Lens')
      expect(lensElements.length).toBeGreaterThan(0)
    })

    it('shows Components wrapper structure in JSON example', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('tab', { name: /Components Schema/i }))

      expect(screen.getByText(/"Components":/)).toBeInTheDocument()
    })

    it('explains the componentType discriminator pattern', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('tab', { name: /Components Schema/i }))

      // componentType appears multiple times - just verify at least one exists
      const componentTypeElements = screen.getAllByText(/componentType/)
      expect(componentTypeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Copy button presence (AC-2.9.4)', () => {
    it('renders copy button for Parts schema code block', () => {
      renderComponent()
      // CopyButton renders with aria-label containing "copy"
      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      expect(copyButtons.length).toBeGreaterThan(0)
    })

    it('renders copy button for Components schema code block', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(screen.getByRole('tab', { name: /Components Schema/i }))

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      expect(copyButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Modal behavior (AC-2.9.1)', () => {
    it('calls onOpenChange(false) when X button clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls onOpenChange(false) when Escape is pressed', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.keyboard('{Escape}')

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Tab switching', () => {
    it('can switch between Parts and Components tabs', async () => {
      const user = userEvent.setup()
      renderComponent()

      // Start on Parts tab
      expect(screen.getByRole('tab', { name: /Parts Schema/i })).toHaveAttribute(
        'data-state',
        'active'
      )

      // Switch to Components
      await user.click(screen.getByRole('tab', { name: /Components Schema/i }))
      expect(screen.getByRole('tab', { name: /Components Schema/i })).toHaveAttribute(
        'data-state',
        'active'
      )

      // Switch back to Parts
      await user.click(screen.getByRole('tab', { name: /Parts Schema/i }))
      expect(screen.getByRole('tab', { name: /Parts Schema/i })).toHaveAttribute(
        'data-state',
        'active'
      )
    })
  })
})
