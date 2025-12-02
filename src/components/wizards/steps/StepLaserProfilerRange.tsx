// src/components/wizards/steps/StepLaserProfilerRange.tsx
// LaserLineProfiler Step 3: Standoff and measurement range
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

export function StepLaserProfilerRange() {
  const form = useFormContext<LaserProfilerFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="StandoffDistance_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Standoff Distance (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 100"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Distance from sensor to focal/reference plane in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="MeasurementRange_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Measurement Range (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 50"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Total Z depth coverage (near to far) in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
