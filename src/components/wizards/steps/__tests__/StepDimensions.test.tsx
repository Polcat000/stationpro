// src/components/wizards/steps/__tests__/StepDimensions.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { partFormSchema, type PartFormInput } from '@/lib/schemas/part'
import { StepDimensions } from '../StepDimensions'

function TestWrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<PartFormInput>({
    resolver: zodResolver(partFormSchema),
    mode: 'onChange',
    defaultValues: {
      PartCallout: 'TEST',
      InspectionZones: [],
    },
  })

  return <FormProvider {...form}>{children}</FormProvider>
}

describe('StepDimensions', () => {
  const renderStep = () => {
    return render(
      <TestWrapper>
        <StepDimensions />
      </TestWrapper>
    )
  }

  describe('rendering', () => {
    it('renders Width input with mm label', () => {
      renderStep()
      expect(screen.getByLabelText(/Width.*mm/i)).toBeInTheDocument()
    })

    it('renders Height input with mm label', () => {
      renderStep()
      expect(screen.getByLabelText(/Height.*mm/i)).toBeInTheDocument()
    })

    it('renders Length input with mm label', () => {
      renderStep()
      expect(screen.getByLabelText(/Length.*mm/i)).toBeInTheDocument()
    })

    it('renders Width description about X-axis', () => {
      renderStep()
      expect(screen.getByText(/x-axis dimension/i)).toBeInTheDocument()
    })

    it('renders Height description about Y-axis', () => {
      renderStep()
      expect(screen.getByText(/y-axis dimension/i)).toBeInTheDocument()
    })

    it('renders Length description about Z-axis', () => {
      renderStep()
      expect(screen.getByText(/z-axis dimension.*scan direction/i)).toBeInTheDocument()
    })

    it('uses grid layout on larger screens', () => {
      renderStep()
      // The outer grid container has the grid class
      const input = screen.getByLabelText(/Width.*mm/i)
      const formItem = input.closest('[data-slot="form-item"]')
      const gridContainer = formItem?.parentElement
      expect(gridContainer).toHaveClass('grid')
    })
  })

  describe('input behavior', () => {
    it('accepts numeric input for Width', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Width.*mm/i)
      await user.type(input, '10.5')

      expect(input).toHaveValue(10.5)
    })

    it('accepts numeric input for Height', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Height.*mm/i)
      await user.type(input, '5.25')

      expect(input).toHaveValue(5.25)
    })

    it('accepts numeric input for Length', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Length.*mm/i)
      await user.type(input, '20')

      expect(input).toHaveValue(20)
    })

    it('uses number input type', () => {
      renderStep()
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(3)
    })

    it('uses step=0.01 for precision', () => {
      renderStep()
      const input = screen.getByLabelText(/Width.*mm/i)
      expect(input).toHaveAttribute('step', '0.01')
    })
  })

  describe('validation', () => {
    it('shows error for negative width after blur', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Width.*mm/i)
      await user.type(input, '-5')
      // Tab away to trigger blur/validation
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument()
      })
    })
  })
})
