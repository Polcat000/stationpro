import { forwardRef } from 'react'
import { useWorkingSetStore } from '@/stores/workingSet'
import { useComponentsStore } from '@/stores/components'
import { cn } from '@/lib/utils'

interface WorkingSetBadgeProps {
  className?: string
  onClick?: () => void
}

export const WorkingSetBadge = forwardRef<HTMLButtonElement, WorkingSetBadgeProps>(
  function WorkingSetBadge({ className, onClick }, ref) {
    const partsCount = useWorkingSetStore((state) => state.partIds.size)
    const componentsCount = useComponentsStore((state) => state.activeComponentIds.size)

    const partsLabel = partsCount === 1 ? 'part' : 'parts'
    const componentsLabel = componentsCount === 1 ? 'component' : 'components'

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          'text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
          'px-2 py-1 rounded-md hover:bg-secondary/50',
          className
        )}
        aria-label={`Working set: ${partsCount} ${partsLabel}, ${componentsCount} ${componentsLabel}`}
      >
        {partsCount} {partsLabel}, {componentsCount} {componentsLabel}
      </button>
    )
  }
)
