// src/components/parts/__tests__/WorkingSetCounter.test.tsx
// Tests for WorkingSetCounter component (AC 3.1.3)

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkingSetCounter } from '../WorkingSetCounter'
import { useWorkingSetStore } from '@/stores/workingSet'

describe('WorkingSetCounter', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('displays "0 parts in working set" when empty', () => {
    render(<WorkingSetCounter />)

    expect(screen.getByText('0 parts in working set')).toBeInTheDocument()
  })

  it('displays "1 part in working set" for single part', () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1']),
      stationIds: new Set<string>(),
    })

    render(<WorkingSetCounter />)

    expect(screen.getByText('1 part in working set')).toBeInTheDocument()
  })

  it('displays correct count with pluralization for multiple parts', () => {
    useWorkingSetStore.setState({
      partIds: new Set(['p1', 'p2', 'p3']),
      stationIds: new Set<string>(),
    })

    render(<WorkingSetCounter />)

    expect(screen.getByText('3 parts in working set')).toBeInTheDocument()
  })

  it('updates when working set changes', () => {
    const { rerender } = render(<WorkingSetCounter />)

    expect(screen.getByText('0 parts in working set')).toBeInTheDocument()

    useWorkingSetStore.setState({
      partIds: new Set(['p1', 'p2']),
      stationIds: new Set<string>(),
    })

    rerender(<WorkingSetCounter />)

    expect(screen.getByText('2 parts in working set')).toBeInTheDocument()
  })
})
