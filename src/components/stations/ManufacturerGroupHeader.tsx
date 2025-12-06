// src/components/stations/ManufacturerGroupHeader.tsx
// Manufacturer group header with tri-state checkbox for bulk toggle (AC 3.2.2)

import { ChevronRight, ChevronDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useComponentsStore } from '@/stores/components'
import { cn } from '@/lib/utils'

export interface ManufacturerGroupHeaderProps {
  manufacturer: string
  componentIdsInGroup: string[]
  isExpanded: boolean
  onToggleExpand: () => void
}

type CheckState = 'checked' | 'unchecked' | 'indeterminate'

function getCheckState(componentIds: string[], activeIds: Set<string>): CheckState {
  const selectedCount = componentIds.filter((id) => activeIds.has(id)).length

  if (selectedCount === 0) return 'unchecked'
  if (selectedCount === componentIds.length) return 'checked'
  return 'indeterminate'
}

export function ManufacturerGroupHeader({
  manufacturer,
  componentIdsInGroup,
  isExpanded,
  onToggleExpand,
}: ManufacturerGroupHeaderProps) {
  const { activeComponentIds, toggleByManufacturer } = useComponentsStore()

  const checkState = getCheckState(componentIdsInGroup, activeComponentIds)
  const selectedCount = componentIdsInGroup.filter((id) => activeComponentIds.has(id)).length
  const totalCount = componentIdsInGroup.length

  const handleCheckboxChange = () => {
    toggleByManufacturer(manufacturer, componentIdsInGroup)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex items-center text-muted-foreground hover:text-foreground"
        aria-label={isExpanded ? 'Collapse manufacturer' : 'Expand manufacturer'}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      <Checkbox
        checked={checkState === 'checked' ? true : checkState === 'indeterminate' ? 'indeterminate' : false}
        onCheckedChange={handleCheckboxChange}
        aria-label={`Toggle all components from ${manufacturer}`}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="font-medium">{manufacturer || 'Unknown Manufacturer'}</span>
      <span className={cn(
        'text-sm',
        selectedCount === totalCount ? 'text-primary' : 'text-muted-foreground'
      )}>
        {selectedCount} of {totalCount} active
      </span>
    </div>
  )
}
