import { useState, useCallback } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import {
  partFormSchema,
  type PartFormInput,
  type Part,
} from '@/lib/schemas/part'
import { Button } from '@/components/ui/button'
import { StepBasicInfo } from './steps/StepBasicInfo'
import { StepDimensions } from './steps/StepDimensions'
import { StepFeatures } from './steps/StepFeatures'
import { StepInspectionZones } from './steps/StepInspectionZones'

export interface PartEntryWizardProps {
  onComplete: (data: Part) => void
  onCancel: () => void
  defaultValues?: Partial<Part>
}

interface StepConfig {
  id: string
  title: string
  fields: (keyof PartFormInput)[]
  component: React.ComponentType
}

const STEPS: StepConfig[] = [
  {
    id: 'basic',
    title: 'Basic Info',
    fields: ['PartCallout', 'PartSeries'],
    component: StepBasicInfo,
  },
  {
    id: 'dimensions',
    title: 'Dimensions',
    fields: ['PartWidth_mm', 'PartHeight_mm', 'PartLength_mm'],
    component: StepDimensions,
  },
  {
    id: 'features',
    title: 'Features',
    fields: ['SmallestLateralFeature_um', 'SmallestDepthFeature_um'],
    component: StepFeatures,
  },
  {
    id: 'zones',
    title: 'Inspection Zones',
    fields: ['InspectionZones'],
    component: StepInspectionZones,
  },
]

export function PartEntryWizard({
  onComplete,
  onCancel,
  defaultValues,
}: PartEntryWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const form = useForm<PartFormInput>({
    resolver: zodResolver(partFormSchema),
    mode: 'onChange',
    defaultValues: {
      PartCallout: '',
      PartSeries: '',
      PartWidth_mm: undefined,
      PartHeight_mm: undefined,
      PartLength_mm: undefined,
      SmallestLateralFeature_um: undefined,
      SmallestDepthFeature_um: undefined,
      InspectionZones: [],
      ...defaultValues,
    },
  })

  const canProceed = useCallback(async (): Promise<boolean> => {
    const stepFields = STEPS[currentStep].fields
    const result = await form.trigger(stepFields as (keyof PartFormInput)[])
    return result
  }, [currentStep, form])

  const handleNext = useCallback(async () => {
    const valid = await canProceed()
    if (valid && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [canProceed, currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleSubmit = form.handleSubmit((data) => {
    // Apply defaults for inspection zone fields before passing to onComplete
    const partWithDefaults: Part = {
      ...data,
      InspectionZones: data.InspectionZones.map((zone) => ({
        ...zone,
        RequiredCoverage_pct: zone.RequiredCoverage_pct ?? 100,
        MinPixelsPerFeature: zone.MinPixelsPerFeature ?? 3,
      })),
    }
    onComplete(partWithDefaults)
  })

  const isLastStep = currentStep === STEPS.length - 1
  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-sm font-medium',
                  index < currentStep && 'bg-primary text-primary-foreground',
                  index === currentStep &&
                    'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  index > currentStep && 'bg-muted text-muted-foreground'
                )}
                aria-current={index === currentStep ? 'step' : undefined}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-12',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <div className="text-center">
          <h3 className="text-lg font-semibold">{STEPS[currentStep].title}</h3>
          <p className="text-muted-foreground text-sm">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          <CurrentStepComponent />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onCancel : handleBack}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          {isLastStep ? (
            <Button type="submit">Save</Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  )
}
