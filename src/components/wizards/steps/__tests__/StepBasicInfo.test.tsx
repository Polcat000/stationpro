// src/components/wizards/steps/__tests__/StepBasicInfo.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { partFormSchema, type PartFormInput } from '@/lib/schemas/part'
import { StepBasicInfo } from '../StepBasicInfo'

function TestWrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<PartFormInput>({
    resolver: zodResolver(partFormSchema),
    mode: 'onChange',
    defaultValues: {
      PartCallout: '',
      PartSeries: '',
      InspectionZones: [],
    },
  })

  return <FormProvider {...form}>{children}</FormProvider>
}

describe('StepBasicInfo', () => {
  const renderStep = () => {
    return render(
      <TestWrapper>
        <StepBasicInfo />
      </TestWrapper>
    )
  }

  describe('rendering', () => {
    it('renders Part Callout input', () => {
      renderStep()
      expect(screen.getByLabelText(/Part Callout/i)).toBeInTheDocument()
    })

    it('renders Part Series input', () => {
      renderStep()
      expect(screen.getByLabelText(/Part Series/i)).toBeInTheDocument()
    })

    it('renders Part Callout description', () => {
      renderStep()
      expect(screen.getByText(/unique identifier for this part/i)).toBeInTheDocument()
    })

    it('renders Part Series description', () => {
      renderStep()
      expect(screen.getByText(/optional product series for grouping/i)).toBeInTheDocument()
    })

    it('renders Part Callout placeholder', () => {
      renderStep()
      expect(screen.getByPlaceholderText(/PART-001/i)).toBeInTheDocument()
    })

    it('renders Part Series placeholder', () => {
      renderStep()
      expect(screen.getByPlaceholderText(/USB-C Connectors/i)).toBeInTheDocument()
    })
  })

  describe('input behavior', () => {
    it('accepts text input for Part Callout', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Part Callout/i)
      await user.type(input, 'TEST-123')

      expect(input).toHaveValue('TEST-123')
    })

    it('accepts text input for Part Series', async () => {
      const user = userEvent.setup()
      renderStep()

      const input = screen.getByLabelText(/Part Series/i)
      await user.type(input, 'Connectors')

      expect(input).toHaveValue('Connectors')
    })
  })
})
