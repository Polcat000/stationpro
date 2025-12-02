// src/components/wizards/steps/StepSnapshotRange.tsx
// SnapshotSensor Step 3: Measurement range and working distance
// Per AC-2.6.3: FormDescription for guided field explanations

import { useFormContext } from 'react-hook-form'
import type { SnapshotSensorFormInput } from '@/lib/schemas/component'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function StepSnapshotRange() {
  const form = useFormContext<SnapshotSensorFormInput>()

  return (
    <div className="space-y-4">
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
                placeholder="e.g., 25"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Total Z depth coverage in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="WorkingDistance_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Working Distance (mm)</FormLabel>
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
              Distance from sensor to object plane in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
