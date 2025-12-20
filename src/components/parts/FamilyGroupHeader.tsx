// src/components/parts/FamilyGroupHeader.tsx
// Family group header with tri-state checkbox for bulk toggle (AC 3.15.2, 3.15.4)

import { ChevronRight, ChevronDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useWorkingSetStore } from '@/stores/workingSet'
import { cn } from '@/lib/utils'

export interface FamilyGroupHeaderProps {
  familyName: string
  partIdsInFamily: string[]
  isExpanded: boolean
  onToggleExpand: () => void
}

type CheckState = 'checked' | 'unchecked' | 'indeterminate'

function getCheckState(partIdsInFamily: string[], workingSetIds: Set<string>): CheckState {
  const selectedCount = partIdsInFamily.filter((id) => workingSetIds.has(id)).length

  if (selectedCount === 0) return 'unchecked'
  if (selectedCount === partIdsInFamily.length) return 'checked'
  return 'indeterminate'
}

export function FamilyGroupHeader({
  familyName,
  partIdsInFamily,
  isExpanded,
  onToggleExpand,
}: FamilyGroupHeaderProps) {
  const { partIds, toggleFamily } = useWorkingSetStore()

  const checkState = getCheckState(partIdsInFamily, partIds)
  const selectedCount = partIdsInFamily.filter((id) => partIds.has(id)).length
  const totalCount = partIdsInFamily.length

  const handleCheckboxChange = () => {
    toggleFamily(familyName, partIdsInFamily)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex items-center text-muted-foreground hover:text-foreground"
        aria-label={isExpanded ? 'Collapse family' : 'Expand family'}
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
        aria-label={`Toggle all parts in ${familyName} family`}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="font-semibold">{familyName || 'Unassigned'}</span>
      <span className={cn(
        'text-sm',
        selectedCount === totalCount ? 'text-primary' : 'text-muted-foreground'
      )}>
        {selectedCount} of {totalCount} selected
      </span>
    </div>
  )
}
