// src/components/parts/__tests__/PartDetailPanel.test.tsx
// Unit tests for PartDetailPanel component (AC 2.7.4)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Part } from '@/lib/schemas/part'
import { PartDetailPanel } from '../PartDetailPanel'

const mockPart: Part = {
  PartCallout: 'TEST-PART-001',
  PartSeries: 'Test-Series',
  PartWidth_mm: 100,
  PartHeight_mm: 50,
  PartLength_mm: 200,
  SmallestLateralFeature_um: 10,
  SmallestDepthFeature_um: 5,
  InspectionZones: [
    {
      ZoneID: 'Z1',
      Name: 'Top Zone',
      Face: 'Top',
      ZoneDepth_mm: 5,
      ZoneOffset_mm: 0,
      RequiredCoverage_pct: 100,
      MinPixelsPerFeature: 3,
      SmallestLateralFeature_um: 8,
      SmallestDepthFeature_um: 4,
    },
    {
      ZoneID: 'Z2',
      Name: 'Front Zone',
      Face: 'Front',
      ZoneDepth_mm: 10,
      ZoneOffset_mm: 5,
      RequiredCoverage_pct: 95,
      MinPixelsPerFeature: 3,
    },
  ],
}

describe('PartDetailPanel', () => {
  describe('AC-2.7.4: Row Click Opens Detail Side Panel', () => {
    it('renders when open is true and part is provided', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('TEST-PART-001')).toBeInTheDocument()
    })

    it('does not render when open is false', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={false}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.queryByText('TEST-PART-001')).not.toBeInTheDocument()
    })

    it('does not render when part is null', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={null}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      // Should not crash and should render nothing
      expect(screen.queryByText('Dimensions')).not.toBeInTheDocument()
    })

    it('displays part header with PartCallout and PartSeries', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('TEST-PART-001')).toBeInTheDocument()
      expect(screen.getByText('Series: Test-Series')).toBeInTheDocument()
    })

    it('displays dimensions section with values', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('Dimensions')).toBeInTheDocument()
      expect(screen.getByText('Width')).toBeInTheDocument()
      expect(screen.getByText('100 mm')).toBeInTheDocument()
      expect(screen.getByText('Height')).toBeInTheDocument()
      expect(screen.getByText('50 mm')).toBeInTheDocument()
      expect(screen.getByText('Length')).toBeInTheDocument()
      expect(screen.getByText('200 mm')).toBeInTheDocument()
    })

    it('displays feature sizes section', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('Feature Sizes')).toBeInTheDocument()
      expect(screen.getByText('Smallest Lateral')).toBeInTheDocument()
      expect(screen.getByText('10 \u03BCm')).toBeInTheDocument()
      expect(screen.getByText('Smallest Depth')).toBeInTheDocument()
      expect(screen.getByText('5 \u03BCm')).toBeInTheDocument()
    })

    it('displays inspection zones section with count', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('Inspection Zones (2)')).toBeInTheDocument()
      expect(screen.getByText('Top Zone')).toBeInTheDocument()
      expect(screen.getByText('Front Zone')).toBeInTheDocument()
    })

    it('expands zone to show details', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      // Click to expand the first zone
      await user.click(screen.getByText('Top Zone'))

      // Zone details should be visible
      expect(screen.getByText('Face:')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText('Depth:')).toBeInTheDocument()
      expect(screen.getByText('5 mm')).toBeInTheDocument()
    })

    it('renders Edit button', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    it('renders Delete button', () => {
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('calls onEdit when Edit button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      await user.click(screen.getByRole('button', { name: /edit/i }))

      expect(onEdit).toHaveBeenCalled()
    })

    it('calls onDelete when Delete button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      await user.click(screen.getByRole('button', { name: /delete/i }))

      expect(onDelete).toHaveBeenCalled()
    })
  })

  describe('Part Without Optional Fields', () => {
    it('handles part without PartSeries', () => {
      const partWithoutSeries: Part = {
        ...mockPart,
        PartSeries: undefined,
      }

      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={partWithoutSeries}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('TEST-PART-001')).toBeInTheDocument()
      expect(screen.queryByText(/Series:/)).not.toBeInTheDocument()
    })

    it('handles part without SmallestDepthFeature_um', () => {
      const partWithoutDepthFeature: Part = {
        ...mockPart,
        SmallestDepthFeature_um: undefined,
      }

      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={partWithoutDepthFeature}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('10 \u03BCm')).toBeInTheDocument()
      // Should not show depth feature if undefined
      expect(screen.queryByText('Smallest Depth')).not.toBeInTheDocument()
    })
  })

  describe('Zone Details', () => {
    it('shows zone-level feature sizes when present', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      // Expand the first zone which has zone-level features
      await user.click(screen.getByText('Top Zone'))

      // Check that lateral and depth feature labels are shown
      // Values are rendered in same element, so check the label exists
      expect(screen.getByText('Lateral Feature:')).toBeInTheDocument()
      expect(screen.getByText('Depth Feature:')).toBeInTheDocument()
    })

    it('shows coverage percentage', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <PartDetailPanel
          open={true}
          onOpenChange={onOpenChange}
          part={mockPart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      // Expand the first zone
      await user.click(screen.getByText('Top Zone'))

      expect(screen.getByText('Coverage:')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })
})
