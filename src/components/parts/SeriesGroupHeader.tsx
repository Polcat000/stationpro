// src/components/parts/SeriesGroupHeader.tsx
// Series group header with tri-state checkbox for bulk toggle (AC 3.1.6, 3.1.7)

import { ChevronRight, ChevronDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useWorkingSetStore } from '@/stores/workingSet'
import { cn } from '@/lib/utils'

export interface SeriesGroupHeaderProps {
  seriesName: string
  partIdsInSeries: string[]
  isExpanded: boolean
  onToggleExpand: () => void
}

type CheckState = 'checked' | 'unchecked' | 'indeterminate'

function getCheckState(partIdsInSeries: string[], workingSetIds: Set<string>): CheckState {
  const selectedCount = partIdsInSeries.filter((id) => workingSetIds.has(id)).length

  if (selectedCount === 0) return 'unchecked'
  if (selectedCount === partIdsInSeries.length) return 'checked'
  return 'indeterminate'
}

export function SeriesGroupHeader({
  seriesName,
  partIdsInSeries,
  isExpanded,
  onToggleExpand,
}: SeriesGroupHeaderProps) {
  const { partIds, toggleSeries } = useWorkingSetStore()

  const checkState = getCheckState(partIdsInSeries, partIds)
  const selectedCount = partIdsInSeries.filter((id) => partIds.has(id)).length
  const totalCount = partIdsInSeries.length

  const handleCheckboxChange = () => {
    toggleSeries(seriesName, partIdsInSeries)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex items-center text-muted-foreground hover:text-foreground"
        aria-label={isExpanded ? 'Collapse series' : 'Expand series'}
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
        aria-label={`Toggle all parts in ${seriesName} series`}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="font-medium">{seriesName || 'No Series'}</span>
      <span className={cn(
        'text-sm',
        selectedCount === totalCount ? 'text-primary' : 'text-muted-foreground'
      )}>
        {selectedCount} of {totalCount} selected
      </span>
    </div>
  )
}
