import { useFormContext } from 'react-hook-form'
import type { Part } from '@/lib/schemas/part'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export function StepFeatures() {
  const form = useFormContext<Part>()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="SmallestLateralFeature_um"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Smallest Lateral Feature (µm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="0.0"
                {...field}
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
              />
            </FormControl>
            <FormDescription>
              Smallest X/Y detail to detect in micrometers. Determines
              resolution requirements.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="SmallestDepthFeature_um"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Smallest Depth Feature (µm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                placeholder="Optional"
                {...field}
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
              />
            </FormControl>
            <FormDescription>
              Smallest Z detail to detect in micrometers (optional for 2D-only
              inspection)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
