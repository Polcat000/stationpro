// src/components/stations/__tests__/ComponentsFilterPanel.test.tsx
// Unit tests for ComponentsFilterPanel component (AC 2.8.3)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentsFilterPanel } from '../ComponentsFilterPanel'
import type { ComponentFilters } from '../ComponentsTab'

const defaultFilters: ComponentFilters = {
  model: '',
  manufacturers: [],
  types: [],
}

const mockManufacturers = ['LMI Technologies', 'Basler', 'Keyence', 'Edmund Optics']

describe('ComponentsFilterPanel', () => {
  describe('AC-2.8.3: Filter Panel Renders All Controls', () => {
    it('renders when open', () => {
      const onOpenChange = vi.fn()
      const onFiltersChange = vi.fn()
      const onClearAll = vi.fn()

      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueManufacturers={mockManufacturers}
          onClearAll={onClearAll}
        />
      )

      expect(screen.getByText('Filter Components')).toBeInTheDocument()
    })

    it('renders model search input', () => {
      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={defaultFilters}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      expect(screen.getByLabelText('Model')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search model...')).toBeInTheDocument()
    })

    it('renders manufacturer select', () => {
      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={defaultFilters}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      expect(screen.getByText('Manufacturer')).toBeInTheDocument()
    })

    it('renders component type select', () => {
      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={defaultFilters}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      expect(screen.getByText('Component Type')).toBeInTheDocument()
    })

    it('renders Clear All and Apply buttons', () => {
      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={defaultFilters}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
    })
  })

  describe('Model Search', () => {
    it('updates model filter on input', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      const input = screen.getByPlaceholderText('Search model...')
      // Type a single character and verify onFiltersChange is called with it
      // Note: Since this is a controlled component that resets to filters.model prop,
      // typing multiple chars doesn't accumulate without re-render with updated prop.
      // We test that each keystroke triggers onFiltersChange with the typed character.
      await user.type(input, 'G')

      expect(onFiltersChange).toHaveBeenCalled()
      // First keystroke should call with 'G'
      expect(onFiltersChange.mock.calls[0][0].model).toBe('G')
    })
  })

  describe('Clear All', () => {
    it('calls onClearAll when clicked', async () => {
      const user = userEvent.setup()
      const onClearAll = vi.fn()

      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={{ model: 'test', manufacturers: ['LMI'], types: ['Lens'] }}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={onClearAll}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Clear All' }))

      expect(onClearAll).toHaveBeenCalled()
    })
  })

  describe('Apply Button', () => {
    it('closes panel when Apply clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={onOpenChange}
          filters={defaultFilters}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Apply' }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Selected Filters Display', () => {
    it('shows selected manufacturers as badges', () => {
      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={{ ...defaultFilters, manufacturers: ['Basler', 'Keyence'] }}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      expect(screen.getByText('Basler ×')).toBeInTheDocument()
      expect(screen.getByText('Keyence ×')).toBeInTheDocument()
    })

    it('shows selected types as badges with human-readable labels', () => {
      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={{ ...defaultFilters, types: ['LaserLineProfiler', 'Lens'] }}
          onFiltersChange={vi.fn()}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      expect(screen.getByText('Laser Profiler ×')).toBeInTheDocument()
      expect(screen.getByText('Lens ×')).toBeInTheDocument()
    })

    it('removes manufacturer when badge clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={{ ...defaultFilters, manufacturers: ['Basler', 'Keyence'] }}
          onFiltersChange={onFiltersChange}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      await user.click(screen.getByText('Basler ×'))

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        manufacturers: ['Keyence'],
      })
    })

    it('removes type when badge clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      render(
        <ComponentsFilterPanel
          open={true}
          onOpenChange={vi.fn()}
          filters={{ ...defaultFilters, types: ['LaserLineProfiler', 'Lens'] }}
          onFiltersChange={onFiltersChange}
          uniqueManufacturers={mockManufacturers}
          onClearAll={vi.fn()}
        />
      )

      await user.click(screen.getByText('Laser Profiler ×'))

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        types: ['Lens'],
      })
    })
  })
})
