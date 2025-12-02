// src/components/stations/columns.tsx
// TanStack Table column definitions for Components grid (AC 2.8.2)
// This file exports column config (not components) - react-refresh not applicable
/* eslint-disable react-refresh/only-export-components */

import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { Component } from '@/lib/schemas/component'
import { Switch } from '@/components/ui/switch'
import { componentFieldLabels } from '@/lib/componentFieldLabels'

// Type label mapping (AC 2.8.2)
export const typeLabels: Record<string, string> = {
  LaserLineProfiler: 'Laser Profiler',
  AreascanCamera: 'Areascan Camera',
  LinescanCamera: 'Linescan Camera',
  Lens: 'Lens',
  SnapshotSensor: 'Snapshot Sensor',
}

// Custom filter functions
const textContainsFilter: FilterFn<Component> = (row, columnId, filterValue: string) => {
  const value = row.getValue(columnId) as string
  return value?.toLowerCase().includes(filterValue.toLowerCase()) ?? false
}

const multiSelectFilter: FilterFn<Component> = (row, columnId, filterValue: string[]) => {
  const value = row.getValue(columnId) as string
  return filterValue.length === 0 || filterValue.includes(value)
}

interface SortableHeaderProps {
  column: {
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
  }
  label: string
}

function SortableHeader({ column, label }: SortableHeaderProps) {
  const sorted = column.getIsSorted()

  return (
    <button
      className="flex items-center gap-1 hover:text-foreground"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      type="button"
    >
      {label}
      {sorted === 'asc' && <ArrowUp className="h-4 w-4" aria-label="Sorted ascending" />}
      {sorted === 'desc' && <ArrowDown className="h-4 w-4" aria-label="Sorted descending" />}
      {!sorted && <ArrowUpDown className="h-4 w-4 opacity-50" />}
    </button>
  )
}

interface ActiveToggleProps {
  component: Component
}

function ActiveToggle({ component }: ActiveToggleProps) {
  return (
    <Switch
      aria-label={`Toggle ${component.Manufacturer} ${component.Model} active state`}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// =============================================================================
// Base Columns (always present)
// =============================================================================

const baseColumns: ColumnDef<Component>[] = [
  {
    accessorKey: 'Manufacturer',
    header: ({ column }) => (
      <SortableHeader column={column} label="Manufacturer" />
    ),
    filterFn: multiSelectFilter,
    enableHiding: false,
  },
  {
    accessorKey: 'Model',
    header: ({ column }) => (
      <SortableHeader column={column} label="Model" />
    ),
    filterFn: textContainsFilter,
  },
  {
    accessorKey: 'componentType',
    header: ({ column }) => (
      <SortableHeader column={column} label="Type" />
    ),
    filterFn: multiSelectFilter,
    cell: ({ row }) => {
      const type = row.getValue('componentType') as string
      return typeLabels[type] || type
    },
  },
]

// =============================================================================
// Shared Spec Columns
// =============================================================================

const sharedSpecColumns: ColumnDef<Component>[] = [
  {
    id: 'PartNumber',
    accessorKey: 'PartNumber',
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.PartNumber} />
    ),
    cell: ({ row }) => row.getValue('PartNumber') ?? '-',
  },
]

// =============================================================================
// Laser Line Profiler Columns
// =============================================================================

