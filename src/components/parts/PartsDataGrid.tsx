// src/components/parts/PartsDataGrid.tsx
// Virtualized data grid using TanStack Table + TanStack Virtual (Story 3.12)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md, 3-12-table-virtualization.md

import * as React from 'react'
import {
  flexRender,
  type Table as TanStackTable,
  type Row,
} from '@tanstack/react-table'
import type { Part } from '@/lib/schemas/part'
import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { VirtualizedTable, ROW_HEIGHTS } from '@/components/ui/VirtualizedTable'
import { cn } from '@/lib/utils'
import { columns } from './columns'
import { SeriesGroupHeader } from './SeriesGroupHeader'

export interface PartsDataGridProps {
  table: TanStackTable<Part>
  onRowClick: (part: Part) => void
}

export function PartsDataGrid({ table, onRowClick }: PartsDataGridProps) {
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
          No parts found.
        </TableCell>
      </TableRow>
    ),
    []
  )

  // Render individual row (grouped or data)
  const renderRow = React.useCallback(
    (row: Row<Part>) => {
      // Grouped row (series header)
      if (row.getIsGrouped()) {
        const seriesName = row.getValue('PartSeries') as string
        const leafRows = row.getLeafRows()
        const partIdsInSeries = leafRows.map((r) => r.original.PartCallout)

        return (
          <TableRow
            key={row.id}
            className="bg-muted/50 hover:bg-muted"
            data-virtualized-row
          >
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
    (row: Row<Part>) => (row.getIsGrouped() ? ROW_HEIGHTS.GROUP : ROW_HEIGHTS.DATA),
    []
  )

  return (
    <VirtualizedTable
      table={table}
      renderRow={renderRow}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      estimateSize={estimateSize}
      testId="parts-data-grid"
    />
  )
}
