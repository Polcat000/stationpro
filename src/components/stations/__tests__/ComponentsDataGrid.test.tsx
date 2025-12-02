// src/components/stations/__tests__/ComponentsDataGrid.test.tsx
// Unit tests for ComponentsDataGrid component (AC 2.8.2)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

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
import type { Component, LaserLineProfiler, AreascanCamera, LinescanCamera, Lens, SnapshotSensor } from '@/lib/schemas/component'
import { ComponentsDataGrid } from '../ComponentsDataGrid'
import { columns, formatKeySpecs, typeLabels } from '../columns'

const mockLaserProfiler: LaserLineProfiler = {
  componentId: 'LMI-G2-001',
  componentType: 'LaserLineProfiler',
  Manufacturer: 'LMI Technologies',
  Model: 'Gocator 2512',
  PartNumber: 'G2-512-12345',
  NearFieldLateralFOV_mm: 50,
  MidFieldLateralFOV_mm: 75,
  FarFieldLateralFOV_mm: 100,
  StandoffDistance_mm: 200,
  MeasurementRange_mm: 150,
  PointsPerProfile: 2048,
  LateralResolution_um: 25,
  VerticalResolution_um: 5,
  MaxScanRate_kHz: 10,
}

const mockAreascanCamera: AreascanCamera = {
  componentId: 'CAM-AREA-001',
  componentType: 'AreascanCamera',
  Manufacturer: 'Basler',
  Model: 'acA2048-55uc',
  ResolutionHorizontal_px: 2048,
  ResolutionVertical_px: 2048,
  PixelSizeHorizontal_um: 5.5,
  PixelSizeVertical_um: 5.5,
  FrameRate_fps: 55,
  LensMount: 'C-Mount',
}

const mockLinescanCamera: LinescanCamera = {
  componentId: 'CAM-LINE-001',
  componentType: 'LinescanCamera',
  Manufacturer: 'Teledyne DALSA',
  Model: 'Piranha4',
  ResolutionHorizontal_px: 4096,
  ResolutionVertical_px: 1,
  PixelSizeHorizontal_um: 7,
  PixelSizeVertical_um: 7,
  LineRate_kHz: 140,
  LensMount: 'F-Mount',
}

const mockLens: Lens = {
  componentId: 'LENS-TC-001',
  componentType: 'Lens',
  LensType: 'Telecentric',
  Manufacturer: 'Edmund Optics',
  Model: 'TC-2340',
  Mount: 'C-Mount',
  MaxSensorSize_mm: 11,
  ApertureMin_fnum: 4,
  ApertureMax_fnum: 16,
  Magnification: 0.5,
  WorkingDistance_mm: 65,
  FieldDepth_mm: 2.5,
}

const mockSnapshotSensor: SnapshotSensor = {
  componentId: 'SNAP-001',
  componentType: 'SnapshotSensor',
  Manufacturer: 'Keyence',
  Model: 'LJ-X8400',
  FOV_X_mm: 25,
  FOV_Y_mm: 25,
  MeasurementRange_mm: 30,
  WorkingDistance_mm: 50,
  XYDataInterval_um: 10,
}

const mockComponents: Component[] = [
  mockLaserProfiler,
  mockAreascanCamera,
  mockLinescanCamera,
  mockLens,
  mockSnapshotSensor,
]

interface TestWrapperProps {
  components: Component[]
  onRowClick: (component: Component) => void
}

function TestWrapper({ components, onRowClick }: TestWrapperProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: components,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  })

  return <ComponentsDataGrid table={table} onRowClick={onRowClick} />
}