const laserProfilerColumns: ColumnDef<Component>[] = [
  {
    id: 'NearFieldLateralFOV_mm',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.NearFieldLateralFOV_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.NearFieldLateralFOV_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('NearFieldLateralFOV_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'MidFieldLateralFOV_mm',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.MidFieldLateralFOV_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.MidFieldLateralFOV_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('MidFieldLateralFOV_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'FarFieldLateralFOV_mm',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.FarFieldLateralFOV_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.FarFieldLateralFOV_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('FarFieldLateralFOV_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'StandoffDistance_mm',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.StandoffDistance_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.StandoffDistance_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('StandoffDistance_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'MeasurementRange_mm_profiler',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.MeasurementRange_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.MeasurementRange_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('MeasurementRange_mm_profiler')
      return value != null ? value : '-'
    },
  },
  {
    id: 'PointsPerProfile',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.PointsPerProfile
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.PointsPerProfile} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('PointsPerProfile')
      return value != null ? value : '-'
    },
  },
  {
    id: 'LateralResolution_um',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.LateralResolution_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.LateralResolution_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('LateralResolution_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'VerticalResolution_um',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.VerticalResolution_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.VerticalResolution_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('VerticalResolution_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'VerticalRepeatability_um',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.VerticalRepeatability_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.VerticalRepeatability_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('VerticalRepeatability_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'VerticalLinearity_um',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.VerticalLinearity_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.VerticalLinearity_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('VerticalLinearity_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'MaxScanRate_kHz',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler') {
        return row.MaxScanRate_kHz
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.MaxScanRate_kHz} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('MaxScanRate_kHz')
      return value != null ? value : '-'
    },
  },
  {
    id: 'LaserClass',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler' && row.LaserClass) {
        return row.LaserClass.join(', ')
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.LaserClass} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('LaserClass')
      return value != null ? value : '-'
    },
  },
  {
    id: 'LaserWavelength',
    accessorFn: (row) => {
      if (row.componentType === 'LaserLineProfiler' && row.LaserWavelength) {
        return row.LaserWavelength.join(', ')
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.LaserWavelength} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('LaserWavelength')
      return value != null ? value : '-'
    },
  },
]

// =============================================================================
// Camera Shared Columns (Linescan & Areascan)
// =============================================================================

const cameraSharedColumns: ColumnDef<Component>[] = [
  {
    id: 'SensorVendor',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.SensorVendor
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.SensorVendor} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('SensorVendor')
      return value != null ? value : '-'
    },
  },
  {
    id: 'SensorName',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.SensorName
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.SensorName} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('SensorName')
      return value != null ? value : '-'
    },
  },
  {
    id: 'SensorType',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.SensorType
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.SensorType} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('SensorType')
      return value != null ? value : '-'
    },
  },
  {
    id: 'ShutterType',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.ShutterType
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ShutterType} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ShutterType')
      return value != null ? value : '-'
    },
  },
  {
    id: 'OpticalFormat',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.OpticalFormat
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.OpticalFormat} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('OpticalFormat')
      return value != null ? value : '-'
    },
  },
  {
    id: 'SensorDiagonal_mm',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.SensorDiagonal_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.SensorDiagonal_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('SensorDiagonal_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'ResolutionHorizontal_px',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.ResolutionHorizontal_px
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ResolutionHorizontal_px} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ResolutionHorizontal_px')
      return value != null ? value : '-'
    },
  },
  {
    id: 'ResolutionVertical_px',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.ResolutionVertical_px
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ResolutionVertical_px} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ResolutionVertical_px')
      return value != null ? value : '-'
    },
  },
  {
    id: 'PixelSizeHorizontal_um',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.PixelSizeHorizontal_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.PixelSizeHorizontal_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('PixelSizeHorizontal_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'PixelSizeVertical_um',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.PixelSizeVertical_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.PixelSizeVertical_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('PixelSizeVertical_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'Chroma',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.Chroma
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Chroma} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Chroma')
      return value != null ? value : '-'
    },
  },
  {
    id: 'Spectrum',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.Spectrum
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Spectrum} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Spectrum')
      return value != null ? value : '-'
    },
  },
  {
    id: 'LensMount',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.LensMount
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.LensMount} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('LensMount')
      return value != null ? value : '-'
    },
  },
  {
    id: 'DataInterface',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.DataInterface
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.DataInterface} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('DataInterface')
      return value != null ? value : '-'
    },
  },
  {
    id: 'PixelBitDepth_bits',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera' || row.componentType === 'AreascanCamera') {
        return row.PixelBitDepth_bits
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.PixelBitDepth_bits} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('PixelBitDepth_bits')
      return value != null ? value : '-'
    },
  },
]

