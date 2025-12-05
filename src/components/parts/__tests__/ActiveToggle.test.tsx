// src/components/parts/__tests__/ActiveToggle.test.tsx
// Tests for ActiveToggle in columns (AC 3.1.1, 3.1.2)

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { Part } from '@/lib/schemas/part'
import { columns } from '../columns'
import { useWorkingSetStore } from '@/stores/workingSet'

const mockPart: Part = {
  PartCallout: 'TEST-001',
  PartSeries: 'TestSeries',
  PartWidth_mm: 10,
  PartHeight_mm: 20,
  PartLength_mm: 30,
  SmallestLateralFeature_um: 5,
  InspectionZones: [],
}

function TestTable({ data }: { data: Part[] }) {
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

describe('ActiveToggle', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  it('renders switch in unchecked state when part not in working set', () => {
    render(<TestTable data={[mockPart]} />)

    const toggle = screen.getByRole('switch', { name: /toggle TEST-001 active state/i })
    expect(toggle).not.toBeChecked()
  })

  it('renders switch in checked state when part is in working set', () => {
    useWorkingSetStore.setState({
      partIds: new Set(['TEST-001']),
      stationIds: new Set<string>(),
    })

    render(<TestTable data={[mockPart]} />)

    const toggle = screen.getByRole('switch', { name: /toggle TEST-001 active state/i })
    expect(toggle).toBeChecked()
  })

  it('adds part to working set when toggled on', async () => {
    const user = userEvent.setup()
    render(<TestTable data={[mockPart]} />)

    const toggle = screen.getByRole('switch', { name: /toggle TEST-001 active state/i })
    await user.click(toggle)

    const { partIds } = useWorkingSetStore.getState()
    expect(partIds.has('TEST-001')).toBe(true)
  })

  it('removes part from working set when toggled off', async () => {
    useWorkingSetStore.setState({
      partIds: new Set(['TEST-001']),
      stationIds: new Set<string>(),
    })
    const user = userEvent.setup()

    render(<TestTable data={[mockPart]} />)

    const toggle = screen.getByRole('switch', { name: /toggle TEST-001 active state/i })
    await user.click(toggle)

    const { partIds } = useWorkingSetStore.getState()
    expect(partIds.has('TEST-001')).toBe(false)
  })

  it('updates visual state immediately after click', async () => {
    const user = userEvent.setup()
    render(<TestTable data={[mockPart]} />)

    const toggle = screen.getByRole('switch', { name: /toggle TEST-001 active state/i })
    expect(toggle).not.toBeChecked()

    await user.click(toggle)

    expect(toggle).toBeChecked()
  })
})
