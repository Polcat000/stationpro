// src/components/stations/__tests__/ActiveToggle.test.tsx
// Tests for ActiveToggle in Component columns (AC 3.2.1)

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { Component, LaserLineProfiler } from '@/lib/schemas/component'
import { columns } from '../columns'
import { useComponentsStore } from '@/stores/components'

const mockComponent: LaserLineProfiler = {
  componentId: 'test-llp-001',
  componentType: 'LaserLineProfiler',
  Manufacturer: 'LMI Technologies',
  Model: 'Gocator 2350',
  NearFieldLateralFOV_mm: 100,
  MidFieldLateralFOV_mm: 150,
  FarFieldLateralFOV_mm: 200,
  StandoffDistance_mm: 300,
  MeasurementRange_mm: 100,
  PointsPerProfile: 1280,
  LateralResolution_um: 78,
  VerticalResolution_um: 10,
  MaxScanRate_kHz: 5,
}

function TestTable({ data }: { data: Component[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

describe('ActiveToggle for Components', () => {
  beforeEach(() => {
    useComponentsStore.setState({
      activeComponentIds: new Set<string>(),
    })
  })

  it('renders switch in unchecked state when component not active', () => {
    render(<TestTable data={[mockComponent]} />)

    const toggle = screen.getByRole('switch', { name: /toggle LMI Technologies Gocator 2350 active state/i })
    expect(toggle).not.toBeChecked()
  })

  it('renders switch in checked state when component is active', () => {
    useComponentsStore.setState({
      activeComponentIds: new Set(['test-llp-001']),
    })

    render(<TestTable data={[mockComponent]} />)

    const toggle = screen.getByRole('switch', { name: /toggle LMI Technologies Gocator 2350 active state/i })
    expect(toggle).toBeChecked()
  })

  it('adds component to active set when toggled on', async () => {
    const user = userEvent.setup()
    render(<TestTable data={[mockComponent]} />)

    const toggle = screen.getByRole('switch', { name: /toggle LMI Technologies Gocator 2350 active state/i })
    await user.click(toggle)

    const { activeComponentIds } = useComponentsStore.getState()
    expect(activeComponentIds.has('test-llp-001')).toBe(true)
  })

  it('removes component from active set when toggled off', async () => {
    useComponentsStore.setState({
      activeComponentIds: new Set(['test-llp-001']),
    })
    const user = userEvent.setup()

    render(<TestTable data={[mockComponent]} />)

    const toggle = screen.getByRole('switch', { name: /toggle LMI Technologies Gocator 2350 active state/i })
    await user.click(toggle)

    const { activeComponentIds } = useComponentsStore.getState()
    expect(activeComponentIds.has('test-llp-001')).toBe(false)
  })

  it('updates visual state immediately after click', async () => {
    const user = userEvent.setup()
    render(<TestTable data={[mockComponent]} />)

    const toggle = screen.getByRole('switch', { name: /toggle LMI Technologies Gocator 2350 active state/i })
    expect(toggle).not.toBeChecked()

    await user.click(toggle)

    expect(toggle).toBeChecked()
  })
})
