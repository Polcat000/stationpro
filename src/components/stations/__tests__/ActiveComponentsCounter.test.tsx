// src/components/stations/__tests__/ActiveComponentsCounter.test.tsx
// Tests for ActiveComponentsCounter (AC 3.2.1)

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActiveComponentsCounter } from '../ActiveComponentsCounter'
import { useComponentsStore } from '@/stores/components'

describe('ActiveComponentsCounter', () => {
  beforeEach(() => {
    useComponentsStore.setState({
      activeComponentIds: new Set<string>(),
    })
  })

  it('displays "0 active components" when none are active', () => {
    render(<ActiveComponentsCounter />)

    expect(screen.getByText('0 active components')).toBeInTheDocument()
  })

  it('displays "1 active component" (singular) when one is active', () => {
    useComponentsStore.setState({
      activeComponentIds: new Set(['component-1']),
    })

    render(<ActiveComponentsCounter />)

    expect(screen.getByText('1 active component')).toBeInTheDocument()
  })

  it('displays plural form for multiple active components', () => {
    useComponentsStore.setState({
      activeComponentIds: new Set(['component-1', 'component-2', 'component-3']),
    })

    render(<ActiveComponentsCounter />)

    expect(screen.getByText('3 active components')).toBeInTheDocument()
  })

  it('updates when store changes', () => {
    const { rerender } = render(<ActiveComponentsCounter />)

    expect(screen.getByText('0 active components')).toBeInTheDocument()

    useComponentsStore.setState({
      activeComponentIds: new Set(['c1', 'c2']),
    })

    rerender(<ActiveComponentsCounter />)

    expect(screen.getByText('2 active components')).toBeInTheDocument()
  })
})
