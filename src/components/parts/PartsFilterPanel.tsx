// src/components/parts/PartsFilterPanel.tsx
// Floating filter panel using shadcn Sheet (AC 2.7.2)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

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
import type { PartFilters } from './PartsLibraryPage'

export interface PartsFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: PartFilters
  onFiltersChange: (filters: PartFilters) => void
  uniqueSeries: string[]
  onClearAll: () => void
}

export function PartsFilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  uniqueSeries,
  onClearAll,
}: PartsFilterPanelProps) {
  const handleCalloutChange = (value: string) => {
    onFiltersChange({ ...filters, callout: value })
  }

  const handleSeriesChange = (value: string) => {
    // Toggle series in array
    const newSeries = filters.series.includes(value)
      ? filters.series.filter((s) => s !== value)
      : [...filters.series, value]
    onFiltersChange({ ...filters, series: newSeries })
  }

  const handleSeriesRemove = (value: string) => {
    onFiltersChange({
      ...filters,
      series: filters.series.filter((s) => s !== value),
    })
  }

  const handleRangeChange = (
    field: 'widthRange' | 'heightRange' | 'lengthRange' | 'zoneCountRange',
    index: 0 | 1,
    value: string
  ) => {
    const numValue = value === '' ? null : Number(value)
    const newRange = [...filters[field]] as [number | null, number | null]
    newRange[index] = numValue
    onFiltersChange({ ...filters, [field]: newRange })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>Filter Parts</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 overflow-y-auto px-5">
          {/* Callout Search */}
          <div className="space-y-2">
            <Label htmlFor="callout-search">Part Callout</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="callout-search"
                placeholder="Search callout..."
                value={filters.callout}
                onChange={(e) => handleCalloutChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Series Multi-Select */}
          <div className="space-y-2">
            <Label>Part Series</Label>
            {filters.series.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {filters.series.map((series) => (
                  <Badge
                    key={series}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleSeriesRemove(series)}
                  >
                    {series} ×
                  </Badge>
                ))}
              </div>
            )}
            <Select onValueChange={handleSeriesChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select series..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueSeries.map((series) => (
                  <SelectItem
                    key={series}
                    value={series}
                    disabled={filters.series.includes(series)}
                  >
                    {series}
                    {filters.series.includes(series) && ' (selected)'}
                  </SelectItem>
                ))}
                {uniqueSeries.length === 0 && (
                  <SelectItem value="_none" disabled>
                    No series available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Width Range */}
          <RangeInput
            label="Width (mm)"
            min={filters.widthRange[0]}
            max={filters.widthRange[1]}
            onMinChange={(v) => handleRangeChange('widthRange', 0, v)}
            onMaxChange={(v) => handleRangeChange('widthRange', 1, v)}
          />

          {/* Height Range */}
          <RangeInput
            label="Height (mm)"
            min={filters.heightRange[0]}
            max={filters.heightRange[1]}
            onMinChange={(v) => handleRangeChange('heightRange', 0, v)}
            onMaxChange={(v) => handleRangeChange('heightRange', 1, v)}
          />

          {/* Length Range */}
          <RangeInput
            label="Length (mm)"
            min={filters.lengthRange[0]}
            max={filters.lengthRange[1]}
            onMinChange={(v) => handleRangeChange('lengthRange', 0, v)}
            onMaxChange={(v) => handleRangeChange('lengthRange', 1, v)}
          />

          {/* Zone Count Range */}
          <RangeInput
            label="# Zones"
            min={filters.zoneCountRange[0]}
            max={filters.zoneCountRange[1]}
            onMinChange={(v) => handleRangeChange('zoneCountRange', 0, v)}
            onMaxChange={(v) => handleRangeChange('zoneCountRange', 1, v)}
            step={1}
          />
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClearAll}>
            Clear All
          </Button>
          <Button onClick={() => onOpenChange(false)}>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface RangeInputProps {
  label: string
  min: number | null
  max: number | null
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
  step?: number
}

function RangeInput({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  step = 0.01,
}: RangeInputProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={min ?? ''}
          onChange={(e) => onMinChange(e.target.value)}
          step={step}
          className="w-full"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="number"
          placeholder="Max"
          value={max ?? ''}
          onChange={(e) => onMaxChange(e.target.value)}
          step={step}
          className="w-full"
        />
      </div>
    </div>
  )
}
