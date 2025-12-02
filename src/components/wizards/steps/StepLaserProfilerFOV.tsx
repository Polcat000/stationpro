// src/components/wizards/steps/StepLaserProfilerFOV.tsx
// LaserLineProfiler Step 2: Field of View fields
// Per AC-2.6.3: FormDescription for guided field explanations

import { useFormContext } from 'react-hook-form'
import type { LaserProfilerFormInput } from '@/lib/schemas/component'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function StepLaserProfilerFOV() {
  const form = useFormContext<LaserProfilerFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="NearFieldLateralFOV_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Near Field Lateral FOV (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 25"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Field of view at near standoff distance in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="MidFieldLateralFOV_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mid Field Lateral FOV (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 35"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Field of view at reference/focal plane in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="FarFieldLateralFOV_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Far Field Lateral FOV (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 45"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Field of view at far standoff distance in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
