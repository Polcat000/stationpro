// src/components/import/__tests__/PartManualEntryModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PartManualEntryModal } from '../PartManualEntryModal'
import { partsRepository } from '@/lib/repositories/partsRepository'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('PartManualEntryModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()
  let queryClient: QueryClient

  beforeEach(async () => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    await partsRepository.clear()
  })

  const renderModal = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PartManualEntryModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          {...props}
        />
      </QueryClientProvider>
    )
  }

  describe('rendering', () => {
    it('renders dialog when open', () => {
      renderModal()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      renderModal({ open: false })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders modal title', () => {
      renderModal()
      expect(screen.getByText('Add Part Manually')).toBeInTheDocument()
    })

    it('renders modal description', () => {
      renderModal()
      expect(screen.getByText(/enter part details using the guided wizard/i)).toBeInTheDocument()
    })

    it('renders wizard on step 1', () => {
      renderModal()
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    })

    it('renders Part Callout field', () => {
      renderModal()
      expect(screen.getByLabelText(/Part Callout/i)).toBeInTheDocument()
    })
  })

  describe('happy path: complete wizard and save', () => {
    const fillWizardAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
      // Step 1: Basic Info
      await user.type(screen.getByLabelText(/Part Callout/i), 'MANUAL-001')
      await user.type(screen.getByLabelText(/Part Series/i), 'Test Series')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      // Step 2: Dimensions
      await user.type(screen.getByLabelText(/Width.*mm/i), '15')
      await user.type(screen.getByLabelText(/Height.*mm/i), '10')
      await user.type(screen.getByLabelText(/Length.*mm/i), '25')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 3 of 4')).toBeInTheDocument())

      // Step 3: Features
      await user.type(screen.getByLabelText(/Smallest Lateral Feature.*µm/i), '50')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 4 of 4')).toBeInTheDocument())

      // Step 4: Zones
      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())
      await user.type(screen.getByLabelText(/Zone Name/i), 'Top Surface')

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('saves part to repository', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillWizardAndSave(user)

      await waitFor(async () => {
        const parts = await partsRepository.getAll()
        expect(parts).toHaveLength(1)
        expect(parts[0].PartCallout).toBe('MANUAL-001')
      })
    })

    it('shows success toast after save', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillWizardAndSave(user)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('MANUAL-001')
        )
      })
    })

    it('closes modal after successful save', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillWizardAndSave(user)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('calls onSuccess callback after save', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillWizardAndSave(user)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('invalidates parts query cache after save', async () => {
      const user = userEvent.setup()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      renderModal()

      await fillWizardAndSave(user)

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parts'] })
      })
    })

    it('saves part with all required fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillWizardAndSave(user)

      await waitFor(async () => {
        const parts = await partsRepository.getAll()
        expect(parts[0]).toMatchObject({
          PartCallout: 'MANUAL-001',
          PartSeries: 'Test Series',
          PartWidth_mm: 15,
          PartHeight_mm: 10,
          PartLength_mm: 25,
          SmallestLateralFeature_um: 50,
          InspectionZones: expect.arrayContaining([
            expect.objectContaining({
              Name: 'Top Surface',
              Face: 'Top',
            }),
          ]),
        })
      })
    })
  })

  describe('validation errors', () => {
    it('shows validation error on step 1 for empty callout', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Part callout is required/i)).toBeInTheDocument()
      })
    })

    it('shows validation error on step 2 for missing dimensions', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /next/i }))

      // Should stay on step 2 with validation errors
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    })

    it('shows validation error on step 4 for no zones', async () => {
      const user = userEvent.setup()
      renderModal()

      // Complete steps 1-3
      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Width.*mm/i), '10')
      await user.type(screen.getByLabelText(/Height.*mm/i), '5')
      await user.type(screen.getByLabelText(/Length.*mm/i), '20')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 3 of 4')).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Smallest Lateral Feature.*µm/i), '100')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 4 of 4')).toBeInTheDocument())

      // Try to save without zones
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/at least one inspection zone required/i)).toBeInTheDocument()
      })
    })
  })

  describe('cancel behavior', () => {
    it('closes modal when clicking Cancel on step 1', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('does not save data when cancelled', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Part Callout/i), 'WILL-NOT-SAVE')
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      const parts = await partsRepository.getAll()
      expect(parts).toHaveLength(0)
    })
  })

  describe('form state reset', () => {
    it('resets form when modal reopens', async () => {
      const user = userEvent.setup()
      const { rerender } = renderModal()

      // Fill in some data
      await user.type(screen.getByLabelText(/Part Callout/i), 'OLD-DATA')

      // Close modal
      rerender(
        <QueryClientProvider client={queryClient}>
          <PartManualEntryModal
            open={false}
            onOpenChange={mockOnOpenChange}
            onSuccess={mockOnSuccess}
          />
        </QueryClientProvider>
      )

      // Reopen modal
      rerender(
        <QueryClientProvider client={queryClient}>
          <PartManualEntryModal
            open={true}
            onOpenChange={mockOnOpenChange}
            onSuccess={mockOnSuccess}
          />
        </QueryClientProvider>
      )

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByLabelText(/Part Callout/i)).toHaveValue('')
      })
    })
  })

  describe('navigation', () => {
    it('Back button navigates to previous step', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /back/i }))

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      })
    })

    it('preserves data when navigating back', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Part Callout/i), 'MY-PART')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /back/i }))
      await waitFor(() => expect(screen.getByText('Step 1 of 4')).toBeInTheDocument())

      expect(screen.getByLabelText(/Part Callout/i)).toHaveValue('MY-PART')
    })
  })

  describe('zone management', () => {
    const navigateToStep4 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Width.*mm/i), '10')
      await user.type(screen.getByLabelText(/Height.*mm/i), '5')
      await user.type(screen.getByLabelText(/Length.*mm/i), '20')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 3 of 4')).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Smallest Lateral Feature.*µm/i), '100')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 4 of 4')).toBeInTheDocument())
    }

    it('can add zone and see zone fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await navigateToStep4(user)
      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^Face$/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Zone Depth.*mm/i)).toBeInTheDocument()
      })
    })

    it('zone gets auto-generated UUID', async () => {
      const user = userEvent.setup()
      renderModal()

      await navigateToStep4(user)
      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Zone Name/i), 'Test Zone')
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(async () => {
        const parts = await partsRepository.getAll()
        expect(parts[0].InspectionZones[0].ZoneID).toBeDefined()
        expect(parts[0].InspectionZones[0].ZoneID.length).toBeGreaterThan(0)
      })
    })
  })
})
