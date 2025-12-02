// src/components/wizards/steps/StepTelecentricLens.tsx
// Telecentric Lens Step 3: Type-specific fields
// Per AC-2.6.3: FormDescription for guided field explanations

import { useFormContext } from 'react-hook-form'
import type { TelecentricLensFormInput } from '@/lib/schemas/component'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function StepTelecentricLens() {
  const form = useFormContext<TelecentricLensFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="Magnification"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Magnification</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 0.5, 1.0, 2.0"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Fixed optical magnification ratio (e.g., 0.5, 2.0)
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
                placeholder="e.g., 65"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Fixed distance to object plane in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="FieldDepth_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field Depth (mm)</FormLabel>
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
              Range that stays in focus in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
