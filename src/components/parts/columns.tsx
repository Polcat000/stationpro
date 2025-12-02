// src/components/parts/columns.tsx
// TanStack Table column definitions for Parts grid (AC 2.7.1)
// This file exports column config (not components) - react-refresh not applicable
/* eslint-disable react-refresh/only-export-components */

import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { Part } from '@/lib/schemas/part'
import { Switch } from '@/components/ui/switch'

// Custom filter functions - defined here to ensure proper typing with ColumnDef
const textContainsFilter: FilterFn<Part> = (row, columnId, filterValue: string) => {
  const value = row.getValue(columnId) as string
  return value?.toLowerCase().includes(filterValue.toLowerCase()) ?? false
}

const multiSelectFilter: FilterFn<Part> = (row, columnId, filterValue: string[]) => {
  const value = row.getValue(columnId) as string
  return filterValue.length === 0 || filterValue.includes(value)
}

const numberRangeFilter: FilterFn<Part> = (row, columnId, filterValue: [number | null, number | null]) => {
  const value = row.getValue(columnId) as number
  const [min, max] = filterValue
  if (min !== null && value < min) return false
  if (max !== null && value > max) return false
  return true
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
  part: Part
}

function ActiveToggle({ part }: ActiveToggleProps) {
  return (
    <Switch
      aria-label={`Toggle ${part.PartCallout} active state`}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

export const columns: ColumnDef<Part>[] = [
  {
    accessorKey: 'PartCallout',
    header: ({ column }) => (
      <SortableHeader column={column} label="Callout" />
    ),
    filterFn: textContainsFilter,
    enableHiding: false,
  },
  {
    accessorKey: 'PartSeries',
    header: ({ column }) => (
      <SortableHeader column={column} label="Series" />
    ),
    filterFn: multiSelectFilter,
    cell: ({ row }) => row.getValue('PartSeries') || '-',
  },
  {
    accessorKey: 'PartWidth_mm',
    header: ({ column }) => (
      <SortableHeader column={column} label="Width (mm)" />
    ),
    filterFn: numberRangeFilter,
    cell: ({ row }) => {
      const value = row.getValue('PartWidth_mm') as number
      return value.toFixed(2)
    },
  },
  {
    accessorKey: 'PartHeight_mm',
    header: ({ column }) => (
      <SortableHeader column={column} label="Height (mm)" />
    ),
    filterFn: numberRangeFilter,
    cell: ({ row }) => {
      const value = row.getValue('PartHeight_mm') as number
      return value.toFixed(2)
    },
  },
  {
    accessorKey: 'PartLength_mm',
    header: ({ column }) => (
      <SortableHeader column={column} label="Length (mm)" />
    ),
    filterFn: numberRangeFilter,
    cell: ({ row }) => {
      const value = row.getValue('PartLength_mm') as number
      return value.toFixed(2)
    },
  },
  {
    id: 'zoneCount',
    accessorFn: (row) => row.InspectionZones?.length ?? 0,
    header: ({ column }) => (
      <SortableHeader column={column} label="# Zones" />
    ),
    filterFn: numberRangeFilter,
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) => (
      <ActiveToggle part={row.original} />
    ),
    enableSorting: false,
  },
]
