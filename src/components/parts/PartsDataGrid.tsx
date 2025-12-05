// src/components/parts/PartsDataGrid.tsx
// Data grid using TanStack Table with shadcn/ui Table (AC 2.7.1, 3.1.6, 3.1.7)
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
import { SeriesGroupHeader } from './SeriesGroupHeader'

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
          rows.map((row) => {
            // Check if this is a grouped row (series header)
            if (row.getIsGrouped()) {
              const seriesName = row.getValue('PartSeries') as string
              const leafRows = row.getLeafRows()
              const partIdsInSeries = leafRows.map((r) => r.original.PartCallout)

              return (
                <TableRow key={row.id} className="bg-muted/50 hover:bg-muted">
                  <TableCell colSpan={columns.length}>
                    <SeriesGroupHeader
                      seriesName={seriesName}
                      partIdsInSeries={partIdsInSeries}
                      isExpanded={row.getIsExpanded()}
                      onToggleExpand={() => row.toggleExpanded()}
                    />
                  </TableCell>
                </TableRow>
              )
            }

            // Regular data row
            return (
              <TableRow
                key={row.id}
                className={cn('cursor-pointer')}
                onClick={() => onRowClick(row.original)}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {cell.getIsGrouped() ? null : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
