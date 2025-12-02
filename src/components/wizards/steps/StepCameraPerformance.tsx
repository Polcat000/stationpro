// src/components/wizards/steps/StepCameraPerformance.tsx
// Camera Step 3: Performance fields (frame/line rate, lens mount)
// Per AC-2.6.3: FormDescription for guided field explanations
// Handles both LinescanCamera and AreascanCamera

import { useFormContext } from 'react-hook-form'
import type { ComponentFormInput } from '@/lib/schemas/component'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function StepCameraPerformance() {
  const form = useFormContext<ComponentFormInput>()
  const componentType = form.watch('componentType')
  const isLinescan = componentType === 'LinescanCamera'

  return (
    <div className="space-y-4">
      {isLinescan ? (
        <FormField
          control={form.control}
          name="LineRate_kHz"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Line Rate (kHz)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 140"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>
                Maximum lines per second (thousands)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="FrameRate_fps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frame Rate (fps)</FormLabel>
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
                Maximum frames per second
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="LensMount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lens Mount</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., C, CS, F, M42, M72"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>
              Physical mount type (C, CS, F, M42, M72, etc.)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
