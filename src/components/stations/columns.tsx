// src/components/stations/columns.tsx
// TanStack Table column definitions for Components grid (AC 2.8.2)
// This file exports column config (not components) - react-refresh not applicable
/* eslint-disable react-refresh/only-export-components */

import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { Component } from '@/lib/schemas/component'
import { Switch } from '@/components/ui/switch'

// Type label mapping (AC 2.8.2)
export const typeLabels: Record<string, string> = {
  LaserLineProfiler: 'Laser Profiler',
  AreascanCamera: 'Areascan Camera',
  LinescanCamera: 'Linescan Camera',
  Lens: 'Lens',
  SnapshotSensor: 'Snapshot Sensor',
}

// Key Specs formatter (AC 2.8.2)
export function formatKeySpecs(component: Component): string {
  switch (component.componentType) {
    case 'LaserLineProfiler':
      return `FOV: ${component.NearFieldLateralFOV_mm}-${component.FarFieldLateralFOV_mm}mm, Z: ${component.MeasurementRange_mm}mm`
    case 'AreascanCamera':
      return `${component.ResolutionHorizontal_px}×${component.ResolutionVertical_px}px, ${component.FrameRate_fps}fps`
    case 'LinescanCamera':
      return `${component.ResolutionHorizontal_px}px, ${component.LineRate_kHz}kHz`
    case 'Lens':
      return `${component.LensType}, f/${component.ApertureMin_fnum}`
    case 'SnapshotSensor':
      return `FOV: ${component.FOV_X_mm}×${component.FOV_Y_mm}mm`
  }
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

export const columns: ColumnDef<Component>[] = [
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
  {
    id: 'keySpecs',
    accessorFn: (row) => formatKeySpecs(row),
    header: ({ column }) => (
      <SortableHeader column={column} label="Key Specs" />
    ),
    cell: ({ row }) => formatKeySpecs(row.original),
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) => (
      <ActiveToggle component={row.original} />
    ),
    enableSorting: false,
  },
]
