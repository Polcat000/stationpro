// src/components/shared/__tests__/WorkingSetBadge.test.tsx
// Tests for WorkingSetBadge component (AC 3.3.1)

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkingSetBadge } from '../WorkingSetBadge'
import { useWorkingSetStore } from '@/stores/workingSet'
import { useComponentsStore } from '@/stores/components'

describe('WorkingSetBadge', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
    useComponentsStore.setState({
      activeComponentIds: new Set<string>(),
    })
  })

  describe('count display', () => {
    it('displays "0 parts, 0 components" when empty', () => {
      render(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('0 parts, 0 components')
    })

    it('displays "1 part, 0 components" for single part', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1']),
        stationIds: new Set<string>(),
      })

      render(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('1 part, 0 components')
    })

    it('displays "0 parts, 1 component" for single component', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1']),
      })

      render(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('0 parts, 1 component')
    })

    it('displays plural forms correctly for multiple items', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1', 'p2', 'p3']),
        stationIds: new Set<string>(),
      })
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1', 'c2']),
      })

      render(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('3 parts, 2 components')
    })
  })

  describe('reactivity', () => {
    it('updates count when working set changes', () => {
      const { rerender } = render(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('0 parts, 0 components')

      useWorkingSetStore.setState({
        partIds: new Set(['p1', 'p2']),
        stationIds: new Set<string>(),
      })

      rerender(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('2 parts, 0 components')
    })

    it('updates count when component store changes', () => {
      const { rerender } = render(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('0 parts, 0 components')

      useComponentsStore.setState({
        activeComponentIds: new Set(['c1', 'c2', 'c3']),
      })

      rerender(<WorkingSetBadge />)

      expect(screen.getByRole('button')).toHaveTextContent('0 parts, 3 components')
    })
  })

  describe('accessibility', () => {
    it('has accessible label describing working set', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1']),
        stationIds: new Set<string>(),
      })
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1', 'c2']),
      })

      render(<WorkingSetBadge />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Working set: 1 part, 2 components')
    })

    it('is clickable', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(<WorkingSetBadge onClick={handleClick} />)

      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