// =============================================================================
// Linescan Camera Specific Columns
// =============================================================================

const linescanCameraColumns: ColumnDef<Component>[] = [
  {
    id: 'LineRate_kHz',
    accessorFn: (row) => {
      if (row.componentType === 'LinescanCamera') {
        return row.LineRate_kHz
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.LineRate_kHz} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('LineRate_kHz')
      return value != null ? value : '-'
    },
  },
]

// =============================================================================
// Areascan Camera Specific Columns
// =============================================================================

const areascanCameraColumns: ColumnDef<Component>[] = [
  {
    id: 'SensorWidth_mm',
    accessorFn: (row) => {
      if (row.componentType === 'AreascanCamera') {
        return row.SensorWidth_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.SensorWidth_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('SensorWidth_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'SensorHeight_mm',
    accessorFn: (row) => {
      if (row.componentType === 'AreascanCamera') {
        return row.SensorHeight_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.SensorHeight_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('SensorHeight_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'FrameRate_fps',
    accessorFn: (row) => {
      if (row.componentType === 'AreascanCamera') {
        return row.FrameRate_fps
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.FrameRate_fps} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('FrameRate_fps')
      return value != null ? value : '-'
    },
  },
]

// =============================================================================
// Lens Base Columns (all lens types)
// =============================================================================

const lensBaseColumns: ColumnDef<Component>[] = [
  {
    id: 'LensType',
    accessorFn: (row) => {
      if (row.componentType === 'Lens') {
        return row.LensType
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.LensType} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('LensType')
      return value != null ? value : '-'
    },
  },
  {
    id: 'Mount',
    accessorFn: (row) => {
      if (row.componentType === 'Lens') {
        return row.Mount
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Mount} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Mount')
      return value != null ? value : '-'
    },
  },
  {
    id: 'MaxSensorSize_mm',
    accessorFn: (row) => {
      if (row.componentType === 'Lens') {
        return row.MaxSensorSize_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.MaxSensorSize_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('MaxSensorSize_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'MaxSensorFormat',
    accessorFn: (row) => {
      if (row.componentType === 'Lens') {
        return row.MaxSensorFormat
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.MaxSensorFormat} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('MaxSensorFormat')
      return value != null ? value : '-'
    },
  },
  {
    id: 'ApertureMin_fnum',
    accessorFn: (row) => {
      if (row.componentType === 'Lens') {
        return row.ApertureMin_fnum
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ApertureMin_fnum} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ApertureMin_fnum')
      return value != null ? `f/${value}` : '-'
    },
  },
  {
    id: 'ApertureMax_fnum',
    accessorFn: (row) => {
      if (row.componentType === 'Lens') {
        return row.ApertureMax_fnum
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ApertureMax_fnum} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ApertureMax_fnum')
      return value != null ? `f/${value}` : '-'
    },
  },
]

// =============================================================================
// Telecentric Lens Columns
// =============================================================================

const telecentricLensColumns: ColumnDef<Component>[] = [
  {
    id: 'Magnification',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'Telecentric') {
        return row.Magnification
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Magnification} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Magnification')
      return value != null ? `${value}×` : '-'
    },
  },
  {
    id: 'WorkingDistance_mm_lens',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'Telecentric') {
        return row.WorkingDistance_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.WorkingDistance_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('WorkingDistance_mm_lens')
      return value != null ? value : '-'
    },
  },
  {
    id: 'WorkingDistanceTolerance_mm',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'Telecentric') {
        return row.WorkingDistanceTolerance_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.WorkingDistanceTolerance_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('WorkingDistanceTolerance_mm')
      return value != null ? `±${value}` : '-'
    },
  },
  {
    id: 'FieldDepth_mm',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'Telecentric') {
        return row.FieldDepth_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.FieldDepth_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('FieldDepth_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'Telecentricity_deg',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'Telecentric') {
        return row.Telecentricity_deg
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Telecentricity_deg} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Telecentricity_deg')
      return value != null ? `${value}°` : '-'
    },
  },
  {
    id: 'Distortion_pct_telecentric',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'Telecentric') {
        return row.Distortion_pct
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Distortion_pct} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Distortion_pct_telecentric')
      return value != null ? `${value}%` : '-'
    },
  },
  {
    id: 'Resolution_um',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'Telecentric') {
        return row.Resolution_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Resolution_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Resolution_um')
      return value != null ? value : '-'
    },
  },
]

// =============================================================================
// Fixed Focal Length Lens Columns
// =============================================================================

const fixedFocalLengthLensColumns: ColumnDef<Component>[] = [
  {
    id: 'FocalLength_mm',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'FixedFocalLength') {
        return row.FocalLength_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.FocalLength_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('FocalLength_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'WorkingDistanceMin_mm',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'FixedFocalLength') {
        return row.WorkingDistanceMin_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.WorkingDistanceMin_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('WorkingDistanceMin_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'WorkingDistanceMax_mm',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'FixedFocalLength') {
        return row.WorkingDistanceMax_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.WorkingDistanceMax_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('WorkingDistanceMax_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'AngleOfView_deg',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'FixedFocalLength') {
        return row.AngleOfView_deg
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.AngleOfView_deg} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('AngleOfView_deg')
      return value != null ? `${value}°` : '-'
    },
  },
  {
    id: 'Distortion_pct_ffl',
    accessorFn: (row) => {
      if (row.componentType === 'Lens' && row.LensType === 'FixedFocalLength') {
        return row.Distortion_pct
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Distortion_pct} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Distortion_pct_ffl')
      return value != null ? `${value}%` : '-'
    },
  },
]

// =============================================================================
// Snapshot Sensor Columns
// =============================================================================

const snapshotSensorColumns: ColumnDef<Component>[] = [
  {
    id: 'Resolution3D_px',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.Resolution3D_px
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Resolution3D_px} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Resolution3D_px')
      return value != null ? value : '-'
    },
  },
  {
    id: 'Resolution2D_px',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.Resolution2D_px
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.Resolution2D_px} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('Resolution2D_px')
      return value != null ? value : '-'
    },
  },
  {
    id: 'XYDataInterval_um',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.XYDataInterval_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.XYDataInterval_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('XYDataInterval_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'FOV_X_mm',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.FOV_X_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.FOV_X_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('FOV_X_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'FOV_Y_mm',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.FOV_Y_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.FOV_Y_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('FOV_Y_mm')
      return value != null ? value : '-'
    },
  },
  {
    id: 'MeasurementRange_mm_snapshot',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.MeasurementRange_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.MeasurementRange_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('MeasurementRange_mm_snapshot')
      return value != null ? value : '-'
    },
  },
  {
    id: 'WorkingDistance_mm_snapshot',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.WorkingDistance_mm
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.WorkingDistance_mm} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('WorkingDistance_mm_snapshot')
      return value != null ? value : '-'
    },
  },
  {
    id: 'XYZRepeatability_um',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.XYZRepeatability_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.XYZRepeatability_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('XYZRepeatability_um')
      return value != null ? value : '-'
    },
  },
  {
    id: 'HeightAccuracy_um',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.HeightAccuracy_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.HeightAccuracy_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('HeightAccuracy_um')
      return value != null ? `±${value}` : '-'
    },
  },
  {
    id: 'WidthAccuracy_um',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.WidthAccuracy_um
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.WidthAccuracy_um} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('WidthAccuracy_um')
      return value != null ? `±${value}` : '-'
    },
  },
  {
    id: 'ShutterSpeedMin_us',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.ShutterSpeedMin_us
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ShutterSpeedMin_us} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ShutterSpeedMin_us')
      return value != null ? value : '-'
    },
  },
  {
    id: 'ShutterSpeedMax_ms',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.ShutterSpeedMax_ms
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ShutterSpeedMax_ms} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ShutterSpeedMax_ms')
      return value != null ? value : '-'
    },
  },
  {
    id: 'IntegratedLighting',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.IntegratedLighting
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.IntegratedLighting} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('IntegratedLighting')
      if (value === true) return 'Yes'
      if (value === false) return 'No'
      return '-'
    },
  },
  {
    id: 'LightSource',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.LightSource
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.LightSource} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('LightSource')
      return value != null ? value : '-'
    },
  },
  {
    id: 'ControllerRequired',
    accessorFn: (row) => {
      if (row.componentType === 'SnapshotSensor') {
        return row.ControllerRequired
      }
      return null
    },
    header: ({ column }) => (
      <SortableHeader column={column} label={componentFieldLabels.ControllerRequired} />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ControllerRequired')
      return value != null ? value : '-'
    },
  },
]

