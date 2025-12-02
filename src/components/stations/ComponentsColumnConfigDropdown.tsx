// src/components/stations/ComponentsColumnConfigDropdown.tsx
// Column visibility dropdown with gear icon (AC 2.8.4)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { useState } from 'react'
import { Settings2, ChevronDown, ChevronRight } from 'lucide-react'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { componentFieldLabels } from '@/lib/componentFieldLabels'
import { specColumnIds } from './columns'

export interface ComponentsColumnConfigDropdownProps<TData> {
  table: Table<TData>
  lockedColumns?: string[]
}

// Base column labels (not in componentFieldLabels)
const baseColumnLabels: Record<string, string> = {
  Manufacturer: 'Manufacturer',
  Model: 'Model',
  componentType: 'Type',
  active: 'Active',
}

// Map column IDs to their display labels
// Handles both base columns and spec columns with suffix disambiguation
function getColumnLabel(columnId: string): string {
  // Check base columns first
  if (baseColumnLabels[columnId]) {
    return baseColumnLabels[columnId]
  }

  // Handle suffixed column IDs (e.g., MeasurementRange_mm_profiler -> MeasurementRange_mm)
  const suffixedMappings: Record<string, string> = {
    MeasurementRange_mm_profiler: 'MeasurementRange_mm',
    MeasurementRange_mm_snapshot: 'MeasurementRange_mm',
    WorkingDistance_mm_lens: 'WorkingDistance_mm',
    WorkingDistance_mm_snapshot: 'WorkingDistance_mm',
    Distortion_pct_telecentric: 'Distortion_pct',
    Distortion_pct_ffl: 'Distortion_pct',
  }

  const baseFieldId = suffixedMappings[columnId] || columnId
  return componentFieldLabels[baseFieldId] || columnId
}

// Group definitions for collapsible sections
const columnGroups = [
  {
    id: 'shared',
    label: 'Shared',
    columnIds: ['PartNumber'],
  },
  {
    id: 'laserProfiler',
    label: 'Laser Profiler',
    columnIds: [
      'NearFieldLateralFOV_mm',
      'MidFieldLateralFOV_mm',
      'FarFieldLateralFOV_mm',
      'StandoffDistance_mm',
      'MeasurementRange_mm_profiler',
      'PointsPerProfile',
      'LateralResolution_um',
      'VerticalResolution_um',
      'VerticalRepeatability_um',
      'VerticalLinearity_um',
      'MaxScanRate_kHz',
      'LaserClass',
      'LaserWavelength',
    ],
  },
  {
    id: 'camera',
    label: 'Camera (Shared)',
    columnIds: [
      'SensorVendor',
      'SensorName',
      'SensorType',
      'ShutterType',
      'OpticalFormat',
      'SensorDiagonal_mm',
      'ResolutionHorizontal_px',
      'ResolutionVertical_px',
      'PixelSizeHorizontal_um',
      'PixelSizeVertical_um',
      'Chroma',
      'Spectrum',
      'LensMount',
      'DataInterface',
      'PixelBitDepth_bits',
    ],
  },
  {
    id: 'linescan',
    label: 'Linescan Camera',
    columnIds: ['LineRate_kHz'],
  },
  {
    id: 'areascan',
    label: 'Areascan Camera',
    columnIds: ['SensorWidth_mm', 'SensorHeight_mm', 'FrameRate_fps'],
  },
  {
    id: 'lensBase',
    label: 'Lens (All)',
    columnIds: [
      'LensType',
      'Mount',
      'MaxSensorSize_mm',
      'MaxSensorFormat',
      'ApertureMin_fnum',
      'ApertureMax_fnum',
    ],
  },
  {
    id: 'telecentric',
    label: 'Telecentric Lens',
    columnIds: [
      'Magnification',
      'WorkingDistance_mm_lens',
      'WorkingDistanceTolerance_mm',
      'FieldDepth_mm',
      'Telecentricity_deg',
      'Distortion_pct_telecentric',
      'Resolution_um',
    ],
  },
  {
    id: 'ffl',
    label: 'Fixed Focal Length',
    columnIds: [
      'FocalLength_mm',
      'WorkingDistanceMin_mm',
      'WorkingDistanceMax_mm',
      'AngleOfView_deg',
      'Distortion_pct_ffl',
    ],
  },
  {
    id: 'snapshot',
    label: 'Snapshot Sensor',
    columnIds: [
      'Resolution3D_px',
      'Resolution2D_px',
      'XYDataInterval_um',
      'FOV_X_mm',
      'FOV_Y_mm',
      'MeasurementRange_mm_snapshot',
      'WorkingDistance_mm_snapshot',
      'XYZRepeatability_um',
      'HeightAccuracy_um',
      'WidthAccuracy_um',
      'ShutterSpeedMin_us',
      'ShutterSpeedMax_ms',
      'IntegratedLighting',
      'LightSource',
      'ControllerRequired',
    ],
  },
]

