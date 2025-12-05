// src/components/parts/__tests__/SeriesGroupHeader.test.tsx
// Tests for SeriesGroupHeader component (AC 3.1.6, 3.1.7)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeriesGroupHeader } from '../SeriesGroupHeader'
import { useWorkingSetStore } from '@/stores/workingSet'

describe('SeriesGroupHeader', () => {
  const defaultProps = {
    seriesName: 'USB-C',
    partIdsInSeries: ['p1', 'p2', 'p3'],
    isExpanded: true,
    onToggleExpand: vi.fn(),
  }

  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
    vi.clearAllMocks()
  })

  it('displays series name', () => {
    render(<SeriesGroupHeader {...defaultProps} />)

    expect(screen.getByText('USB-C')).toBeInTheDocument()
  })

  it('displays "No Series" for empty series name', () => {
    render(<SeriesGroupHeader {...defaultProps} seriesName="" />)

    expect(screen.getByText('No Series')).toBeInTheDocument()
  })

  it('displays "0 of 3 selected" when no parts selected', () => {
    render(<SeriesGroupHeader {...defaultProps} />)

    expect(screen.getByText('0 of 3 selected')).toBeInTheDocument()
  })

  it('displays "2 of 3 selected" when some parts selected', () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1', 'p2']),
      stationIds: new Set<string>(),
    })

    render(<SeriesGroupHeader {...defaultProps} />)

    expect(screen.getByText('2 of 3 selected')).toBeInTheDocument()
  })

  it('displays "3 of 3 selected" when all parts selected', () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1', 'p2', 'p3']),
      stationIds: new Set<string>(),
    })

    render(<SeriesGroupHeader {...defaultProps} />)

    expect(screen.getByText('3 of 3 selected')).toBeInTheDocument()
  })

  it('renders checkbox unchecked when no parts selected', () => {
    render(<SeriesGroupHeader {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    expect(checkbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('renders checkbox checked when all parts selected', () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1', 'p2', 'p3']),
      stationIds: new Set<string>(),
    })

    render(<SeriesGroupHeader {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('renders checkbox indeterminate when some parts selected', () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1']),
      stationIds: new Set<string>(),
    })

    render(<SeriesGroupHeader {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
  })

  it('adds all parts when checkbox clicked with none selected', async () => {
    const user = userEvent.setup()
    render(<SeriesGroupHeader {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    const { partIds } = useWorkingSetStore.getState()
    expect(partIds.size).toBe(3)
    expect(partIds.has('p1')).toBe(true)
    expect(partIds.has('p2')).toBe(true)
    expect(partIds.has('p3')).toBe(true)
  })

  it('removes all parts when checkbox clicked with all selected', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1', 'p2', 'p3']),
      stationIds: new Set<string>(),
    })
    const user = userEvent.setup()

    render(<SeriesGroupHeader {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    const { partIds } = useWorkingSetStore.getState()
    expect(partIds.size).toBe(0)
  })

  it('adds all parts when checkbox clicked with some selected (OR logic)', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1']),
      stationIds: new Set<string>(),
    })
    const user = userEvent.setup()

    render(<SeriesGroupHeader {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    const { partIds } = useWorkingSetStore.getState()
    expect(partIds.size).toBe(3)
  })

  it('calls onToggleExpand when expand button clicked', async () => {
    const onToggleExpand = vi.fn()
    const user = userEvent.setup()

    render(<SeriesGroupHeader {...defaultProps} onToggleExpand={onToggleExpand} />)

    const expandButton = screen.getByRole('button', { name: /collapse series/i })
    await user.click(expandButton)

    expect(onToggleExpand).toHaveBeenCalledTimes(1)
  })

  it('shows expand icon when collapsed', () => {
    render(<SeriesGroupHeader {...defaultProps} isExpanded={false} />)

    expect(screen.getByRole('button', { name: /expand series/i })).toBeInTheDocument()
  })

  it('shows collapse icon when expanded', () => {
    render(<SeriesGroupHeader {...defaultProps} isExpanded={true} />)

    expect(screen.getByRole('button', { name: /collapse series/i })).toBeInTheDocument()
  })
})
