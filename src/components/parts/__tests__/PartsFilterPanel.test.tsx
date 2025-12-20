// src/components/parts/__tests__/PartsFilterPanel.test.tsx
// Unit tests for PartsFilterPanel component (AC 2.7.2)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PartsFilterPanel } from '../PartsFilterPanel'
import type { PartFilters } from '../PartsLibraryPage'

const defaultFilters: PartFilters = {
  callout: '',
  series: [],
  family: [],
  widthRange: [null, null],
  heightRange: [null, null],
  lengthRange: [null, null],
  zoneCountRange: [null, null],
}

describe('PartsFilterPanel', () => {
  describe('AC-2.7.2: Floating Filter Panel', () => {
    it('renders when open is true', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={['Series-A', 'Series-B']}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      expect(screen.getByText('Filter Parts')).toBeInTheDocument()
    })

    it('does not render when open is false', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={false}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={['Series-A', 'Series-B']}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      expect(screen.queryByText('Filter Parts')).not.toBeInTheDocument()
    })

    it('renders PartCallout text search input', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={['Series-A', 'Series-B']}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      expect(screen.getByLabelText('Part Callout')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search callout...')).toBeInTheDocument()
    })

    it('renders dimension range inputs', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      expect(screen.getByText('Width (mm)')).toBeInTheDocument()
      expect(screen.getByText('Height (mm)')).toBeInTheDocument()
      expect(screen.getByText('Length (mm)')).toBeInTheDocument()
      expect(screen.getByText('# Zones')).toBeInTheDocument()
    })

    it('renders Clear All and Apply buttons', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
    })

    it('calls onFiltersChange when callout search changes', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search callout...')
      fireEvent.change(searchInput, { target: { value: 'ABC' } })

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ callout: 'ABC' })
      )
    })

    it('calls onFiltersChange when dimension range changes', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      // Find the Min input in the Width section
      const minInputs = screen.getAllByPlaceholderText('Min')
      fireEvent.change(minInputs[0], { target: { value: '50' } })

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ widthRange: [50, null] })
      )
    })

    it('calls onClearAll when Clear All button clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Clear All' }))

      expect(onClearAll).toHaveBeenCalled()
    })

    it('calls onOpenChange(false) when Apply button clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Apply' }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Series Multi-Select', () => {
    it('displays Part Series label', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={['Series-A', 'Series-B']}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      expect(screen.getByText('Part Series')).toBeInTheDocument()
    })

    it('displays selected series as badges', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      const filtersWithSeries: PartFilters = {
        ...defaultFilters,
        series: ['Series-A', 'Series-B'],
      }

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={filtersWithSeries}
          onFiltersChange={onFiltersChange}
          uniqueSeries={['Series-A', 'Series-B', 'Series-C']}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      // Selected series should appear as badges
      expect(screen.getByText('Series-A ×')).toBeInTheDocument()
      expect(screen.getByText('Series-B ×')).toBeInTheDocument()
    })

    it('removes series when badge is clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      const filtersWithSeries: PartFilters = {
        ...defaultFilters,
        series: ['Series-A', 'Series-B'],
      }

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={filtersWithSeries}
          onFiltersChange={onFiltersChange}
          uniqueSeries={['Series-A', 'Series-B']}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      // Click the badge to remove Series-A
      await user.click(screen.getByText('Series-A ×'))

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          series: ['Series-B'],
        })
      )
    })

    it('renders select trigger', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={['Series-A', 'Series-B']}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      expect(screen.getByText('Select series...')).toBeInTheDocument()
    })
  })

  describe('Range Filter Behavior', () => {
    it('handles max value input', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      const maxInputs = screen.getAllByPlaceholderText('Max')
      fireEvent.change(maxInputs[0], { target: { value: '200' } })

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ widthRange: [null, 200] })
      )
    })

    it('clears range value when input is cleared', () => {
      const onFiltersChange = vi.fn()
      const onOpenChange = vi.fn()
      const onClearAll = vi.fn()

      const filtersWithRange: PartFilters = {
        ...defaultFilters,
        widthRange: [50, 200],
      }

      render(
        <PartsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={filtersWithRange}
          onFiltersChange={onFiltersChange}
          uniqueSeries={[]}
          uniqueFamilies={[]}
          onClearAll={onClearAll}
        />
      )

      const minInputs = screen.getAllByPlaceholderText('Min')
      fireEvent.change(minInputs[0], { target: { value: '' } })

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ widthRange: [null, 200] })
      )
    })
  })
})