interface CollapsibleGroupProps<TData> {
  group: {
    id: string
    label: string
    columnIds: string[]
  }
  table: Table<TData>
  lockedColumns: string[]
  isExpanded: boolean
  onToggle: () => void
}

function CollapsibleGroup<TData>({
  group,
  table,
  lockedColumns,
  isExpanded,
  onToggle,
}: CollapsibleGroupProps<TData>) {
  // Get columns that exist in this group
  const groupColumns = group.columnIds
    .map((id) => table.getColumn(id))
    .filter((col) => col && col.getCanHide())

  if (groupColumns.length === 0) {
    return null
  }

  // Check if all columns in group are visible
  const allVisible = groupColumns.every((col) => col?.getIsVisible())
  const someVisible = groupColumns.some((col) => col?.getIsVisible())

  const handleToggleAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newValue = !allVisible
    groupColumns.forEach((col) => {
      if (col && !lockedColumns.includes(col.id)) {
        col.toggleVisibility(newValue)
      }
    })
  }

  return (
    <div className="py-1">
      <button
        type="button"
        className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium hover:bg-accent rounded-sm"
        onClick={onToggle}
      >
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>{group.label}</span>
          <span className="text-xs text-muted-foreground">
            ({groupColumns.filter((col) => col?.getIsVisible()).length}/{groupColumns.length})
          </span>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground px-1"
          onClick={handleToggleAll}
        >
          {allVisible ? 'Hide all' : someVisible ? 'Show all' : 'Show all'}
        </button>
      </button>

      {isExpanded && (
        <div className="ml-4 mt-1 space-y-0">
          {groupColumns.map((column) => {
            if (!column) return null
            const isLocked = lockedColumns.includes(column.id)
            const label = getColumnLabel(column.id)

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                disabled={isLocked}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                className="text-sm"
              >
                {label}
                {isLocked && (
                  <span className="ml-auto text-xs text-muted-foreground">(locked)</span>
                )}
              </DropdownMenuCheckboxItem>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ComponentsColumnConfigDropdown<TData>({
  table,
  lockedColumns = [],
}: ComponentsColumnConfigDropdownProps<TData>) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // Get base columns (non-spec columns)
  const baseColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanHide() &&
        !specColumnIds.includes(column.id) &&
        column.id !== 'active'
    )

  // Active column
  const activeColumn = table.getColumn('active')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Configure columns">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Base columns (always shown flat) */}
        <div className="py-1">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Base Columns
          </div>
          {baseColumns.map((column) => {
            const isLocked = lockedColumns.includes(column.id)
            const label = getColumnLabel(column.id)

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                disabled={isLocked}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {label}
                {isLocked && (
                  <span className="ml-auto text-xs text-muted-foreground">(locked)</span>
                )}
              </DropdownMenuCheckboxItem>
            )
          })}
        </div>

        <DropdownMenuSeparator />

        {/* Grouped spec columns */}
        <div className="py-1">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Spec Columns
          </div>
          {columnGroups.map((group) => (
            <CollapsibleGroup
              key={group.id}
              group={group}
              table={table}
              lockedColumns={lockedColumns}
              isExpanded={!!expandedGroups[group.id]}
              onToggle={() => toggleGroup(group.id)}
            />
          ))}
        </div>

        {/* Active column (always at bottom) */}
        {activeColumn && activeColumn.getCanHide() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={activeColumn.getIsVisible()}
              onCheckedChange={(value) => activeColumn.toggleVisibility(!!value)}
            >
              {getColumnLabel('active')}
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
