// src/components/parts/WorkingSetCounter.tsx
// Working set count display for Parts Library header (AC 3.1.3)

import { useWorkingSetStore } from '@/stores/workingSet'

export function WorkingSetCounter() {
  const { partIds } = useWorkingSetStore()
  const count = partIds.size

  return (
    <span className="text-sm text-muted-foreground">
      {count === 0
        ? '0 parts in working set'
        : count === 1
          ? '1 part in working set'
          : `${count} parts in working set`}
    </span>
  )
}
