// src/components/parts/__tests__/PartsDataGrid.test.tsx
// Unit tests for PartsDataGrid component (AC 2.7.1)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { Part } from '@/lib/schemas/part'
import { PartsDataGrid } from '../PartsDataGrid'
import { columns } from '../columns'

const mockParts: Part[] = [
  {
    PartCallout: 'PART-001',
    PartSeries: 'Series-A',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 10,
    SmallestDepthFeature_um: 5,
    InspectionZones: [
      {
        ZoneID: 'Z1',
        Name: 'Top Zone',
        Face: 'Top',
        ZoneDepth_mm: 5,
        ZoneOffset_mm: 0,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
  {
    PartCallout: 'PART-002',
    PartSeries: 'Series-B',
    PartWidth_mm: 150,
    PartHeight_mm: 75,
    PartLength_mm: 300,
    SmallestLateralFeature_um: 15,
    InspectionZones: [
      {
        ZoneID: 'Z2',
        Name: 'Front Zone',
        Face: 'Front',
        ZoneDepth_mm: 10,
        ZoneOffset_mm: 5,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
      {
        ZoneID: 'Z3',
        Name: 'Back Zone',
        Face: 'Back',
        ZoneDepth_mm: 8,
        ZoneOffset_mm: 2,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
  {
    PartCallout: 'PART-003',
    PartWidth_mm: 80,
    PartHeight_mm: 40,
    PartLength_mm: 160,
    SmallestLateralFeature_um: 8,
    InspectionZones: [
      {
        ZoneID: 'Z4',
        Name: 'Bottom Zone',
        Face: 'Bottom',
        ZoneDepth_mm: 3,
        ZoneOffset_mm: 1,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
]

interface TestWrapperProps {
  parts: Part[]
  onRowClick: (part: Part) => void
}

function TestWrapper({ parts, onRowClick }: TestWrapperProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: parts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  })

  return <PartsDataGrid table={table} onRowClick={onRowClick} />
}

describe('PartsDataGrid', () => {
  describe('AC-2.7.1: Data Grid Renders with Sortable Columns', () => {
    it('renders all 7 columns', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      expect(screen.getByText('Callout')).toBeInTheDocument()
      expect(screen.getByText('Series')).toBeInTheDocument()
      expect(screen.getByText('Width (mm)')).toBeInTheDocument()
      expect(screen.getByText('Height (mm)')).toBeInTheDocument()
      expect(screen.getByText('Length (mm)')).toBeInTheDocument()
      expect(screen.getByText('# Zones')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('renders part data in rows', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      expect(screen.getByText('PART-001')).toBeInTheDocument()
      expect(screen.getByText('PART-002')).toBeInTheDocument()
      expect(screen.getByText('PART-003')).toBeInTheDocument()
      expect(screen.getByText('Series-A')).toBeInTheDocument()
      expect(screen.getByText('Series-B')).toBeInTheDocument()
    })

    it('shows "-" for missing series', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // PART-003 has no series
      const cells = screen.getAllByRole('cell')
      const hasEmptySeries = cells.some((cell) => cell.textContent === '-')
      expect(hasEmptySeries).toBe(true)
    })

    it('displays computed zone count', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // PART-001 has 1 zone, PART-002 has 2 zones, PART-003 has 1 zone
      const cells = screen.getAllByRole('cell')
      const zoneCounts = cells
        .filter((cell) => cell.textContent === '1' || cell.textContent === '2')
        .map((cell) => cell.textContent)
      expect(zoneCounts).toContain('1')
      expect(zoneCounts).toContain('2')
    })

    it('sorts by column header click - ascending', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // Click Width column header to sort
      await user.click(screen.getByText('Width (mm)'))

      // After ascending sort, PART-003 (80mm) should be first
      const rows = screen.getAllByRole('row')
      // Skip header row
      expect(rows[1]).toHaveTextContent('PART-003')
    })

    it('sorts by column header click - descending on second click', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // Click twice for descending
      await user.click(screen.getByText('Width (mm)'))
      await user.click(screen.getByText('Width (mm)'))

      // After descending sort, PART-002 (150mm) should be first
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('PART-002')
    })

    it('shows sort direction indicators', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // Click to sort ascending
      await user.click(screen.getByText('Width (mm)'))

      // Should show ascending indicator
      expect(screen.getByLabelText('Sorted ascending')).toBeInTheDocument()

      // Click again for descending
      await user.click(screen.getByText('Width (mm)'))

      // Should show descending indicator
      expect(screen.getByLabelText('Sorted descending')).toBeInTheDocument()
    })

    it('formats dimension values with 2 decimal places', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // Width values should be formatted
      expect(screen.getByText('100.00')).toBeInTheDocument()
      expect(screen.getByText('150.00')).toBeInTheDocument()
      expect(screen.getByText('80.00')).toBeInTheDocument()
    })
  })

  describe('Row Click Behavior', () => {
    it('calls onRowClick when row is clicked', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // Click on the first data row
      const rows = screen.getAllByRole('row')
      await user.click(rows[1])

      expect(onRowClick).toHaveBeenCalledWith(mockParts[0])
    })

    it('does not call onRowClick when header is clicked', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // Click on the header row
      const headerRow = screen.getAllByRole('row')[0]
      await user.click(headerRow)

      expect(onRowClick).not.toHaveBeenCalled()
    })

    it('calls onRowClick with correct part on different row click', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      // Click on the second data row
      const rows = screen.getAllByRole('row')
      await user.click(rows[2])

      expect(onRowClick).toHaveBeenCalledWith(mockParts[1])
    })
  })

  describe('Empty State', () => {
    it('shows empty message when no parts', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper parts={[]} onRowClick={onRowClick} />)

      expect(screen.getByText('No parts found.')).toBeInTheDocument()
    })
  })

  describe('Active Toggle', () => {
    it('renders switch for each row', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      const switches = screen.getAllByRole('switch')
      expect(switches).toHaveLength(mockParts.length)
    })

    it('switch click does not trigger row click', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper parts={mockParts} onRowClick={onRowClick} />)

      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      // onRowClick should NOT be called when clicking the switch
      expect(onRowClick).not.toHaveBeenCalled()
    })
  })
})