// =============================================================================
// Active Column (always last)
// =============================================================================

const activeColumn: ColumnDef<Component> = {
  id: 'active',
  header: 'Active',
  cell: ({ row }) => (
    <ActiveToggle component={row.original} />
  ),
  enableSorting: false,
}

// =============================================================================
// Combined Columns Export
// =============================================================================

export const columns: ColumnDef<Component>[] = [
  ...baseColumns,
  ...sharedSpecColumns,
  ...laserProfilerColumns,
  ...cameraSharedColumns,
  ...linescanCameraColumns,
  ...areascanCameraColumns,
  ...lensBaseColumns,
  ...telecentricLensColumns,
  ...fixedFocalLengthLensColumns,
  ...snapshotSensorColumns,
  activeColumn,
]

/**
 * IDs of all spec columns (for column configuration).
 * Excludes base columns (Manufacturer, Model, componentType) and active.
 */
export const specColumnIds = [
  // Shared
  'PartNumber',
  // Laser Profiler
  'NearFieldLateralFOV_mm',
  'MidFieldLateralFOV_mm',
  'FarFieldLateralFOV_mm',
  'StandoffDistance_mm',
  'MeasurementRange_mm_profiler',
  'PointsPerProfile',
  'LateralResolution_um',
  'VerticalResolution_um',
  'VerticalRepeatability_um',
  'VerticalLinearity_um',
  'MaxScanRate_kHz',
  'LaserClass',
  'LaserWavelength',
  // Camera Shared
  'SensorVendor',
  'SensorName',
  'SensorType',
  'ShutterType',
  'OpticalFormat',
  'SensorDiagonal_mm',
  'ResolutionHorizontal_px',
  'ResolutionVertical_px',
  'PixelSizeHorizontal_um',
  'PixelSizeVertical_um',
  'Chroma',
  'Spectrum',
  'LensMount',
  'DataInterface',
  'PixelBitDepth_bits',
  // Linescan
  'LineRate_kHz',
  // Areascan
  'SensorWidth_mm',
  'SensorHeight_mm',
  'FrameRate_fps',
  // Lens Base
  'LensType',
  'Mount',
  'MaxSensorSize_mm',
  'MaxSensorFormat',
  'ApertureMin_fnum',
  'ApertureMax_fnum',
  // Telecentric
  'Magnification',
  'WorkingDistance_mm_lens',
  'WorkingDistanceTolerance_mm',
  'FieldDepth_mm',
  'Telecentricity_deg',
  'Distortion_pct_telecentric',
  'Resolution_um',
  // Fixed Focal Length
  'FocalLength_mm',
  'WorkingDistanceMin_mm',
  'WorkingDistanceMax_mm',
  'AngleOfView_deg',
  'Distortion_pct_ffl',
  // Snapshot Sensor
  'Resolution3D_px',
  'Resolution2D_px',
  'XYDataInterval_um',
  'FOV_X_mm',
  'FOV_Y_mm',
  'MeasurementRange_mm_snapshot',
  'WorkingDistance_mm_snapshot',
  'XYZRepeatability_um',
  'HeightAccuracy_um',
  'WidthAccuracy_um',
  'ShutterSpeedMin_us',
  'ShutterSpeedMax_ms',
  'IntegratedLighting',
  'LightSource',
  'ControllerRequired',
]
