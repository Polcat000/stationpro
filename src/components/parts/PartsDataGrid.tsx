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
import { FamilyGroupHeader } from './FamilyGroupHeader'

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
      // Grouped row - detect depth for family vs series
      if (row.getIsGrouped()) {
        const depth = row.depth
        const leafRows = row.getLeafRows()
        const partIds = leafRows.map((r) => r.original.PartCallout)

        // Depth 0: Family-level grouping
        if (depth === 0) {
          const familyName = row.getValue('PartFamily') as string

          return (
            <TableRow
              key={row.id}
              className="bg-muted/40 hover:bg-muted/50"
              data-virtualized-row
            >
              <TableCell colSpan={columns.length}>
                <FamilyGroupHeader
                  familyName={familyName}
                  partIdsInFamily={partIds}
                  isExpanded={row.getIsExpanded()}
                  onToggleExpand={() => row.toggleExpanded()}
                />
              </TableCell>
            </TableRow>
          )
        }

        // Depth 1: Series-level grouping (or single-level series grouping)
        const seriesName = row.getValue('PartSeries') as string

        return (
          <TableRow
            key={row.id}
            className="bg-muted/60 hover:bg-muted/70"
            data-virtualized-row
          >
            <TableCell colSpan={columns.length}>
              <SeriesGroupHeader
                seriesName={seriesName}
                partIdsInSeries={partIds}
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
