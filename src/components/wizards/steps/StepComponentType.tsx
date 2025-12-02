// src/components/wizards/steps/StepComponentType.tsx
// Step 1: Component type selection and base info
// Per AC-2.6.1: Type selector with 5 options
// Per AC-2.6.3: FormDescription for guided field explanations

import { useFormContext } from 'react-hook-form'
import type { ComponentFormInput, ComponentTypeOption } from '@/lib/schemas/component'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const COMPONENT_TYPE_OPTIONS: { value: ComponentTypeOption; label: string }[] = [
  { value: 'LaserLineProfiler', label: 'Laser Line Profiler' },
  { value: 'LinescanCamera', label: 'Linescan Camera' },
  { value: 'AreascanCamera', label: 'Areascan Camera' },
  { value: 'Lens', label: 'Lens' },
  { value: 'SnapshotSensor', label: 'Snapshot Sensor' },
]

const LENS_TYPE_OPTIONS = [
  { value: 'Telecentric', label: 'Telecentric' },
  { value: 'FixedFocalLength', label: 'Fixed Focal Length' },
]

export interface StepComponentTypeProps {
  /** When true, type selection is disabled (edit mode) */
  isEditMode?: boolean
}

export function StepComponentType({ isEditMode = false }: StepComponentTypeProps) {
  const form = useFormContext<ComponentFormInput>()
  const componentType = form.watch('componentType')

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="componentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Component Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
              <FormControl>
                <SelectTrigger disabled={isEditMode}>
                  <SelectValue placeholder="Select component type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COMPONENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {isEditMode
                ? 'Component type cannot be changed when editing'
                : 'Select the type of component you want to add'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Show LensType selector when component type is Lens */}
      {componentType === 'Lens' && (
        <FormField
          control={form.control}
          name="LensType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lens Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                <FormControl>
                  <SelectTrigger disabled={isEditMode}>
                    <SelectValue placeholder="Select lens type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LENS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {isEditMode
                  ? 'Lens type cannot be changed when editing'
                  : 'Telecentric lenses provide constant magnification; Fixed focal length lenses have variable magnification based on distance'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="componentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Component ID</FormLabel>
            <FormControl>
              <Input placeholder="e.g., LMI-G2-500" {...field} />
            </FormControl>
            <FormDescription>
              Unique identifier for this component in your system
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="Manufacturer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Manufacturer</FormLabel>
            <FormControl>
              <Input placeholder="e.g., LMI Technologies, Keyence" {...field} />
            </FormControl>
            <FormDescription>
              Vendor or brand name (e.g., LMI Technologies, Keyence)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="Model"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Model</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Gocator 2512" {...field} />
            </FormControl>
            <FormDescription>
              Model number or name from the spec sheet
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="PartNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Part Number (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., G2-512-12345"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>
              Manufacturer part number for ordering
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
