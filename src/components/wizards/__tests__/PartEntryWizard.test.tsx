// src/components/wizards/__tests__/PartEntryWizard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PartEntryWizard } from '../PartEntryWizard'

describe('PartEntryWizard', () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWizard = (props = {}) => {
    return render(
      <PartEntryWizard
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        {...props}
      />
    )
  }

  describe('rendering', () => {
    it('renders step indicator with 4 steps', () => {
      renderWizard()
      const stepIndicators = screen.getAllByRole('generic').filter(
        (el) => el.textContent?.match(/^[1-4]$/)
      )
      expect(stepIndicators.length).toBeGreaterThanOrEqual(4)
    })

    it('starts on step 1', () => {
      renderWizard()
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    })

    it('shows Basic Info title on step 1', () => {
      renderWizard()
      expect(screen.getByText('Basic Info')).toBeInTheDocument()
    })

    it('renders Part Callout field on step 1', () => {
      renderWizard()
      expect(screen.getByLabelText(/Part Callout/i)).toBeInTheDocument()
    })

    it('renders Part Series field on step 1', () => {
      renderWizard()
      expect(screen.getByLabelText(/Part Series/i)).toBeInTheDocument()
    })

    it('shows Cancel button on step 1', () => {
      renderWizard()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows Next button on step 1', () => {
      renderWizard()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })
  })

  describe('step 1 validation', () => {
    it('prevents advancing without Part Callout', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Part callout is required/i)).toBeInTheDocument()
      })
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    })

    it('advances to step 2 with valid Part Callout', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST-001')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
      })
    })
  })

  describe('step 2 (Dimensions)', () => {
    const goToStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST-001')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
      })
    }

    it('shows Dimensions title', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep2(user)

      expect(screen.getByText('Dimensions')).toBeInTheDocument()
    })

    it('renders Width field with mm unit', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep2(user)

      expect(screen.getByLabelText(/Width.*mm/i)).toBeInTheDocument()
    })

    it('renders Height field with mm unit', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep2(user)

      expect(screen.getByLabelText(/Height.*mm/i)).toBeInTheDocument()
    })

    it('renders Length field with mm unit', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep2(user)

      expect(screen.getByLabelText(/Length.*mm/i)).toBeInTheDocument()
    })

    it('shows Back button on step 2', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep2(user)

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('validates positive numbers for dimensions', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep2(user)

      const widthInput = screen.getByLabelText(/Width.*mm/i)
      await user.clear(widthInput)
      await user.type(widthInput, '-5')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument()
      })
    })

    it('prevents advancing without required dimensions', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep2(user)

      await user.click(screen.getByRole('button', { name: /next/i }))

      // Should stay on step 2 (doesn't advance)
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
        expect(screen.getByText('Dimensions')).toBeInTheDocument()
      })
    })
  })

  describe('step 3 (Features)', () => {
    const goToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST-001')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Width.*mm/i), '10')
      await user.type(screen.getByLabelText(/Height.*mm/i), '5')
      await user.type(screen.getByLabelText(/Length.*mm/i), '20')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 3 of 4')).toBeInTheDocument())
    }

    it('shows Features title', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep3(user)

      expect(screen.getByText('Features')).toBeInTheDocument()
    })

    it('renders Smallest Lateral Feature field with µm unit', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep3(user)

      expect(screen.getByLabelText(/Smallest Lateral Feature.*µm/i)).toBeInTheDocument()
    })

    it('renders Smallest Depth Feature field (optional)', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep3(user)

      expect(screen.getByLabelText(/Smallest Depth Feature.*µm/i)).toBeInTheDocument()
    })
  })

  describe('step 4 (Inspection Zones)', () => {
    const goToStep4 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST-001')
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

    it('shows Inspection Zones title', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep4(user)

      expect(screen.getByText('Inspection Zones')).toBeInTheDocument()
    })

    it('shows Add Zone button', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep4(user)

      expect(screen.getByRole('button', { name: /add zone/i })).toBeInTheDocument()
    })

    it('shows Save button instead of Next on step 4', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep4(user)

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument()
    })

    it('shows empty state message when no zones', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep4(user)

      expect(screen.getByText(/no inspection zones added/i)).toBeInTheDocument()
    })

    it('adds a zone when clicking Add Zone', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep4(user)

      await user.click(screen.getByRole('button', { name: /add zone/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument()
      })
    })

    it('validates at least one zone is required', async () => {
      const user = userEvent.setup()
      renderWizard()
      await goToStep4(user)

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/at least one inspection zone required/i)).toBeInTheDocument()
      })
    })
  })

  describe('navigation', () => {
    it('Back button returns to previous step', async () => {
      const user = userEvent.setup()
      renderWizard()

      // Go to step 2
      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST-001')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      // Go back
      await user.click(screen.getByRole('button', { name: /back/i }))

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      })
    })

    it('preserves form values when navigating back', async () => {
      const user = userEvent.setup()
      renderWizard()

      // Enter data on step 1
      await user.type(screen.getByLabelText(/Part Callout/i), 'MY-PART')
      await user.type(screen.getByLabelText(/Part Series/i), 'MY-SERIES')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      // Go back
      await user.click(screen.getByRole('button', { name: /back/i }))
      await waitFor(() => expect(screen.getByText('Step 1 of 4')).toBeInTheDocument())

      // Values should be preserved
      expect(screen.getByLabelText(/Part Callout/i)).toHaveValue('MY-PART')
      expect(screen.getByLabelText(/Part Series/i)).toHaveValue('MY-SERIES')
    })

    it('Cancel button on step 1 calls onCancel', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      // Step 1
      await user.type(screen.getByLabelText(/Part Callout/i), 'TEST-PART-001')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 2 of 4')).toBeInTheDocument())

      // Step 2
      await user.type(screen.getByLabelText(/Width.*mm/i), '10')
      await user.type(screen.getByLabelText(/Height.*mm/i), '5')
      await user.type(screen.getByLabelText(/Length.*mm/i), '20')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 3 of 4')).toBeInTheDocument())

      // Step 3
      await user.type(screen.getByLabelText(/Smallest Lateral Feature.*µm/i), '100')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Step 4 of 4')).toBeInTheDocument())

      // Step 4 - Add a zone
      await user.click(screen.getByRole('button', { name: /add zone/i }))
      await waitFor(() => expect(screen.getByLabelText(/Zone Name/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Zone Name/i), 'Top Surface')

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('calls onComplete with valid Part object', async () => {
      const user = userEvent.setup()
      renderWizard()

      await fillAndSubmit(user)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            PartCallout: 'TEST-PART-001',
            PartWidth_mm: 10,
            PartHeight_mm: 5,
            PartLength_mm: 20,
            SmallestLateralFeature_um: 100,
            InspectionZones: expect.arrayContaining([
              expect.objectContaining({
                Name: 'Top Surface',
                Face: 'Top',
              }),
            ]),
          })
        )
      })
    })

    it('includes auto-generated ZoneID in zone', async () => {
      const user = userEvent.setup()
      renderWizard()

      await fillAndSubmit(user)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
        const call = mockOnComplete.mock.calls[0][0]
        expect(call.InspectionZones[0].ZoneID).toBeDefined()
        expect(typeof call.InspectionZones[0].ZoneID).toBe('string')
      })
    })
  })

  describe('FormDescription contextual help', () => {
    it('shows description for Part Callout', () => {
      renderWizard()
      expect(screen.getByText(/unique identifier for this part/i)).toBeInTheDocument()
    })

    it('shows description for Part Series', () => {
      renderWizard()
      expect(screen.getByText(/optional product series for grouping/i)).toBeInTheDocument()
    })
  })
})
