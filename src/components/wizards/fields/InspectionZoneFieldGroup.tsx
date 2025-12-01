import { useFormContext } from 'react-hook-form'
import type { Part, InspectionFace } from '@/lib/schemas/part'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FACE_OPTIONS: InspectionFace[] = [
  'Top',
  'Bottom',
  'Front',
  'Back',
  'Left',
  'Right',
]

interface InspectionZoneFieldGroupProps {
  index: number
}

export function InspectionZoneFieldGroup({
  index,
}: InspectionZoneFieldGroupProps) {
  const form = useFormContext<Part>()
  const prefix = `InspectionZones.${index}` as const

  return (
    <div className="grid gap-4">
      {/* Row 1: Name and Face */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`${prefix}.Name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zone Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Top Surface" {...field} />
              </FormControl>
              <FormDescription>
                Descriptive name for this inspection zone
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${prefix}.Face`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Face</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select face" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FACE_OPTIONS.map((face) => (
                    <SelectItem key={face} value={face}>
                      {face}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Orientation of the inspection zone (Top, Bottom, Front, Back,
                Left, Right)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 2: Zone Depth and Offset */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`${prefix}.ZoneDepth_mm`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zone Depth (mm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.5"
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
                Thickness of the inspection zone in millimeters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${prefix}.ZoneOffset_mm`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zone Offset (mm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
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
                Distance from part face to center of inspection zone
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Feature Overrides (optional) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`${prefix}.SmallestLateralFeature_um`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Smallest Lateral Feature Override (µm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Inherits from part"
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
                Override smallest X/Y detail for this zone (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${prefix}.SmallestDepthFeature_um`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Smallest Depth Feature Override (µm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Inherits from part"
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
                Override smallest Z detail for this zone (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 4: Coverage and Pixels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`${prefix}.RequiredCoverage_pct`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Coverage (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="100"
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
                Percentage of zone that must be covered (0-100)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${prefix}.MinPixelsPerFeature`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Pixels Per Feature</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="3"
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
                Minimum pixels per smallest feature (default 3)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
