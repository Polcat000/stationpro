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

export function StepDimensions() {
  const form = useFormContext<Part>()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <FormField
        control={form.control}
        name="PartWidth_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Width (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
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
              X-axis dimension of the part in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="PartHeight_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Height (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
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
              Y-axis dimension of the part in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="PartLength_mm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Length (mm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
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
              Z-axis dimension (scan direction) in millimeters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
