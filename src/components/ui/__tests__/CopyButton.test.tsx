import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from '../CopyButton'

describe('CopyButton', () => {
  const testText = 'Test content to copy'

  it('renders with copy aria-label initially', () => {
    render(<CopyButton text={testText} />)
    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument()
  })

  it('shows copied state after clicking', async () => {
    const user = userEvent.setup()
    render(<CopyButton text={testText} />)

    await user.click(screen.getByRole('button'))

    // Verify UI state change to "Copied" (clipboard mock is provided in setup.ts)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    render(<CopyButton text={testText} className="custom-class" />)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})
