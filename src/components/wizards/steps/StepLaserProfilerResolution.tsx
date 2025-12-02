// src/components/wizards/steps/StepLaserProfilerResolution.tsx
// LaserLineProfiler Step 4: Resolution and scan rate
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

export function StepLaserProfilerResolution() {
  const form = useFormContext<LaserProfilerFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="PointsPerProfile"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Points Per Profile</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="1"
                placeholder="e.g., 1280"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Data points captured per scan line
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="LateralResolution_um"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lateral Resolution (um)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 27.3"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              X-axis resolution at mid-field in micrometers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="VerticalResolution_um"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vertical Resolution (um)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 3.9"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Z-axis resolution in micrometers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="MaxScanRate_kHz"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Scan Rate (kHz)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 5"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Maximum profiles per second (thousands)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
