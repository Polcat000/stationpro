// src/components/wizards/steps/__tests__/StepFeatures.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { partFormSchema, type PartFormInput } from '@/lib/schemas/part'
import { StepFeatures } from '../StepFeatures'

function TestWrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<PartFormInput>({
    resolver: zodResolver(partFormSchema),
    mode: 'onChange',
    defaultValues: {
      PartCallout: 'TEST',
      PartWidth_mm: 10,
      PartHeight_mm: 5,
      PartLength_mm: 20,
      InspectionZones: [],
    },
  })

  return <FormProvider {...form}>{children}</FormProvider>
}

describe('StepFeatures', () => {
  const renderStep = () => {
    return render(
      <TestWrapper>
        <StepFeatures />
      </TestWrapper>
    )
  }

  describe('rendering', () => {
    it('renders Smallest Lateral Feature input with µm label', () => {
      renderStep()
      expect(screen.getByLabelText(/Smallest Lateral Feature.*µm/i)).toBeInTheDocument()
    })

    it('renders Smallest Depth Feature input with µm label', () => {
      renderStep()
      expect(screen.getByLabelText(/Smallest Depth Feature.*µm/i)).toBeInTheDocument()
    })

    it('renders lateral feature description', () => {
      renderStep()
      expect(screen.getByText(/smallest x\/y detail to detect/i)).toBeInTheDocument()
    })

    it('renders depth feature description mentioning optional', () => {
      renderStep()
      expect(screen.getByText(/optional for 2d-only inspection/i)).toBeInTheDocument()
    })

    it('uses grid layout on larger screens', () => {
      renderStep()
      // The outer grid container has the grid class
      const input = screen.getByLabelText(/Smallest Lateral Feature/i)
      const formItem = input.closest('[data-slot="form-item"]')
      const gridContainer = formItem?.parentElement
      expect(gridContainer).toHaveClass('grid')
    })
  })

  describe('input behavior', () => {
    it('accepts numeric input for Smallest Lateral Feature', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Smallest Lateral Feature.*µm/i)
      await user.type(input, '100')

      expect(input).toHaveValue(100)
    })

    it('accepts numeric input for Smallest Depth Feature', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Smallest Depth Feature.*µm/i)
      await user.type(input, '50')

      expect(input).toHaveValue(50)
    })

    it('shows Optional placeholder for depth feature', () => {
      renderStep()
      const input = screen.getByLabelText(/Smallest Depth Feature.*µm/i)
      expect(input).toHaveAttribute('placeholder', 'Optional')
    })

    it('uses step=0.1 for precision', () => {
      renderStep()
      const input = screen.getByLabelText(/Smallest Lateral Feature.*µm/i)
      expect(input).toHaveAttribute('step', '0.1')
    })
  })
})
