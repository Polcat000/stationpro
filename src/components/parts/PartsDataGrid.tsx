// src/components/parts/PartsDataGrid.tsx
// Data grid using TanStack Table with shadcn/ui Table (AC 2.7.1)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import {
  flexRender,
  type Table as TanStackTable,
} from '@tanstack/react-table'
import type { Part } from '@/lib/schemas/part'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { columns } from './columns'

export interface PartsDataGridProps {
  table: TanStackTable<Part>
  onRowClick: (part: Part) => void
}

export function PartsDataGrid({ table, onRowClick }: PartsDataGridProps) {
  const rows = table.getRowModel().rows

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center text-muted-foreground"
            >
              No parts found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn('cursor-pointer')}
              onClick={() => onRowClick(row.original)}
              data-state={row.getIsSelected() ? 'selected' : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
