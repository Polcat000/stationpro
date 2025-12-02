// src/components/wizards/steps/StepLensBase.tsx
// Lens Step 2: Base lens fields (mount, sensor size, aperture)
// Per AC-2.6.3: FormDescription for guided field explanations

import { useFormContext } from 'react-hook-form'
import type { LensFormInput } from '@/lib/schemas/component'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function StepLensBase() {
  const form = useFormContext<LensFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="Mount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mount</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., C, CS, F, M42, M58, M72, V48, V70"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>
              Lens mount type (C, CS, F, M42, M58, M72, V48, V70)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="MaxSensorSize_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Sensor Size (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 11"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Maximum compatible sensor diagonal in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ApertureMin_fnum"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Aperture (f-number)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 2.8"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Widest aperture (smallest f-number)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ApertureMax_fnum"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Aperture (f-number)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 16"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Smallest aperture (largest f-number)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
