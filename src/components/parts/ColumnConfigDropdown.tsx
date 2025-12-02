// src/components/parts/ColumnConfigDropdown.tsx
// Column visibility dropdown with gear icon (AC 2.7.3)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { Settings2 } from 'lucide-react'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface ColumnConfigDropdownProps<TData> {
  table: Table<TData>
  lockedColumns?: string[]
}

const columnLabels: Record<string, string> = {
  PartCallout: 'Callout',
  PartSeries: 'Series',
  PartWidth_mm: 'Width (mm)',
  PartHeight_mm: 'Height (mm)',
  PartLength_mm: 'Length (mm)',
  zoneCount: '# Zones',
  active: 'Active',
}

export function ColumnConfigDropdown<TData>({
  table,
  lockedColumns = [],
}: ColumnConfigDropdownProps<TData>) {
  const allColumns = table.getAllColumns().filter((column) => column.getCanHide())

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Configure columns">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allColumns.map((column) => {
          const isLocked = lockedColumns.includes(column.id)
          const label = columnLabels[column.id] || column.id

          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              disabled={isLocked}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {label}
              {isLocked && (
                <span className="ml-auto text-xs text-muted-foreground">(locked)</span>
              )}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