describe('ComponentsDataGrid', () => {
  describe('AC-2.8.2: Data Grid Renders with Sortable Columns', () => {
    it('renders all 5 columns', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      expect(screen.getByText('Manufacturer')).toBeInTheDocument()
      expect(screen.getByText('Model')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Key Specs')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('renders component data in rows', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      expect(screen.getByText('Gocator 2512')).toBeInTheDocument()
      expect(screen.getByText('Basler')).toBeInTheDocument()
      expect(screen.getByText('acA2048-55uc')).toBeInTheDocument()
    })

    it('displays human-readable type labels', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      expect(screen.getByText('Laser Profiler')).toBeInTheDocument()
      expect(screen.getByText('Areascan Camera')).toBeInTheDocument()
      expect(screen.getByText('Linescan Camera')).toBeInTheDocument()
      expect(screen.getByText('Lens')).toBeInTheDocument()
      expect(screen.getByText('Snapshot Sensor')).toBeInTheDocument()
    })

    it('sorts by column header click - ascending', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      // Click Manufacturer column header to sort
      await user.click(screen.getByText('Manufacturer'))

      // After ascending sort, Basler should be first
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Basler')
    })

    it('sorts by column header click - descending on second click', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      // Click twice for descending
      await user.click(screen.getByText('Manufacturer'))
      await user.click(screen.getByText('Manufacturer'))

      // After descending sort, Teledyne DALSA should be first
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Teledyne DALSA')
    })

    it('shows sort direction indicators', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      // Click to sort ascending
      await user.click(screen.getByText('Manufacturer'))

      // Should show ascending indicator
      expect(screen.getByLabelText('Sorted ascending')).toBeInTheDocument()

      // Click again for descending
      await user.click(screen.getByText('Manufacturer'))

      // Should show descending indicator
      expect(screen.getByLabelText('Sorted descending')).toBeInTheDocument()
    })
  })

  describe('Row Click Behavior', () => {
    it('calls onRowClick when row is clicked', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      // Click on the first data row
      const rows = screen.getAllByRole('row')
      await user.click(rows[1])

      expect(onRowClick).toHaveBeenCalledWith(mockComponents[0])
    })

    it('does not call onRowClick when header is clicked', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      // Click on the header row
      const headerRow = screen.getAllByRole('row')[0]
      await user.click(headerRow)

      expect(onRowClick).not.toHaveBeenCalled()
    })

    it('calls onRowClick with correct component on different row click', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      // Click on the third data row
      const rows = screen.getAllByRole('row')
      await user.click(rows[3])

      expect(onRowClick).toHaveBeenCalledWith(mockComponents[2])
    })
  })

  describe('Empty State', () => {
    it('shows empty message when no components', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper components={[]} onRowClick={onRowClick} />)

      expect(screen.getByText('No components found.')).toBeInTheDocument()
    })
  })

  describe('Active Toggle', () => {
    it('renders switch for each row', () => {
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      const switches = screen.getAllByRole('switch')
      expect(switches).toHaveLength(mockComponents.length)
    })

    it('switch click does not trigger row click', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(<TestWrapper components={mockComponents} onRowClick={onRowClick} />)

      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      // onRowClick should NOT be called when clicking the switch
      expect(onRowClick).not.toHaveBeenCalled()
    })
  })
})

describe('Type Labels', () => {
  it('maps all component types correctly', () => {
    expect(typeLabels['LaserLineProfiler']).toBe('Laser Profiler')
    expect(typeLabels['AreascanCamera']).toBe('Areascan Camera')
    expect(typeLabels['LinescanCamera']).toBe('Linescan Camera')
    expect(typeLabels['Lens']).toBe('Lens')
    expect(typeLabels['SnapshotSensor']).toBe('Snapshot Sensor')
  })
})

describe('formatKeySpecs', () => {
  it('formats LaserLineProfiler correctly', () => {
    const result = formatKeySpecs(mockLaserProfiler)
    expect(result).toBe('FOV: 50-100mm, Z: 150mm')
  })

  it('formats AreascanCamera correctly', () => {
    const result = formatKeySpecs(mockAreascanCamera)
    expect(result).toBe('2048×2048px, 55fps')
  })

  it('formats LinescanCamera correctly', () => {
    const result = formatKeySpecs(mockLinescanCamera)
    expect(result).toBe('4096px, 140kHz')
  })

  it('formats Lens correctly', () => {
    const result = formatKeySpecs(mockLens)
    expect(result).toBe('Telecentric, f/4')
  })

  it('formats SnapshotSensor correctly', () => {
    const result = formatKeySpecs(mockSnapshotSensor)
    expect(result).toBe('FOV: 25×25mm')
  })
})
