// src/components/wizards/ComponentEntryWizard.tsx
// Multi-step wizard for manual component entry
// Per AC-2.6.1: Dynamic steps based on componentType
// Per AC-2.6.2: Type-specific validation with Zod schemas

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import {
  getComponentFormSchema,
  type ComponentTypeOption,
  type ComponentFormInput,
  type Component,
  type LensType,
  type LinescanCamera,
} from '@/lib/schemas/component'
import { Button } from '@/components/ui/button'
import { StepComponentType } from './steps/StepComponentType'
import { StepLaserProfilerFOV } from './steps/StepLaserProfilerFOV'
import { StepLaserProfilerRange } from './steps/StepLaserProfilerRange'
import { StepLaserProfilerResolution } from './steps/StepLaserProfilerResolution'
import { StepCameraResolution } from './steps/StepCameraResolution'
import { StepCameraPerformance } from './steps/StepCameraPerformance'
import { StepLensBase } from './steps/StepLensBase'
import { StepTelecentricLens } from './steps/StepTelecentricLens'
import { StepFixedFocalLens } from './steps/StepFixedFocalLens'
import { StepSnapshotFOV } from './steps/StepSnapshotFOV'
import { StepSnapshotRange } from './steps/StepSnapshotRange'

export interface ComponentEntryWizardProps {
  onComplete: (data: Component) => void
  onCancel: () => void
  defaultValues?: Partial<Component>
  /** When true, type selection is disabled (edit mode) */
  isEditMode?: boolean
}

interface StepConfig {
  id: string
  title: string
  fields: string[]
  component: React.ComponentType
}

// Base fields for step 1 (all component types)
const BASE_FIELDS = ['componentType', 'componentId', 'Manufacturer', 'Model', 'PartNumber']

// Step configurations per component type
const COMPONENT_TYPE_CONFIGS: Record<ComponentTypeOption, StepConfig[]> = {
  LaserLineProfiler: [
    { id: 'type', title: 'Component Info', fields: BASE_FIELDS, component: StepComponentType },
    { id: 'fov', title: 'Field of View', fields: ['NearFieldLateralFOV_mm', 'MidFieldLateralFOV_mm', 'FarFieldLateralFOV_mm'], component: StepLaserProfilerFOV },
    { id: 'range', title: 'Range', fields: ['StandoffDistance_mm', 'MeasurementRange_mm'], component: StepLaserProfilerRange },
    { id: 'resolution', title: 'Resolution', fields: ['PointsPerProfile', 'LateralResolution_um', 'VerticalResolution_um', 'MaxScanRate_kHz'], component: StepLaserProfilerResolution },
  ],
  LinescanCamera: [
    { id: 'type', title: 'Component Info', fields: BASE_FIELDS, component: StepComponentType },
    { id: 'resolution', title: 'Resolution', fields: ['ResolutionHorizontal_px', 'PixelSizeHorizontal_um', 'PixelSizeVertical_um'], component: StepCameraResolution },
    { id: 'performance', title: 'Performance', fields: ['LineRate_kHz', 'LensMount'], component: StepCameraPerformance },
  ],
  AreascanCamera: [
    { id: 'type', title: 'Component Info', fields: BASE_FIELDS, component: StepComponentType },
    { id: 'resolution', title: 'Resolution', fields: ['ResolutionHorizontal_px', 'ResolutionVertical_px', 'PixelSizeHorizontal_um', 'PixelSizeVertical_um'], component: StepCameraResolution },
    { id: 'performance', title: 'Performance', fields: ['FrameRate_fps', 'LensMount'], component: StepCameraPerformance },
  ],
  Lens: [
    { id: 'type', title: 'Component Info', fields: [...BASE_FIELDS, 'LensType'], component: StepComponentType },
    { id: 'base', title: 'Lens Base', fields: ['Mount', 'MaxSensorSize_mm', 'ApertureMin_fnum', 'ApertureMax_fnum'], component: StepLensBase },
    // Third step depends on LensType - handled dynamically
    { id: 'specific', title: 'Lens Details', fields: [], component: StepTelecentricLens },
  ],
  SnapshotSensor: [
    { id: 'type', title: 'Component Info', fields: BASE_FIELDS, component: StepComponentType },
    { id: 'fov', title: 'Field of View', fields: ['FOV_X_mm', 'FOV_Y_mm', 'XYDataInterval_um'], component: StepSnapshotFOV },
    { id: 'range', title: 'Range', fields: ['MeasurementRange_mm', 'WorkingDistance_mm'], component: StepSnapshotRange },
  ],
}

