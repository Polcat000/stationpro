// src/components/stations/ComponentsDataGrid.tsx
// Virtualized data grid using TanStack Table + TanStack Virtual (Story 3.12)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md, 3-12-table-virtualization.md

import * as React from 'react'
import {
  flexRender,
  type Table as TanStackTable,
  type Row,
} from '@tanstack/react-table'
import type { Component } from '@/lib/schemas/component'
import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { VirtualizedTable, ROW_HEIGHTS } from '@/components/ui/VirtualizedTable'
import { cn } from '@/lib/utils'
import { columns } from './columns'
import { ManufacturerGroupHeader } from './ManufacturerGroupHeader'

export interface ComponentsDataGridProps {
  table: TanStackTable<Component>
  onRowClick: (component: Component) => void
}

export function ComponentsDataGrid({ table, onRowClick }: ComponentsDataGridProps) {
  // Render table header
  const renderHeader = React.useCallback(
    () => (
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
    ),
    [table]
  )

  // Render empty state
  const renderEmpty = React.useCallback(
    () => (
      <TableRow>
        <TableCell
          colSpan={columns.length}
          className="h-24 text-center text-muted-foreground"
        >
          No components found.
        </TableCell>
      </TableRow>
    ),
    []
  )

  // Render individual row (grouped or data)
  const renderRow = React.useCallback(
    (row: Row<Component>) => {
      // Grouped row (manufacturer header)
      if (row.getIsGrouped()) {
        const manufacturer = row.getValue('Manufacturer') as string
        const leafRows = row.getLeafRows()
        const componentIdsInGroup = leafRows.map((r) => r.original.componentId)

        return (
          <TableRow
            key={row.id}
            className="bg-muted/50 hover:bg-muted"
            data-virtualized-row
          >
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
          data-virtualized-row
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {cell.getIsGrouped()
                ? null
                : flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      )
    },
    [onRowClick]
  )

  // Custom size estimator for grouped vs data rows
  const estimateSize = React.useCallback(
    (row: Row<Component>) => (row.getIsGrouped() ? ROW_HEIGHTS.GROUP : ROW_HEIGHTS.DATA),
    []
  )

  return (
    <VirtualizedTable
      table={table}
      renderRow={renderRow}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      estimateSize={estimateSize}
      testId="components-data-grid"
    />
  )
}
