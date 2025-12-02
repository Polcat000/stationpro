// src/components/parts/PartDetailPanel.tsx
// Detail side panel for part info (AC 2.7.4)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { Edit, Trash2 } from 'lucide-react'
import type { Part } from '@/lib/schemas/part'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface PartDetailPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part: Part | null
  onEdit: () => void
  onDelete: () => void
}

export function PartDetailPanel({
  open,
  onOpenChange,
  part,
  onEdit,
  onDelete,
}: PartDetailPanelProps) {
  if (!part) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="text-xl">{part.PartCallout}</SheetTitle>
          {part.PartSeries && (
            <p className="text-sm text-muted-foreground">Series: {part.PartSeries}</p>
          )}
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 overflow-y-auto px-5">
          {/* Dimensions Section */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Dimensions
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <DataItem label="Width" value={`${part.PartWidth_mm} mm`} />
              <DataItem label="Height" value={`${part.PartHeight_mm} mm`} />
              <DataItem label="Length" value={`${part.PartLength_mm} mm`} />
            </div>
          </section>

          {/* Features Section */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Feature Sizes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <DataItem
                label="Smallest Lateral"
                value={`${part.SmallestLateralFeature_um} \u03BCm`}
              />
              {part.SmallestDepthFeature_um && (
                <DataItem
                  label="Smallest Depth"
                  value={`${part.SmallestDepthFeature_um} \u03BCm`}
                />
              )}
            </div>
          </section>

          {/* Inspection Zones Section */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Inspection Zones ({part.InspectionZones.length})
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {part.InspectionZones.map((zone, index) => (
                <AccordionItem key={zone.ZoneID} value={zone.ZoneID}>
                  <AccordionTrigger className="text-sm">
                    {zone.Name || `Zone ${index + 1}`}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 py-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Face:</span>{' '}
                        {zone.Face}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Depth:</span>{' '}
                        {zone.ZoneDepth_mm} mm
                      </div>
                      <div>
                        <span className="text-muted-foreground">Offset:</span>{' '}
                        {zone.ZoneOffset_mm} mm
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coverage:</span>{' '}
                        {zone.RequiredCoverage_pct}%
                      </div>
                      {zone.SmallestLateralFeature_um && (
                        <div>
                          <span className="text-muted-foreground">Lateral Feature:</span>{' '}
                          {zone.SmallestLateralFeature_um} \u03BCm
                        </div>
                      )}
                      {zone.SmallestDepthFeature_um && (
                        <div>
                          <span className="text-muted-foreground">Depth Feature:</span>{' '}
                          {zone.SmallestDepthFeature_um} \u03BCm
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface DataItemProps {
  label: string
  value: string
}

function DataItem({ label, value }: DataItemProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
