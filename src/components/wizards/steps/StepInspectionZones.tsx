import { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Plus, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Part, InspectionZone } from '@/lib/schemas/part'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { InspectionZoneFieldGroup } from '../fields/InspectionZoneFieldGroup'

function getDefaultZone(): InspectionZone {
  return {
    ZoneID: crypto.randomUUID(),
    Name: '',
    Face: 'Top',
    ZoneDepth_mm: 0.5,
    ZoneOffset_mm: 0,
    RequiredCoverage_pct: 100,
    MinPixelsPerFeature: 3,
  }
}

export function StepInspectionZones() {
  const form = useFormContext<Part>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'InspectionZones',
  })

  const [collapsedZones, setCollapsedZones] = useState<Set<number>>(new Set())

  const toggleCollapse = (index: number) => {
    setCollapsedZones((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleAddZone = () => {
    append(getDefaultZone())
  }

  const handleRemoveZone = (index: number) => {
    // Get current form value for the zone name (not stale fields array)
    const zoneName = form.getValues(`InspectionZones.${index}.Name`)
    // Show confirmation if zone has data entered
    if (zoneName) {
      const confirmed = window.confirm(
        `Remove zone "${zoneName}"? This cannot be undone.`
      )
      if (!confirmed) return
    }
    remove(index)
  }

  // Get root-level error for InspectionZones array (min 1 validation)
  const zonesError = form.formState.errors.InspectionZones?.root?.message
    ?? form.formState.errors.InspectionZones?.message

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Add inspection zones to define areas of the part to be inspected.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddZone}
        >
          <Plus className="mr-1 size-4" />
          Add Zone
        </Button>
      </div>

      {zonesError && (
        <p className="text-destructive text-sm">{String(zonesError)}</p>
      )}

      {fields.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
          <p>No inspection zones added yet.</p>
          <p className="text-sm">Click "Add Zone" to create your first zone.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const isCollapsed = collapsedZones.has(index)
            const zoneName = form.watch(`InspectionZones.${index}.Name`)
            const zoneFace = form.watch(`InspectionZones.${index}.Face`)

            return (
              <Card key={field.id}>
                <CardHeader
                  className="cursor-pointer py-3"
                  onClick={() => toggleCollapse(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {zoneName || `Zone ${index + 1}`} - {zoneFace}
                    </span>
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform',
                          isCollapsed && '-rotate-90'
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveZone(index)
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent className="pt-0">
                    <InspectionZoneFieldGroup index={index} />
                    {/* Show field-level errors for this zone */}
                    {form.formState.errors.InspectionZones?.[index] && (
                      <div className="mt-2">
                        <FormMessage />
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
