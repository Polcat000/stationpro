// src/components/wizards/steps/StepFixedFocalLens.tsx
// Fixed Focal Length Lens Step 3: Type-specific fields
// Per AC-2.6.3: FormDescription for guided field explanations

import { useFormContext } from 'react-hook-form'
import type { FixedFocalLengthLensFormInput } from '@/lib/schemas/component'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function StepFixedFocalLens() {
  const form = useFormContext<FixedFocalLengthLensFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="FocalLength_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Focal Length (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 25, 50, 75"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Lens focal length in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="WorkingDistanceMin_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Working Distance (mm)</FormLabel>
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
              Minimum object distance (MOD) in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
