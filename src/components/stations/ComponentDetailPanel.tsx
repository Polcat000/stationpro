// src/components/stations/ComponentDetailPanel.tsx
// Detail side panel for component info (AC 2.8.5)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { Edit, Trash2 } from 'lucide-react'
import type { Component } from '@/lib/schemas/component'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { typeLabels } from './columns'

export interface ComponentDetailPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  component: Component | null
  onEdit: () => void
  onDelete: () => void
}

interface DataItemProps {
  label: string
  value: string | number | undefined
  unit?: string
}

function DataItem({ label, value, unit = '' }: DataItemProps) {
  if (value === undefined || value === null) return null
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}{unit}</p>
    </div>
  )
}

function LaserProfilerDetails({ component }: { component: Extract<Component, { componentType: 'LaserLineProfiler' }> }) {
  return (
    <>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Field of View
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <DataItem label="Near FOV" value={component.NearFieldLateralFOV_mm} unit=" mm" />
          <DataItem label="Mid FOV" value={component.MidFieldLateralFOV_mm} unit=" mm" />
          <DataItem label="Far FOV" value={component.FarFieldLateralFOV_mm} unit=" mm" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Working Distance
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Standoff" value={component.StandoffDistance_mm} unit=" mm" />
          <DataItem label="Measurement Range" value={component.MeasurementRange_mm} unit=" mm" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Resolution
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Lateral" value={component.LateralResolution_um} unit=" µm" />
          <DataItem label="Vertical" value={component.VerticalResolution_um} unit=" µm" />
          <DataItem label="Points/Profile" value={component.PointsPerProfile} />
          <DataItem label="Max Scan Rate" value={component.MaxScanRate_kHz} unit=" kHz" />
        </div>
      </section>
    </>
  )
}

function AreascanCameraDetails({ component }: { component: Extract<Component, { componentType: 'AreascanCamera' }> }) {
  return (
    <>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Resolution
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Horizontal" value={component.ResolutionHorizontal_px} unit=" px" />
          <DataItem label="Vertical" value={component.ResolutionVertical_px} unit=" px" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pixel Size
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Horizontal" value={component.PixelSizeHorizontal_um} unit=" µm" />
          <DataItem label="Vertical" value={component.PixelSizeVertical_um} unit=" µm" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Performance
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Frame Rate" value={component.FrameRate_fps} unit=" fps" />
          <DataItem label="Lens Mount" value={component.LensMount} />
          {component.SensorDiagonal_mm && (
            <DataItem label="Sensor Size" value={component.SensorDiagonal_mm} unit=" mm" />
          )}
        </div>
      </section>
    </>
  )
}

function LinescanCameraDetails({ component }: { component: Extract<Component, { componentType: 'LinescanCamera' }> }) {
  return (
    <>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Resolution
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Horizontal" value={component.ResolutionHorizontal_px} unit=" px" />
          <DataItem label="Vertical" value={component.ResolutionVertical_px} unit=" px" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pixel Size
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Horizontal" value={component.PixelSizeHorizontal_um} unit=" µm" />
          <DataItem label="Vertical" value={component.PixelSizeVertical_um} unit=" µm" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Performance
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Line Rate" value={component.LineRate_kHz} unit=" kHz" />
          <DataItem label="Lens Mount" value={component.LensMount} />
        </div>
      </section>
    </>
  )
}

function LensDetails({ component }: { component: Extract<Component, { componentType: 'Lens' }> }) {
  return (
    <>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Lens Properties
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Type" value={component.LensType} />
          <DataItem label="Mount" value={component.Mount} />
          <DataItem label="Max Sensor Size" value={component.MaxSensorSize_mm} unit=" mm" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Aperture
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Min f-number" value={component.ApertureMin_fnum} />
          <DataItem label="Max f-number" value={component.ApertureMax_fnum} />
        </div>
      </section>
      {component.LensType === 'Telecentric' && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Telecentric Properties
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <DataItem label="Magnification" value={component.Magnification} unit="×" />
            <DataItem label="Working Distance" value={component.WorkingDistance_mm} unit=" mm" />
            <DataItem label="Field Depth" value={component.FieldDepth_mm} unit=" mm" />
          </div>
        </section>
      )}
      {component.LensType === 'FixedFocalLength' && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Focal Length Properties
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <DataItem label="Focal Length" value={component.FocalLength_mm} unit=" mm" />
            <DataItem label="Min Working Distance" value={component.WorkingDistanceMin_mm} unit=" mm" />
            {component.WorkingDistanceMax_mm && (
              <DataItem label="Max Working Distance" value={component.WorkingDistanceMax_mm} unit=" mm" />
            )}
          </div>
        </section>
      )}
    </>
  )
}

function SnapshotSensorDetails({ component }: { component: Extract<Component, { componentType: 'SnapshotSensor' }> }) {
  return (
    <>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Field of View
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="FOV X" value={component.FOV_X_mm} unit=" mm" />
          <DataItem label="FOV Y" value={component.FOV_Y_mm} unit=" mm" />
          <DataItem label="XY Data Interval" value={component.XYDataInterval_um} unit=" µm" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Working Range
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DataItem label="Measurement Range" value={component.MeasurementRange_mm} unit=" mm" />
          <DataItem label="Working Distance" value={component.WorkingDistance_mm} unit=" mm" />
        </div>
      </section>
    </>
  )
}

export function ComponentDetailPanel({
  open,
  onOpenChange,
  component,
  onEdit,
  onDelete,
}: ComponentDetailPanelProps) {
  if (!component) return null

  const typeLabel = typeLabels[component.componentType] || component.componentType

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="text-xl">{component.Manufacturer} {component.Model}</SheetTitle>
          <p className="text-sm text-muted-foreground">{typeLabel}</p>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 overflow-y-auto px-5">
          {/* Common fields */}
          {component.PartNumber && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Identification
              </h3>
              <DataItem label="Part Number" value={component.PartNumber} />
            </section>
          )}

          {/* Type-specific details */}
          {component.componentType === 'LaserLineProfiler' && (
            <LaserProfilerDetails component={component} />
          )}
          {component.componentType === 'AreascanCamera' && (
            <AreascanCameraDetails component={component} />
          )}
          {component.componentType === 'LinescanCamera' && (
            <LinescanCameraDetails component={component} />
          )}
          {component.componentType === 'Lens' && (
            <LensDetails component={component} />
          )}
          {component.componentType === 'SnapshotSensor' && (
            <SnapshotSensorDetails component={component} />
          )}
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