// Fields specific to each lens type
const TELECENTRIC_FIELDS = ['Magnification', 'WorkingDistance_mm', 'FieldDepth_mm']
const FIXED_FOCAL_FIELDS = ['FocalLength_mm', 'WorkingDistanceMin_mm']

export function ComponentEntryWizard({
  onComplete,
  onCancel,
  defaultValues,
  isEditMode = false,
}: ComponentEntryWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [componentType, setComponentType] = useState<ComponentTypeOption>(
    (defaultValues?.componentType as ComponentTypeOption) || 'LaserLineProfiler'
  )
  const [lensType, setLensType] = useState<LensType>(
    (defaultValues as { LensType?: LensType })?.LensType || 'Telecentric'
  )

  // Get current schema based on type
  const currentSchema = useMemo(
    () => getComponentFormSchema(componentType, lensType),
    [componentType, lensType]
  )

  // Get steps for current component type
  const steps = useMemo(() => {
    const config = [...COMPONENT_TYPE_CONFIGS[componentType]]
    // For Lens type, update the third step based on LensType
    if (componentType === 'Lens') {
      config[2] = {
        ...config[2],
        fields: lensType === 'Telecentric' ? TELECENTRIC_FIELDS : FIXED_FOCAL_FIELDS,
        component: lensType === 'Telecentric' ? StepTelecentricLens : StepFixedFocalLens,
        title: lensType === 'Telecentric' ? 'Telecentric Details' : 'Fixed Focal Details',
      }
    }
    return config
  }, [componentType, lensType])

  const form = useForm<ComponentFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(currentSchema as any),
    mode: 'onChange',
    defaultValues: {
      componentType: componentType,
      componentId: '',
      Manufacturer: '',
      Model: '',
      PartNumber: '',
      ...defaultValues,
    } as ComponentFormInput,
  })

  // Watch for component type and lens type changes
  const watchedComponentType = form.watch('componentType') as ComponentTypeOption
  const watchedLensType = form.watch('LensType') as LensType | undefined

  // Handle component type change - reset type-specific fields
  useEffect(() => {
    if (watchedComponentType && watchedComponentType !== componentType) {
      // Save base field values
      const baseValues = {
        componentId: form.getValues('componentId'),
        Manufacturer: form.getValues('Manufacturer'),
        Model: form.getValues('Model'),
        PartNumber: form.getValues('PartNumber'),
      }

      setComponentType(watchedComponentType)
      setCurrentStep(0) // Reset to first step

      // Reset form with new type and preserved base fields
      form.reset({
        componentType: watchedComponentType,
        ...baseValues,
      } as ComponentFormInput)
    }
  }, [watchedComponentType, componentType, form])

  // Handle lens type change
  useEffect(() => {
    if (componentType === 'Lens' && watchedLensType && watchedLensType !== lensType) {
      setLensType(watchedLensType)
    }
  }, [watchedLensType, lensType, componentType])

  const canProceed = useCallback(async (): Promise<boolean> => {
    const stepFields = steps[currentStep].fields
    const result = await form.trigger(stepFields as (keyof ComponentFormInput)[])
    return result
  }, [currentStep, form, steps])

  const handleNext = useCallback(async () => {
    const valid = await canProceed()
    if (valid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [canProceed, currentStep, steps.length])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleSubmit = form.handleSubmit((data) => {
    // Apply defaults for LinescanCamera ResolutionVertical_px
    let componentWithDefaults: Component = data as unknown as Component

    if (data.componentType === 'LinescanCamera') {
      componentWithDefaults = {
        ...(data as unknown as LinescanCamera),
        ResolutionVertical_px: 1, // Linescan always has 1 vertical pixel
      } as LinescanCamera
    }

    onComplete(componentWithDefaults)
  })

  const isLastStep = currentStep === steps.length - 1
  const CurrentStepComponent = steps[currentStep].component

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
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
              {index < steps.length - 1 && (
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
          <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
          <p className="text-muted-foreground text-sm">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {steps[currentStep].id === 'type' ? (
            <StepComponentType isEditMode={isEditMode} />
          ) : (
            <CurrentStepComponent />
          )}
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
