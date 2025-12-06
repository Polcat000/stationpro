// src/components/stations/__tests__/ManufacturerGroupHeader.test.tsx
// Tests for ManufacturerGroupHeader with tri-state checkbox (AC 3.2.2)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManufacturerGroupHeader } from '../ManufacturerGroupHeader'
import { useComponentsStore } from '@/stores/components'

describe('ManufacturerGroupHeader', () => {
  const defaultProps = {
    manufacturer: 'LMI Technologies',
    componentIdsInGroup: ['c1', 'c2', 'c3'],
    isExpanded: true,
    onToggleExpand: vi.fn(),
  }

  beforeEach(() => {
    useComponentsStore.setState({
      activeComponentIds: new Set<string>(),
    })
    vi.clearAllMocks()
  })

  it('renders manufacturer name', () => {
    render(<ManufacturerGroupHeader {...defaultProps} />)

    expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
  })

  it('renders "0 of 3 active" when none are active', () => {
    render(<ManufacturerGroupHeader {...defaultProps} />)

    expect(screen.getByText('0 of 3 active')).toBeInTheDocument()
  })

  it('renders "3 of 3 active" when all are active', () => {
    useComponentsStore.setState({
      activeComponentIds: new Set(['c1', 'c2', 'c3']),
    })

    render(<ManufacturerGroupHeader {...defaultProps} />)

    expect(screen.getByText('3 of 3 active')).toBeInTheDocument()
  })

  it('renders "1 of 3 active" when some are active', () => {
    useComponentsStore.setState({
      activeComponentIds: new Set(['c1']),
    })

    render(<ManufacturerGroupHeader {...defaultProps} />)

    expect(screen.getByText('1 of 3 active')).toBeInTheDocument()
  })

  describe('checkbox tri-state', () => {
    it('checkbox is unchecked when no components are active', () => {
      render(<ManufacturerGroupHeader {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /toggle all components from LMI Technologies/i })
      expect(checkbox).not.toBeChecked()
      expect(checkbox).not.toHaveAttribute('data-state', 'indeterminate')
    })

    it('checkbox is checked when all components are active', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1', 'c2', 'c3']),
      })

      render(<ManufacturerGroupHeader {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /toggle all components from LMI Technologies/i })
      expect(checkbox).toBeChecked()
    })

    it('checkbox is indeterminate when some components are active', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1']),
      })

      render(<ManufacturerGroupHeader {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /toggle all components from LMI Technologies/i })
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
    })
  })

  describe('checkbox interaction', () => {
    it('activates all components when none are active', async () => {
      const user = userEvent.setup()
      render(<ManufacturerGroupHeader {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /toggle all components from LMI Technologies/i })
      await user.click(checkbox)

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('c1')).toBe(true)
      expect(activeComponentIds.has('c2')).toBe(true)
      expect(activeComponentIds.has('c3')).toBe(true)
    })

    it('deactivates all components when all are active', async () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1', 'c2', 'c3']),
      })
      const user = userEvent.setup()

      render(<ManufacturerGroupHeader {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /toggle all components from LMI Technologies/i })
      await user.click(checkbox)

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('c1')).toBe(false)
      expect(activeComponentIds.has('c2')).toBe(false)
      expect(activeComponentIds.has('c3')).toBe(false)
    })

    it('activates all components when some are active (OR logic)', async () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1']),
      })
      const user = userEvent.setup()

      render(<ManufacturerGroupHeader {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /toggle all components from LMI Technologies/i })
      await user.click(checkbox)

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('c1')).toBe(true)
      expect(activeComponentIds.has('c2')).toBe(true)
      expect(activeComponentIds.has('c3')).toBe(true)
    })
  })

  describe('expand/collapse', () => {
    it('calls onToggleExpand when chevron button is clicked', async () => {
      const user = userEvent.setup()
      const onToggleExpand = vi.fn()

      render(<ManufacturerGroupHeader {...defaultProps} onToggleExpand={onToggleExpand} />)

      const expandButton = screen.getByRole('button', { name: /collapse manufacturer/i })
      await user.click(expandButton)

      expect(onToggleExpand).toHaveBeenCalledTimes(1)
    })

    it('shows collapse button when expanded', () => {
      render(<ManufacturerGroupHeader {...defaultProps} isExpanded={true} />)

      expect(screen.getByRole('button', { name: /collapse manufacturer/i })).toBeInTheDocument()
    })

    it('shows expand button when collapsed', () => {
      render(<ManufacturerGroupHeader {...defaultProps} isExpanded={false} />)

      expect(screen.getByRole('button', { name: /expand manufacturer/i })).toBeInTheDocument()
    })
  })
})
