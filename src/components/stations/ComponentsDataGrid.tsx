// src/components/stations/ComponentsDataGrid.tsx
// Data grid using TanStack Table with shadcn/ui Table (AC 2.8.2)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import {
  flexRender,
  type Table as TanStackTable,
} from '@tanstack/react-table'
import type { Component } from '@/lib/schemas/component'
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
import { ManufacturerGroupHeader } from './ManufacturerGroupHeader'

export interface ComponentsDataGridProps {
  table: TanStackTable<Component>
  onRowClick: (component: Component) => void
}

export function ComponentsDataGrid({ table, onRowClick }: ComponentsDataGridProps) {
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
              No components found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            // Check if this is a grouped row (manufacturer header)
            if (row.getIsGrouped()) {
              const manufacturer = row.getValue('Manufacturer') as string
              const leafRows = row.getLeafRows()
              const componentIdsInGroup = leafRows.map((r) => r.original.componentId)

              return (
                <TableRow key={row.id} className="bg-muted/50 hover:bg-muted">
                  <TableCell colSpan={columns.length}>
                    <ManufacturerGroupHeader
                      manufacturer={manufacturer}
                      componentIdsInGroup={componentIdsInGroup}
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
