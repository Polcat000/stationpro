// src/components/wizards/steps/StepCameraResolution.tsx
// Camera Step 2: Resolution and pixel size
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

export function StepCameraResolution() {
  const form = useFormContext<ComponentFormInput>()
  const componentType = form.watch('componentType')
  const isAreascan = componentType === 'AreascanCamera'

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="ResolutionHorizontal_px"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horizontal Resolution (px)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="1"
                placeholder="e.g., 4096"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Horizontal pixel count
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Only show vertical resolution for Areascan cameras */}
      {isAreascan && (
        <FormField
          control={form.control}
          name="ResolutionVertical_px"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vertical Resolution (px)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  placeholder="e.g., 3072"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                />
              </FormControl>
              <FormDescription>
                Vertical pixel count
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="PixelSizeHorizontal_um"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pixel Size Horizontal (um)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 5.5"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Width of each pixel in micrometers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="PixelSizeVertical_um"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pixel Size Vertical (um)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 5.5"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Height of each pixel in micrometers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
