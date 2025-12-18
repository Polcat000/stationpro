// src/components/ui/VirtualizedTable.tsx
// Virtualized table wrapper using @tanstack/react-virtual (Story 3.12)
// Renders only visible rows for performance with large datasets (16K+ rows)
// Uses spacer approach to maintain column alignment with table headers

import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

/** Row heights for virtualization calculation */
export const ROW_HEIGHTS = {
  /** Standard data row height */
  DATA: 41,
  /** Group header row height (SeriesGroupHeader, ManufacturerGroupHeader) */
  GROUP: 49,
} as const

export interface VirtualizedTableProps<TData> {
  /** TanStack Table instance */
  table: TanStackTable<TData>
  /** Render function for each row (handles both grouped and data rows) */
  renderRow: (row: Row<TData>) => React.ReactNode
  /** Render function for table header */
  renderHeader: () => React.ReactNode
  /** Render function for empty state */
  renderEmpty: () => React.ReactNode
  /** Number of rows to render outside visible area (default: 5) */
  overscan?: number
  /** Custom height calculation based on row type */
  estimateSize?: (row: Row<TData>) => number
  /** Test ID for the virtualized container */
  testId?: string
  /** Additional className for the scroll container */
  className?: string
}

export function VirtualizedTable<TData>({
  table,
  renderRow,
  renderHeader,
  renderEmpty,
  overscan = 5,
  estimateSize,
  testId = 'virtualized-table',
  className,
}: VirtualizedTableProps<TData>) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows

  // Default size estimator: use GROUP height for grouped rows, DATA for others
  const defaultEstimateSize = React.useCallback(
    (index: number) => {
      const row = rows[index]
      if (!row) return ROW_HEIGHTS.DATA
      return row.getIsGrouped() ? ROW_HEIGHTS.GROUP : ROW_HEIGHTS.DATA
    },
    [rows]
  )

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: estimateSize
      ? (index) => {
          const row = rows[index]
          return row ? estimateSize(row) : ROW_HEIGHTS.DATA
        }
      : defaultEstimateSize,
    overscan,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalHeight = rowVirtualizer.getTotalSize()

  // Calculate padding for spacer rows to maintain scroll position
  // This approach keeps rows in normal table flow for column alignment
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalHeight - (virtualRows[virtualRows.length - 1].end)
      : 0

  // Empty state
  if (rows.length === 0) {
    return (
      <div
        ref={scrollContainerRef}
        data-testid={testId}
        data-slot="virtualized-table-container"
        className={cn('relative h-full w-full overflow-auto', className)}
      >
        <table data-slot="table" className="w-full caption-bottom text-sm">
          {renderHeader()}
          <tbody data-slot="table-body">{renderEmpty()}</tbody>
        </table>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      data-testid={testId}
      data-slot="virtualized-table-container"
      className={cn('relative h-full w-full overflow-auto', className)}
    >
      <table data-slot="table" className="w-full caption-bottom text-sm">
        {renderHeader()}
        <tbody data-slot="table-body">
          {/* Top spacer row for scroll offset */}
          {paddingTop > 0 && (
            <tr aria-hidden="true">
              <td style={{ height: paddingTop, padding: 0, border: 'none' }} />
            </tr>
          )}

          {/* Visible rows - rendered in normal table flow for column alignment */}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <React.Fragment key={row.id}>
                {renderRow(row)}
              </React.Fragment>
            )
          })}

          {/* Bottom spacer row for total scroll height */}
          {paddingBottom > 0 && (
            <tr aria-hidden="true">
              <td style={{ height: paddingBottom, padding: 0, border: 'none' }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
