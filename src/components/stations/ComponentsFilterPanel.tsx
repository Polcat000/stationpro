// src/components/stations/ComponentsFilterPanel.tsx
// Floating filter panel using shadcn Sheet (AC 2.8.3)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { ComponentFilters } from './ComponentsTab'
import { typeLabels } from './columns'

export interface ComponentsFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: ComponentFilters
  onFiltersChange: (filters: ComponentFilters) => void
  uniqueManufacturers: string[]
  onClearAll: () => void
}

const componentTypes = [
  'LaserLineProfiler',
  'LinescanCamera',
  'AreascanCamera',
  'Lens',
  'SnapshotSensor',
] as const

export function ComponentsFilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  uniqueManufacturers,
  onClearAll,
}: ComponentsFilterPanelProps) {
  const handleModelChange = (value: string) => {
    onFiltersChange({ ...filters, model: value })
  }

  const handleManufacturerChange = (value: string) => {
    // Toggle manufacturer in array
    const newManufacturers = filters.manufacturers.includes(value)
      ? filters.manufacturers.filter((m) => m !== value)
      : [...filters.manufacturers, value]
    onFiltersChange({ ...filters, manufacturers: newManufacturers })
  }

  const handleManufacturerRemove = (value: string) => {
    onFiltersChange({
      ...filters,
      manufacturers: filters.manufacturers.filter((m) => m !== value),
    })
  }

  const handleTypeChange = (value: string) => {
    // Toggle type in array
    const newTypes = filters.types.includes(value)
      ? filters.types.filter((t) => t !== value)
      : [...filters.types, value]
    onFiltersChange({ ...filters, types: newTypes })
  }

  const handleTypeRemove = (value: string) => {
    onFiltersChange({
      ...filters,
      types: filters.types.filter((t) => t !== value),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>Filter Components</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 overflow-y-auto px-5">
          {/* Model Search */}
          <div className="space-y-2">
            <Label htmlFor="model-search">Model</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="model-search"
                placeholder="Search model..."
                value={filters.model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Manufacturer Multi-Select */}
          <div className="space-y-2">
            <Label>Manufacturer</Label>
            {filters.manufacturers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {filters.manufacturers.map((mfr) => (
                  <Badge
                    key={mfr}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleManufacturerRemove(mfr)}
                  >
                    {mfr} ×
                  </Badge>
                ))}
              </div>
            )}
            <Select onValueChange={handleManufacturerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select manufacturer..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueManufacturers.map((mfr) => (
                  <SelectItem
                    key={mfr}
                    value={mfr}
                    disabled={filters.manufacturers.includes(mfr)}
                  >
                    {mfr}
                    {filters.manufacturers.includes(mfr) && ' (selected)'}
                  </SelectItem>
                ))}
                {uniqueManufacturers.length === 0 && (
                  <SelectItem value="_none" disabled>
                    No manufacturers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Type Multi-Select */}
          <div className="space-y-2">
            <Label>Component Type</Label>
            {filters.types.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {filters.types.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleTypeRemove(type)}
                  >
                    {typeLabels[type] || type} ×
                  </Badge>
                ))}
              </div>
            )}
            <Select onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {componentTypes.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    disabled={filters.types.includes(type)}
                  >
                    {typeLabels[type]}
                    {filters.types.includes(type) && ' (selected)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClearAll}>
            Clear All Filters
          </Button>
          <Button onClick={() => onOpenChange(false)}>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
