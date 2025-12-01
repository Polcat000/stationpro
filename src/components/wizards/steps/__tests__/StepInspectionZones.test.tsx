// src/components/wizards/steps/__tests__/StepInspectionZones.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { partFormSchema, type PartFormInput } from '@/lib/schemas/part'
import { StepInspectionZones } from '../StepInspectionZones'

// Mock window.confirm
const mockConfirm = vi.fn()
window.confirm = mockConfirm

function TestWrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<PartFormInput>({
    resolver: zodResolver(partFormSchema),
    mode: 'onChange',
    defaultValues: {
      PartCallout: 'TEST',
      PartWidth_mm: 10,
      PartHeight_mm: 5,
      PartLength_mm: 20,
      SmallestLateralFeature_um: 100,
      InspectionZones: [],
    },
  })

  return <FormProvider {...form}>{children}</FormProvider>
}

describe('StepInspectionZones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  const renderStep = () => {
    return render(
      <TestWrapper>
        <StepInspectionZones />
      </TestWrapper>
    )
  }

  describe('rendering', () => {
    it('renders Add Zone button', () => {
      renderStep()
      expect(screen.getByRole('button', { name: /add zone/i })).toBeInTheDocument()
    })

    it('shows empty state message when no zones', () => {
      renderStep()
      expect(screen.getByText(/no inspection zones added/i)).toBeInTheDocument()
    })

    it('shows instruction to click Add Zone', () => {
      renderStep()
      expect(screen.getByText(/click "add zone" to create your first zone/i)).toBeInTheDocument()
    })
  })

  describe('add zone', () => {
    it('adds a zone when clicking Add Zone', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument()
      })
    })

    it('hides empty state after adding zone', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.queryByText(/no inspection zones added/i)).not.toBeInTheDocument()
      })
    })

    it('shows default Face value of Top', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByText(/Zone 1 - Top/i)).toBeInTheDocument()
      })
    })

    it('can add multiple zones', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByText(/Zone 1 - Top/i)).toBeInTheDocument()
        expect(screen.getByText(/Zone 2 - Top/i)).toBeInTheDocument()
      })
    })
  })

  describe('zone fields', () => {
    it('renders Zone Name field', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument()
      })
    })

    it('renders Face selector', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^Face$/i)).toBeInTheDocument()
      })
    })

    it('renders Zone Depth field', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Depth.*mm/i)).toBeInTheDocument()
      })
    })

    it('renders Zone Offset field', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Offset.*mm/i)).toBeInTheDocument()
      })
    })

    it('renders Required Coverage field', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Required Coverage/i)).toBeInTheDocument()
      })
    })

    it('renders Min Pixels Per Feature field', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Min Pixels Per Feature/i)).toBeInTheDocument()
      })
    })
  })

  describe('remove zone', () => {
    it('removes zone when clicking remove button (no name)', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      // Find and click the remove button (trash icon)
      const removeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg.lucide-trash2')
      )
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/no inspection zones added/i)).toBeInTheDocument()
      })
    })

    it('shows confirmation when zone has name', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Zone Name/i), 'My Zone')

      // Wait for the value to be updated
      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Name/i)).toHaveValue('My Zone')
      })

      const removeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg.lucide-trash2')
      )
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          expect.stringContaining('My Zone')
        )
      })
    })

    it('does not remove zone if confirmation cancelled', async () => {
      mockConfirm.mockReturnValue(false)
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Zone Name/i), 'My Zone')

      // Wait for the value to be updated
      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Name/i)).toHaveValue('My Zone')
      })

      const removeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg.lucide-trash2')
      )
      await user.click(removeButtons[0])

      // Zone should still be there since confirm returned false
      await waitFor(() => {
        // Check header shows our zone is still present
        expect(screen.getByText(/My Zone - Top/i)).toBeInTheDocument()
      })
    })
  })

  describe('collapsible zones', () => {
    it('can collapse zone card', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      // Click on the header to collapse
      await user.click(screen.getByText(/Zone 1 - Top/i))

      await waitFor(() => {
        expect(screen.queryByLabelText(/Zone Name/i)).not.toBeInTheDocument()
      })
    })

    it('can expand collapsed zone card', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      // Collapse
      await user.click(screen.getByText(/Zone 1 - Top/i))
      await waitFor(() => expect(screen.queryByLabelText(/Zone Name/i)).not.toBeInTheDocument())

      // Expand
      await user.click(screen.getByText(/Zone 1 - Top/i))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())
    })

    it('shows zone name in header when provided', async () => {
      const user = userEvent.setup()
      renderStep()

      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Zone Name/i), 'Top Surface')

      // Zone name should appear in header
      await waitFor(() => {
        expect(screen.getByText(/Top Surface - Top/i)).toBeInTheDocument()
      })
    })
  })
})
