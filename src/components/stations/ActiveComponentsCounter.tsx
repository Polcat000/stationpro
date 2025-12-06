// src/components/stations/ActiveComponentsCounter.tsx
// Active components count display for Components tab header (AC 3.2.1)

import { useComponentsStore } from '@/stores/components'

export function ActiveComponentsCounter() {
  const { activeComponentIds } = useComponentsStore()
  const count = activeComponentIds.size

  return (
    <span className="text-sm text-muted-foreground">
      {count === 0
        ? '0 active components'
        : count === 1
          ? '1 active component'
          : `${count} active components`}
    </span>
  )
}
