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

export function StepBasicInfo() {
  const form = useFormContext<Part>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="PartCallout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Part Callout</FormLabel>
            <FormControl>
              <Input placeholder="e.g., PART-001" {...field} />
            </FormControl>
            <FormDescription>
              Unique identifier for this part in your system
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="PartSeries"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Part Series</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., USB-C Connectors"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>
              Optional product series for grouping parts (e.g., USB-C
              Connectors)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
