// src/components/wizards/steps/StepSnapshotFOV.tsx
// SnapshotSensor Step 2: Field of View and data interval
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

export function StepSnapshotFOV() {
  const form = useFormContext<SnapshotSensorFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="FOV_X_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>FOV X (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 60"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Horizontal field of view in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="FOV_Y_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>FOV Y (mm)</FormLabel>
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
              Vertical field of view in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="XYDataInterval_um"
        render={({ field }) => (
          <FormItem>
            <FormLabel>XY Data Interval (um)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 10"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Spacing between XY measurement points in micrometers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
